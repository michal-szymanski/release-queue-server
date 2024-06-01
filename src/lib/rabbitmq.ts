import amqp from 'amqplib';
import { emitQueue, emitPipeline, emitMergeRequest, emitJob } from '@/lib/websocket';
import { processJobInDb, processMergeRequestInDb, processPipelineInDb } from '@/lib/drizzle/services';
import { GitLabEvent, jobSchema, mergeRequestSchema, pipelineSchema } from '@/types';
import { env } from '@/env';

const queues: GitLabEvent[] = ['Merge Request Hook', 'Pipeline Hook', 'Job Hook'];
const healthCheckInterval = 5000;

const getConnection = async () => await amqp.connect(env.RABBIT_MQ_URL);

const createQueues = async (channel: amqp.Channel) => {
    try {
        for (const queue of queues) {
            await channel.assertQueue(queue, { durable: true });
            createQueueConsumer(queue, channel);
            console.log(`Queue ${queue} created successfully.`);
        }
        console.log('All queues created successfully.');
    } catch (err) {
        console.error('Error creating queues.', err);
        process.exit(1);
    }
};

export const initRabbitMQ = async () => {
    try {
        const connection = await getConnection();
        const channel = await connection.createChannel();
        await createQueues(channel);
    } catch (err) {
        console.error('RabbitMQ is not reachable. Attempting retry.', err);
        setTimeout(initRabbitMQ, healthCheckInterval);
    }
};

export const sendToQueue = async (queue: GitLabEvent, message: any) => {
    const connection = await getConnection();
    const channel = await connection.createChannel();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    await channel.close();
    await connection.close();
};

const createQueueConsumer = (queue: GitLabEvent, channel: amqp.Channel) => {
    switch (queue) {
        case 'Merge Request Hook':
            channel.consume(queue, async (msg) => {
                if (!msg) {
                    console.log(`Consumer ${queue} cancelled by server.`);
                    return;
                }

                try {
                    const message = JSON.parse(msg.content.toString());

                    const {
                        object_attributes: {
                            iid,
                            author_id,
                            action,
                            last_commit: { id: commitId },
                            merge_commit_sha
                        },
                        project
                    } = mergeRequestSchema.parse(message);

                    await processMergeRequestInDb(iid, author_id, message, commitId, merge_commit_sha, action);
                    await emitMergeRequest(message);
                    await emitQueue();

                    channel.ack(msg);
                } catch (err) {
                    console.error(`Could not consume ${queue} message.`, err);
                }
            });
            break;
        case 'Pipeline Hook':
            channel.consume(queue, async (msg) => {
                if (!msg) {
                    console.log(`Consumer ${queue} cancelled by server.`);
                    return;
                }

                try {
                    const message = JSON.parse(msg.content.toString());

                    const {
                        object_attributes: { id },
                        commit: { id: commitId }
                    } = pipelineSchema.parse(message);

                    await processPipelineInDb(id, commitId, message);
                    await emitPipeline(message);

                    channel.ack(msg);
                } catch (err) {
                    console.error(`Could not consume ${queue} message.`, err);
                }
            });
            break;
        case 'Job Hook':
            channel.consume(queue, async (msg) => {
                if (!msg) {
                    console.log(`Consumer ${queue} cancelled by server.`);
                    return;
                }

                try {
                    const message = JSON.parse(msg.content.toString());

                    const { build_id, pipeline_id } = jobSchema.parse(message);

                    await processJobInDb(build_id, pipeline_id, message);
                    await emitJob(message);

                    channel.ack(msg);
                } catch (err) {
                    console.error(`Could not consume ${queue} message.`, err);
                }
            });
            break;
        default:
            throw Error(`Missing consumer for queue ${queue}.`);
    }
};
