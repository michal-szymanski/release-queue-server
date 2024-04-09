import { db } from '@/drizzle/db';
import { mergeRequestsTable, queueTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const qetQueue = async () => {
    return db
        .select({ id: queueTable.id, json: mergeRequestsTable.json })
        .from(queueTable)
        .innerJoin(mergeRequestsTable, eq(mergeRequestsTable.id, queueTable.mergeRequestId))
        .orderBy(queueTable.id);
};

export const addToQueue = async (mergeRequestId: number) => {
    await db.insert(queueTable).values({ mergeRequestId });
};
export const removeFromQueue = async (mergeRequestId: number) => {
    await db.delete(queueTable).where(eq(queueTable.mergeRequestId, mergeRequestId));
};
