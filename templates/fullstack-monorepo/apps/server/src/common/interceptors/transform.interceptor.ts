import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { BYPASS_TRANSFORM_KEY } from '@/common/decorators/bypass-transform.decorator'
import { RESPONSE_MESSAGE_KEY } from '@/common/decorators/response-message.decorator'
import type { StandardResponse } from '@repo/contracts'

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T> | T> {
    const isBypassed = this.reflector.getAllAndOverride<boolean>(BYPASS_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest()

    // Automatically bypass Better Auth routes and explicitly marked endpoints
    if (isBypassed || request.url?.startsWith('/api/auth')) {
      return next.handle()
    }

    const response = httpContext.getResponse()
    const statusCode = response.statusCode ?? 200
    const message = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            statusCode,
            success: true,
            ...(message ? { message } : {}),
            data: (data as { data: T }).data,
            meta: {
              timestamp: new Date().toISOString(),
              ...(data as { meta?: Record<string, unknown> }).meta,
            },
          }
        }

        return {
          statusCode,
          success: true,
          ...(message ? { message } : {}),
          data: data ?? null,
          meta: {
            timestamp: new Date().toISOString(),
          },
        }
      }),
    )
  }
}
