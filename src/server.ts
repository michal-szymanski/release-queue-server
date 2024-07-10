import { GitLabEvent, gitlabEventEnum, jobSchema, mergeRequestSchema, pipelineSchema } from '@/types';
import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { env } from '@/env';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { clerkClient, ClerkExpressRequireAuth, ClerkExpressWithAuth, WithAuthProp, LooseAuthProp, User } from '@clerk/clerk-sdk-node';
import { addToQueue, qetQueue, stepBackInQueue } from '@/lib/drizzle/queries/queue';
import { getEventsByUserId, processJobInDb, processMergeRequestInDb, processPipelineInDb, processRemoveFromQueue } from '@/lib/drizzle/services';
import { getMergeRequestById } from '@/lib/drizzle/queries/merge-requests';
import { IncomingMessage } from 'http';
import { z } from 'zod';

declare global {
    namespace Express {
        interface Request extends LooseAuthProp {}
    }
}

const app = express();

app.use(
    cors({
        origin: '*',
        // methods: ['GET', 'POST'],
        allowedHeaders: '*',
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(ClerkExpressWithAuth());
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).send({ errors: [{ message: 'Something went wrong' }] });
});

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        // methods: ['GET', 'POST'],
        allowedHeaders: '*',
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// io.engine.use(ClerkExpressRequireAuth());

// const clerkClient = createClerkClient({
//     secretKey: process.env.CLERK_SECRET_KEY
// });

io.engine.use(async (req: WithAuthProp<Request> & { _query: Record<string, string>; user?: User }, _res: Response, next: NextFunction) => {
    const isHandshake = req._query.sid === undefined;

    if (!isHandshake) {
        return next();
    }

    try {
        // if (!isSignedIn) {
        //     return next(new Error('Unauthorized'));
        // }
        if (!req.auth.userId) {
            throw Error('Unauthorized');
        }

        const user = await clerkClient.users.getUser(req.auth.userId);
        console.log({ userId: user.externalAccounts[0].externalId });

        req.user = user;

        return next();
    } catch (e) {
        return next(e);
    }
});

export const emitQueue = async () => {
    const results = await qetQueue();
    io.emit('queue', results);
};

export const emitPipeline = async (message: unknown) => {
    io.emit('pipeline', message);
};

export const emitJob = async (message: unknown) => {
    io.emit('job', message);
};

export const emitMergeRequest = async (message: unknown) => {
    io.emit('merge-request', message);
};

export const emitEvents = async (userId: number) => {
    const events = await getEventsByUserId(userId);
    io.emit('events', events);
};

export const emitRepositoryUpdate = async (repositoryName: string) => {
    io.emit('repository-update', repositoryName);
};

io.on('connection', async (socket) => {
    const { user } = socket.request as IncomingMessage & { user?: User };

    if (!user) {
        socket.disconnect(true);
        return;
    }

    const userId = z.coerce.number().parse(user.externalAccounts[0].externalId);

    socket.join(`user:${userId}`);

    await emitEvents(userId);
    await emitQueue();

    socket.on('add-to-queue', async (payload) => {
        const { mergeRequestIid, isoString } = z
            .object({
                mergeRequestIid: z.number(),
                isoString: z.string().datetime()
            })
            .parse(payload);
        const mergeRequestResults = await getMergeRequestById(mergeRequestIid);
        const {
            project: { id: repositoryId }
        } = mergeRequestSchema.parse(mergeRequestResults[0].json);

        await addToQueue(mergeRequestIid, repositoryId, new Date(isoString));
        await emitQueue();
    });

    socket.on('remove-from-queue', async (payload) => {
        const mergeRequestIid = z.number().parse(payload);
        await processRemoveFromQueue(mergeRequestIid);
        await emitQueue();
    });

    socket.on('step-back-in-queue', async (payload) => {
        const mergeRequestIid = z.number().parse(payload);
        await stepBackInQueue(mergeRequestIid);
        await emitQueue();
    });
});

const handleEvent = async (event: GitLabEvent, message: unknown) => {
    switch (event) {
        case 'Merge Request Hook': {
            try {
                const {
                    object_attributes: {
                        iid,
                        author_id,
                        action,
                        last_commit: { id: commitId },
                        merge_commit_sha
                    },
                    project
                } = mergeRequestSchema.parse(message);

                await processMergeRequestInDb(iid, author_id, message, commitId, action);
                await emitMergeRequest(message);
                await emitQueue();

                if (action === 'merge') {
                    await emitRepositoryUpdate(project.name);
                }
            } catch (err) {
                console.error(`Could not consume ${event} message.`, err);
            } finally {
                break;
            }
        }
        case 'Pipeline Hook': {
            try {
                const {
                    object_attributes: { id },
                    commit: { id: commitId }
                } = pipelineSchema.parse(message);

                await processPipelineInDb(id, commitId, message);
                await emitPipeline(message);
            } catch (err) {
                console.error(`Could not consume ${event} message.`, err);
            } finally {
                break;
            }
        }
        case 'Job Hook': {
            try {
                const { build_id, pipeline_id } = jobSchema.parse(message);

                await processJobInDb(build_id, pipeline_id, message);
                await emitJob(message);
            } catch (err) {
                console.error(`Could not consume ${event} message.`, err);
            } finally {
                break;
            }
        }
        default: {
            throw Error(`Missing handler for ${event} event.`);
        }
    }
};

app.post('/webhook', async (req, res) => {
    try {
        const event = gitlabEventEnum.parse(req.header('X-Gitlab-Event'));

        switch (event) {
            case 'Merge Request Hook':
            case 'Pipeline Hook':
            case 'Job Hook':
                await handleEvent(event, req.body);
                res.status(200).end();
                break;
            default:
                res.status(400).send(`Not implemented ${event}.`);
                break;
        }
    } catch (err) {
        res.status(400).json({ message: 'Could not process request in webhook.', error: err });
    }
});

app.get('/health', async (_req, res) => {
    res.status(200).send('OK');
});

server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}.`);
});
