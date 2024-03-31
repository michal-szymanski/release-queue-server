import { json, pgTable, serial } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core/columns/integer';
import { relations } from 'drizzle-orm';

export const mergeRequestsTable = pgTable('merge_requests', {
    id: integer('id').primaryKey(),
    authorId: integer('author_id').notNull(),
    json: json('json').notNull()
});

export const mergeRequestsRelations = relations(mergeRequestsTable, ({ one }) => ({
    queue: one(queueTable, {
        fields: [mergeRequestsTable.id],
        references: [queueTable.mergeRequestId]
    })
}));

export const queueTable = pgTable('queue', {
    id: serial('id').primaryKey(),
    mergeRequestId: integer('merge_request_id')
        .notNull()
        .references(() => mergeRequestsTable.id)
});

export const queueRelations = relations(queueTable, ({ many }) => ({
    mergeRequests: many(mergeRequestsTable)
}));
