import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const databaseRecipe: Recipe = {
  id: 'database',
  name: 'Database & ORM',
  async apply(config: ProjectConfig) {
    if (config.db === 'postgres' && config.orm === 'drizzle') {
      return
    }

    const isMonorepo = config.arch === 'monorepo'

    if (config.db === 'sqlite') {
      if (isMonorepo) {
        await applyMonorepoSqlite(config.targetDir)
      } else {
        await applyStandaloneSqlite(config.targetDir)
      }
    } else if (config.db === 'none') {
      if (isMonorepo) {
        await applyMonorepoNoDb(config.targetDir, config.auth)
      } else {
        await applyStandaloneNoDb(config.targetDir, config.auth)
      }
    }
  },
}

async function applyStandaloneSqlite(targetDir: string) {
  // 1. Update package.json
  const pkgPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath)
    delete pkg.dependencies['postgres']
    delete pkg.devDependencies['@types/pg']
    pkg.dependencies['better-sqlite3'] = '^11.8.1'
    pkg.devDependencies['@types/better-sqlite3'] = '^7.6.12'
    await fs.writeJson(pkgPath, pkg, { spaces: 2 })
  }

  // 2. Update drizzle.config.ts
  const drizzleConfigPath = path.join(targetDir, 'drizzle.config.ts')
  if (await fs.pathExists(drizzleConfigPath)) {
    const sqliteDrizzleConfig = `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db',
  },
})
`
    await fs.writeFile(drizzleConfigPath, sqliteDrizzleConfig, 'utf8')
  }

  // 3. Update database.service.ts
  const dbServicePath = path.join(targetDir, 'src/database/database.service.ts')
  if (await fs.pathExists(dbServicePath)) {
    const sqliteDbService = `import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

export type AppDatabase = BetterSQLite3Database<typeof schema>

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly db: AppDatabase
  private readonly client: Database.Database

  constructor() {
    this.client = new Database('./sqlite.db')
    this.db = drizzle(this.client, { schema })
  }

  async onModuleDestroy() {
    this.client.close()
  }
}
`
    await fs.writeFile(dbServicePath, sqliteDbService, 'utf8')
  }

  // 4. Update posts.schema.ts
  const postsSchemaPath = path.join(
    targetDir,
    'src/database/schema/posts.schema.ts',
  )
  if (await fs.pathExists(postsSchemaPath)) {
    const sqlitePostsSchema = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  userId: text('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
`
    await fs.writeFile(postsSchemaPath, sqlitePostsSchema, 'utf8')
  }

  // 5. Update auth.ts
  const authPath = path.join(targetDir, 'src/auth/auth.ts')
  if (await fs.pathExists(authPath)) {
    let content = await fs.readFile(authPath, 'utf8')
    content = content.replace(
      /import \{ drizzle \} from 'drizzle-orm\/postgres-js'\nimport postgres from 'postgres'/,
      "import { drizzle } from 'drizzle-orm/better-sqlite3'\nimport Database from 'better-sqlite3'",
    )
    content = content.replace(
      /const client = postgres\([^)]*\)\nconst db = drizzle\(client, \{ schema \}\)/,
      "const client = new Database('./sqlite.db')\nconst db = drizzle(client, { schema })",
    )
    content = content.replace(/provider:\s*'pg'/, "provider: 'sqlite'")
    await fs.writeFile(authPath, content, 'utf8')
  }

  // 6. Update health.controller.ts for sqlite (replace .execute with .run)
  const healthPath = path.join(targetDir, 'src/health/health.controller.ts')
  if (await fs.pathExists(healthPath)) {
    let content = await fs.readFile(healthPath, 'utf8')
    content = content.replace(
      /\.execute\(sql`SELECT 1`\)/,
      '.run(sql`SELECT 1`)',
    )
    await fs.writeFile(healthPath, content, 'utf8')
  }

  // 7. Update seed.ts for sqlite
  const seedPath = path.join(targetDir, 'src/database/seed.ts')
  if (await fs.pathExists(seedPath)) {
    const sqliteSeed = `import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

async function seed() {
  console.log('🌱 Starting database seeding...')
  const client = new Database('./sqlite.db')
  const db = drizzle(client, { schema })

  try {
    const demoPost = await db
      .insert(schema.posts)
      .values({
        title: 'Welcome to NestJS v12 + SQLite',
        content: 'This is an initial seed post for SQLite.',
        userId: 'seed_author',
      })
      .returning()

    console.log('✅ Created demo post:', demoPost)
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    client.close()
  }
}

await seed()
`
    await fs.writeFile(seedPath, sqliteSeed, 'utf8')
  }

  // 8. Update env files
  const envFiles = [
    path.join(targetDir, '.env'),
    path.join(targetDir, '.env.example'),
  ]
  for (const envFile of envFiles) {
    if (await fs.pathExists(envFile)) {
      let content = await fs.readFile(envFile, 'utf8')
      content = content.replace(
        /DATABASE_URL=[^\n]+/,
        'DATABASE_URL=./sqlite.db',
      )
      await fs.writeFile(envFile, content, 'utf8')
    }
  }
}

async function applyMonorepoSqlite(targetDir: string) {
  const dbPkgDir = path.join(targetDir, 'packages/db')
  const authPkgDir = path.join(targetDir, 'packages/auth')
  const serverDir = path.join(targetDir, 'apps/server')
  const envPkgDir = path.join(targetDir, 'packages/env')

  // 1. Update packages/db/package.json
  const dbPkgPath = path.join(dbPkgDir, 'package.json')
  if (await fs.pathExists(dbPkgPath)) {
    const pkg = await fs.readJson(dbPkgPath)
    delete pkg.dependencies['postgres']
    delete pkg.devDependencies['@types/pg']
    pkg.dependencies['better-sqlite3'] = '^11.8.1'
    pkg.devDependencies['@types/better-sqlite3'] = '^7.6.12'
    await fs.writeJson(dbPkgPath, pkg, { spaces: 2 })
  }

  // 2. Update packages/db/drizzle.config.ts
  const drizzleConfigPath = path.join(dbPkgDir, 'drizzle.config.ts')
  if (await fs.pathExists(drizzleConfigPath)) {
    const sqliteDrizzleConfig = `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db',
  },
})
`
    await fs.writeFile(drizzleConfigPath, sqliteDrizzleConfig, 'utf8')
  }

  // 3. Update packages/db/src/index.ts
  const dbIndexPath = path.join(dbPkgDir, 'src/index.ts')
  if (await fs.pathExists(dbIndexPath)) {
    const sqliteDbIndex = `import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { env } from '@repo/env/server'
