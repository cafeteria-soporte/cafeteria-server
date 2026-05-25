import { BadRequestException } from '@nestjs/common';

export const CANNOT_DEACTIVATE_SELF = 'CANNOT_DEACTIVATE_SELF';

export class CannotDeactivateSelfException extends BadRequestException {
  constructor() {
    super({
      message: 'You cannot deactivate your own account.',
      error: CANNOT_DEACTIVATE_SELF,
    });
  }
}
