import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/env';

const pool = new Pool({
    host: 'postgres',
    port: 5432,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: 'release-queue',
    ssl: false
});

const db = drizzle(pool);

export { pool, db };
