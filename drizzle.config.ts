import { defineConfig } from 'drizzle-kit';
export default defineConfig({
    schema: './drizzle/schema.ts',
    out: './drizzle/migrations',
    driver: 'pg',
    dbCredentials: {
        host: '0.0.0.0',
        port: 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: 'release-queue',
        ssl: false
    },
    verbose: true,
    strict: true
});
