import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const docsRecipe: Recipe = {
  id: 'docs',
  name: 'API Documentation',
  async apply(config: ProjectConfig) {
    if (config.docs === 'scalar') {
      // Default template already includes Scalar
      return
    }

    const serverDirs =
      config.arch === 'monorepo'
        ? [path.join(config.targetDir, 'apps/server')]
        : [config.targetDir]

    for (const serverDir of serverDirs) {
      const pkgPath = path.join(serverDir, 'package.json')
      const mainPath = path.join(serverDir, 'src/main.ts')

      if (config.docs === 'none') {
        if (await fs.pathExists(pkgPath)) {
          const pkg = await fs.readJson(pkgPath)
          delete pkg.dependencies['@scalar/nestjs-api-reference']
          delete pkg.dependencies['@nestjs/swagger']
          await fs.writeJson(pkgPath, pkg, { spaces: 2 })
        }

        if (await fs.pathExists(mainPath)) {
          let content = await fs.readFile(mainPath, 'utf8')
          content = content.replace(
            /import \{ apiReference \} from '@scalar\/nestjs-api-reference'\n?/,
            '',
          )
          content = content.replace(
            /import \{ DocumentBuilder, SwaggerModule \} from '@nestjs\/swagger'\n?/,
            '',
          )
          // Remove Swagger setup block
          content = content.replace(
            /\/\/ Swagger \/ OpenAPI Specification[\s\S]*?app\.use\('\/docs', apiReference\([^)]*\)\)/,
            '',
          )
          await fs.writeFile(mainPath, content, 'utf8')
        }
      } else if (config.docs === 'swagger') {
        if (await fs.pathExists(pkgPath)) {
          const pkg = await fs.readJson(pkgPath)
          delete pkg.dependencies['@scalar/nestjs-api-reference']
          await fs.writeJson(pkgPath, pkg, { spaces: 2 })
        }

        if (await fs.pathExists(mainPath)) {
          let content = await fs.readFile(mainPath, 'utf8')
          content = content.replace(
            /import \{ apiReference \} from '@scalar\/nestjs-api-reference'\n?/,
            '',
          )
          content = content.replace(
            /app\.use\('\/docs', apiReference\([^)]*\)\)/,
            "SwaggerModule.setup('docs', app, document)",
          )
          await fs.writeFile(mainPath, content, 'utf8')
        }
      }
    }
  },
}
