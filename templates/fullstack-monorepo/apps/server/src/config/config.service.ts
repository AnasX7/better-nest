import { Injectable } from '@nestjs/common'
import { env, type ServerEnv } from '@repo/env/server'

@Injectable()
export class ConfigService {
  private readonly env: ServerEnv = env

  get<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
    return this.env[key]
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production'
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development'
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test'
  }
}
