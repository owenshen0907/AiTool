FROM node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache python3 make g++ git
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app
RUN apk add --no-cache git && \
    git config --system --add safe.directory /AiTool-content
ENV NODE_ENV=production

COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/next.config.mjs ./next.config.mjs

USER node
EXPOSE 3000
CMD ["./node_modules/.bin/next", "start", "-p", "3000"]
