import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

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

app.post('/webhook', (req, res) => {
    const payload = req.body;
    const event = req.headers['x-gitlab-event'];
    console.log(event);
    console.log('Webhook', payload);
    io.emit('merge-request', payload);
    res.status(200).end();
});

const port = process.env.PORT;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
