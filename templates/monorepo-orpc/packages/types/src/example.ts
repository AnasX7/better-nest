import { z } from 'zod'

export const MessageSchema = z.object({
  message: z.string()
})

export const testSchema = z.object({
  test: z.string()
})

export type Message = z.infer<typeof MessageSchema>
