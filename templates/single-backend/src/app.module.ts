import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '#/auth/auth.module';
import { validateEnv } from '#/config/env';
import { PrismaModule } from '#/database/prisma.module';
import { EnvModule } from '#/config/env.module';
import { EnvService } from '#/config/env.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      validationOptions: {
        abortEarly: true,
      },
    }),
    EnvModule,
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => [
        {
          ttl: Number(env.get('THROTTLE_TTL')),
          limit: Number(env.get('THROTTLE_LIMIT')),
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
