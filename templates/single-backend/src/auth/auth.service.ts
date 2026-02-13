import { Injectable } from '@nestjs/common';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import type { AuthType } from './auth.config';

@Injectable()
export class AuthService extends BetterAuthService<AuthType> {}