import * as schema from './schema'

export * from './schema'

export function createDbClient(url = env.DATABASE_URL || './sqlite.db') {
  const client = new Database(url)
  const db = drizzle(client, { schema })
  return { client, db }
}

export const { client, db } = createDbClient()
export type Database = typeof db
`
    await fs.writeFile(dbIndexPath, sqliteDbIndex, 'utf8')
  }

  // 4. Update packages/db/src/schema/posts.schema.ts
  const postsSchemaPath = path.join(dbPkgDir, 'src/schema/posts.schema.ts')
  if (await fs.pathExists(postsSchemaPath)) {
    const sqlitePostsSchema = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  userId: text('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
`
    await fs.writeFile(postsSchemaPath, sqlitePostsSchema, 'utf8')
  }

  // 5. Update packages/auth/src/index.ts
  const authIndexPath = path.join(authPkgDir, 'src/index.ts')
  if (await fs.pathExists(authIndexPath)) {
    let content = await fs.readFile(authIndexPath, 'utf8')
    content = content.replace(/provider:\s*'pg'/, "provider: 'sqlite'")
    await fs.writeFile(authIndexPath, content, 'utf8')
  }

  // 6. Update apps/server/src/database/database.service.ts
  const dbServicePath = path.join(serverDir, 'src/database/database.service.ts')
  if (await fs.pathExists(dbServicePath)) {
    const sqliteDbService = `import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { client, db, type Database } from '@repo/db'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  readonly db: Database = db

  async onModuleDestroy() {
    this.logger.log('Closing database connection')
    client.close()
  }
}
`
    await fs.writeFile(dbServicePath, sqliteDbService, 'utf8')
  }

  // 7. Update apps/server/package.json
  const serverPkgPath = path.join(serverDir, 'package.json')
  if (await fs.pathExists(serverPkgPath)) {
    const pkg = await fs.readJson(serverPkgPath)
    delete pkg.dependencies['postgres']
    pkg.dependencies['better-sqlite3'] = '^11.8.1'
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['@types/better-sqlite3'] = '^7.6.12'
    await fs.writeJson(serverPkgPath, pkg, { spaces: 2 })
  }

  // 8. Update apps/server health.controller.ts for sqlite
  const healthPath = path.join(serverDir, 'src/health/health.controller.ts')
  if (await fs.pathExists(healthPath)) {
    let content = await fs.readFile(healthPath, 'utf8')
    content = content.replace(
      /\.execute\(sql`SELECT 1`\)/,
      '.run(sql`SELECT 1`)',
    )
    await fs.writeFile(healthPath, content, 'utf8')
  }

  // 9. Update packages/db/src/seed.ts for sqlite
  const seedPath = path.join(dbPkgDir, 'src/seed.ts')
  if (await fs.pathExists(seedPath)) {
    const sqliteSeed = `import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

async function seed() {
  console.log('🌱 Starting database seeding...')
  const client = new Database('./sqlite.db')
  const db = drizzle(client, { schema })

  try {
    const demoPost = await db
      .insert(schema.posts)
      .values({
        title: 'Welcome to NestJS v12 + SQLite',
        content: 'This is an initial seed post for SQLite.',
        userId: 'seed_author',
      })
      .returning()

    console.log('✅ Created demo post:', demoPost)
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    client.close()
  }
}

await seed()
`
    await fs.writeFile(seedPath, sqliteSeed, 'utf8')
  }

  // 10. Update packages/env/src/server.ts
  const envServerPath = path.join(envPkgDir, 'src/server.ts')
  if (await fs.pathExists(envServerPath)) {
    let content = await fs.readFile(envServerPath, 'utf8')
    content = content.replace(
      /\.default\('postgresql:\/\/[^']+'\)/,
      ".default('./sqlite.db')",
    )
    await fs.writeFile(envServerPath, content, 'utf8')
  }

  // 11. Update .env files
  const envFiles = [
    path.join(targetDir, '.env'),
    path.join(targetDir, '.env.example'),
    path.join(serverDir, '.env'),
    path.join(serverDir, '.env.example'),
  ]
  for (const envFile of envFiles) {
    if (await fs.pathExists(envFile)) {
      let content = await fs.readFile(envFile, 'utf8')
      content = content.replace(
        /DATABASE_URL=[^\n]+/,
        'DATABASE_URL=./sqlite.db',
      )
      await fs.writeFile(envFile, content, 'utf8')
    }
  }
}

