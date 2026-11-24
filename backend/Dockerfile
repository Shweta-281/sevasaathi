FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache sqlite tini postgresql-client

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
ARG PRISMA_SCHEMA=prisma/schema.prisma
RUN npx prisma generate --schema=${PRISMA_SCHEMA}

COPY . .
RUN mkdir -p /app/storage/uploads /app/storage/backups \
  && chown -R node:node /app

ENV NODE_ENV=production
USER node
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
