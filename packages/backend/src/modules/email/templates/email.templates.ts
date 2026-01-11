import { baseTemplate } from './base.template';

/**
 * OTP verification email template
 * Used for 4-digit code email verification during signup
 */
export function otpVerificationEmailTemplate(data: {
  otp: string;
  username?: string;
  expirationMinutes?: number;
}): { subject: string; html: string } {
  const expiry = data.expirationMinutes || 10;

  const content = `
    <h1>Verify Your Email Address</h1>
    ${data.username ? `<p>Hi ${data.username},</p>` : '<p>Hi there,</p>'}
    <p>Thank you for signing up for FundBrave! Please use the following verification code to complete your registration:</p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 25px 40px; display: inline-block;">
        <span class="code" style="font-size: 36px; letter-spacing: 8px; color: #ffffff; font-weight: bold;">${data.otp}</span>
      </div>
    </div>

    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #4b5563; font-size: 14px;">
        This code will expire in <strong>${expiry} minutes</strong>.
      </p>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">
        <strong>Security tip:</strong> Never share this code with anyone.
        FundBrave staff will never ask for your verification code.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 13px;">
      If you didn't create an account on FundBrave, you can safely ignore this email.
    </p>
  `;

  return {
    subject: `${data.otp} is your FundBrave verification code`,
    html: baseTemplate(content),
  };
}

/**
 * Email verification template (link-based)
 */
export function verificationEmailTemplate(data: {
  token: string;
  username?: string;
}): { subject: string; html: string } {
  const verifyUrl = `${process.env.FRONTEND_URL || 'https://fundbrave.com'}/verify-email?token=${data.token}`;

  const content = `
    <h1>Verify Your Email</h1>
    <p>Hi${data.username ? ` ${data.username}` : ''},</p>
    <p>Thank you for signing up for FundBrave! Please verify your email address by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <div class="highlight">
      <a href="${verifyUrl}" style="word-break: break-all;">${verifyUrl}</a>
    </div>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account on FundBrave, you can safely ignore this email.</p>
  `;

  return {
    subject: 'Verify Your FundBrave Email',
    html: baseTemplate(content),
  };
}

/**
 * Password reset template
 * Enhanced with security notices, clear CTAs, and professional branding
 */
export function passwordResetEmailTemplate(data: {
  token: string;
  username?: string;
}): { subject: string; html: string } {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://fundbrave.com'}/auth/reset-password?token=${data.token}`;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@fundbrave.com';

  const content = `
    <h1>Reset Your Password</h1>
    ${data.username ? `<p>Hi ${data.username},</p>` : '<p>Hi there,</p>'}
    <p>We received a request to reset the password for your FundBrave account. Click the button below to create a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button" style="font-size: 16px; padding: 16px 32px;">Reset Password</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <div class="highlight">
      <a href="${resetUrl}" style="word-break: break-all; color: #6366f1;">${resetUrl}</a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">
        <strong>Important:</strong> This link will expire in <strong>1 hour</strong>.
        After that, you'll need to request a new password reset.
      </p>
    </div>

    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>Security Notice</strong></p>
      <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
        <li>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</li>
        <li>Never share this link with anyone. FundBrave staff will never ask for your password or this link.</li>
        <li>If you suspect unauthorized access to your account, please contact our support team immediately.</li>
      </ul>
    </div>

    <p style="margin-top: 30px;">
      <strong>Need help?</strong> Contact our support team at
      <a href="mailto:${supportEmail}" style="color: #6366f1;">${supportEmail}</a>
    </p>

    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
      This password reset was requested on ${new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      })}.
      If you didn't make this request, no action is needed.
    </p>
  `;

  return {
    subject: 'Reset Your FundBrave Password',
    html: baseTemplate(content),
  };
}

/**
 * Welcome email template
 */
