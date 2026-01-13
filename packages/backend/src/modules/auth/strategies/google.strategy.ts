import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

/**
 * Google OAuth Strategy
 * Handles authentication via Google OAuth 2.0
 *
 * Security features:
 * - CWE-352: State parameter validation handled by AuthController
 * - CWE-640: Blocks auto-linking to password-protected accounts (handled by AuthService)
 * - CWE-598: One-time code exchange pattern (handled by AuthController)
 * - Validates email presence from Google profile
 * - Creates managed wallets for OAuth users (encrypted with AES-256-GCM)
 * - Marks Google-authenticated emails as verified
 *
 * Required environment variables:
 * - GOOGLE_CLIENT_ID: OAuth 2.0 Client ID from Google Console
 * - GOOGLE_CLIENT_SECRET: OAuth 2.0 Client Secret
 * - GOOGLE_CALLBACK_URL: Callback URL (must match Google Console settings)
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID', '');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET', '');
    const callbackURL = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/auth/google/callback',
    );

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      // State parameter is now handled manually by AuthController for proper validation
      // We pass through any state parameter that comes from the OAuth flow
      passReqToCallback: true,
    });

    // Log configuration status (without exposing secrets)
    if (clientID && clientSecret) {
      this.logger.log(
        `Google OAuth configured with callback URL: ${callbackURL}`,
      );
    } else {
      this.logger.warn(
        'Google OAuth credentials not configured. OAuth will not work.',
      );
    }
  }

  /**
   * Validate the Google OAuth profile and find/create user
   *
   * Security notes:
   * - State validation is performed BEFORE this method is called (in AuthController)
   * - This method only handles user creation/lookup
   * - Account linking to password-protected accounts is blocked in AuthService
   *
   * @param req - Express request (contains state parameter)
   * @param accessToken - Google access token (not stored)
   * @param refreshToken - Google refresh token (not stored)
   * @param profile - Google user profile
   * @param done - Passport callback
   */
  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    const email = emails?.[0]?.value;
    const avatarUrl = photos?.[0]?.value;

    // Email is required for our authentication flow
    if (!email) {
      this.logger.warn(`Google OAuth: No email returned for Google ID ${id}`);
      done(
        new Error(
          'Email is required for authentication. Please allow email access in Google.',
        ),
        undefined,
      );
      return;
    }

    try {
      this.logger.debug(
        `Google OAuth: Authenticating user with email ${this.maskEmail(email)}`,
      );

      // Find or create user with Google ID
      // This method now blocks auto-linking to password-protected accounts (CWE-640)
      const user = await this.authService.findOrCreateGoogleUser({
        googleId: id,
        email,
        displayName: displayName || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      this.logger.log(
        `Google OAuth: Successfully authenticated user ${user.id}`,
      );
      done(null, user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Google OAuth: Authentication failed for ${this.maskEmail(email)}: ${errorMessage}`,
      );
      done(error as Error, undefined);
    }
  }

  /**
   * Mask email for logging (privacy protection)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***';
    const maskedLocal =
      local.length > 2
        ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
        : '*'.repeat(local.length);
    return `${maskedLocal}@${domain}`;
  }
}
