import amqp from 'amqplib';
import { z } from 'zod';
import { emitAllMergeRequests } from '@/websocket';
import { insertOrUpdateMergeRequests } from '@/drizzle/queries';

type Queue = 'merge-requests';

const queues: Queue[] = ['merge-requests'];
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

export const sendToQueue = async (queue: Queue, message: any) => {
    const connection = await getConnection();
    const channel = await connection.createChannel();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    await channel.close();
    await connection.close();
};

const createQueueConsumer = (queue: Queue, channel: amqp.Channel) => {
    switch (queue) {
        case 'merge-requests':
            channel.consume(queue, async (msg) => {
                if (!msg) {
                    console.log(`Consumer ${queue} cancelled by server.`);
                    return;
                }

                try {
                    const message = JSON.parse(msg.content.toString());

                    const schema = z.object({
                        object_attributes: z.object({
                            id: z.number(),
                            author_id: z.number()
                        })
                    });

                    const {
                        object_attributes: { id, author_id }
                    } = schema.parse(message);

                    await insertOrUpdateMergeRequests(id, author_id, message);
                    await emitAllMergeRequests();
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
