import { Server } from 'socket.io';
import { server } from '@/lib/express';
import { getMergeRequestById } from '@/lib/drizzle/queries/merge-requests';
import { addToQueue, qetQueue, stepBackInQueue } from '@/lib/drizzle/queries/queue';
import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';
import { jwtSchema, mergeRequestSchema, User } from '@/types';
import cookieParser from 'cookie-parser';
import { decode } from 'next-auth/jwt';
import { IncomingMessage } from 'http';
import { env } from '@/env';
import { getEventsByUserId, processRemoveFromQueue } from '@/lib/drizzle/services';

const io = new Server(server, {
    cors: {
        origin: env.WEB_APP_URL,
        credentials: true
    }
});

const cookieName = 'next-auth.session-token';

io.engine.use(cookieParser());

io.engine.use(async (req: Request & { _query: Record<string, string>; user?: User }, _res: Response, next: NextFunction) => {
    const isHandshake = req._query.sid === undefined;

    if (!isHandshake) {
        return next();
    }

    try {
        const token = z.string().parse(req.cookies[cookieName]);

        const jwt = await decode({
            token,
            secret: env.NEXTAUTH_SECRET
        });

        const { expires_at, user } = jwtSchema.parse(jwt);

        if (Date.now() >= expires_at * 1000) {
            return next(new Error('Authentication failed.'));
        }

        req.user = {
            id: z.coerce.number().positive().parse(user.id)
        };

        return next();
    } catch {
        return next(new Error('Authentication failed.'));
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

    socket.join(`user:${user.id}`);

    await emitEvents(user.id);
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
