import { db } from '@/drizzle/db';
import { mergeRequestsTable, queueTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const getAllMergeRequests = async () => {
    return db.select({ json: mergeRequestsTable.json }).from(mergeRequestsTable);
};

export const insertOrUpdateMergeRequests = async (id: number, authorId: number, json: any) => {
    const result = await db.select({ id: mergeRequestsTable.id }).from(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));

    if (!result.length) {
        await db.insert(mergeRequestsTable).values({ id, authorId, json });
        return;
    }
    await db.update(mergeRequestsTable).set({ id, authorId, json });
};

export const qetQueue = async () => {
    return db.select({ json: mergeRequestsTable.json }).from(queueTable).innerJoin(mergeRequestsTable, eq(mergeRequestsTable.id, queueTable.mergeRequestId));
};

export const addToQueue = async (mergeRequestId: number) => {
    await db.insert(queueTable).values({ mergeRequestId });
};
export const removeFromQueue = async (mergeRequestId: number) => {
    await db.delete(queueTable).where(eq(queueTable.mergeRequestId, mergeRequestId));
};
