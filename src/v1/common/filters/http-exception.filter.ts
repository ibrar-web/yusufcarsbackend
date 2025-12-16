import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { AbstractHttpAdapter } from '@nestjs/core';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly httpAdapter: AbstractHttpAdapter) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = this.extractMessage(exception);

    const body: {
      statusCode: number;
      message: string;
      data: null;
      errors?: unknown;
    } = {
      statusCode: status,
      message,
      data: null,
    };

    if (errors) body.errors = errors;
    this.logError(request, status, message, exception);
    this.httpAdapter.reply(response, body, status);
  }

  private extractMessage(exception: unknown): {
    message: string;
    errors?: unknown;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return { message: response };
      if (response && typeof response === 'object' && 'message' in response) {
        const payload = response as {
          message?: string | string[];
          errors?: unknown;
        };
        const message =
          Array.isArray(payload.message) && payload.message.length > 0
            ? payload.message.join(', ')
            : typeof payload.message === 'string'
              ? payload.message
              : exception.message;
        return { message, errors: payload.errors ?? payload.message };
      }
      return { message: exception.message };
    }

    return { message: 'Internal server error' };
  }

  private logError(
    request: Request,
    status: number,
    message: string,
    exception: unknown,
  ): void {
    const context = `${request.method || 'UNKNOWN'} ${request.url || ''} [${status}]`;
    const payload = JSON.stringify({
      status,
      message,
      method: request.method,
      url: request.url,
    });
    this.logger.error(
      `${context} - ${payload}`,
      exception instanceof Error ? exception.stack : undefined,
    );
  }
}
