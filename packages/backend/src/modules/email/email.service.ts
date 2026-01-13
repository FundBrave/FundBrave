import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  notificationDigestEmailTemplate,
  donationReceivedEmailTemplate,
  goalReachedEmailTemplate,
  accountSuspendedEmailTemplate,
  otpVerificationEmailTemplate,
} from './templates';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email Service using Resend
 *
 * Resend provides:
 * - 3,000 emails/month free tier
 * - Excellent deliverability
 * - Simple API with just an API key
 * - Built-in analytics and bounce handling
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get API key from dashboard
 * 3. Set RESEND_API_KEY in .env
 * 4. Set RESEND_FROM_EMAIL (must be verified domain or resend.dev subdomain)
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private readonly fromAddress: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'FundBrave <onboarding@resend.dev>', // Free tier default
    );

    this.isConfigured = !!apiKey;

    if (this.isConfigured) {
      this.resend = new Resend(apiKey);
      this.logger.log('✅ Resend email service configured');
      this.logger.log(`📧 Sending emails from: ${this.fromAddress}`);
    } else {
      this.logger.warn(
        '⚠️  Email service not configured. Set RESEND_API_KEY environment variable.',
      );
      this.logger.warn('💡 Get your API key at https://resend.com/api-keys');
    }
  }

  /**
   * Send an email via Resend
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      this.logger.warn(
        `📧 Email not sent (not configured): ${options.subject} to ${options.to}`,
      );
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
        return false;
      }

      this.logger.log(`✅ Email sent: ${data?.id} to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email to ${options.to}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send OTP verification email
   * Used for 4-digit code email verification during signup
   *
   * @param email - Recipient email address
   * @param otp - 4-digit OTP code (plain text, NOT hashed)
   * @param username - Optional username for personalization
   * @param expirationMinutes - OTP expiration time in minutes (default: 10)
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    username?: string,
    expirationMinutes: number = 10,
  ): Promise<boolean> {
    const { subject, html } = otpVerificationEmailTemplate({
      otp,
      username,
      expirationMinutes,
    });
    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send verification email (link-based)
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
  async sendPasswordResetEmail(
    email: string,
    token: string,
    username?: string,
  ): Promise<boolean> {
    const { subject, html } = passwordResetEmailTemplate({ token, username });
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

    const { subject, html } = notificationDigestEmailTemplate({
      notifications,
    });
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

  /**
   * Send bulk emails (batch operation)
   * Useful for newsletters, announcements, etc.
   */
  async sendBulkEmails(
    emails: Array<{ to: string; subject: string; html: string; text?: string }>,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured || !this.resend) {
      this.logger.warn('📧 Bulk emails not sent (service not configured)');
      return { sent: 0, failed: emails.length };
    }

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    this.logger.log(`📧 Bulk emails: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }
}
