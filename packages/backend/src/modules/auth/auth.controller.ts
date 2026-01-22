import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
  Query,
  BadRequestException,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import {
  AuthRateLimit,
  PasswordResetRateLimit,
  OtpVerificationRateLimit,
  OtpResendRateLimit,
} from '../../common/decorators';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetTokenDto,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyResetTokenResponse,
  OAuthCodeExchangeDto,
  OAuthCodeExchangeResponseDto,
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  VerifyOtpDto,
  ResendOtpDto,
  VerifyOtpResponse,
  SendOtpResponse,
  AUTH_REDIRECT_PATHS,
} from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TokenCookieConfig, RequestSecurityContext } from './types';

/**
 * Auth Controller - Secure Authentication Endpoints
 *
 * Security Fixes Implemented:
 * - CWE-598: One-time code exchange pattern (tokens not in URL)
 * - CWE-352: CSRF state validation for OAuth
 * - CWE-601: Redirect URL validation
 * - CWE-522: HttpOnly cookies for token delivery
 * - Rate limiting on all sensitive endpoints
 * - Generic error messages to prevent enumeration
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Extract request security context for logging and validation
   */
  private getSecurityContext(
    req: ExpressRequest,
    ip?: string,
  ): RequestSecurityContext {
    return {
      ipAddress: ip || req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      origin: req.headers['origin'],
    };
  }

  /**
   * Get cookie configuration based on environment
   *
   * Security & Cross-Origin Cookie Configuration:
   * - Development: sameSite='none' with secure=false works for localhost cross-origin
   *   However, modern browsers prefer secure=true even in development
   * - Production: sameSite='none' with secure=true for cross-domain cookies
   *
   * Note: For localhost:3000 -> localhost:3001, browsers treat different ports
   * as different origins, requiring sameSite='none' to allow cookies
   */
  private getCookieConfig(): TokenCookieConfig {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    // For cross-origin cookies between localhost:3000 and localhost:3001
    // we need sameSite='none' and secure=true (even in development)
    // However, for local development without HTTPS, we use 'lax' with secure=false
    // which works when credentials: 'include' is set on frontend

    return {
      httpOnly: true,
      secure: isProduction, // true in production for HTTPS, false in dev for HTTP
      sameSite: isProduction ? 'none' : 'lax', // 'none' for production cross-domain, 'lax' for dev
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...(cookieDomain && { domain: cookieDomain }),
    };
  }

  /**
   * Set authentication cookies on response
   * CWE-522 Fix: Tokens delivered via HttpOnly cookies
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const config = this.getCookieConfig();

    // Access token cookie (shorter expiry)
    res.cookie('access_token', accessToken, {
      ...config,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh token cookie (longer expiry)
    res.cookie('refresh_token', refreshToken, {
      ...config,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    const config = this.getCookieConfig();

    res.clearCookie('access_token', {
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite,
      path: config.path,
      domain: config.domain,
    });

    res.clearCookie('refresh_token', {
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite,
      path: config.path,
      domain: config.domain,
    });
  }

  // ==================== SIWE AUTHENTICATION ====================

  /**
   * Generate a nonce for SIWE authentication
   */
  @Get('nonce')
  @ApiOperation({ summary: 'Generate nonce for SIWE authentication' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async getNonce(@Query('address') walletAddress: string) {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }
    return { nonce: await this.authService.generateNonce(walletAddress) };
  }

  /**
   * Verify SIWE signature and login
   */
  @Post('siwe/verify')
  @AuthRateLimit()
  @ApiOperation({ summary: 'Verify SIWE signature and authenticate' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async verifySiwe(
    @Body() body: { message: string; signature: string },
    @Request() req: ExpressRequest,
    @Ip() ip: string,
  ) {
    if (!body.message || !body.signature) {
      throw new BadRequestException('Message and signature are required');
    }
    const context = this.getSecurityContext(req, ip);
    return this.authService.verifySiweAndLogin(
      body.message,
      body.signature,
      context,
    );
  }

  // ==================== EMAIL/PASSWORD AUTHENTICATION ====================

  /**
   * Register with email and password
   * CWE-522 Fix: Tokens delivered via HttpOnly cookies
   *
   * Flow:
   * 1. User registers with email/password
   * 2. OTP is sent to their email for verification
   * 3. User is redirected to onboarding page
   * 4. User must verify OTP during onboarding before full access
   */
  @Post('register')
  @AuthRateLimit()
  @ApiOperation({ summary: 'Register new user with email/password' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data or email already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ): Promise<AuthResponseDto> {
    const context = this.getSecurityContext(req, ip);
    const result = await this.authService.registerWithEmail(
      registerDto.email,
      registerDto.password,
      registerDto.displayName,
      context,
    );

    // CWE-522 Fix: Set tokens as HttpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Email/password users need to verify OTP and complete onboarding
    // OTP is automatically sent during registration
    return {
      success: true,
      message:
        'Registration successful. Please check your email for the verification code.',
      user: {
        id: result.user.id,
        walletAddress: result.user.walletAddress,
        email: result.user.email,
        username: result.user.username,
        displayName: result.user.displayName,
        emailVerified: result.user.emailVerified,
      },
      redirectUrl: AUTH_REDIRECT_PATHS.ONBOARDING,
      requiresOtpVerification: true,
    };
  }

  /**
   * Login with email/password
   * CWE-522 Fix: Tokens delivered via HttpOnly cookies
   * CWE-384 Fix: Invalidates existing sessions before creating new one
   *
   * Flow:
   * - If email is verified: redirect to homepage
   * - If email is not verified: redirect to onboarding with OTP verification required
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit()
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ): Promise<AuthResponseDto> {
    const context = this.getSecurityContext(req, ip);
    const result = await this.authService.loginWithEmail(
      loginDto.emailOrUsername,
      loginDto.password,
      context,
    );

    // CWE-522 Fix: Set tokens as HttpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Determine redirect based on email verification status
    const requiresOtpVerification = !result.user.emailVerified;
    const redirectUrl = requiresOtpVerification
      ? AUTH_REDIRECT_PATHS.ONBOARDING
      : AUTH_REDIRECT_PATHS.HOME;

    return {
      success: true,
      message: result.user.emailVerified
        ? 'Login successful'
        : 'Login successful. Please verify your email to continue.',
      user: {
        id: result.user.id,
        walletAddress: result.user.walletAddress,
        email: result.user.email,
        username: result.user.username,
        displayName: result.user.displayName,
        avatarUrl: result.user.avatarUrl,
        emailVerified: result.user.emailVerified,
      },
      redirectUrl,
      requiresOtpVerification,
    };
  }

  // ==================== GOOGLE OAUTH (CWE-352, CWE-598, CWE-601 FIXES) ====================

  /**
   * Initiate Google OAuth with CSRF state
   * GET /auth/google
   *
   * CWE-352 Fix: Generates CSRF state token before OAuth redirect
   */
  @Get('google')
  @AuthRateLimit()
  @ApiOperation({ summary: 'Initiate Google OAuth authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth(
    @Request() req: ExpressRequest,
    @Res() res: Response,
    @Ip() ip: string,
  ) {
    const context = this.getSecurityContext(req, ip);

    // CWE-352 Fix: Generate and store state for CSRF protection
    const state = await this.authService.generateOAuthState(context);

    // Build Google OAuth URL with state
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/auth/google/callback',
    );

    const googleAuthUrl = new URL(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    googleAuthUrl.searchParams.set('client_id', googleClientId || '');
    googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    res.redirect(googleAuthUrl.toString());
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   *
   * Security fixes:
   * - CWE-352: Validates state parameter
   * - CWE-598: Returns one-time code instead of tokens
   * - CWE-601: Validates redirect URL
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with auth code',
  })
  async googleAuthCallback(
    @Request() req: any,
    @Res() res: Response,
    @Query('state') state: string,
    @Ip() ip: string,
  ) {
    const context = this.getSecurityContext(req, ip);

    // Get validated frontend URL
    const frontendUrl = this.authService.getSafeRedirectUrl('/auth/callback');

    try {
      // CWE-352 Fix: Validate state parameter
      const stateValidation = await this.authService.validateOAuthState(state);
      if (!stateValidation.valid) {
        this.logger.warn(
          `OAuth state validation failed: ${stateValidation.errorMessage}`,
        );
        return res.redirect(
          `${this.authService.getSafeRedirectUrl('/auth')}?error=csrf_failed&message=${encodeURIComponent('Authentication failed. Please try again.')}`,
        );
      }

      const user = req.user;

      if (!user) {
        return res.redirect(
          `${this.authService.getSafeRedirectUrl('/auth')}?error=oauth_failed&message=${encodeURIComponent('Authentication failed. Please try again.')}`,
        );
      }

      // Generate tokens
      const tokens = await this.authService.loginWithGoogle(
        { id: user.id, walletAddress: user.walletAddress },
        context,
      );

      // CWE-598 Fix: Create one-time handoff code instead of passing tokens in URL
      const handoffCode = await this.authService.createOAuthHandoff({
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // CWE-601 Fix: Use validated redirect URL with only the code parameter
      res.redirect(`${frontendUrl}?code=${handoffCode}`);
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);

      // Generic error message to prevent information leakage
      res.redirect(
        `${this.authService.getSafeRedirectUrl('/auth')}?error=oauth_failed&message=${encodeURIComponent('Authentication failed. Please try again.')}`,
      );
    }
  }

  /**
   * Exchange OAuth code for tokens
   * POST /auth/oauth/exchange
   *
   * CWE-598 Fix: Frontend calls this endpoint to exchange the one-time code for tokens
   * CWE-522 Fix: Tokens returned via HttpOnly cookies
   *
   * Google OAuth users:
   * - Email is automatically verified (verified by Google)
   * - No OTP verification required
   * - Redirect to homepage
   */
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit()
  @ApiOperation({ summary: 'Exchange OAuth code for authentication tokens' })
  @ApiResponse({ status: 200, description: 'Tokens exchanged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async exchangeOAuthCode(
    @Body() body: OAuthCodeExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OAuthCodeExchangeResponseDto> {
    const result = await this.authService.exchangeOAuthCode(body.code);

    // CWE-522 Fix: Set tokens as HttpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Return user info (tokens are in cookies, not response body)
    // OAuth users have verified emails and go directly to homepage
    return {
      success: true,
      message: 'Authentication successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        displayName: result.user.displayName,
        emailVerified: result.user.emailVerified,
      },
      redirectUrl: AUTH_REDIRECT_PATHS.HOME,
    };
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Refresh access token
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() body: { refreshToken?: string },
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, then body
    const refreshToken = req.cookies?.refresh_token || body.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Update cookies with new tokens
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      success: true,
      message: 'Tokens refreshed successfully',
    };
  }

  // ==================== LOGOUT ====================

  /**
   * Logout current session
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Request() req: any,
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      authorization?.replace('Bearer ', '') || req.cookies?.access_token;
    await this.authService.logout(req.user.id, token);

    // Clear auth cookies
    this.clearAuthCookies(res);

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Logout all sessions
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout all sessions' })
  @ApiResponse({ status: 200, description: 'All sessions logged out' })
  async logoutAll(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(req.user.id);

    // Clear auth cookies
    this.clearAuthCookies(res);

    return {
      success: true,
      message: 'All sessions logged out',
      sessionsInvalidated: result.sessionsInvalidated,
    };
  }

  // ==================== USER PROFILE ====================

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: any) {
    return req.user;
  }

  // ==================== DEBUG ENDPOINT (DEVELOPMENT ONLY) ====================

  /**
   * Debug auth status - useful for testing cookie and token setup
   * GET /api/auth/debug
   *
   * Returns information about the current request's auth state
   * Only available in development mode
   */
  @Get('debug')
  @ApiOperation({ summary: 'Debug authentication status (development only)' })
  @ApiResponse({ status: 200, description: 'Returns auth debug information' })
  async debugAuth(@Request() req: ExpressRequest) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (isProduction) {
      return { error: 'Debug endpoint disabled in production' };
    }

    const cookies = req.cookies || {};
    const hasAccessToken = !!cookies.access_token;
    const hasRefreshToken = !!cookies.refresh_token;
    const authHeader = req.headers.authorization;
    const hasBearerToken = !!authHeader?.startsWith('Bearer ');

    return {
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV'),
      authentication: {
        hasAccessTokenCookie: hasAccessToken,
        hasRefreshTokenCookie: hasRefreshToken,
        hasBearerToken,
        accessTokenPreview: hasAccessToken
          ? `${cookies.access_token.substring(0, 20)}...`
          : null,
      },
      cookies: {
        received: Object.keys(cookies),
        cookieHeader: req.headers.cookie ? 'present' : 'missing',
      },
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent']?.substring(0, 50),
      },
      cors: {
        frontendUrl: this.configService.get<string>('FRONTEND_URL'),
        allowedOrigins: this.configService.get<string>('ALLOWED_ORIGINS'),
      },
    };
  }

  /**
   * Verify test user exists and credentials are correct
   * GET /api/auth/verify-test-user
   *
   * Only available in development mode
   */
  @Get('verify-test-user')
  @ApiOperation({
    summary: 'Verify test user credentials (development only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns test user verification status',
  })
  async verifyTestUser() {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (isProduction) {
      return { error: 'Debug endpoint disabled in production' };
    }

    return this.authService.verifyTestUserCredentials();
  }

  // ==================== PASSWORD RESET ====================

  /**
   * Request password reset
   * POST /auth/forgot-password
   *
   * Rate limited to 3 requests per 15 minutes per IP to prevent abuse.
   * Always returns success message to prevent email enumeration attacks.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @PasswordResetRateLimit()
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if account exists)',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Verify password reset token
   * GET /auth/verify-reset-token?token=xxx
   *
   * Used by frontend to check if reset link is valid before showing the form.
   * Does not consume the token.
   */
  @Get('verify-reset-token')
  @ApiOperation({ summary: 'Verify password reset token validity' })
  @ApiResponse({ status: 200, description: 'Token validity status' })
  async verifyResetToken(
    @Query() verifyResetTokenDto: VerifyResetTokenDto,
  ): Promise<VerifyResetTokenResponse> {
    return this.authService.verifyResetToken(verifyResetTokenDto.token);
  }

  /**
   * Reset password with token
   * POST /auth/reset-password
   *
   * Validates the token and updates the user's password.
   * Invalidates all existing sessions after successful reset.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit()
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  // ==================== OTP EMAIL VERIFICATION ====================

  /**
   * Verify OTP code
   * POST /auth/verify-otp
   *
   * Validates the 4-digit OTP code and marks the user's email as verified.
   *
   * Security:
   * - Rate limited to 3 attempts per 10 minutes
   * - Maximum 3 failed attempts before lockout (requires new OTP)
   * - OTP expires after 10 minutes
   * - Timing-attack resistant via bcrypt comparison
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @OtpVerificationRateLimit()
  @ApiOperation({ summary: 'Verify email with 4-digit OTP code' })
  @ApiResponse({ status: 200, description: 'Email verification result' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<VerifyOtpResponse> {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  /**
   * Resend OTP verification email
   * POST /auth/resend-otp
   *
   * Generates a new OTP and sends it to the user's email.
   * Returns generic response to prevent email enumeration.
   *
   * Security:
   * - Rate limited to 3 requests per 10 minutes
   * - 60-second cooldown between resend requests
   * - Generic response to prevent email enumeration
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @OtpResendRateLimit()
  @ApiOperation({ summary: 'Resend OTP verification email' })
  @ApiResponse({ status: 200, description: 'OTP resend result' })
  async resendOtp(
    @Body() resendOtpDto: ResendOtpDto,
  ): Promise<SendOtpResponse> {
    return this.authService.resendOtp(resendOtpDto.email);
  }

  /**
   * Request OTP verification (for authenticated users)
   * POST /auth/request-otp
   *
   * Generates and sends a new OTP to the authenticated user's email.
   * Use this when user is logged in but email is not yet verified.
   *
   * Security:
   * - Requires authentication (JWT)
   * - Rate limited to 3 requests per 10 minutes
   * - 60-second cooldown between requests
   */
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @OtpResendRateLimit()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request OTP for authenticated user' })
  @ApiResponse({ status: 200, description: 'OTP request result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestOtp(@Request() req: any): Promise<SendOtpResponse> {
    return this.authService.generateAndSendOtp(req.user.id);
  }
}
