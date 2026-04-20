import { BadRequestException } from '@nestjs/common';

export class ShiftAlreadyOpenException extends BadRequestException {
  constructor() {
    super({
      message: 'Ya tienes un turno abierto.',
      error: 'SHIFT_ALREADY_OPEN',
    });
  }
}
