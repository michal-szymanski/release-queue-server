import { db } from '@/lib/drizzle/db';
import { mergeRequestsTable, pipelinesTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export const getPipelines = async () => {
    return db.select({ json: pipelinesTable.json }).from(pipelinesTable);
};

export const addPipeline = async (id: number, commitId: string, json: unknown) => {
    await db.insert(pipelinesTable).values({ id, commitId, json });
};

export const updatePipeline = async (id: number, commitId: string, json: unknown) => {
    await db.update(pipelinesTable).set({ commitId, json }).where(eq(pipelinesTable.id, id));
};

export const isPipelineInDb = async (id: number) => {
    const results = await db.select({ id: pipelinesTable.id }).from(pipelinesTable).where(eq(pipelinesTable.id, id));
    return results.length === 1;
};

export const deletePipelineByMergeRequestId = async (id: number) => {
    const commitResults = await db.select({ commitId: mergeRequestsTable.commitId }).from(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
    if (commitResults.length) {
        await db.delete(pipelinesTable).where(eq(pipelinesTable.commitId, commitResults[0].commitId));
    }
};
