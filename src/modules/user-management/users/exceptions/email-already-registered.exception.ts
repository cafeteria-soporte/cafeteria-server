import { ConflictException } from '@nestjs/common';

export const EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED';

export class EmailAlreadyRegisteredException extends ConflictException {
  constructor() {
    super({
      error: EMAIL_ALREADY_REGISTERED,
      message: 'Email already registered',
    });
  }
}
