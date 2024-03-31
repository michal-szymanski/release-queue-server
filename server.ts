import dotenv from 'dotenv';
import { initRabbitMQ, sendToQueue } from '@/rabbitmq';
import { app, server } from '@/express';
import { gitlabEventHeader } from '@/types';

dotenv.config();

initRabbitMQ();

app.post('/webhook', async (req, res) => {
    try {
        const gitlabEventType = gitlabEventHeader.parse(req.header('X-Gitlab-Event'));
        switch (gitlabEventType) {
            case 'Merge Request Hook':
                await sendToQueue('merge-requests', req.body);
                res.status(200).end();
                break;
            default:
                res.status(400).send(`Not implemented ${gitlabEventType}.`);
                break;
        }
    } catch (err) {
        res.status(400).json({ message: 'Could not process request in webhook.', error: err });
    }
});

const port = process.env.PORT;

server.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});
