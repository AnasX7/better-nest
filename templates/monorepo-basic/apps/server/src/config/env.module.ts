import { Module, Global } from '@nestjs/common'
import { EnvService } from '#/config/env.service'

@Global()
@Module({
  providers: [EnvService],
  exports: [EnvService]
})
export class EnvModule {}
