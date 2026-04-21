import { NotFoundException } from '@nestjs/common';

export class SettingNotFoundException extends NotFoundException {
    constructor(key: string) {
        super({ message: `Setting '${key}' not found.`, error: 'SETTING_NOT_FOUND' });
    }
}
