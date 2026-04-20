import { NotFoundException } from '@nestjs/common';

export class ProductNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Product not found.',
      error: 'PRODUCT_NOT_FOUND',
    });
  }
}
