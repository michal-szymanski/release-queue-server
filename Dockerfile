FROM node:21.7.1

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml .env tsconfig.json ./
COPY server.ts rabbitmq.ts ./

RUN pnpm install

CMD ["pnpm", "start"]
