import { NotFoundException } from '@nestjs/common';

export class OrderItemNotFoundException extends NotFoundException {
  constructor() {
    super({ message: 'Order item not found.', error: 'ORDER_ITEM_NOT_FOUND' });
  }
}
