import { z } from 'zod';

export const gitlabEventHeader = z.enum([
    'Push Hook',
    'Tag Push Hook',
    'Issue Hook',
    'Note Hook',
    'Merge Request Hook',
    'Wiki Page Hook',
    'Pipeline Hook',
    'Job Hook',
    'Deployment Hook',
    'Feature Flag Hook',
    'Release Hook',
    'Emoji Hook',
    'Resource Access Token Hook',
    'Member Hook',
    'Subgroup Hook'
]);

const mergeRequestAction = z.enum(['open', 'close', 'reopen', 'update', 'approved', 'unapproved', 'approval', 'merge']);

export type MergeRequestAction = z.infer<typeof mergeRequestAction>;

export const mergeRequestSchema = z.object({
    object_attributes: z.object({
        id: z.number(),
        author_id: z.number(),
        action: mergeRequestAction.optional()
    })
});
