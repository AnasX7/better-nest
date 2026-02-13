import { Module } from '@nestjs/common'
import { APP_GUARD, APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from '@thallesp/nestjs-better-auth'
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod'
import { auth } from '@marifa/auth'

import { HttpExceptionFilter } from '#/common/filters/http-exception.filter'
import { AppService } from '#/app.service'
import { AppController } from '#/app.controller'
import { validateEnv } from '#/config/env'
import { EnvModule } from '#/config/env.module'
import { EnvService } from '#/config/env.service'
import { PrismaModule } from '#/database/prisma.module'
import { ExampleModule } from '#/example/example.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    EnvModule,
    AuthModule.forRoot({ auth }),
    ThrottlerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => [
        {
          ttl: Number(env.get('THROTTLE_TTL')),
          limit: Number(env.get('THROTTLE_LIMIT'))
        }
      ]
    }),
    PrismaModule,
    ExampleModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    }
  ]
})
export class AppModule {}
