import { NotFoundException } from '@nestjs/common';

<<<<<<< HEAD
export const PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND';

export class ProductNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Product not found.', error: PRODUCT_NOT_FOUND });
    }
=======
export class ProductNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Product not found.',
      error: 'PRODUCT_NOT_FOUND',
    });
  }
>>>>>>> feature/products-and-shifts
}
