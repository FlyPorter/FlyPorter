FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

EXPOSE 3000

# Use tsx to run the TypeScript entrypoint without a separate build step.
CMD ["npx", "tsx", "src/server.ts"]

