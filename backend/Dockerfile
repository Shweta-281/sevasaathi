FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache sqlite tini
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN mkdir -p /app/storage/uploads /app/storage/backups
ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]