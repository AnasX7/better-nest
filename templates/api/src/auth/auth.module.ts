import { Global, Module } from '@nestjs/common'
import {
  AuthModule as BaseAuthModule,
  AuthService as BaseAuthService,
} from '@thallesp/nestjs-better-auth'
import { auth } from './auth'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [
    BaseAuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: true,
    }),
  ],
  providers: [
    {
      provide: AuthService,
      useExisting: BaseAuthService,
    },
  ],
  exports: [AuthService, BaseAuthModule],
})
export class AuthModule {}
