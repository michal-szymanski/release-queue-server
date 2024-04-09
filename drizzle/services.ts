import { MergeRequestAction } from '@/types';
import { removeFromQueue } from '@/drizzle/queries/queue';
import { addMergeRequest, deleteMergeRequest, isMergeRequestInDb, updateMergeRequest } from '@/drizzle/queries/merge-requests';
import { addPipeline, isPipelineInDb, updatePipeline } from '@/drizzle/queries/pipelines';

export const processMergeRequestInDb = async (id: number, authorId: number, json: unknown, action?: MergeRequestAction) => {
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

export const processPipelineInDb = async (id: number, commitId: string, json: unknown) => {
    const exists = await isPipelineInDb(id);

    if (exists) {
        await updatePipeline(id, json);
        return;
    }

    await addPipeline(id, commitId, json);
};
