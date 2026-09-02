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
            /import\s*\{\s*apiReference\s*\}\s*from\s*'@scalar\/nestjs-api-reference'\n?/,
            '',
          )
          content = content.replace(
            /import\s*\{\s*DocumentBuilder,\s*SwaggerModule\s*\}\s*from\s*'@nestjs\/swagger'\n?/,
            '',
          )
          // Remove documentation setup block in main.ts
          content = content.replace(
            /if\s*\(!config\.isProduction\s*\|\|\s*config\.get\('ENABLE_DOCS'\)\)\s*\{[\s\S]*?app\.use\(\s*'\/docs'[\s\S]*?\)\s*\}\n?/,
            '',
          )
          content = content.replace(
            /exclude:\s*\[\s*'health',\s*'docs'\s*\]/,
            "exclude: ['health']",
          )
          await fs.writeFile(mainPath, content, 'utf8')
        }
      } else if (config.docs === 'swagger') {
        if (await fs.pathExists(pkgPath)) {
          const pkg = await fs.readJson(pkgPath)
          delete pkg.dependencies['@scalar/nestjs-api-reference']
          if (config.http === 'express') {
            pkg.dependencies['swagger-ui-express'] = '^5.0.1'
            pkg.devDependencies['@types/swagger-ui-express'] = '^4.1.8'
          } else {
            pkg.dependencies['@fastify/swagger-ui'] = '^5.2.2'
          }
          await fs.writeJson(pkgPath, pkg, { spaces: 2 })
        }

        if (await fs.pathExists(mainPath)) {
          let content = await fs.readFile(mainPath, 'utf8')
          content = content.replace(
            /import\s*\{\s*apiReference\s*\}\s*from\s*'@scalar\/nestjs-api-reference'\n?/,
            '',
          )
          content = content.replace(
            /app\.use\(\s*'\/docs',\s*apiReference\([\s\S]*?\),\s*\)/,
            "SwaggerModule.setup('docs', app, document)",
          )
          await fs.writeFile(mainPath, content, 'utf8')
        }
      }
    }
  },
}
