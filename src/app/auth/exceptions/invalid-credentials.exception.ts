import { UnauthorizedException } from '@nestjs/common';

export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid credentials',
      error: INVALID_CREDENTIALS,
    });
  }
}
