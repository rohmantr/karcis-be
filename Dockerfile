FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS production

RUN mkdir -p /app && chown node:node /app
WORKDIR /app

USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/.env* ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
