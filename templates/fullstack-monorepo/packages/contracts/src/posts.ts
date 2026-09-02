import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().optional(),
})

export type CreatePostDto = z.infer<typeof createPostSchema>

export const updatePostSchema = createPostSchema.partial()
export type UpdatePostDto = z.infer<typeof updatePostSchema>

export interface PostAuthor {
  id: string
  name: string
  email: string
  image: string | null
}

export interface PostResponse {
  id: string
  title: string
  content: string | null
  userId: string
  createdAt: string
  updatedAt: string
  author?: PostAuthor | null
}
