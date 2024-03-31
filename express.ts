import express from 'express';
import { createServer } from 'node:http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);

export { app, server };
