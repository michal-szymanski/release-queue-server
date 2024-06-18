import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const schema = z.object({
    PORT: z.string().regex(/^(0|[1-9]\d*)$/, { message: 'String must contain only positive numbers.' }),
    RABBIT_MQ_URL: z.string().url(),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number(),
    WEB_APP_URL: z.string().min(1).url(),
    NEXTAUTH_SECRET: z.string().min(1)
});

export const env = schema.parse(process.env);
