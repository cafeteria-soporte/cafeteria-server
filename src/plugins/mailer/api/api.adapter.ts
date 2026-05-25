import { Injectable, Logger } from '@nestjs/common';
import { MailerPort, MailOptions } from '../mailer.port';
import { ApiMailerConfig } from './api.config';

@Injectable()
export class ApiMailerAdapter extends MailerPort {
  private readonly logger = new Logger(ApiMailerAdapter.name);

  constructor(private readonly config: ApiMailerConfig) {
    super();
  }

  send(options: MailOptions): void {
    setImmediate(async () => {
      try {
        const response = await fetch(this.config.apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.buildPayload(options)),
        });

        if (!response.ok) {
          const body = await response.text();
          this.logger.error(`API mailer error ${response.status}: ${body}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(`API mailer network error: ${message}`, stack);
      }
    });
  }
  private buildPayload(options: MailOptions): Record<string, unknown> {
    return {
      from: this.config.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    };
  }
}
