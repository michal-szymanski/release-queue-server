import { defineConfig } from 'drizzle-kit';
import { env } from '@/env';

export default defineConfig({
    schema: './src/lib/drizzle/schema.ts',
    out: './src/lib/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        ssl: false
    },
    migrations: {
        table: 'migrations',
        schema: 'public'
    },
    verbose: true,
    strict: true
});
