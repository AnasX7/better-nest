import path from 'path'
import fs from 'fs-extra'
import type { Addon, AddonContext } from './types'

export const dockerAddon: Addon = {
  id: 'docker',
  label: 'Docker & Docker Compose',
  hint: 'Production multi-stage Dockerfile and Postgres container',
  default: true,
  async setup(ctx: AddonContext) {
    const isEnabled = ctx.selectedAddons.includes('docker')

    if (!isEnabled) {
      // Clean up all docker files if unselected
      const rootFiles = [
        path.join(ctx.targetDir, 'Dockerfile'),
        path.join(ctx.targetDir, 'docker-compose.yml'),
        path.join(ctx.targetDir, '.dockerignore'),
      ]
      for (const file of rootFiles) {
        if (await fs.pathExists(file)) await fs.remove(file)
      }

      const appFiles = [
        path.join(ctx.targetDir, 'apps/server/Dockerfile'),
        path.join(ctx.targetDir, 'apps/server/docker-compose.yml'),
        path.join(ctx.targetDir, 'apps/server/.dockerignore'),
        path.join(ctx.targetDir, 'apps/web/Dockerfile'),
        path.join(ctx.targetDir, 'apps/web/.dockerignore'),
      ]
      for (const file of appFiles) {
        if (await fs.pathExists(file)) await fs.remove(file)
      }
      return
    }

    // Docker is ENABLED: Adapt Dockerfiles & docker-compose.yml to selected stack
    if (ctx.arch === 'standalone') {
      await adaptStandaloneDocker(ctx)
    } else {
      await adaptMonorepoDocker(ctx)
    }
  },
}

/**
 * Adapts Dockerfile and docker-compose.yml for standalone projects
 */
async function adaptStandaloneDocker(ctx: AddonContext) {
  const dockerfilePath = path.join(ctx.targetDir, 'Dockerfile')
  const composePath = path.join(ctx.targetDir, 'docker-compose.yml')

  // 1. Adapt Dockerfile
  if (await fs.pathExists(dockerfilePath)) {
    let content = await fs.readFile(dockerfilePath, 'utf8')

    // Adapt package manager
    if (ctx.pm === 'pnpm') {
      content = content.replace(
        /FROM oven\/bun:1-alpine AS builder/,
        'FROM node:22-alpine AS builder\nRUN corepack enable && corepack prepare pnpm@latest --activate',
      )
      content = content.replace(
        /COPY package\.json bun\.lock \.\//,
        'COPY package.json pnpm-lock.yaml ./',
      )
      content = content.replace(
        /RUN bun install --frozen-lockfile/g,
        'RUN pnpm install --frozen-lockfile',
      )
      content = content.replace(/RUN bun run build/, 'RUN pnpm run build')
    } else if (ctx.pm === 'npm') {
      content = content.replace(
        /FROM oven\/bun:1-alpine AS builder/,
        'FROM node:22-alpine AS builder',
      )
      content = content.replace(
        /COPY package\.json bun\.lock \.\//,
        'COPY package.json package-lock.json* ./',
      )
      content = content.replace(
        /RUN bun install --frozen-lockfile/g,
        'RUN npm install',
      )
      content = content.replace(/RUN bun run build/, 'RUN npm run build')
    }

    // Adapt database files copy
    if (ctx.db === 'none') {
      content = content.replace(
        /COPY --chown=node:node --from=builder \/app\/src\/database\/migrations \.\/src\/database\/migrations\n?/,
        '',
      )
      content = content.replace(
        /COPY --chown=node:node --from=builder \/app\/drizzle\.config\.ts \.\/drizzle\.config\.ts\n?/,
        '',
      )
    }

    await fs.writeFile(dockerfilePath, content, 'utf8')
  }

  // 2. Adapt docker-compose.yml
  if (await fs.pathExists(composePath)) {
    let content = await fs.readFile(composePath, 'utf8')

    // If database is not postgres, remove postgres service and volumes
    if (ctx.db !== 'postgres') {
      content = content.replace(
        /\s+depends_on:\s+postgres:\s+condition: service_healthy\n?/,
        '\n',
      )
      content = content.replace(
        /postgres:[\s\S]*?healthcheck:[\s\S]*?retries: 5\n?/,
        '',
      )
      content = content.replace(/volumes:\s+pgdata:\n?/, '')

      if (ctx.db === 'none') {
        content = content.replace(/\s+DATABASE_URL:[^\n]+\n/, '\n')
      } else if (ctx.db === 'sqlite') {
        content = content.replace(
          /DATABASE_URL: postgresql:[^\n]+/,
          'DATABASE_URL: ./sqlite.db',
        )
      }
    }

    // If auth is none, remove auth environment variables
    if (ctx.auth === 'none') {
      content = content.replace(/\s+BETTER_AUTH_SECRET:[^\n]+\n/, '\n')
      content = content.replace(/\s+BETTER_AUTH_URL:[^\n]+\n/, '\n')
    }

    await fs.writeFile(composePath, content, 'utf8')
  }
}

