import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { SmtpConfig } from './smtp.config';
import { SmtpAdapter } from './smtp.adapter';
import { MailerPort } from '../mailer.port';

@Module({
  imports: [
    MailerModule.forRootAsync({
      extraProviders: [SmtpConfig],
      inject: [SmtpConfig],
      useFactory: (cfg: SmtpConfig) => ({
        transport: {
          host: cfg.host,
          port: cfg.port,
          auth: { user: cfg.user, pass: cfg.pass },
        },
        defaults: { from: cfg.from },
        template: {
          dir: join(__dirname, '../templates'),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [
    SmtpConfig,
    SmtpAdapter,
    { provide: MailerPort, useExisting: SmtpAdapter },
  ],
  exports: [MailerPort],
})
export class SmtpMailerModule {}
