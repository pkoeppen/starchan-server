FROM node:16-alpine
LABEL org.opencontainers.image.source="https://github.com/pkoeppen/starchan-server"

WORKDIR /app

COPY package.json /app/
RUN npm install --silent

COPY tsconfig.json /app/
COPY prisma/ /app/prisma/
RUN npm run generate;

COPY src/ /app/src/
RUN npm run build;

EXPOSE 3001

CMD [ "npm", "start" ]
