FROM node:21.7.1

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml .env tsconfig.json drizzle.config.ts ./
COPY server.ts rabbitmq.ts express.ts websocket.ts types.ts ./
COPY drizzle/ ./drizzle

RUN pnpm install

CMD ["pnpm", "start"]
