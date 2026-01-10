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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { AuthRateLimit } from '../../common/decorators';

/**
 * Auth Controller
 * Handles authentication endpoints for SIWE, Google OAuth, and traditional auth
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a nonce for SIWE authentication
   */
  @Get('nonce')
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
  async verifySiwe(@Body() body: { message: string; signature: string }) {
    if (!body.message || !body.signature) {
      throw new BadRequestException('Message and signature are required');
    }
    return this.authService.verifySiweAndLogin(body.message, body.signature);
  }

  /**
   * Register with email and password
   */
  @Post('register')
  @AuthRateLimit()
  async register(
    @Body() body: { email: string; password: string; displayName: string },
  ) {
    if (!body.email || !body.password || !body.displayName) {
      throw new BadRequestException('Email, password, and display name are required');
    }
    return this.authService.registerWithEmail(
      body.email,
      body.password,
      body.displayName,
    );
  }

  /**
   * Initiate Google OAuth
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard handles redirect to Google
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    const user = req.user;
    const tokens = await this.authService.loginWithGoogle({
      id: user.id,
      walletAddress: user.walletAddress,
    });

    // Redirect to frontend with tokens
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );

    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshTokens(body.refreshToken);
  }

  /**
   * Logout current session
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req: any,
    @Headers('authorization') authorization: string,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, token);
  }

  /**
   * Logout all sessions
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Request() req: any) {
    return this.authService.logoutAll(req.user.id);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return req.user;
  }
}
