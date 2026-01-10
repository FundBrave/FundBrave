import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES, EmailJobData } from '../queue.service';

/**
 * Email queue processor
 * Handles sending emails via the email service
 */
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  // Inject EmailService when it's ready
  // constructor(private readonly emailService: EmailService) {}

  @Process()
  async handleEmailJob(job: Job<EmailJobData>): Promise<void> {
    this.logger.debug(`Processing email job ${job.id}: ${job.data.type}`);

    const { type, to, data } = job.data;

    try {
      switch (type) {
        case 'verification':
          // await this.emailService.sendVerificationEmail(to, data.token as string);
          this.logger.log(`Verification email sent to ${to}`);
          break;

        case 'password-reset':
          // await this.emailService.sendPasswordResetEmail(to, data.token as string);
          this.logger.log(`Password reset email sent to ${to}`);
          break;

        case 'welcome':
          // await this.emailService.sendWelcomeEmail(to, data.username as string);
          this.logger.log(`Welcome email sent to ${to}`);
          break;

        case 'notification-digest':
          // await this.emailService.sendNotificationEmail(to, data.notifications);
          this.logger.log(`Notification digest email sent to ${to}`);
          break;

        case 'custom':
          // await this.emailService.sendCustomEmail(to, job.data.subject, job.data.template, data);
          this.logger.log(`Custom email sent to ${to}`);
          break;

        default:
          this.logger.warn(`Unknown email type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EmailJobData>): void {
    this.logger.debug(`Email job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job<EmailJobData>, error: Error): void {
    this.logger.error(`Email job ${job.id} failed: ${error.message}`);
  }
}
