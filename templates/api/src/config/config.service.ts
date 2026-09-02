import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from './env'

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.configService.get(key, { infer: true })
  }

  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development'
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production'
  }

  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test'
  }

  get trustedOrigins(): string[] {
    return this.get('TRUSTED_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  }
}
