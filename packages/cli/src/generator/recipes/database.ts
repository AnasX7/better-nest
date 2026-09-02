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
        const pkgPath = path.join(serverDir, 'package.json')
        if (await fs.pathExists(pkgPath)) {
          const pkg = await fs.readJson(pkgPath)
          delete pkg.dependencies['postgres']
          delete pkg.devDependencies['@types/pg']
          pkg.dependencies['better-sqlite3'] = '^11.8.1'
          pkg.devDependencies['@types/better-sqlite3'] = '^7.6.12'
          await fs.writeJson(pkgPath, pkg, { spaces: 2 })
        }

        // Update drizzle.config.ts
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
      }
    } else if (config.db === 'none') {
      for (const serverDir of serverDirs) {
        // Remove database directory and drizzle config
        const dbDir = path.join(serverDir, 'src/database')
        const drizzleConfig = path.join(serverDir, 'drizzle.config.ts')
        if (await fs.pathExists(dbDir)) await fs.remove(dbDir)
        if (await fs.pathExists(drizzleConfig)) await fs.remove(drizzleConfig)

        // Clean package.json
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

        // Remove DatabaseModule from app.module.ts
        const appModulePath = path.join(serverDir, 'src/app.module.ts')
        if (await fs.pathExists(appModulePath)) {
          let content = await fs.readFile(appModulePath, 'utf8')
          content = content.replace(
            /import \{ DatabaseModule \} from '\.\/database\/database\.module'\n?/,
            '',
          )
          content = content.replace(/DatabaseModule,\s*/, '')
          await fs.writeFile(appModulePath, content, 'utf8')
        }
      }
    }
  },
}
