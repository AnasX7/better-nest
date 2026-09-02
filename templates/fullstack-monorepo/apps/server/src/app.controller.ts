import { Body, Controller, Get, Logger, Post } from '@nestjs/common'
import { AllowAnonymous, Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth'
import { z } from 'zod'
import { AuthService } from '@/auth/auth.service'
import { AppService } from '@/app.service'

const echoSchema = z.object({
  message: z.string().min(3, 'Message must be at least 3 characters'),
})

type EchoDto = z.infer<typeof echoSchema>

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)

  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @AllowAnonymous()
  @Get()
  getHello(): string {
    this.logger.log('Executing getHello endpoint')
    return this.appService.getHello()
  }

  @AllowAnonymous()
  @Post('echo')
  echo(@Body({ schema: echoSchema }) body: EchoDto) {
    this.logger.log(`Echoing message: ${body.message}`)
    return { echo: body.message }
  }

  @Get('me')
  getProfile(@Session() session: UserSession) {
    this.logger.log(`Fetching profile for user: ${session.user.id}`)
    return session
  }

  @Roles(['admin'])
  @Get('admin/dashboard')
  getAdminDashboard(@Session() session: UserSession) {
    this.logger.log(`Admin accessed dashboard: ${session.user.id}`)
    return {
      message: 'Welcome to the admin dashboard',
      adminUser: session.user,
    }
  }
}
