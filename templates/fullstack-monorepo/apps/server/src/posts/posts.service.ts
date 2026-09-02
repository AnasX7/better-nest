import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import type { CreatePostDto, UpdatePostDto } from '@repo/contracts'
import { DatabaseService } from '@/database/database.service'
import { posts } from '@repo/db'

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
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
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
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`)
    }

    return post
  }

  async update(id: string, userId: string, data: UpdatePostDto) {
    const existing = await this.findById(id)

    if (existing.userId !== userId) {
      throw new ForbiddenException('You are not allowed to update this post')
    }

    const [updated] = await this.database.db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning()

    return updated
  }

  async delete(id: string, userId: string) {
    const existing = await this.findById(id)

    if (existing.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post')
    }

    await this.database.db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)))

    return { success: true }
  }
}
