# Stage 1: Build Next.js application using Bun
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV SKIP_ENV_VALIDATION=1
ENV NODE_ENV=production

RUN cd apps/web && bun run build
RUN mkdir -p apps/web/public

# Stage 2: Production runtime with Node.js LTS (standalone)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER node

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
