import { NotFoundException } from '@nestjs/common';

export class ShiftNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'No tienes un turno abierto.',
      error: 'SHIFT_NOT_FOUND',
    });
  }
}
