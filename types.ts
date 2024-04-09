import { z } from 'zod';

export const gitlabEventEnum = z.enum([
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

export type GitLabEvent = z.infer<typeof gitlabEventEnum>;

const mergeRequestActionEnum = z.enum(['open', 'close', 'reopen', 'update', 'approved', 'unapproved', 'approval', 'merge']);

export type MergeRequestAction = z.infer<typeof mergeRequestActionEnum>;

export const mergeRequestSchema = z.object({
    object_attributes: z.object({
        id: z.number(),
        author_id: z.number(),
        action: mergeRequestActionEnum.optional()
    })
});

export const jwtSchema = z.object({
    name: z.string(),
    email: z.string(),
    picture: z.string(),
    sub: z.string(),
    iat: z.number(),
    exp: z.number(),
    jti: z.string()
});

export type User = {
    id: number;
};

export const pipelineSchema = z.object({
    object_attributes: z.object({
        id: z.number()
    }),
    commit: z.object({
        id: z.string()
    })
});
