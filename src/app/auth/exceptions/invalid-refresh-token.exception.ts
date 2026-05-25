import { UnauthorizedException } from '@nestjs/common';

export const INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN';

export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid or expired refresh token.',
      error: INVALID_REFRESH_TOKEN,
    });
  }
}
