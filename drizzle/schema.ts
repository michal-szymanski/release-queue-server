import { json, pgTable, serial } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core/columns/integer';

export const mergeRequestsTable = pgTable('merge_requests', {
    id: integer('id').primaryKey(),
    authorId: integer('author_id').notNull(),
    json: json('json').notNull()
});
