import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { initRabbitMQ, sendToQueue } from '@/rabbitmq';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.WEB_APP_URL
    }
});

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
    console.log(`Server running on port ${port}`);
});