async function applyStandaloneNoDb(targetDir: string, auth: string) {
  // 1. Remove database directory, drizzle config, and posts module
  const dbDir = path.join(targetDir, 'src/database')
  const drizzleConfig = path.join(targetDir, 'drizzle.config.ts')
  const postsDir = path.join(targetDir, 'src/posts')
  if (await fs.pathExists(dbDir)) await fs.remove(dbDir)
  if (await fs.pathExists(drizzleConfig)) await fs.remove(drizzleConfig)
  if (await fs.pathExists(postsDir)) await fs.remove(postsDir)

  // 2. Clean package.json
  const pkgPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath)
    delete pkg.dependencies['drizzle-orm']
    delete pkg.dependencies['postgres']
    delete pkg.devDependencies['drizzle-kit']
    delete pkg.devDependencies['@types/pg']
    if (pkg.scripts) {
      delete pkg.scripts['db:generate']
      delete pkg.scripts['db:migrate']
      delete pkg.scripts['db:push']
      delete pkg.scripts['db:studio']
      delete pkg.scripts['db:seed']
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 })
  }

  // 3. Update app.module.ts
  const appModulePath = path.join(targetDir, 'src/app.module.ts')
  if (await fs.pathExists(appModulePath)) {
    let content = await fs.readFile(appModulePath, 'utf8')
    content = content.replace(
      /import \{ DatabaseModule \} from '\.\/database\/database\.module'\n?/,
      '',
    )
    content = content.replace(
      /import \{ PostsModule \} from '\.\/posts\/posts\.module'\n?/,
      '',
    )
    content = content.replace(/DatabaseModule,\s*/, '')
    content = content.replace(/PostsModule,\s*/, '')
    await fs.writeFile(appModulePath, content, 'utf8')
  }

  // 4. Update health.controller.ts
  await cleanHealthController(
    path.join(targetDir, 'src/health/health.controller.ts'),
    auth,
  )

  // 5. Update test/app.e2e-spec.ts
  const e2ePath = path.join(targetDir, 'test/app.e2e-spec.ts')
  if (await fs.pathExists(e2ePath)) {
    let content = await fs.readFile(e2ePath, 'utf8')
    content = content.replace(
      /import \{ DatabaseService \} from '@\/database\/database\.service'\n?/,
      '',
    )
    content = content.replace(
      /\.overrideProvider\(DatabaseService\)[\s\S]*?\.useValue\(\{[\s\S]*?\}\)/,
      '',
    )
    content = content.replace(
      /expect\(json\.info\?\.database\?\.status\)\.toBe\('up'\)\n?/,
      '',
    )
    await fs.writeFile(e2ePath, content, 'utf8')
  }

  // 6. Clean env.ts and .env
  const envPath = path.join(targetDir, 'src/config/env.ts')
  if (await fs.pathExists(envPath)) {
    let content = await fs.readFile(envPath, 'utf8')
    content = content.replace(
      /\s+DATABASE_URL:[^\n]+\n[^\n]+default\([^\n]+\),/,
      '',
    )
    content = content.replace(/\s+DATABASE_MAX_CONNECTIONS:[^\n]+,/, '')
    await fs.writeFile(envPath, content, 'utf8')
  }

  const envFiles = [
    path.join(targetDir, '.env'),
    path.join(targetDir, '.env.example'),
  ]
  for (const envFile of envFiles) {
    if (await fs.pathExists(envFile)) {
      let content = await fs.readFile(envFile, 'utf8')
      content = content.replace(/DATABASE_URL=[^\n]*\n?/, '')
      content = content.replace(/DATABASE_MAX_CONNECTIONS=[^\n]*\n?/, '')
      await fs.writeFile(envFile, content, 'utf8')
    }
  }
}

