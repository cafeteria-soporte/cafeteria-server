import { BadRequestException } from '@nestjs/common';

export class NoOpenShiftException extends BadRequestException {
  constructor() {
    super({
      message: 'You do not have an open shift for this shift record.',
      error: 'NO_OPEN_SHIFT',
    });
  }
}
