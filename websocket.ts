import { Server } from 'socket.io';
import { server } from '@/express';
import { addToQueue, getAllMergeRequests, qetQueue, removeFromQueue } from '@/drizzle/queries';
import { z } from 'zod';

const io = new Server(server, {
    cors: {
        origin: process.env.WEB_APP_URL
    }
});

export const emitAllMergeRequests = async () => {
    const results = await getAllMergeRequests();
    io.emit(
        'merge-requests',
        results.map((row) => row.json)
    );
};

export const emitQueue = async () => {
    const results = await qetQueue();
    io.emit(
        'queue',
        results.map((row) => row.json)
    );
};

io.on('connection', async (socket) => {
    await emitQueue();
    await emitAllMergeRequests();

    socket.on('add-to-queue', async (payload) => {
        const mergeRequestId = z.number().parse(payload);
        await addToQueue(mergeRequestId);
        await emitQueue();
    });

    socket.on('remove-from-queue', async (payload) => {
        const mergeRequestId = z.number().parse(payload);
        await removeFromQueue(mergeRequestId);
        await emitQueue();
    });
});
