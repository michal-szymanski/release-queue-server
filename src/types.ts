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
        iid: z.number(),
        author_id: z.number(),
        action: mergeRequestActionEnum.optional(),
        last_commit: z.object({
            id: z.string()
        }),
        merge_commit_sha: z.string().nullable()
    }),
    project: z.object({
        id: z.number(),
        name: z.string()
    })
});

export const jwtSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_at: z.number(),
    iat: z.number(),
    exp: z.number(),
    jti: z.string(),
    user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        image: z.string()
    })
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

export const jobSchema = z.object({
    build_id: z.number(),
    pipeline_id: z.number()
});
