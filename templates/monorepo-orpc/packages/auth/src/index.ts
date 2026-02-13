import * as dotenv from 'dotenv'
import { betterAuth } from 'better-auth'
import { admin, openAPI } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@repo/db'

dotenv.config({
  path: '../../../apps/server/.env'
})

const trustedOrigins = (process.env.CORS_ORIGIN?.split(',') || []).map((o) =>
  o.trim()
)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: trustedOrigins,
  emailAndPassword: {
    enabled: true
  },
  advanced: {
    disableOriginCheck: process.env.NODE_ENV !== 'production',
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
      secure: true,
      partitioned: true,
      httpOnly: true
    },
    ...(process.env.NODE_ENV === 'production' && {
      crossSubDomainCookies: {
        enabled: true,
        domain: process.env.COOKIE_DOMAIN
      }
    })
  },
  plugins: [admin(), openAPI()]
})
