import { db } from '@/drizzle/db';
import { mergeRequestsTable, queueTable } from '@/drizzle/schema';
import { and, eq, max, not, sql } from 'drizzle-orm';

export const qetQueue = async () => {
    return db
        .select({ id: queueTable.id, json: mergeRequestsTable.json, date: queueTable.date })
        .from(queueTable)
        .innerJoin(mergeRequestsTable, eq(mergeRequestsTable.id, queueTable.mergeRequestId))
        .orderBy(queueTable.date, queueTable.order);
};

const selectMaxOrderByDate = db
    .select({ lastOrder: max(queueTable.order) })
    .from(queueTable)
    .where(eq(queueTable.date, sql.placeholder('date')))
    .groupBy(queueTable.date)
    .prepare('select_max_order_by_date');

export const addToQueue = async (mergeRequestId: number, date: Date) => {
    const orderResults = await selectMaxOrderByDate.execute({ date });

    await db.insert(queueTable).values({
        mergeRequestId,
        date,
        order: (orderResults[0]?.lastOrder ?? -1) + 1
    });
};

export const removeFromQueue = async (mergeRequestId: number) => {
    await db.delete(queueTable).where(eq(queueTable.mergeRequestId, mergeRequestId));
};

export const stepBackInQueue = async (mergeRequestId: number) => {
    const queueResults = await db
        .select({ date: queueTable.date, order: queueTable.order })
        .from(queueTable)
        .where(eq(queueTable.mergeRequestId, mergeRequestId));

    if (!queueResults.length) return;

    await db
        .update(queueTable)
        .set({ order: queueResults[0].order + 1 })
        .where(eq(queueTable.mergeRequestId, mergeRequestId));
    await db
        .update(queueTable)
        .set({ order: queueResults[0].order })
        .where(
            and(not(eq(queueTable.mergeRequestId, mergeRequestId)), eq(queueTable.date, queueResults[0].date), eq(queueTable.order, queueResults[0].order + 1))
        );
};
