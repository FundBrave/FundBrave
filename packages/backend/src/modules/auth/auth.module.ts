import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Auth Module
 * Handles authentication via SIWE (Sign-In With Ethereum), Google OAuth, and JWT
 */
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        // Get expiration from config or use default (in seconds for type safety)
        const expiresInConfig = configService.get<string>('JWT_EXPIRES_IN');
        // Convert duration string to seconds if provided, otherwise default to 1 day (86400 seconds)
        const expiresIn = expiresInConfig
          ? parseJwtDuration(expiresInConfig)
          : 86400;

        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Conditionally provide GoogleStrategy only if credentials are configured
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

        // Only instantiate GoogleStrategy if credentials are provided
        if (clientId && clientSecret) {
          return new GoogleStrategy(configService, authService);
        }

        // Return null if credentials not configured (strategy won't be available)
        return null;
      },
      inject: [ConfigService, AuthService],
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

/**
 * Parse JWT duration string to seconds
 * Supports formats like '7d', '24h', '30m', '60s', or plain numbers (treated as seconds)
 */
function parseJwtDuration(duration: string): number {
  const match = duration.match(/^(\d+)([dhms]?)$/);
  if (!match) {
    // If parsing fails, default to 1 day
    return 86400;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || 's';

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
    default:
      return value;
  }
}
