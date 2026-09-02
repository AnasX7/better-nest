import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z
      .string()
      .min(1)
      .default('postgresql://postgres:postgres@localhost:5432/nest_db'),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long')
      .default('development-secret-key-at-least-32-chars-long-for-auth'),
    BETTER_AUTH_URL: z.url().optional(),
    TRUSTED_ORIGINS: z.string().default('http://localhost:3000'),
    COOKIE_DOMAIN: z.string().optional(),
    ENABLE_DOCS: z.coerce.boolean().default(false),
    DATABASE_MAX_CONNECTIONS: z.coerce.number().default(10),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})

export type ServerEnv = typeof env
