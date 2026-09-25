FROM docker.m.daocloud.io/library/node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

COPY src/database/seed.ts ./src/database/seed.ts
COPY tsconfig.json ./

EXPOSE 3000

CMD ["node", "dist/app.js"]
