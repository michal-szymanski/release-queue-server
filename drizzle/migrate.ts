import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '@/drizzle/db';

const main = async () => {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
    console.log('Migrations pushed successfully.');
    process.exit(0);
};

main().catch((err) => {
    console.error('Could not push migrations.', err);
    process.exit(1);
});
