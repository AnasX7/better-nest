import { Injectable } from '@nestjs/common'
import { AuthService as BaseAuthService } from '@thallesp/nestjs-better-auth'
import { auth } from './auth'

@Injectable()
export class AuthService extends BaseAuthService<typeof auth> {}
