import { BadRequestException } from '@nestjs/common';

export const INCORRECT_PASSWORD = 'INCORRECT_PASSWORD';

export class IncorrectPasswordException extends BadRequestException {
    constructor() {
        super({ message: 'Current password is incorrect.', error: INCORRECT_PASSWORD });
    }
}
