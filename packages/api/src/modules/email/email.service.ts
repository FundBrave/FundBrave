import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Minimal transactional email via Resend. Fully optional — every send is
 * fire-and-forget and silently skipped when unconfigured.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('email.resendApiKey') ?? '';
    this.resend = key && !key.startsWith('your-') ? new Resend(key) : null;
    this.from = config.get<string>('email.from') ?? 'FundBrave <no-reply@localhost>';
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Email skipped (unconfigured): "${subject}" → ${to}`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.warn(`Email send failed: ${(err as Error).message}`);
    }
  }
}
