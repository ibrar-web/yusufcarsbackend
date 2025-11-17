import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { AbstractHttpAdapter } from '@nestjs/core';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapter: AbstractHttpAdapter) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = this.extractMessage(exception);

    const body: Record<string, any> = {
      statusCode: status,
      message,
      data: null,
    };

    if (errors) body.errors = errors;
    this.httpAdapter.reply(ctx.getResponse(), body, status);
  }

  private extractMessage(exception: unknown): { message: string; errors?: any } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') return { message: res };

      const msg =
        (Array.isArray((res as any).message)
          ? (res as any).message.join(', ')
          : (res as any).message) || exception.message;

      return { message: msg, errors: (res as any).message };
    }

    return { message: 'Internal server error' };
  }
}
