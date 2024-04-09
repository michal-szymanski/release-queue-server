import amqp from 'amqplib';
import { emitMergeRequests, emitPipelines, emitQueue } from '@/websocket';
import { processMergeRequestInDb, processPipelineInDb } from '@/drizzle/services';
import { GitLabEvent, mergeRequestSchema, pipelineSchema } from '@/types';

const queues: GitLabEvent[] = ['Merge Request Hook', 'Pipeline Hook'];
const healthCheckInterval = 5000;

const getConnection = async () => await amqp.connect(process.env.RABBIT_MQ_URL ?? '');

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
                        object_attributes: { id, author_id, action }
                    } = mergeRequestSchema.parse(message);

                    await processMergeRequestInDb(id, author_id, message, action);
                    await emitQueue();
                    await emitMergeRequests(author_id);
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
                    await emitPipelines();
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
