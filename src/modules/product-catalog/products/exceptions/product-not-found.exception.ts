import { NotFoundException } from '@nestjs/common';

export const PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND';

export class ProductNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Product not found.', error: PRODUCT_NOT_FOUND });
    }
}