async function applyMonorepoNoDb(targetDir: string, auth: string) {
  const dbPkgDir = path.join(targetDir, 'packages/db')
  const serverDir = path.join(targetDir, 'apps/server')
  const envPkgDir = path.join(targetDir, 'packages/env')
  const webDir = path.join(targetDir, 'apps/web')
  const authPkgDir = path.join(targetDir, 'packages/auth')

  // 1. Remove packages/db entirely
  if (await fs.pathExists(dbPkgDir)) {
    await fs.remove(dbPkgDir)
  }

  // 2. Remove @repo/db from apps/server/package.json
  const serverPkgPath = path.join(serverDir, 'package.json')
  if (await fs.pathExists(serverPkgPath)) {
    const pkg = await fs.readJson(serverPkgPath)
    delete pkg.dependencies['@repo/db']
    delete pkg.dependencies['drizzle-orm']
    delete pkg.dependencies['postgres']
    await fs.writeJson(serverPkgPath, pkg, { spaces: 2 })
  }

  // 3. Remove @repo/db from apps/web/package.json if exists
  const webPkgPath = path.join(webDir, 'package.json')
  if (await fs.pathExists(webPkgPath)) {
    const pkg = await fs.readJson(webPkgPath)
    if (pkg.dependencies && pkg.dependencies['@repo/db']) {
      delete pkg.dependencies['@repo/db']
      await fs.writeJson(webPkgPath, pkg, { spaces: 2 })
    }
  }

  // 4. Remove @repo/db from packages/auth/package.json if exists
  const authPkgPath = path.join(authPkgDir, 'package.json')
  if (await fs.pathExists(authPkgPath)) {
    const pkg = await fs.readJson(authPkgPath)
    if (pkg.dependencies && pkg.dependencies['@repo/db']) {
      delete pkg.dependencies['@repo/db']
      await fs.writeJson(authPkgPath, pkg, { spaces: 2 })
    }
  }

  // 5. Clean apps/server src
  const serverDbDir = path.join(serverDir, 'src/database')
  const serverPostsDir = path.join(serverDir, 'src/posts')
  if (await fs.pathExists(serverDbDir)) await fs.remove(serverDbDir)
  if (await fs.pathExists(serverPostsDir)) await fs.remove(serverPostsDir)

  // 6. Update apps/server/src/app.module.ts
  const appModulePath = path.join(serverDir, 'src/app.module.ts')
  if (await fs.pathExists(appModulePath)) {
    let content = await fs.readFile(appModulePath, 'utf8')
    content = content.replace(
      /import \{ DatabaseModule \} from '\.\/database\/database\.module'\n?/,
      '',
    )
    content = content.replace(
      /import \{ PostsModule \} from '\.\/posts\/posts\.module'\n?/,
      '',
    )
    content = content.replace(/DatabaseModule,\s*/, '')
    content = content.replace(/PostsModule,\s*/, '')
    await fs.writeFile(appModulePath, content, 'utf8')
  }

  // 7. Update health controller
  await cleanHealthController(
    path.join(serverDir, 'src/health/health.controller.ts'),
    auth,
  )

  // 8. Update apps/server e2e test
  const e2ePath = path.join(serverDir, 'test/app.e2e-spec.ts')
  if (await fs.pathExists(e2ePath)) {
    let content = await fs.readFile(e2ePath, 'utf8')
    content = content.replace(
      /import \{ DatabaseService \} from '\.\.\/src\/database\/database\.service'\n?/,
      '',
    )
    content = content.replace(
      /import \{ DatabaseService \} from '@\/database\/database\.service'\n?/,
      '',
    )
    content = content.replace(
      /\.overrideProvider\(DatabaseService\)[\s\S]*?\.useValue\(\{[\s\S]*?\}\)/,
      '',
    )
    content = content.replace(
      /expect\(json\.info\?\.database\?\.status\)\.toBe\('up'\)\n?/,
      '',
    )
    await fs.writeFile(e2ePath, content, 'utf8')
  }

  // 9. Update packages/env/src/server.ts
  const envServerPath = path.join(envPkgDir, 'src/server.ts')
  if (await fs.pathExists(envServerPath)) {
    let content = await fs.readFile(envServerPath, 'utf8')
    content = content.replace(
      /\s+DATABASE_URL:[^\n]+\n[^\n]+default\([^\n]+\),/,
      '',
    )
    content = content.replace(/\s+DATABASE_MAX_CONNECTIONS:[^\n]+,/, '')
    await fs.writeFile(envServerPath, content, 'utf8')
  }

  // 10. Update .env files
  const envFiles = [
    path.join(targetDir, '.env'),
    path.join(targetDir, '.env.example'),
    path.join(serverDir, '.env'),
    path.join(serverDir, '.env.example'),
  ]
  for (const envFile of envFiles) {
    if (await fs.pathExists(envFile)) {
      let content = await fs.readFile(envFile, 'utf8')
      content = content.replace(/DATABASE_URL=[^\n]*\n?/, '')
      content = content.replace(/DATABASE_MAX_CONNECTIONS=[^\n]*\n?/, '')
      await fs.writeFile(envFile, content, 'utf8')
    }
  }
}

async function cleanHealthController(
  healthControllerPath: string,
  auth: string,
) {
  if (await fs.pathExists(healthControllerPath)) {
    const authImport =
      auth !== 'none'
        ? "import { AllowAnonymous } from '@thallesp/nestjs-better-auth'\n"
        : ''
    const allowAnon = auth !== 'none' ? '  @AllowAnonymous()\n' : ''
    const cleanHealth = `import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { SkipThrottle } from '@nestjs/throttler'
${authImport}import { BypassTransform } from '@/common/decorators/bypass-transform.decorator'

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

${allowAnon}  @BypassTransform()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => ({
        api: { status: 'up' },
      }),
    ])
  }
}
`
    await fs.writeFile(healthControllerPath, cleanHealth, 'utf8')
  }
}
