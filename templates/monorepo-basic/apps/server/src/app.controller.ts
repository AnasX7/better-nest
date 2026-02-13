import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import type { Message } from '@marifa/types/example'

@AllowAnonymous()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): Message {
    const message = this.appService.getHello()
    return { message }
  }
}
