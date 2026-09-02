# Stage 1: Build NestJS application using Bun
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/server ./apps/server

RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN cd apps/server && bun run build

# Stage 2: Production runtime with Node.js LTS
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages ./packages

USER node

EXPOSE 3001

CMD ["node", "apps/server/dist/main.js"]
