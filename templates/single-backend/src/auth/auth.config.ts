import { PrismaService } from '#/database/prisma.service';
import { EnvService } from '#/config/env.service';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, openAPI } from 'better-auth/plugins';

export function createAuthConfig(prisma: PrismaService, env: EnvService) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: env.get('CORS_ORIGIN'),
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [admin(), openAPI()],
  });
}

export type AuthType = ReturnType<typeof createAuthConfig>;
