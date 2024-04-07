import { Server } from 'socket.io';
import { server } from '@/express';
import { addToQueue, getMergeRequests, qetQueue, removeFromQueue } from '@/drizzle/queries';
import { z } from 'zod';

const io = new Server(server, {
    cors: {
        origin: process.env.WEB_APP_URL
    }
});

export const emitMergeRequests = async () => {
    const results = await getMergeRequests();
    io.emit(
        'merge-requests',
        results.map((row) => row.json)
    );
};

export const emitQueue = async () => {
    const results = await qetQueue();
    io.emit('queue', results);
};

io.on('connection', async (socket) => {
    await emitQueue();
    await emitMergeRequests();

    socket.on('add-to-queue', async (payload) => {
        const mergeRequestId = z.number().parse(payload);
        await addToQueue(mergeRequestId);
        await emitQueue();
        await emitMergeRequests();
    });

    socket.on('remove-from-queue', async (payload) => {
        const mergeRequestId = z.number().parse(payload);
        await removeFromQueue(mergeRequestId);
        await emitQueue();
        await emitMergeRequests();
    });
});
