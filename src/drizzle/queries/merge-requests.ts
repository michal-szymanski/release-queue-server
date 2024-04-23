import { db } from '@/drizzle/db';
import { mergeRequestsTable, queueTable } from '@/drizzle/schema';
import { and, eq, isNull } from 'drizzle-orm';

export const getMergeRequestsByUserId = async (userId: number) => {
    return db
        .select({ json: mergeRequestsTable.json, rebaseError: mergeRequestsTable.rebaseError })
        .from(mergeRequestsTable)
        .leftJoin(queueTable, eq(queueTable.mergeRequestId, mergeRequestsTable.id))
        .where(and(isNull(queueTable.mergeRequestId), eq(mergeRequestsTable.authorId, userId)));
};

export const getMergeRequestById = async (id: number) => {
    return db.select({ json: mergeRequestsTable.json }).from(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
};

export const addMergeRequest = async (id: number, authorId: number, commitId: string, json: unknown) => {
    await db.insert(mergeRequestsTable).values({ id, authorId, commitId, json });
};

export const deleteMergeRequest = async (id: number) => {
    await db.delete(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
};

export const updateMergeRequest = async (id: number, authorId: number, commitId: string, mergeCommitSHA: string | null, json: unknown) => {
    await db
        .update(mergeRequestsTable)
        .set({ authorId, commitId: mergeCommitSHA ?? commitId, json })
        .where(eq(mergeRequestsTable.id, id));
};

export const isMergeRequestInDb = async (id: number) => {
    const results = await db.select({ id: mergeRequestsTable.id }).from(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
    return results.length === 1;
};

export const addRebaseError = async (mergeRequestId: number, rebaseError: string) => {
    await db.update(mergeRequestsTable).set({ rebaseError }).where(eq(mergeRequestsTable.id, mergeRequestId));
};
