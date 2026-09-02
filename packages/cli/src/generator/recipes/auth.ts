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
      // 1. Remove auth directory
      const authDir = path.join(serverDir, 'src/auth')
      if (await fs.pathExists(authDir)) {
        await fs.remove(authDir)
      }

      // 2. Clean package.json
      const pkgPath = path.join(serverDir, 'package.json')
      if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath)
        delete pkg.dependencies['better-auth']
        delete pkg.dependencies['@thallesp/nestjs-better-auth']
        await fs.writeJson(pkgPath, pkg, { spaces: 2 })
      }

      // 3. Remove AuthModule from app.module.ts
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

      // 4. Update app.controller.ts (remove auth imports, decorators, and auth routes)
      const appControllerPath = path.join(serverDir, 'src/app.controller.ts')
      if (await fs.pathExists(appControllerPath)) {
        const cleanController = `import { Body, Controller, Get, Logger, Post } from '@nestjs/common'
import { z } from 'zod'
import { AppService } from '@/app.service'

const echoSchema = z.object({
  message: z.string().min(3, 'Message must be at least 3 characters'),
})

type EchoDto = z.infer<typeof echoSchema>

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    this.logger.log('Executing getHello endpoint')
    return this.appService.getHello()
  }

  @Post('echo')
  echo(@Body({ schema: echoSchema }) body: EchoDto) {
    this.logger.log(\`Echoing message: \${body.message}\`)
    return { echo: body.message }
  }
}
`
        await fs.writeFile(appControllerPath, cleanController, 'utf8')
      }

      // 5. Update app.controller.spec.ts
      const appControllerSpecPath = path.join(
        serverDir,
        'src/app.controller.spec.ts',
      )
      if (await fs.pathExists(appControllerSpecPath)) {
        const cleanSpec = `import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!')
    })
  })
})
`
        await fs.writeFile(appControllerSpecPath, cleanSpec, 'utf8')
      }

      // 6. Update health.controller.ts (remove @AllowAnonymous)
      const healthControllerPath = path.join(
        serverDir,
        'src/health/health.controller.ts',
      )
      if (await fs.pathExists(healthControllerPath)) {
        let content = await fs.readFile(healthControllerPath, 'utf8')
        content = content.replace(
          /import \{ AllowAnonymous \} from '@thallesp\/nestjs-better-auth'\n?/,
          '',
        )
        content = content.replace(/@AllowAnonymous\(\)\n?\s*/g, '')
        await fs.writeFile(healthControllerPath, content, 'utf8')
      }

      // 7. Clean database auth schema if database is used
      const authSchemaPath = path.join(
        serverDir,
        'src/database/schema/auth.schema.ts',
      )
      if (await fs.pathExists(authSchemaPath)) {
        await fs.remove(authSchemaPath)
      }

      const schemaIndexPath = path.join(
        serverDir,
        'src/database/schema/index.ts',
      )
      if (await fs.pathExists(schemaIndexPath)) {
        let content = await fs.readFile(schemaIndexPath, 'utf8')
        content = content.replace(/export \* from '\.\/auth\.schema'\n?/, '')
        await fs.writeFile(schemaIndexPath, content, 'utf8')
      }

      const postsSchemaPath = path.join(
        serverDir,
        'src/database/schema/posts.schema.ts',
      )
      if (await fs.pathExists(postsSchemaPath)) {
        let content = await fs.readFile(postsSchemaPath, 'utf8')
        content = content.replace(
          /import \{ user \} from '\.\/auth\.schema'\n?/,
          '',
        )
        content = content.replace(
          /\.references\(\(\) => user\.id, \{ onDelete: 'cascade' \}\)/,
          '',
        )
        content = content.replace(
          /export const postsRelations =[\s\S]*?\}\)\)\n?/,
          '',
        )
        await fs.writeFile(postsSchemaPath, content, 'utf8')
      }

      // 8. Clean seed.ts (remove user creation)
      const seedPath = path.join(serverDir, 'src/database/seed.ts')
      if (await fs.pathExists(seedPath)) {
        let content = await fs.readFile(seedPath, 'utf8')
        content = content.replace(
          /const adminUser = await db[\s\S]*?console\.log\([^)]*\)\n?/,
          '',
        )
        content = content.replace(
          /userId:\s*'usr_admin_seed'/,
          "userId: 'seed_author'",
        )
        await fs.writeFile(seedPath, content, 'utf8')
      }

      // 9. Clean env variables
      const envPath = path.join(serverDir, 'src/config/env.ts')
      if (await fs.pathExists(envPath)) {
        let content = await fs.readFile(envPath, 'utf8')
        content = content.replace(
          /\s+BETTER_AUTH_SECRET:[^\n]+\n[^\n]+default\([^\n]+\),/,
          '',
        )
        content = content.replace(/\s+BETTER_AUTH_URL:[^\n]+,/, '')
        await fs.writeFile(envPath, content, 'utf8')
      }

      const envFiles = [
        path.join(serverDir, '.env'),
        path.join(serverDir, '.env.example'),
      ]
      for (const envFile of envFiles) {
        if (await fs.pathExists(envFile)) {
          let content = await fs.readFile(envFile, 'utf8')
          content = content.replace(/BETTER_AUTH_SECRET=[^\n]*\n?/, '')
          content = content.replace(/BETTER_AUTH_URL=[^\n]*\n?/, '')
          await fs.writeFile(envFile, content, 'utf8')
        }
      }
    }

    // 10. Monorepo web cleanup
    if (config.arch === 'monorepo') {
      const webDir = path.join(config.targetDir, 'apps/web')
      const authClientPath = path.join(webDir, 'src/lib/auth-client.ts')
      if (await fs.pathExists(authClientPath)) {
        await fs.remove(authClientPath)
      }

      const webPkgPath = path.join(webDir, 'package.json')
      if (await fs.pathExists(webPkgPath)) {
        const pkg = await fs.readJson(webPkgPath)
        delete pkg.dependencies['better-auth']
        await fs.writeJson(webPkgPath, pkg, { spaces: 2 })
      }
    }
  },
}
