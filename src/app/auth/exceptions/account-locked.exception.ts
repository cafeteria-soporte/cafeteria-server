import { ForbiddenException } from '@nestjs/common';

export const ACCOUNT_LOCKED = 'ACCOUNT_LOCKED';

export class AccountLockedException extends ForbiddenException {
    constructor() {
        super({
            error: ACCOUNT_LOCKED,
            message: 'Account is temporarily locked due to too many failed login attempts.',
        });
    }
}
