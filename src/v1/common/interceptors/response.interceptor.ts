import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse<any>();
        const req = context.switchToHttp().getRequest<Request>();
        const statusCode = res?.statusCode ?? 200;

        // Preserve explicit status codes set in controllers (e.g. @HttpCode).
        res.status(statusCode);

        return {
          statusCode,
          message: this.resolveMessage(data, statusCode),
          data,
        };
      }),
    );
  }

  private resolveMessage(data: any, statusCode: number) {
    if (data && typeof data === 'object' && typeof data.message === 'string')
      return data.message;
    if (statusCode >= 200 && statusCode < 300) return 'Success';
    return 'OK';
  }
}
