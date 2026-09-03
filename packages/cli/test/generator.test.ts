import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import { executeGenerator } from '../src/generator/index'
import type { ProjectConfig } from '../src/generator/types'

describe('create-better-nest Generator Engine', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'better-nest-test-'))
  })

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir)
    }
  })

  it('scaffolds Standalone default (Fastify + Postgres + Better Auth + Scalar)', async () => {
    const config: ProjectConfig = {
      projectName: 'test-standalone-default',
      targetDir: tempDir,
      arch: 'standalone',
      frontend: 'none',
      http: 'fastify',
      db: 'postgres',
      orm: 'drizzle',
      auth: 'better-auth',
      docs: 'scalar',
      pm: 'bun',
      git: false,
      install: false,
      addons: ['docker', 'mcp'],
    }

    await executeGenerator(config)

    // Check main files
    expect(await fs.pathExists(path.join(tempDir, 'src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(tempDir, 'src/auth/auth.ts'))).toBe(
      true,
    )
    expect(
      await fs.pathExists(path.join(tempDir, 'src/database/schema/index.ts')),
    ).toBe(true)
    expect(await fs.pathExists(path.join(tempDir, 'docker-compose.yml'))).toBe(
      true,
    )
    expect(await fs.pathExists(path.join(tempDir, '.mcp.json'))).toBe(true)

    // Verify Fastify and Scalar in main.ts
    const mainContent = await fs.readFile(
      path.join(tempDir, 'src/main.ts'),
      'utf8',
    )
    expect(mainContent).toContain('FastifyAdapter')
    expect(mainContent).toContain('withFastify: true')
    expect(mainContent).toContain('bodyParser: false')

    // Verify package.json dependencies
    const pkg = await fs.readJson(path.join(tempDir, 'package.json'))
    expect(pkg.dependencies).toHaveProperty('@nestjs/platform-fastify')
    expect(pkg.dependencies).toHaveProperty('better-auth')
    expect(pkg.dependencies).toHaveProperty('drizzle-orm')
    expect(pkg.dependencies).toHaveProperty('@scalar/nestjs-api-reference')

    // Verify docker-compose
    const composeContent = await fs.readFile(
      path.join(tempDir, 'docker-compose.yml'),
      'utf8',
    )
    expect(composeContent).toContain('postgres:')
    expect(composeContent).toContain('pgdata:')
  })

  it('scaffolds Standalone minimal (Express + DB None + Auth None + Docs None)', async () => {
    const config: ProjectConfig = {
      projectName: 'test-standalone-minimal',
      targetDir: tempDir,
      arch: 'standalone',
      frontend: 'none',
      http: 'express',
      db: 'none',
      orm: 'none',
      auth: 'none',
      docs: 'none',
      pm: 'bun',
      git: false,
      install: false,
      addons: [],
    }

    await executeGenerator(config)

    // Check that stripped directories are removed
    expect(await fs.pathExists(path.join(tempDir, 'src/auth'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'src/database'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'src/posts'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'docker-compose.yml'))).toBe(
      false,
    )
    expect(await fs.pathExists(path.join(tempDir, '.mcp.json'))).toBe(false)

    // Verify Express in main.ts
    const mainContent = await fs.readFile(
      path.join(tempDir, 'src/main.ts'),
      'utf8',
    )
    expect(mainContent).not.toContain('FastifyAdapter')
    expect(mainContent).toContain('app.use(compression())')
    expect(mainContent).toContain(
      'app.use(helmet({ contentSecurityPolicy: false }))',
    )
    expect(mainContent).not.toContain('apiReference')

    // Verify decoupled controllers
    const appController = await fs.readFile(
      path.join(tempDir, 'src/app.controller.ts'),
      'utf8',
    )
    expect(appController).not.toContain('AuthService')
    expect(appController).not.toContain('@Session')
    expect(appController).not.toContain('@Roles')

    const healthController = await fs.readFile(
      path.join(tempDir, 'src/health/health.controller.ts'),
      'utf8',
    )
    expect(healthController).not.toContain('DatabaseService')
    expect(healthController).not.toContain('@AllowAnonymous')

    // Verify package.json cleanup
    const pkg = await fs.readJson(path.join(tempDir, 'package.json'))
    expect(pkg.dependencies).toHaveProperty('@nestjs/platform-express')
    expect(pkg.dependencies).not.toHaveProperty('@nestjs/platform-fastify')
    expect(pkg.dependencies).not.toHaveProperty('better-auth')
    expect(pkg.dependencies).not.toHaveProperty('drizzle-orm')
    expect(pkg.dependencies).not.toHaveProperty('@scalar/nestjs-api-reference')
  })

  it('scaffolds Standalone with TanStack Router client and SQLite', async () => {
    const config: ProjectConfig = {
      projectName: 'test-standalone-tanstack',
      targetDir: tempDir,
      arch: 'standalone',
      frontend: 'tanstack-router',
      http: 'fastify',
      db: 'sqlite',
      orm: 'drizzle',
      auth: 'none',
      docs: 'scalar',
      pm: 'bun',
      git: false,
      install: false,
      addons: ['docker'],
    }

    await executeGenerator(config)

    // Check TanStack Router client
    expect(await fs.pathExists(path.join(tempDir, 'client/package.json'))).toBe(
      true,
    )
    expect(
      await fs.pathExists(path.join(tempDir, 'client/src/routes/__root.tsx')),
    ).toBe(true)
    expect(
      await fs.pathExists(path.join(tempDir, 'client/vite.config.ts')),
    ).toBe(true)

    const clientPkg = await fs.readJson(
      path.join(tempDir, 'client/package.json'),
    )
    expect(clientPkg.dependencies).toHaveProperty('@tanstack/react-router')

    // Check SQLite configuration
    const drizzleConfig = await fs.readFile(
      path.join(tempDir, 'drizzle.config.ts'),
      'utf8',
    )
    expect(drizzleConfig).toContain("dialect: 'sqlite'")
    expect(drizzleConfig).toContain('./sqlite.db')

    const dbService = await fs.readFile(
      path.join(tempDir, 'src/database/database.service.ts'),
      'utf8',
    )
    expect(dbService).toContain('better-sqlite3')

    // Check Docker adaptation for SQLite (no postgres service)
    const composeContent = await fs.readFile(
      path.join(tempDir, 'docker-compose.yml'),
      'utf8',
    )
    expect(composeContent).not.toContain('postgres:')
    expect(composeContent).not.toContain('pgdata:')
  })

  it('scaffolds Monorepo with Next.js 16 App Router', async () => {
    const config: ProjectConfig = {
      projectName: 'test-mono-next16',
      targetDir: tempDir,
      arch: 'monorepo',
      frontend: 'next',
      http: 'fastify',
      db: 'postgres',
      orm: 'drizzle',
      auth: 'better-auth',
      docs: 'scalar',
      pm: 'bun',
      git: false,
      install: false,
      addons: ['docker'],
    }

    await executeGenerator(config)

    // Check monorepo workspace apps
    expect(
      await fs.pathExists(path.join(tempDir, 'apps/server/src/main.ts')),
    ).toBe(true)
    expect(
      await fs.pathExists(path.join(tempDir, 'apps/web/package.json')),
    ).toBe(true)
    expect(
      await fs.pathExists(path.join(tempDir, 'packages/ui/package.json')),
    ).toBe(true)

    // Verify Next.js 16 version
    const webPkg = await fs.readJson(
      path.join(tempDir, 'apps/web/package.json'),
    )
    expect(webPkg.dependencies.next).toMatch(/\^16\./)

    // Verify docker-compose has both server and web
    const compose = await fs.readFile(
      path.join(tempDir, 'docker-compose.yml'),
      'utf8',
    )
    expect(compose).toContain('server:')
    expect(compose).toContain('web:')
    expect(compose).toContain('postgres:')
  })

  it('scaffolds Monorepo with TanStack Start', async () => {
    const config: ProjectConfig = {
      projectName: 'test-mono-tanstack-start',
      targetDir: tempDir,
      arch: 'monorepo',
      frontend: 'tanstack-start',
      http: 'express',
      db: 'sqlite',
      orm: 'drizzle',
      auth: 'better-auth',
      docs: 'scalar',
      pm: 'bun',
      git: false,
      install: false,
      addons: ['docker'],
    }

    await executeGenerator(config)

    expect(
      await fs.pathExists(path.join(tempDir, 'apps/web/package.json')),
    ).toBe(true)
    expect(
      await fs.pathExists(path.join(tempDir, 'apps/web/src/routes/__root.tsx')),
    ).toBe(true)

    const webPkg = await fs.readJson(
      path.join(tempDir, 'apps/web/package.json'),
    )
    expect(webPkg.dependencies).toHaveProperty('@tanstack/react-start')
    expect(webPkg.dependencies).toHaveProperty('@tanstack/react-router')

    // TanStack Start Dockerfile verification
    const webDockerfile = await fs.readFile(
      path.join(tempDir, 'apps/web/Dockerfile'),
      'utf8',
    )
    expect(webDockerfile).toContain('TanStack Start')
  })

  it('scaffolds Monorepo Pure Backend (frontend: none, db: none)', async () => {
    const config: ProjectConfig = {
      projectName: 'test-mono-backend-only',
      targetDir: tempDir,
      arch: 'monorepo',
      frontend: 'none',
      http: 'fastify',
      db: 'none',
      orm: 'none',
      auth: 'none',
      docs: 'scalar',
      pm: 'bun',
      git: false,
      install: false,
      addons: ['docker'],
    }

    await executeGenerator(config)

    // Verify apps/web and packages/ui were deleted
    expect(await fs.pathExists(path.join(tempDir, 'apps/web'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'packages/ui'))).toBe(false)
    expect(
      await fs.pathExists(path.join(tempDir, 'apps/server/src/main.ts')),
    ).toBe(true)

    // Verify docker-compose has ONLY server (no web, no postgres)
    const compose = await fs.readFile(
      path.join(tempDir, 'docker-compose.yml'),
      'utf8',
    )
    expect(compose).toContain('server:')
    expect(compose).not.toContain('web:')
    expect(compose).not.toContain('postgres:')
  })

  it('adapts Dockerfiles for pnpm package manager', async () => {
    const config: ProjectConfig = {
      projectName: 'test-pnpm-docker',
      targetDir: tempDir,
      arch: 'standalone',
      frontend: 'none',
      http: 'fastify',
      db: 'postgres',
      orm: 'drizzle',
      auth: 'better-auth',
      docs: 'scalar',
      pm: 'pnpm',
      git: false,
      install: false,
      addons: ['docker'],
    }

    await executeGenerator(config)

    const dockerfile = await fs.readFile(
      path.join(tempDir, 'Dockerfile'),
      'utf8',
    )
    expect(dockerfile).toContain(
      'corepack enable && corepack prepare pnpm@latest --activate',
    )
    expect(dockerfile).toContain('pnpm-lock.yaml')
    expect(dockerfile).toContain('pnpm install --frozen-lockfile')
    expect(dockerfile).toContain('pnpm run build')
  })

  it('correctly handles addon inclusions and exclusions', async () => {
    // Scaffold with no addons
    const noAddonsConfig: ProjectConfig = {
      projectName: 'test-no-addons',
      targetDir: tempDir,
      arch: 'standalone',
      frontend: 'none',
      http: 'fastify',
      db: 'postgres',
      orm: 'drizzle',
      auth: 'better-auth',
      docs: 'scalar',
      pm: 'bun',
      git: false,
      install: false,
      addons: [],
    }

    await executeGenerator(noAddonsConfig)

    expect(await fs.pathExists(path.join(tempDir, 'Dockerfile'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'docker-compose.yml'))).toBe(
      false,
    )
    expect(await fs.pathExists(path.join(tempDir, '.mcp.json'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, '.husky'))).toBe(false)
  })
})
