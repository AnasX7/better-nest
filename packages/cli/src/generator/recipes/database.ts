import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const databaseRecipe: Recipe = {
  id: 'database',
  name: 'Database & ORM',
  async apply(config: ProjectConfig) {
    if (config.db === 'postgres' && config.orm === 'drizzle') {
      // Default template is already configured with Postgres + Drizzle
      return
    }

    const serverDirs =
      config.arch === 'monorepo'
        ? [path.join(config.targetDir, 'apps/server')]
        : [config.targetDir]

    if (config.db === 'sqlite') {
      for (const serverDir of serverDirs) {
        // 1. Update package.json
        const pkgPath = path.join(serverDir, 'package.json')
        if (await fs.pathExists(pkgPath)) {
          const pkg = await fs.readJson(pkgPath)
          delete pkg.dependencies['postgres']
          delete pkg.devDependencies['@types/pg']
          pkg.dependencies['better-sqlite3'] = '^11.8.1'
          pkg.devDependencies['@types/better-sqlite3'] = '^7.6.12'
          await fs.writeJson(pkgPath, pkg, { spaces: 2 })
        }

        // 2. Update drizzle.config.ts
        const drizzleConfigPath = path.join(serverDir, 'drizzle.config.ts')
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
        const dbServicePath = path.join(
          serverDir,
          'src/database/database.service.ts',
        )
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

        // 4. Update posts.schema.ts for sqlite
        const postsSchemaPath = path.join(
          serverDir,
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

        // 5. Update auth.ts for sqlite if auth enabled
        const authPath = path.join(serverDir, 'src/auth/auth.ts')
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
      }
    } else if (config.db === 'none') {
      for (const serverDir of serverDirs) {
        // 1. Remove database directory, drizzle config, and posts module
        const dbDir = path.join(serverDir, 'src/database')
        const drizzleConfig = path.join(serverDir, 'drizzle.config.ts')
        const postsDir = path.join(serverDir, 'src/posts')
        if (await fs.pathExists(dbDir)) await fs.remove(dbDir)
        if (await fs.pathExists(drizzleConfig)) await fs.remove(drizzleConfig)
        if (await fs.pathExists(postsDir)) await fs.remove(postsDir)

        // 2. Clean package.json
        const pkgPath = path.join(serverDir, 'package.json')
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

        // 4. Update health.controller.ts (remove database check)
        const healthControllerPath = path.join(
          serverDir,
          'src/health/health.controller.ts',
        )
        if (await fs.pathExists(healthControllerPath)) {
          const authImport =
            config.auth !== 'none'
              ? "import { AllowAnonymous } from '@thallesp/nestjs-better-auth'\n"
              : ''
          const allowAnon =
            config.auth !== 'none' ? '  @AllowAnonymous()\n' : ''
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

        // 5. Update test/app.e2e-spec.ts (remove DatabaseService mock)
        const e2ePath = path.join(serverDir, 'test/app.e2e-spec.ts')
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

        // 6. Clean env.ts
        const envPath = path.join(serverDir, 'src/config/env.ts')
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
    }
  },
}
