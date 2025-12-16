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
        const response = this.getResponse(context);
        const statusCode = this.getStatusCode(response);

        // Preserve explicit status codes set in controllers (e.g. @HttpCode).
        response.status(statusCode);

        return {
          statusCode,
          message: this.resolveMessage(data, statusCode),
          data: data as unknown,
        };
      }),
    );
  }

  private getResponse(context: ExecutionContext): Response {
    const http = context.switchToHttp();
    return http.getResponse<Response>();
  }

  private getStatusCode(response: Response): number {
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
