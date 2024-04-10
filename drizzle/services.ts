import { MergeRequestAction } from '@/types';
import { removeFromQueue } from '@/drizzle/queries/queue';
import { addMergeRequest, deleteMergeRequest, isMergeRequestInDb, updateMergeRequest } from '@/drizzle/queries/merge-requests';
import { addPipeline, deletePipelineByMergeRequestId, isPipelineInDb, updatePipeline } from '@/drizzle/queries/pipelines';
import { addJob, deleteJobsByMergeRequestId, isJobInDb, updateJob } from '@/drizzle/queries/jobs';

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
