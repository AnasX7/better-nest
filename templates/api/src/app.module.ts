import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AuthModule } from './auth/auth.module'
import { AppConfigModule } from './config/config.module'
import { AppConfigService } from './config/config.service'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { PostsModule } from './posts/posts.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      providers: [],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.isProduction ? 'info' : 'debug',
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'HH:MM:ss Z',
                },
              },
          autoLogging: {
            ignore: (req) => Boolean(req.url && req.url.startsWith('/health')),
          },
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
