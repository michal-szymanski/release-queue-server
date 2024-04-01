import { db } from '@/drizzle/db';
import { mergeRequestsTable, queueTable } from '@/drizzle/schema';
import { eq, isNull } from 'drizzle-orm';
import { MergeRequestAction } from '@/types';

export const getMergeRequests = async () => {
    return db
        .select({ json: mergeRequestsTable.json })
        .from(mergeRequestsTable)
        .leftJoin(queueTable, eq(queueTable.mergeRequestId, mergeRequestsTable.id))
        .where(isNull(queueTable.mergeRequestId));
};

const addMergeRequest = async (id: number, authorId: number, json: unknown) => {
    await db.insert(mergeRequestsTable).values({ id, authorId, json });
};

const deleteMergeRequest = async (id: number) => {
    await db.delete(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
};

const updateMergeRequest = async (id: number, json: unknown) => {
    await db.update(mergeRequestsTable).set({ json }).where(eq(mergeRequestsTable.id, id));
};

const isMergeRequestInDb = async (id: number) => {
    const results = await db.select({ id: mergeRequestsTable.id }).from(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
    return results.length === 1;
};

export const processMergeRequestAction = async (id: number, authorId: number, json: unknown, action?: MergeRequestAction) => {
    switch (action) {
        case 'open':
        case 'reopen':
            await addMergeRequest(id, authorId, json);
            break;
        case 'merge':
        case 'close':
            await removeFromQueue(id);
            await deleteMergeRequest(id);
            break;
        default:
            const exists = await isMergeRequestInDb(id);
            if (exists) {
                await updateMergeRequest(id, json);
                break;
            }
            await addMergeRequest(id, authorId, json);
            break;
    }
};

export const qetQueue = async () => {
    return db
        .select({ json: mergeRequestsTable.json })
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
