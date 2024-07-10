import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { env } from '@/env';

const app = express();

app.use(
    cors({
        origin: [env.WEB_APP_URL, 'http://localhost:3000']
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).send({ errors: [{ message: 'Something went wrong' }] });
});

const server = createServer(app);

export { app, server };
