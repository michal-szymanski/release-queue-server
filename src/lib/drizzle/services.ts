import { MergeRequestAction, mergeRequestSchema, pipelineSchema } from '@/types';
import { removeFromQueue } from '@/lib/drizzle/queries/queue';
import { addMergeRequest, deleteMergeRequest, getMergeRequestById, isMergeRequestInDb, updateMergeRequest } from '@/lib/drizzle/queries/merge-requests';
import { addPipeline, deletePipelineByMergeRequestId, isPipelineInDb, updatePipeline } from '@/lib/drizzle/queries/pipelines';
import { addJob, deleteJobsByMergeRequestId, isJobInDb, updateJob } from '@/lib/drizzle/queries/jobs';
import { jobsTable, mergeRequestsTable, pipelinesTable, queueTable } from '@/lib/drizzle/schema';
import { eq, isNotNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/db';

export const processMergeRequestInDb = async (
    id: number,
    authorId: number,
    json: unknown,
    commitId: string,
    mergeCommitSHA: string | null,
    action?: MergeRequestAction
) => {
    switch (action) {
        case 'open':
        case 'reopen':
            await addMergeRequest(id, authorId, commitId, json);
            break;
        case 'close':
            await deleteJobsByMergeRequestId(id);
            await deletePipelineByMergeRequestId(id);
            await removeFromQueue(id);
            await deleteMergeRequest(id);
            break;
        default:
            await deleteJobsByMergeRequestId(id);
            await deletePipelineByMergeRequestId(id);
            const exists = await isMergeRequestInDb(id);

            if (exists) {
                await updateMergeRequest(id, authorId, commitId, mergeCommitSHA, json);
                break;
            }

            await addMergeRequest(id, authorId, commitId, json);
            break;
    }
};

export const processPipelineInDb = async (id: number, commitId: string, json: unknown) => {
    const exists = await isPipelineInDb(id);

    if (exists) {
        await updatePipeline(id, commitId, json);
        return;
    }

    await addPipeline(id, commitId, json);
};

export const processJobInDb = async (id: number, pipelineId: number, json: unknown) => {
    const exists = await isJobInDb(id);

    if (exists) {
        await updateJob(id, json);
        return;
    }

    await addJob(id, pipelineId, json);
};

export const processRemoveFromQueue = async (mergeRequestId: number) => {
    const mergeRequestResults = await getMergeRequestById(mergeRequestId);
    if (!mergeRequestResults.length) return;

    await removeFromQueue(mergeRequestId);
    const {
        object_attributes: { action }
    } = mergeRequestSchema.parse(mergeRequestResults[0].json);

    if (action === 'merge') {
        await deleteJobsByMergeRequestId(mergeRequestId);
        await deletePipelineByMergeRequestId(mergeRequestId);
        await deleteMergeRequest(mergeRequestId);
    }
};

export const getEventsByUserId = async (userId: number) => {
    const results = await db
        .select({
            mergeRequest: mergeRequestsTable.json,
            pipeline: pipelinesTable.json
        })
        .from(mergeRequestsTable)
        .leftJoin(pipelinesTable, eq(pipelinesTable.commitId, mergeRequestsTable.commitId))
        .leftJoin(queueTable, eq(queueTable.mergeRequestId, mergeRequestsTable.id))
        .where(or(isNotNull(queueTable.mergeRequestId), eq(mergeRequestsTable.authorId, userId)));

    const events: { mergeRequest: unknown; pipeline: unknown; jobs: unknown[] }[] = [];

    for (const { mergeRequest, pipeline } of results) {
        if (!pipeline) {
            events.push({ mergeRequest, pipeline, jobs: [] });
        } else {
            const jobs = await db
                .select({ json: jobsTable.json })
                .from(jobsTable)
                .where(eq(jobsTable.pipelineId, pipelineSchema.parse(pipeline).object_attributes.id));
            events.push({ mergeRequest, pipeline, jobs: jobs.map((row) => row.json) });
        }
    }

    return events;
};
