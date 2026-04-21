import { NotFoundException } from '@nestjs/common';

export class CategoryNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Category not found.', error: 'CATEGORY_NOT_FOUND' });
    }
}
