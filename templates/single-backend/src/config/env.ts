import { z } from 'zod';
import { treeifyError } from 'zod';

// Schema
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((val) => val.split(',')),
  THROTTLE_TTL: z.coerce.number().default(60000),
  THROTTLE_LIMIT: z.coerce.number().default(10),
});

// Type
export type Env = z.infer<typeof envSchema>;

// Validation function for ConfigModule
export const validateEnv = (config: Record<string, unknown>) => {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(treeifyError(parsed.error), null, 2),
    );
    throw new Error('Invalid environment variables.');
  }

  return parsed.data;
};
