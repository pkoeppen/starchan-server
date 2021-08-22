FROM node:16-alpine
LABEL org.opencontainers.image.source="https://github.com/pkoeppen/starchan-server"

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV}

WORKDIR /app

COPY package.json ./
RUN npm install --silent

COPY . ./

EXPOSE 3001

CMD [ "npx", "ts-node-dev", "--debug", "--poll", "--transpile-only", "src/index.ts" ]
