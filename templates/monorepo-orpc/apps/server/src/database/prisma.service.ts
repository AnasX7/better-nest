import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
  Logger,
  Inject
} from '@nestjs/common'
import { PrismaClient, adapter } from '@repo/db'
import { EnvService } from '#/config/env.service'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor(@Inject(EnvService) private readonly env: EnvService) {
    super({
      adapter,
      log:
        env.get('NODE_ENV') === 'development'
          ? ['query', 'warn', 'error']
          : ['error']
    })
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Database connection established')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Database connection closed')
  }
}
