import { handleEvent } from '@/lib/event-handlers';
import { app, server } from '@/lib/express';
import { gitlabEventEnum } from '@/types';
import { env } from '@/env';

app.post('/webhook', async (req, res) => {
    try {
        const event = gitlabEventEnum.parse(req.header('X-Gitlab-Event'));

        switch (event) {
            case 'Merge Request Hook':
            case 'Pipeline Hook':
            case 'Job Hook':
                await handleEvent(event, req.body);
                res.status(200).end();
                break;
            default:
                res.status(400).send(`Not implemented ${event}.`);
                break;
        }
    } catch (err) {
        res.status(400).json({ message: 'Could not process request in webhook.', error: err });
    }
});

app.get('/health', async (_req, res) => {
    res.status(200).send('OK');
});

server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}.`);
});
