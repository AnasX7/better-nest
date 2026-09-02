import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { AppConfigService } from '@/config/config.service'
import * as schema from './schema'

export type Database = PostgresJsDatabase<typeof schema>

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly db: Database
  private readonly client: postgres.Sql

  constructor(private readonly config: AppConfigService) {
    const connectionString = this.config.get('DATABASE_URL')
    const maxConnections = this.config.get('DATABASE_MAX_CONNECTIONS')

    this.client = postgres(connectionString, {
      max: maxConnections,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    this.db = drizzle(this.client, { schema })
  }

  async onModuleDestroy() {
    await this.client.end()
  }
}
