import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type {
  AuthenticatedUser,
  RequestWithAuth,
} from '../../../common/types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    if (!request.user) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return request.user;
  },
);
