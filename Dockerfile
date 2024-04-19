FROM node:20.12.2

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml .env tsconfig.json drizzle.config.ts ./
COPY src/ src/

RUN pnpm install
RUN pnpm env:check

CMD ["pnpm", "start"]
