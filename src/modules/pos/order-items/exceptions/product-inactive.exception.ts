import { BadRequestException } from '@nestjs/common';

export class ProductInactiveException extends BadRequestException {
  constructor() {
    super({
      message: 'Product is not available for sale.',
      error: 'PRODUCT_INACTIVE',
    });
  }
}
