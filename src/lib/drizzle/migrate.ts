import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { pool } from '@/lib/drizzle/db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

const healthCheckInterval = 5000;

const tryConnect = async () => {
    try {
        const client = await pool.connect();
        const db = drizzle(client);
        await tryMigrate(db);
        client.release();
    } catch (err) {
        console.error('Postgres is not reachable. Attempting retry.', err);
        setTimeout(tryConnect, healthCheckInterval);
    }
};

const tryMigrate = async (db: PostgresJsDatabase) => {
    try {
        console.log('Running migrations...');
        await migrate(db, { migrationsFolder: 'src/lib/drizzle/migrations' });
        console.log('Migrations pushed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Could not push migrations.', err);
        process.exit(1);
    }
};

tryConnect();
