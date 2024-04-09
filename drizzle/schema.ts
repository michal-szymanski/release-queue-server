import { json, pgTable, serial, text } from 'drizzle-orm/pg-core';
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

export const queueRelations = relations(queueTable, ({ one }) => ({
    mergeRequests: one(mergeRequestsTable, {
        fields: [queueTable.mergeRequestId],
        references: [mergeRequestsTable.id]
    })
}));

export const pipelinesTable = pgTable('pipelines', {
    id: integer('id').primaryKey(),
    commitId: text('commit_id').notNull(),
    json: json('json').notNull()
});
