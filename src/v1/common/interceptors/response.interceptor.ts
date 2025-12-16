/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        const http = context.switchToHttp();
        const statusCode = this.getStatusCode(context);

        // Preserve explicit status codes set in controllers (e.g. @HttpCode).
        http.getResponse<Response>().status(statusCode);

        return {
          statusCode,
          message: this.resolveMessage(data, statusCode),
          data,
        };
      }),
    );
  }

  private getStatusCode(context: ExecutionContext): number {
    const response = context.switchToHttp().getResponse<Response>();
    return response.statusCode ?? 200;
  }

  private resolveMessage(data: unknown, statusCode: number): string {
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }
    if (statusCode >= 200 && statusCode < 300) return 'Success';
    return 'OK';
  }
}
