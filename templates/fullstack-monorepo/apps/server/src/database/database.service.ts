import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { client, db, type Database } from '@repo/db'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  readonly db: Database = db

  async onModuleDestroy() {
    this.logger.log('Closing database connection pool')
    await client.end()
  }
}
