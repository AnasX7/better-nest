import { betterAuth } from 'better-auth'
import { admin, bearer } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/config/env'
import * as schema from '@/database/schema'

const client = postgres(env.DATABASE_URL)
const db = drizzle(client, { schema })

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
    },
  }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer(), admin()],
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === 'production' && Boolean(env.COOKIE_DOMAIN),
      domain: env.COOKIE_DOMAIN ?? undefined,
    },
    defaultCookieAttributes: {
      sameSite:
        env.NODE_ENV === 'production' && Boolean(env.COOKIE_DOMAIN)
          ? 'none'
          : 'lax',
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
  trustedOrigins: env.TRUSTED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  hooks: {},
})

export type Auth = typeof auth
