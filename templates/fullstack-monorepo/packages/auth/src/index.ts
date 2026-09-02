import { db } from '@repo/db'
import * as schema from '@repo/db/schema'
import { env } from '@repo/env/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, bearer } from 'better-auth/plugins'

export function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:3000'],
    emailAndPassword: {
      enabled: true,
    },
    plugins: [bearer(), admin()],
    advanced: {
      crossSubDomainCookies: {
        enabled: !!env.COOKIE_DOMAIN,
        domain: env.COOKIE_DOMAIN,
      },
      defaultCookieAttributes: {
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
      },
    },
  })
}

export const auth = createAuth()
export type Auth = typeof auth
