import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { SkipThrottle } from '@nestjs/throttler'
import { sql } from 'drizzle-orm'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { BypassTransform } from '@/common/decorators/bypass-transform.decorator'
import { DatabaseService } from '@/database/database.service'

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseService,
  ) {}

  @AllowAnonymous()
  @BypassTransform()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () => {
        try {
          await this.database.db.execute(sql`SELECT 1`)
          return {
            database: { status: 'up' },
          }
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          }
        }
      },
    ])
  }
}
