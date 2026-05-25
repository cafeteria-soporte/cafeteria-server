import { NotFoundException } from '@nestjs/common';

export const USER_NOT_FOUND = 'USER_NOT_FOUND';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'User not found',
      error: USER_NOT_FOUND,
    });
  }
}
