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
      // 1. Update package.json
      const pkgPath = path.join(serverDir, 'package.json')
      if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath)

        delete pkg.dependencies['@nestjs/platform-fastify']
        delete pkg.dependencies['@fastify/compress']
        delete pkg.dependencies['@fastify/cors']
        delete pkg.dependencies['@fastify/helmet']
        delete pkg.dependencies['fastify']

        pkg.dependencies['@nestjs/platform-express'] = '^12.0.1'
        pkg.dependencies['compression'] = '^1.8.0'
        pkg.dependencies['cors'] = '^2.8.5'
        pkg.dependencies['helmet'] = '^8.1.0'
        pkg.devDependencies['@types/compression'] = '^1.7.5'
        pkg.devDependencies['@types/cors'] = '^2.8.17'

        await fs.writeJson(pkgPath, pkg, { spaces: 2 })
      }

      // 2. Update src/main.ts
      const mainPath = path.join(serverDir, 'src/main.ts')
      if (await fs.pathExists(mainPath)) {
        let content = await fs.readFile(mainPath, 'utf8')

        // Replace imports
        content = content.replace(
          /import\s*\{\s*FastifyAdapter,\s*NestFastifyApplication,?\s*\}\s*from\s*'@nestjs\/platform-fastify'\n?/,
          '',
        )
        content = content.replace(
          /import fastifyCompress from '@fastify\/compress'\n?/,
          "import compression from 'compression'\n",
        )
        content = content.replace(
          /import fastifyHelmet from '@fastify\/helmet'\n?/,
          "import helmet from 'helmet'\n",
        )

        // Replace NestFactory.create preserving bufferLogs and bodyParser: false for Better Auth
        content = content.replace(
          /const app = await NestFactory\.create<NestFastifyApplication>\(\s*AppModule,\s*new FastifyAdapter\([^)]*\),\s*\{([\s\S]*?)\},?\s*\)/,
          'const app = await NestFactory.create(AppModule, {$1})',
        )

        // Replace middleware
        content = content.replace(
          /await app\.register\(fastifyCompress[^)]*\)/,
          'app.use(compression())',
        )
        content = content.replace(
          /await app\.register\(fastifyHelmet,\s*\{[\s\S]*?\}\)/,
          'app.use(helmet({ contentSecurityPolicy: false }))',
        )

        // Remove withFastify: true from Scalar
        content = content.replace(/withFastify:\s*true,?\n?/, '')

        // Replace listen call
        content = content.replace(
          /await app\.listen\(\{\s*port,\s*host:\s*'0\.0\.0\.0',?\s*\}\)/,
          "await app.listen(port, '0.0.0.0')",
        )

        await fs.writeFile(mainPath, content, 'utf8')
      }

      // 3. Update src/common/filters/http-exception.filter.ts
      const filterPath = path.join(
        serverDir,
        'src/common/filters/http-exception.filter.ts',
      )
      if (await fs.pathExists(filterPath)) {
        let content = await fs.readFile(filterPath, 'utf8')
        content = content.replace(
          /import type \{ FastifyReply \} from 'fastify'/,
          "import type { Response } from 'express'",
        )
        content = content.replace(/<FastifyReply>/g, '<Response>')
        await fs.writeFile(filterPath, content, 'utf8')
      }

      // 4. Update test/app.e2e-spec.ts for Express testing with supertest
      const e2ePath = path.join(serverDir, 'test/app.e2e-spec.ts')
      if (await fs.pathExists(e2ePath)) {
        let content = await fs.readFile(e2ePath, 'utf8')

        // Replace Fastify imports with supertest
        content = content.replace(
          /import\s*\{\s*FastifyAdapter,\s*NestFastifyApplication,?\s*\}\s*from\s*'@nestjs\/platform-fastify'/,
          "import request from 'supertest'\nimport type { INestApplication } from '@nestjs/common'",
        )
        content = content.replace(
          /let app:\s*NestFastifyApplication/,
          'let app: INestApplication',
        )
        content = content.replace(
          /app\s*=\s*moduleFixture\.createNestApplication<NestFastifyApplication>\(\s*new FastifyAdapter\(\),?\s*\)/,
          'app = moduleFixture.createNestApplication()',
        )
        content = content.replace(
          /await app\.getHttpAdapter\(\)\.getInstance\(\)\.ready\(\)\n?/,
          '',
        )

        // Replace app.inject calls with supertest
        content = content.replace(
          /const result = await app\.inject\(\{\s*method:\s*'GET',\s*url:\s*'\/api',?\s*\}\)\s*expect\(result\.statusCode\)\.toBe\(200\)\s*const json = JSON\.parse\(result\.payload\)/,
          `const result = await request(app.getHttpServer()).get('/api')
    expect(result.status).toBe(200)
    const json = result.body`,
        )

        content = content.replace(
          /const result = await app\.inject\(\{\s*method:\s*'GET',\s*url:\s*'\/health',?\s*\}\)\s*expect\(result\.statusCode\)\.toBe\(200\)\s*const json = JSON\.parse\(result\.payload\)/,
          `const result = await request(app.getHttpServer()).get('/health')
    expect(result.status).toBe(200)
    const json = result.body`,
        )

        await fs.writeFile(e2ePath, content, 'utf8')
      }
    }
  },
}
