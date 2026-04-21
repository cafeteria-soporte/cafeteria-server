import { NotFoundException } from '@nestjs/common';

export class PaymentMethodNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Payment method not found.',
      error: 'PAYMENT_METHOD_NOT_FOUND',
    });
  }
}
