import { z } from 'zod'

export const updatePostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().optional(),
})

export type UpdatePostDto = z.infer<typeof updatePostSchema>
