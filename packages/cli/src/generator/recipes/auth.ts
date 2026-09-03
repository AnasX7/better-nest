import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const authRecipe: Recipe = {
  id: 'auth',
  name: 'Authentication',
  async apply(config: ProjectConfig) {
    if (config.auth === 'better-auth') {
      return
    }

    if (config.arch === 'monorepo') {
      await applyMonorepoNoAuth(config.targetDir)
    } else {
      await applyStandaloneNoAuth(config.targetDir)
    }
  },
}

async function applyStandaloneNoAuth(targetDir: string) {
  // 1. Remove auth directory
  const authDir = path.join(targetDir, 'src/auth')
  if (await fs.pathExists(authDir)) {
    await fs.remove(authDir)
  }

  // 2. Clean package.json
  const pkgPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath)
    delete pkg.dependencies['better-auth']
    delete pkg.dependencies['@thallesp/nestjs-better-auth']
    await fs.writeJson(pkgPath, pkg, { spaces: 2 })
  }

  // 3. Remove AuthModule from app.module.ts
  const appModulePath = path.join(targetDir, 'src/app.module.ts')
  if (await fs.pathExists(appModulePath)) {
    let content = await fs.readFile(appModulePath, 'utf8')
    content = content.replace(
      /import \{ AuthModule \} from '\.\/auth\/auth\.module'\n?/,
      '',
    )
    content = content.replace(/AuthModule,\s*/, '')
    await fs.writeFile(appModulePath, content, 'utf8')
  }

  // 4. Update app.controller.ts and spec
  await cleanAppController(targetDir)

  // 5. Update health.controller.ts
  await cleanHealthAuth(path.join(targetDir, 'src/health/health.controller.ts'))

  // 6. Update posts controller & service if posts exists
  await cleanPostsController(
    path.join(targetDir, 'src/posts/posts.controller.ts'),
    false,
  )
  await cleanPostsService(
    path.join(targetDir, 'src/posts/posts.service.ts'),
    false,
  )

  // 7. Clean database auth schema
  const authSchemaPath = path.join(
    targetDir,
    'src/database/schema/auth.schema.ts',
  )
  if (await fs.pathExists(authSchemaPath)) {
    await fs.remove(authSchemaPath)
  }

  const schemaIndexPath = path.join(targetDir, 'src/database/schema/index.ts')
  if (await fs.pathExists(schemaIndexPath)) {
    let content = await fs.readFile(schemaIndexPath, 'utf8')
    content = content.replace(/export \* from '\.\/auth\.schema'\n?/, '')
    await fs.writeFile(schemaIndexPath, content, 'utf8')
  }

  const postsSchemaPath = path.join(
    targetDir,
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

  // 8. Clean seed.ts
  const seedPath = path.join(targetDir, 'src/database/seed.ts')
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
  const envPath = path.join(targetDir, 'src/config/env.ts')
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
    path.join(targetDir, '.env'),
    path.join(targetDir, '.env.example'),
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

async function applyMonorepoNoAuth(targetDir: string) {
  const authPkgDir = path.join(targetDir, 'packages/auth')
  const serverDir = path.join(targetDir, 'apps/server')
  const webDir = path.join(targetDir, 'apps/web')
  const dbPkgDir = path.join(targetDir, 'packages/db')
  const envPkgDir = path.join(targetDir, 'packages/env')

  // 1. Remove packages/auth entirely
  if (await fs.pathExists(authPkgDir)) {
    await fs.remove(authPkgDir)
  }

  // 2. Remove @repo/auth from apps/server/package.json
  const serverPkgPath = path.join(serverDir, 'package.json')
  if (await fs.pathExists(serverPkgPath)) {
    const pkg = await fs.readJson(serverPkgPath)
    delete pkg.dependencies['@repo/auth']
    delete pkg.dependencies['better-auth']
    delete pkg.dependencies['@thallesp/nestjs-better-auth']
    await fs.writeJson(serverPkgPath, pkg, { spaces: 2 })
  }

  // 3. Remove @repo/auth from apps/web/package.json
  const webPkgPath = path.join(webDir, 'package.json')
  if (await fs.pathExists(webPkgPath)) {
    const pkg = await fs.readJson(webPkgPath)
    if (pkg.dependencies) {
      delete pkg.dependencies['@repo/auth']
      delete pkg.dependencies['better-auth']
    }
    await fs.writeJson(webPkgPath, pkg, { spaces: 2 })
  }

  const authClientPath = path.join(webDir, 'src/lib/auth-client.ts')
  if (await fs.pathExists(authClientPath)) {
    await fs.remove(authClientPath)
  }

  // 4. Remove auth from apps/server src
  const serverAuthDir = path.join(serverDir, 'src/auth')
  if (await fs.pathExists(serverAuthDir)) {
    await fs.remove(serverAuthDir)
  }

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

  await cleanAppController(serverDir)
  await cleanHealthAuth(path.join(serverDir, 'src/health/health.controller.ts'))

  // 5. Update posts controller & service in apps/server
  await cleanPostsController(
    path.join(serverDir, 'src/posts/posts.controller.ts'),
    true,
  )
  await cleanPostsService(
    path.join(serverDir, 'src/posts/posts.service.ts'),
    true,
  )

  // 6. Clean packages/db if it exists
  const dbAuthSchemaPath = path.join(dbPkgDir, 'src/schema/auth.schema.ts')
  if (await fs.pathExists(dbAuthSchemaPath)) {
    await fs.remove(dbAuthSchemaPath)
  }

  const dbSchemaIndexPath = path.join(dbPkgDir, 'src/schema/index.ts')
  if (await fs.pathExists(dbSchemaIndexPath)) {
    let content = await fs.readFile(dbSchemaIndexPath, 'utf8')
    content = content.replace(/export \* from '\.\/auth\.schema'\n?/, '')
    await fs.writeFile(dbSchemaIndexPath, content, 'utf8')
  }

  const dbPostsSchemaPath = path.join(dbPkgDir, 'src/schema/posts.schema.ts')
  if (await fs.pathExists(dbPostsSchemaPath)) {
    let content = await fs.readFile(dbPostsSchemaPath, 'utf8')
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
    await fs.writeFile(dbPostsSchemaPath, content, 'utf8')
  }

  const dbSeedPath = path.join(dbPkgDir, 'src/seed.ts')
  if (await fs.pathExists(dbSeedPath)) {
    let content = await fs.readFile(dbSeedPath, 'utf8')
    content = content.replace(
      /const adminUser = await db[\s\S]*?console\.log\([^)]*\)\n?/,
      '',
    )
    content = content.replace(
      /userId:\s*'usr_admin_seed'/,
      "userId: 'seed_author'",
    )
    await fs.writeFile(dbSeedPath, content, 'utf8')
  }

  // 7. Update packages/env/src/server.ts
  const envServerPath = path.join(envPkgDir, 'src/server.ts')
  if (await fs.pathExists(envServerPath)) {
    let content = await fs.readFile(envServerPath, 'utf8')
    content = content.replace(
      /\s+BETTER_AUTH_SECRET:[^\n]+\n[^\n]+default\([^\n]+\),/,
      '',
    )
    content = content.replace(/\s+BETTER_AUTH_URL:[^\n]+,/, '')
    await fs.writeFile(envServerPath, content, 'utf8')
  }

  // 8. Clean .env files
  const envFiles = [
    path.join(targetDir, '.env'),
    path.join(targetDir, '.env.example'),
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

async function cleanAppController(serverDir: string) {
  const appControllerPath = path.join(serverDir, 'src/app.controller.ts')
  if (await fs.pathExists(appControllerPath)) {
    const cleanController = `import { Body, Controller, Get, Logger, Post } from '@nestjs/common'
import { z } from 'zod'
import { AppService } from './app.service'

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
  echo(@Body() body: EchoDto) {
    this.logger.log(\`Echoing message: \${body.message}\`)
    return { echo: body.message }
  }
}
`
    await fs.writeFile(appControllerPath, cleanController, 'utf8')
  }

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
}

async function cleanHealthAuth(healthControllerPath: string) {
  if (await fs.pathExists(healthControllerPath)) {
    let content = await fs.readFile(healthControllerPath, 'utf8')
    content = content.replace(
      /import \{ AllowAnonymous \} from '@thallesp\/nestjs-better-auth'\n?/,
      '',
    )
    content = content.replace(/@AllowAnonymous\(\)\n?\s*/g, '')
    await fs.writeFile(healthControllerPath, content, 'utf8')
  }
}

async function cleanPostsController(
  postsControllerPath: string,
  isMonorepo: boolean,
) {
  if (await fs.pathExists(postsControllerPath)) {
    const dtoImport = isMonorepo
      ? `import {
  createPostSchema,
  type CreatePostDto,
  updatePostSchema,
  type UpdatePostDto,
} from '@repo/contracts'`
      : `import { createPostSchema, type CreatePostDto } from './dto/create-post.dto'
import { updatePostSchema, type UpdatePostDto } from './dto/update-post.dto'`

    const cleanPosts = `import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ResponseMessage } from '@/common/decorators/response-message.decorator'
${dtoImport}
import { PostsService } from './posts.service'

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name)

  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ResponseMessage('Post created successfully')
  async create(@Body({ schema: createPostSchema }) body: CreatePostDto) {
    this.logger.log('Creating post')
    return this.postsService.create('anonymous_author', body)
  }

  @Get()
  @ResponseMessage('Posts retrieved successfully')
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? Number(limit) : 20
    const o = offset ? Number(offset) : 0
    return this.postsService.findAll(l, o)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findById(id)
  }

  @Patch(':id')
  @ResponseMessage('Post updated successfully')
  async update(
    @Param('id') id: string,
    @Body({ schema: updatePostSchema }) body: UpdatePostDto,
  ) {
    this.logger.log(\`Updating post \${id}\`)
    return this.postsService.update(id, 'anonymous_author', body)
  }

  @Delete(':id')
  @ResponseMessage('Post deleted successfully')
  async delete(@Param('id') id: string) {
    this.logger.log(\`Deleting post \${id}\`)
    return this.postsService.delete(id, 'anonymous_author')
  }
}
`
    await fs.writeFile(postsControllerPath, cleanPosts, 'utf8')
  }
}

async function cleanPostsService(
  postsServicePath: string,
  isMonorepo: boolean,
) {
  if (await fs.pathExists(postsServicePath)) {
    const dbImport = isMonorepo
      ? "import { posts } from '@repo/db'"
      : "import { posts } from '@/database/schema'"
    const dtoImport = isMonorepo
      ? "import type { CreatePostDto, UpdatePostDto } from '@repo/contracts'"
      : `import type { CreatePostDto } from './dto/create-post.dto'
import type { UpdatePostDto } from './dto/update-post.dto'`

    const cleanService = `import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'
import { DatabaseService } from '@/database/database.service'
${dbImport}
${dtoImport}

@Injectable()
export class PostsService {
  constructor(private readonly database: DatabaseService) {}

  async create(userId: string, data: CreatePostDto) {
    const [newPost] = await this.database.db
      .insert(posts)
      .values({
        title: data.title,
        content: data.content,
        userId,
      })
      .returning()

    return newPost
  }

  async findAll(limit = 20, offset = 0) {
    const items = await this.database.db.query.posts.findMany({
      limit,
      offset,
      orderBy: [desc(posts.createdAt)],
    })

    return {
      data: items,
      meta: {
        limit,
        offset,
        count: items.length,
      },
    }
  }

  async findById(id: string) {
    const post = await this.database.db.query.posts.findFirst({
      where: eq(posts.id, id),
    })

    if (!post) {
      throw new NotFoundException(\`Post with ID "\${id}" not found\`)
    }

    return post
  }

  async update(id: string, userId: string, data: UpdatePostDto) {
    await this.findById(id)

    const [updated] = await this.database.db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()

    return updated
  }

  async delete(id: string, userId: string) {
    await this.findById(id)

    await this.database.db
      .delete(posts)
      .where(eq(posts.id, id))

    return { success: true }
  }
}
`
    await fs.writeFile(postsServicePath, cleanService, 'utf8')
  }
}
