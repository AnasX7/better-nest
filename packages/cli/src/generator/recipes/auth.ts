import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const authRecipe: Recipe = {
  id: 'auth',
  name: 'Authentication',
  async apply(config: ProjectConfig) {
    if (config.auth === 'better-auth') {
      // Default template already includes Better Auth
      return
    }

    const serverDirs =
      config.arch === 'monorepo'
        ? [path.join(config.targetDir, 'apps/server')]
        : [config.targetDir]

    for (const serverDir of serverDirs) {
      // Remove auth directory
      const authDir = path.join(serverDir, 'src/auth')
      if (await fs.pathExists(authDir)) {
        await fs.remove(authDir)
      }

      // Clean package.json
      const pkgPath = path.join(serverDir, 'package.json')
      if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath)
        delete pkg.dependencies['better-auth']
        delete pkg.dependencies['@thallesp/nestjs-better-auth']
        await fs.writeJson(pkgPath, pkg, { spaces: 2 })
      }

      // Remove AuthModule from app.module.ts
      const appModulePath = path.join(serverDir, 'src/app.module.ts')
      if (await fs.pathExists(appModulePath)) {
        let content = await fs.readFile(appModulePath, 'utf8')
        content = content.replace(
          /import \{ AuthModule \} from '\.\/auth\/auth\.module'\n?/,
          '',
        )
        content = content.replace(/AuthModule,\s*/, '')
        await fs.writeFile(appModulePath, content, 'utf8')
      }
    }
  },
}
