import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  notificationDigestEmailTemplate,
  donationReceivedEmailTemplate,
  goalReachedEmailTemplate,
  accountSuspendedEmailTemplate,
} from './templates';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Service for sending emails via nodemailer
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@fundbrave.com',
    );

    this.isConfigured = !!(host && user && pass);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      // Verify connection
      this.transporter.verify().catch((error) => {
        this.logger.error(`SMTP connection error: ${error}`);
      });
    } else {
      this.logger.warn(
        'Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.',
      );
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn(`Email not sent (not configured): ${options.subject}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent: ${info.messageId} to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
      return false;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    username?: string,
  ): Promise<boolean> {
    const { subject, html } = verificationEmailTemplate({ token, username });
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const { subject, html } = passwordResetEmailTemplate({ token });
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const { subject, html } = welcomeEmailTemplate({ username });
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send notification digest email
   */
  async sendNotificationEmail(
    email: string,
    notifications: Array<{ title: string; message: string }>,
  ): Promise<boolean> {
    if (notifications.length === 0) {
      return false;
    }

    const { subject, html } = notificationDigestEmailTemplate({ notifications });
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send donation received notification
   */
  async sendDonationReceivedEmail(
    email: string,
    data: {
      fundraiserName: string;
      amount: string;
      token: string;
      donorName?: string;
    },
  ): Promise<boolean> {
    const { subject, html } = donationReceivedEmailTemplate(data);
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send goal reached notification
   */
  async sendGoalReachedEmail(
    email: string,
    data: {
      fundraiserName: string;
      goalAmount: string;
      raisedAmount: string;
    },
  ): Promise<boolean> {
    const { subject, html } = goalReachedEmailTemplate(data);
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send account suspended notification
   */
  async sendAccountSuspendedEmail(
    email: string,
    data: {
      reason: string;
      duration?: string;
    },
  ): Promise<boolean> {
    const { subject, html } = accountSuspendedEmailTemplate(data);
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}
