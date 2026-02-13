import { Module } from '@nestjs/common'
import { ExampleController } from './example.controller'
import { ExampleService } from './example.service'
import { UserRepository } from './repositories/user.repository'

@Module({
  controllers: [ExampleController],
  providers: [ExampleService, UserRepository],
  exports: [ExampleService]
})
export class ExampleModule {}
