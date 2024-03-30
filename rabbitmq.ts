import amqp from 'amqplib';

type Queue = 'merge-requests';

const queues: Queue[] = ['merge-requests'];
const healthCheckInterval = 5000;

const getConnection = async () => await amqp.connect(process.env.RABBIT_MQ_URL ?? '');

const createQueues = async (connection: amqp.Connection) => {
    try {
        const channel = await connection.createChannel();
        for (const queue of queues) {
            await channel.assertQueue(queue, { durable: true });
            console.log(`Queue ${queue} created successfully.`);
        }
        await channel.close();
        await connection.close();
        console.log('All queues created successfully.');
    } catch (err) {
        console.error('Error creating queues:', err);
        process.exit(1);
    }
};

export const checkRabbitMQAndCreateQueues = async () => {
    try {
        const connection = await getConnection();
        await createQueues(connection);
    } catch (err) {
        console.error('RabbitMQ is not reachable. Attempting retry.', err);
        setTimeout(checkRabbitMQAndCreateQueues, healthCheckInterval);
    }
};

export const sendToQueue = async (queue: Queue, message: any) => {
    const connection = await getConnection();
    const channel = await connection.createChannel();
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    await channel.close();
    await connection.close();
};
