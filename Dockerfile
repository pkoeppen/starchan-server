FROM node:16-alpine
LABEL org.opencontainers.image.source="https://github.com/pkoeppen/starchan-server"

WORKDIR /app

COPY package.json /app/
RUN npm install --silent

COPY .env /app/
COPY tsconfig.json /app/

COPY prisma/ /app/prisma/
RUN npm run generate;

COPY src/ /app/src/
RUN npm run build;

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV}
EXPOSE 3001

CMD [ "npm", "start" ]