/**
 * Adapts Dockerfiles and docker-compose.yml for monorepo projects
 */
async function adaptMonorepoDocker(ctx: AddonContext) {
  const composePath = path.join(ctx.targetDir, 'docker-compose.yml')
  const serverDockerPath = path.join(ctx.targetDir, 'apps/server/Dockerfile')
  const webDockerPath = path.join(ctx.targetDir, 'apps/web/Dockerfile')

  // 1. Adapt apps/server/Dockerfile package manager
  if (await fs.pathExists(serverDockerPath)) {
    let content = await fs.readFile(serverDockerPath, 'utf8')
    if (ctx.pm === 'pnpm') {
      content = content.replace(
        /FROM oven\/bun:1-alpine AS builder/,
        'FROM node:22-alpine AS builder\nRUN corepack enable && corepack prepare pnpm@latest --activate',
      )
      content = content.replace(/bun\.lock/, 'pnpm-lock.yaml')
      content = content.replace(
        /bun install --frozen-lockfile/,
        'pnpm install --frozen-lockfile',
      )
      content = content.replace(/bun run build/, 'pnpm run build')
    }
    await fs.writeFile(serverDockerPath, content, 'utf8')
  }

  // 2. Adapt apps/web/Dockerfile for TanStack Start or remove if frontend is none
  if (ctx.frontend === 'none') {
    if (await fs.pathExists(webDockerPath)) {
      await fs.remove(webDockerPath)
    }
  } else if (ctx.frontend === 'tanstack-start') {
    const tanstackStartDockerfile = `# Stage 1: Build TanStack Start application
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN bun install --frozen-lockfile
RUN cd apps/web && bun run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/dist ./apps/web/dist

USER node

EXPOSE 3000

CMD ["node", "apps/web/dist/server/index.mjs"]
`
    await fs.writeFile(webDockerPath, tanstackStartDockerfile, 'utf8')
  }

  // 3. Adapt docker-compose.yml
  if (await fs.pathExists(composePath)) {
    let content = await fs.readFile(composePath, 'utf8')

    // Handle database
    if (ctx.db !== 'postgres') {
      content = content.replace(
        /\s+depends_on:\s+postgres:\s+condition: service_healthy\n?/,
        '\n',
      )
      content = content.replace(
        /postgres:[\s\S]*?healthcheck:[\s\S]*?retries: 5\n?/,
        '',
      )
      content = content.replace(/volumes:\s+pgdata:\n?/, '')

      if (ctx.db === 'none') {
        content = content.replace(/\s+DATABASE_URL:[^\n]+\n/, '\n')
      } else if (ctx.db === 'sqlite') {
        content = content.replace(
          /DATABASE_URL: postgresql:[^\n]+/,
          'DATABASE_URL: ./sqlite.db',
        )
      }
    }

    // Handle frontend: if none, remove web service block
    if (ctx.frontend === 'none') {
      content = content.replace(/\s*web:[\s\S]*?start_period: 10s\n?/, '')
    }

    // Handle auth: if none, remove auth secret
    if (ctx.auth === 'none') {
      content = content.replace(/\s+BETTER_AUTH_SECRET:[^\n]+\n/, '\n')
    }

    await fs.writeFile(composePath, content, 'utf8')
  }
}
