import { db } from '@/lib/drizzle/db';
import { jobsTable, mergeRequestsTable, pipelinesTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export const getJobs = async () => {
    return db.select({ json: jobsTable.json }).from(jobsTable);
};

export const addJob = async (id: number, pipelineId: number, json: unknown) => {
    await db.insert(jobsTable).values({ id, pipelineId, json });
};

export const updateJob = async (id: number, json: unknown) => {
    await db.update(jobsTable).set({ json }).where(eq(jobsTable.id, id));
};

export const isJobInDb = async (id: number) => {
    const results = await db.select({ id: jobsTable.id }).from(jobsTable).where(eq(jobsTable.id, id));
    return results.length === 1;
};

export const deleteJobsByMergeRequestId = async (id: number) => {
    const commitsResults = await db.select({ commitId: mergeRequestsTable.commitId }).from(mergeRequestsTable).where(eq(mergeRequestsTable.id, id));
    if (!commitsResults.length) return;

    const pipelinesResults = await db.select({ id: pipelinesTable.id }).from(pipelinesTable).where(eq(pipelinesTable.commitId, commitsResults[0].commitId));
    if (!pipelinesResults.length) return;

    await db.delete(jobsTable).where(eq(jobsTable.pipelineId, pipelinesResults[0].id));
};
