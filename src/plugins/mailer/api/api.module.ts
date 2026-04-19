import { Module } from '@nestjs/common';
import { ApiMailerConfig } from './api.config';
import { ApiMailerAdapter } from './api.adapter';
import { MailerPort } from '../mailer.port';

@Module({
    providers: [
        ApiMailerConfig,
        ApiMailerAdapter,
        { provide: MailerPort, useExisting: ApiMailerAdapter },
    ],
    exports: [MailerPort],
})
export class ApiMailerModule { }
