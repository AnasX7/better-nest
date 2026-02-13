import { Module, Global } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from '#/database/prisma.module';
import { EnvModule } from '#/config/env.module';
import { PrismaService } from '#/database/prisma.service';
import { EnvService } from '#/config/env.service';
import { createAuthConfig } from './auth.config';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    EnvModule,
    BetterAuthModule.forRootAsync({
      imports: [PrismaModule, EnvModule],
      inject: [PrismaService, EnvService],
      useFactory: (prisma: PrismaService, env: EnvService) => {
        return {
          auth: createAuthConfig(prisma, env),
        };
      },
    }),
  ],
  providers: [AuthService],
  exports: [BetterAuthModule, AuthService],
})
export class AuthModule {}
