import { db } from '@/drizzle/db';
import { pipelinesTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const getPipelines = async () => {
    return db.select().from(pipelinesTable);
};

export const addPipeline = async (id: number, commitId: string, json: unknown) => {
    await db.insert(pipelinesTable).values({ id, commitId, json });
};

export const updatePipeline = async (id: number, json: unknown) => {
    await db.update(pipelinesTable).set({ json }).where(eq(pipelinesTable.id, id));
};

export const isPipelineInDb = async (id: number) => {
    const results = await db.select({ id: pipelinesTable.id }).from(pipelinesTable).where(eq(pipelinesTable.id, id));
    return results.length === 1;
};
