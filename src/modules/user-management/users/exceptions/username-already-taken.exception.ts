import { ConflictException } from '@nestjs/common';

export const USERNAME_ALREADY_TAKEN = 'USERNAME_ALREADY_TAKEN';

export class UsernameAlreadyTakenException extends ConflictException {
  constructor() {
    super({
      error: USERNAME_ALREADY_TAKEN,
      message: 'Username already taken',
    });
  }
}
