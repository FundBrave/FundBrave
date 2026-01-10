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
import { AuthRateLimit, PasswordResetRateLimit } from '../../common/decorators';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetTokenDto,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyResetTokenResponse,
  OAuthCodeExchangeDto,
  OAuthCodeExchangeResponseDto,
} from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  private getSecurityContext(req: ExpressRequest, ip?: string): RequestSecurityContext {
    return {
      ipAddress: ip || req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      origin: req.headers['origin'] as string | undefined,
    };
  }

  /**
   * Get cookie configuration based on environment
   */
  private getCookieConfig(): TokenCookieConfig {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
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
    return this.authService.verifySiweAndLogin(body.message, body.signature, context);
  }

  // ==================== EMAIL/PASSWORD AUTHENTICATION ====================

  /**
   * Register with email and password
   */
  @Post('register')
  @AuthRateLimit()
  @ApiOperation({ summary: 'Register new user with email/password' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(
    @Body() body: { email: string; password: string; displayName: string },
    @Request() req: ExpressRequest,
    @Ip() ip: string,
  ) {
    if (!body.email || !body.password || !body.displayName) {
      throw new BadRequestException('Email, password, and display name are required');
    }
    const context = this.getSecurityContext(req, ip);
    return this.authService.registerWithEmail(
      body.email,
      body.password,
      body.displayName,
      context,
    );
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

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
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
  @ApiResponse({ status: 302, description: 'Redirects to frontend with auth code' })
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
        this.logger.warn(`OAuth state validation failed: ${stateValidation.errorMessage}`);
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
    return {
      success: true,
      message: 'Authentication successful',
      email: result.user.email,
      username: result.user.username,
      displayName: result.user.displayName,
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
    const token = authorization?.replace('Bearer ', '') || req.cookies?.access_token;
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
  @ApiResponse({ status: 200, description: 'Password reset email sent (if account exists)' })
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
}
