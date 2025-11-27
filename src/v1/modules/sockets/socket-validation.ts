import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

type ClassType<T> = new (...args: any[]) => T;

export function validatePayload<T extends object>(
  cls: ClassType<T>,
  payload: T,
): T {
  const dto = plainToInstance(cls, payload, { enableImplicitConversion: true });
  const errors = validateSync(dto as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(message || 'Invalid socket payload');
  }
  return dto;
}
