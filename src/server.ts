import { initRabbitMQ, sendToQueue } from '@/rabbitmq';
import { app, server } from '@/express';
import { gitlabEventEnum } from '@/types';
import { env } from '@/env';

initRabbitMQ();

app.post('/webhook', async (req, res) => {
    try {
        const gitlabEventType = gitlabEventEnum.parse(req.header('X-Gitlab-Event'));

        switch (gitlabEventType) {
            case 'Merge Request Hook':
            case 'Pipeline Hook':
            case 'Job Hook':
                await sendToQueue(gitlabEventType, req.body);
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

server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}.`);
});
