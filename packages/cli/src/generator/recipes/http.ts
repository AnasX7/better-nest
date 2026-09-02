import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const httpRecipe: Recipe = {
  id: 'http',
  name: 'HTTP Platform Adapter',
  async apply(config: ProjectConfig) {
    if (config.http === 'fastify') {
      // Default template is already configured with Fastify
      return
    }

    // Apply Express adapter
    const serverDirs =
      config.arch === 'monorepo'
        ? [path.join(config.targetDir, 'apps/server')]
        : [config.targetDir]

    for (const serverDir of serverDirs) {
      const pkgPath = path.join(serverDir, 'package.json')
      if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath)

        // Remove Fastify deps
        delete pkg.dependencies['@nestjs/platform-fastify']
        delete pkg.dependencies['@fastify/compress']
        delete pkg.dependencies['@fastify/cors']
        delete pkg.dependencies['@fastify/helmet']
        delete pkg.dependencies['fastify']

        // Add Express deps
        pkg.dependencies['@nestjs/platform-express'] = '^12.0.1'
        pkg.dependencies['compression'] = '^1.8.0'
        pkg.dependencies['cors'] = '^2.8.5'
        pkg.dependencies['helmet'] = '^8.1.0'
        pkg.devDependencies['@types/compression'] = '^1.7.5'
        pkg.devDependencies['@types/cors'] = '^2.8.17'

        await fs.writeJson(pkgPath, pkg, { spaces: 2 })
      }

      // Update main.ts for Express
      const mainPath = path.join(serverDir, 'src/main.ts')
      if (await fs.pathExists(mainPath)) {
        let content = await fs.readFile(mainPath, 'utf8')

        // Replace imports
        content = content.replace(
          /import \{ NestFastifyApplication, FastifyAdapter \} from '@nestjs\/platform-fastify'/,
          '',
        )
        content = content.replace(
          /import fastifyCompress from '@fastify\/compress'/,
          "import compression from 'compression'",
        )
        content = content.replace(
          /import fastifyHelmet from '@fastify\/helmet'/,
          "import helmet from 'helmet'",
        )
        content = content.replace(
          /import fastifyCors from '@fastify\/cors'/,
          "import cors from 'cors'",
        )

        // Replace NestFactory.create
        content = content.replace(
          /const app = await NestFactory\.create<NestFastifyApplication>\(\s*AppModule,\s*new FastifyAdapter\([^)]*\),?\s*\)/,
          'const app = await NestFactory.create(AppModule)',
        )

        // Replace middleware registration
        content = content.replace(
          /await app\.register\(fastifyHelmet[^)]*\)/,
          'app.use(helmet())',
        )
        content = content.replace(
          /await app\.register\(fastifyCompress\)/,
          'app.use(compression())',
        )
        content = content.replace(
          /await app\.register\(fastifyCors, \{[^}]*\}\)/,
          'app.enableCors({ origin: true, credentials: true })',
        )

        // Replace listen call
        content = content.replace(
          /await app\.listen\(port, '0\.0\.0\.0'\)/,
          'await app.listen(port)',
        )

        await fs.writeFile(mainPath, content, 'utf8')
      }
    }
  },
}
