import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MailerPort, MailOptions } from '../mailer.port';

@Injectable()
export class SmtpAdapter extends MailerPort {
    private readonly logger = new Logger(SmtpAdapter.name);

    constructor(private readonly mailer: MailerService) {
        super();
    }

    send(options: MailOptions): void {
        setImmediate(async () => {
            try {
                await this.mailer.sendMail({
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                    template: options.template,
                    context: options.context,
                    attachments: options.attachments,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const stack = err instanceof Error ? err.stack : undefined;
                this.logger.error(`SMTP send failed: ${message}`, stack);
            }
        });
    }
}
