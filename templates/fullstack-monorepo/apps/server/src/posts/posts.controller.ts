import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common'
import { AllowAnonymous, Session, type UserSession } from '@thallesp/nestjs-better-auth'
import {
  createPostSchema,
  type CreatePostDto,
  updatePostSchema,
  type UpdatePostDto,
} from '@repo/contracts'
import { ResponseMessage } from '@/common/decorators/response-message.decorator'
import { PostsService } from './posts.service'

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name)

  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ResponseMessage('Post created successfully')
  async create(
    @Session() session: UserSession,
    @Body({ schema: createPostSchema }) body: CreatePostDto,
  ) {
    this.logger.log(`Creating post for user: ${session.user.id}`)
    return this.postsService.create(session.user.id, body)
  }

  @AllowAnonymous()
  @Get()
  @ResponseMessage('Posts retrieved successfully')
  async findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const l = limit ? Number(limit) : 20
    const o = offset ? Number(offset) : 0
    return this.postsService.findAll(l, o)
  }

  @AllowAnonymous()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findById(id)
  }

  @Patch(':id')
  @ResponseMessage('Post updated successfully')
  async update(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body({ schema: updatePostSchema }) body: UpdatePostDto,
  ) {
    this.logger.log(`Updating post ${id} by user: ${session.user.id}`)
    return this.postsService.update(id, session.user.id, body)
  }

  @Delete(':id')
  @ResponseMessage('Post deleted successfully')
  async delete(@Param('id') id: string, @Session() session: UserSession) {
    this.logger.log(`Deleting post ${id} by user: ${session.user.id}`)
    return this.postsService.delete(id, session.user.id)
  }
}
