import { z } from 'zod'
import { treeifyError } from 'zod'

// Schema
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((val) => val.split(',')),
  THROTTLE_TTL: z.string().default('60'),
  THROTTLE_LIMIT: z.string().default('10'),
  R2_ENDPOINT: z.url().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional()
})

// Type
export type Env = z.infer<typeof envSchema>

// Validation function for ConfigModule
export const validateEnv = (config: Record<string, unknown>) => {
  const parsed = envSchema.safeParse(config)

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(treeifyError(parsed.error), null, 2)
    )
    throw new Error('Invalid environment variables.')
  }

  return parsed.data
}
