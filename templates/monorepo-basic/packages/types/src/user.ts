import { z } from 'zod'

// User schemas for validation and type inference

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.iso.datetime(), // ISO date string for JSON Schema compatibility
  updatedAt: z.iso.datetime() // ISO date string for JSON Schema compatibility
})

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(100)
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.url().optional()
})

export const userParamsSchema = z.object({
  id: z.string()
})

// Inferred types
export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type UserParams = z.infer<typeof userParamsSchema>
