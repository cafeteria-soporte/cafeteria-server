import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(available: number) {
    super({
      message: `Insufficient stock. Available: ${available}.`,
      error: 'INSUFFICIENT_STOCK',
    });
  }
}