export function welcomeEmailTemplate(data: {
  username: string;
}): { subject: string; html: string } {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'https://fundbrave.com'}/dashboard`;

  const content = `
    <h1>Welcome to FundBrave!</h1>
    <p>Hi ${data.username},</p>
    <p>Welcome to FundBrave, the decentralized platform where you can fund causes you care about while earning rewards!</p>
    <p>Here's what you can do on FundBrave:</p>
    <ul>
      <li><strong>Donate</strong> - Support fundraisers with transparent, on-chain donations</li>
      <li><strong>Stake</strong> - Stake USDC to generate yield for causes</li>
      <li><strong>Earn FBT</strong> - Get rewarded with FundBrave tokens for your participation</li>
      <li><strong>Build Wealth</strong> - Receive tokenized stock portfolio as a thank-you for donating</li>
      <li><strong>Vote</strong> - Participate in DAO governance to allocate community funds</li>
    </ul>
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Explore FundBrave</a>
    </div>
    <p>If you have any questions, feel free to reach out to our community on Discord or Twitter.</p>
    <p>Happy funding!</p>
    <p>The FundBrave Team</p>
  `;

  return {
    subject: 'Welcome to FundBrave - Start Making an Impact!',
    html: baseTemplate(content),
  };
}

/**
 * Notification digest template
 */
export function notificationDigestEmailTemplate(data: {
  notifications: Array<{ title: string; message: string }>;
}): { subject: string; html: string } {
  const notificationsList = data.notifications
    .map(
      (n) => `
      <div class="highlight">
        <strong>${n.title}</strong>
        <p style="margin: 5px 0 0 0;">${n.message}</p>
      </div>
    `,
    )
    .join('');

  const dashboardUrl = `${process.env.FRONTEND_URL || 'https://fundbrave.com'}/notifications`;

  const content = `
    <h1>Your Notification Summary</h1>
    <p>Here's what you missed on FundBrave:</p>
    ${notificationsList}
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">View All Notifications</a>
    </div>
  `;

  return {
    subject: `You have ${data.notifications.length} new notifications on FundBrave`,
    html: baseTemplate(content),
  };
}

/**
 * Donation received template
 */
export function donationReceivedEmailTemplate(data: {
  fundraiserName: string;
  amount: string;
  token: string;
  donorName?: string;
}): { subject: string; html: string } {
  const content = `
    <h1>New Donation Received!</h1>
    <p>Great news! Your fundraiser "${data.fundraiserName}" received a new donation.</p>
    <div class="highlight">
      <p style="margin: 0;"><strong>Amount:</strong> ${data.amount} ${data.token}</p>
      ${data.donorName ? `<p style="margin: 5px 0 0 0;"><strong>From:</strong> ${data.donorName}</p>` : ''}
    </div>
    <p>Thank you for making a difference with FundBrave!</p>
  `;

  return {
    subject: `New Donation: ${data.amount} ${data.token} for ${data.fundraiserName}`,
    html: baseTemplate(content),
  };
}

/**
 * Goal reached template
 */
export function goalReachedEmailTemplate(data: {
  fundraiserName: string;
  goalAmount: string;
  raisedAmount: string;
}): { subject: string; html: string } {
  const content = `
    <h1>Congratulations! Goal Reached!</h1>
    <p>Amazing news! Your fundraiser "${data.fundraiserName}" has reached its funding goal!</p>
    <div class="highlight">
      <p style="margin: 0;"><strong>Goal:</strong> ${data.goalAmount} USDC</p>
      <p style="margin: 5px 0 0 0;"><strong>Raised:</strong> ${data.raisedAmount} USDC</p>
    </div>
    <p>Thank you for using FundBrave to make this happen. Your donors and stakers made this possible!</p>
  `;

  return {
    subject: `Goal Reached: ${data.fundraiserName} hit its target!`,
    html: baseTemplate(content),
  };
}

/**
 * Account suspended template
 */
export function accountSuspendedEmailTemplate(data: {
  reason: string;
  duration?: string;
}): { subject: string; html: string } {
  const content = `
    <h1>Account Suspended</h1>
    <p>Your FundBrave account has been temporarily suspended due to a violation of our community guidelines.</p>
    <div class="highlight">
      <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
      ${data.duration ? `<p style="margin: 5px 0 0 0;"><strong>Duration:</strong> ${data.duration}</p>` : ''}
    </div>
    <p>If you believe this is a mistake, please contact our support team.</p>
  `;

  return {
    subject: 'Your FundBrave Account Has Been Suspended',
    html: baseTemplate(content),
  };
}
