import { ForbiddenException } from '@nestjs/common';

export const ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE';

export class AccountInactiveException extends ForbiddenException {
  constructor() {
    super({
      error: ACCOUNT_INACTIVE,
      message: 'Account is inactive. Contact an administrator.',
    });
  }
}
