import { DynamicModule, Global, Module } from '@nestjs/common';
import { SmtpMailerModule } from './smtp/smtp.module';
import { ApiMailerModule } from './api/api.module';
import { MailerPort } from './mailer.port';

export type MailerTransport = 'smtp' | 'api';

@Global()
@Module({})
export class MailerModule {
  static register(transport?: MailerTransport): DynamicModule {
    const chosen: MailerTransport =
      transport ??
      ((process.env.MAILER_TRANSPORT as MailerTransport) || 'smtp');

    const adapterModule = chosen === 'api' ? ApiMailerModule : SmtpMailerModule;

    return {
      module: MailerModule,
      imports: [adapterModule],
      exports: [MailerPort],
    };
  }
}
