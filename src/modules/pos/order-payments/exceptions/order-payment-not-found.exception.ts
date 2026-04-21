import { NotFoundException } from '@nestjs/common';

export class OrderPaymentNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Order payment not found.',
      error: 'ORDER_PAYMENT_NOT_FOUND',
    });
  }
}
