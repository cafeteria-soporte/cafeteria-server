import { NotFoundException } from '@nestjs/common';

export class StockMovementTypeNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Stock movement type not found.',
      error: 'STOCK_MOVEMENT_TYPE_NOT_FOUND',
    });
  }
}
