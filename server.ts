import dotenv from 'dotenv';
import { initRabbitMQ, sendToQueue } from '@/rabbitmq';
import { app, server } from '@/express';

dotenv.config();

initRabbitMQ();

app.post('/webhook', (req, res) => {
    try {
        sendToQueue('merge-requests', req.body);
        res.status(200).end();
    } catch (err) {
        res.status(400).send('Error pushing message to the queue.');
    }
});

const port = process.env.PORT;

server.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});
