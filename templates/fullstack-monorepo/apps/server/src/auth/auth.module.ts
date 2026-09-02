import { Module } from '@nestjs/common'
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from '@repo/auth'
import { AuthService } from './auth.service'

@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
