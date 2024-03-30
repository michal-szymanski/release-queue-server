import amqp from 'amqplib';

type Queue = 'merge-requests';

const queues: Queue[] = ['merge-requests'];
const healthCheckInterval = 5000;

const getConnection = async () => await amqp.connect(process.env.RABBIT_MQ_URL ?? '');

const createQueues = async (channel: amqp.Channel) => {
    try {
        for (const queue of queues) {
            await channel.assertQueue(queue, { durable: true });
            console.log(`Queue ${queue} created successfully.`);
        }
        createQueueConsumers(channel);
        console.log('All queues created successfully.');
    } catch (err) {
        console.error('Error creating queues:', err);
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

const createQueueConsumers = (channel: amqp.Channel) => {
    channel.consume('merge-requests', (msg) => {
        if (!msg) {
            console.log('Consumer merge-requests cancelled by server.');
            return;
        }

        const message = JSON.parse(msg.content.toString());
        console.log('Received message from RabbitMQ:', message);
        channel.ack(msg);
    });
};
