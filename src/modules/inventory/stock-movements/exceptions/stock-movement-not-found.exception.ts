import { NotFoundException } from '@nestjs/common';

export const STOCK_MOVEMENT_NOT_FOUND = 'STOCK_MOVEMENT_NOT_FOUND';

export class StockMovementNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Stock movement not found.',
      error: STOCK_MOVEMENT_NOT_FOUND,
    });
  }
}
