import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().optional(),
})

export type CreatePostDto = z.infer<typeof createPostSchema>
