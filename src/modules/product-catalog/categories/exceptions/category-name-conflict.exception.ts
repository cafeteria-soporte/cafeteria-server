import { ConflictException } from '@nestjs/common';

export class CategoryNameConflictException extends ConflictException {
    constructor() {
        super({ message: 'A category with that name already exists.', error: 'CATEGORY_NAME_CONFLICT' });
    }
}
