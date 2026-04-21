import { NotFoundException } from '@nestjs/common';

export class UserOrderNotFoundException extends NotFoundException {
  constructor() {
    super({ message: 'Order not found.', error: 'ORDER_NOT_FOUND' });
  }
}
