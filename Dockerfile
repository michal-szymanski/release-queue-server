FROM node:20.12.2

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml .env tsconfig.json drizzle.config.ts .prettierrc .prettierignore ./
COPY src/ src/

RUN pnpm install
RUN pnpm tsc:check
RUN pnpm prettier:check
RUN pnpm env:check

CMD ["pnpm", "start"]
