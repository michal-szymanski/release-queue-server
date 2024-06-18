import { defineConfig } from 'drizzle-kit';
import { env } from '@/env';

export default defineConfig({
    schema: './src/lib/drizzle/schema.ts',
    out: './src/lib/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        host: '0.0.0.0',
        port: 5432,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: 'release-queue',
        ssl: false
    },
    verbose: true,
    strict: true
});
