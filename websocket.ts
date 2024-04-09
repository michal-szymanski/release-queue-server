import { Server } from 'socket.io';
import { server } from '@/express';
import { addToQueue, getMergeRequests, qetQueue, removeFromQueue } from '@/drizzle/queries';
import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';
import { jwtSchema, User } from '@/types';
import cookieParser from 'cookie-parser';
import { decode } from 'next-auth/jwt';
import { IncomingMessage } from 'http';

const io = new Server(server, {
    cors: {
        origin: process.env.WEB_APP_URL,
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
            secret: `${process.env.NEXTAUTH_SECRET}`
        });

        const { exp, sub } = jwtSchema.parse(jwt);

        if (new Date() > new Date(exp * 1000)) {
            return next(new Error('Authentication failed.'));
        }

        req.user = {
            id: z.coerce.number().positive().parse(sub)
        };

        return next();
    } catch {
        return next(new Error('Authentication failed.'));
    }
});

export const emitMergeRequests = async (userId: number) => {
    const results = await getMergeRequests(userId);
    io.to(`user:${userId}`).emit(
        'merge-requests',
        results.map((row) => row.json)
    );
};

export const emitQueue = async () => {
    const results = await qetQueue();
    io.emit('queue', results);
};

io.on('connection', async (socket) => {
    const { user } = socket.request as IncomingMessage & { user?: User };

    if (!user) {
        socket.disconnect(true);
        return;
    }

    socket.join(`user:${user.id}`);

    await emitQueue();
    await emitMergeRequests(user.id);

    socket.on('add-to-queue', async (payload) => {
        const mergeRequestId = z.number().parse(payload);
        await addToQueue(mergeRequestId);
        await emitQueue();
        await emitMergeRequests(user.id);
    });

    socket.on('remove-from-queue', async (payload) => {
        const mergeRequestId = z.number().parse(payload);
        await removeFromQueue(mergeRequestId);
        await emitQueue();
        await emitMergeRequests(user.id);
    });
});
