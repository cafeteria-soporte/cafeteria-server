export interface MailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    context?: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
}

export abstract class MailerPort {
    abstract send(options: MailOptions): void;
}
