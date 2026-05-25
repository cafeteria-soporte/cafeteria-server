import { ForbiddenException } from '@nestjs/common';

export const INSUFFICIENT_ROLE = 'INSUFFICIENT_ROLE';

export class InsufficientRoleException extends ForbiddenException {
  constructor() {
    super({
      message: 'You can only manage users with a lower role than yours.',
      error: INSUFFICIENT_ROLE,
    });
  }
}
