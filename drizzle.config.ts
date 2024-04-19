import { defineConfig } from 'drizzle-kit';
import { env } from '@/env';

export default defineConfig({
    schema: './src/drizzle/schema.ts',
    out: './src/drizzle/migrations',
    driver: 'pg',
    dbCredentials: {
        host: '0.0.0.0',
        port: 5432,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: 'release-queue',
        ssl: false
    },
    verbose: true,
    strict: true
});
