import { emitQueue, emitPipeline, emitMergeRequest, emitJob, emitRepositoryUpdate } from '@/lib/websocket';
import { processJobInDb, processMergeRequestInDb, processPipelineInDb } from '@/lib/drizzle/services';
import { GitLabEvent, jobSchema, mergeRequestSchema, pipelineSchema } from '@/types';

export const handleEvent = async (event: GitLabEvent, message: unknown) => {
    switch (event) {
        case 'Merge Request Hook': {
            try {
                const {
                    object_attributes: {
                        iid,
                        author_id,
                        action,
                        last_commit: { id: commitId },
                        merge_commit_sha
                    },
                    project
                } = mergeRequestSchema.parse(message);

                await processMergeRequestInDb(iid, author_id, message, commitId, action);
                await emitMergeRequest(message);
                await emitQueue();

                if (action === 'merge') {
                    await emitRepositoryUpdate(project.name);
                }
            } catch (err) {
                console.error(`Could not consume ${event} message.`, err);
            } finally {
                break;
            }
        }
        case 'Pipeline Hook': {
            try {
                const {
                    object_attributes: { id },
                    commit: { id: commitId }
                } = pipelineSchema.parse(message);

                await processPipelineInDb(id, commitId, message);
                await emitPipeline(message);
            } catch (err) {
                console.error(`Could not consume ${event} message.`, err);
            } finally {
                break;
            }
        }
        case 'Job Hook': {
            try {
                const { build_id, pipeline_id } = jobSchema.parse(message);

                await processJobInDb(build_id, pipeline_id, message);
                await emitJob(message);
            } catch (err) {
                console.error(`Could not consume ${event} message.`, err);
            } finally {
                break;
            }
        }
        default: {
            throw Error(`Missing handler for ${event} event.`);
        }
    }
};
