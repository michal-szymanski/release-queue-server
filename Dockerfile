FROM node:20.12.2

ARG PORT
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG DB_HOST
ARG DB_PORT
ARG WEB_APP_URL
ARG CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml tsconfig.json drizzle.config.ts .prettierrc .prettierignore ./
COPY src/ src/

RUN pnpm install
RUN pnpm tsc:check
RUN pnpm prettier:check
# RUN pnpm env:check

CMD ["pnpm", "start"]
