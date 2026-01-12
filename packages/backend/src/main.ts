import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

/**
 * Security Configuration Constants
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'WALLET_ENCRYPTION_KEY',
] as const;

const RECOMMENDED_ENV_VARS = [
  'FRONTEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'ALLOWED_REDIRECT_DOMAINS',
  'COOKIE_DOMAIN',
] as const;

/**
 * Validate required environment variables at startup
 * Fails fast if critical security configuration is missing
 */
function validateEnvironment(logger: Logger): void {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingRequired.push(envVar);
    }
  }

  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingRecommended.push(envVar);
    }
  }

  // Fail if required variables are missing
  if (missingRequired.length > 0) {
    logger.error(`CRITICAL: Missing required environment variables: ${missingRequired.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  // Warn about missing recommended variables
  if (missingRecommended.length > 0) {
    logger.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    logger.warn('WARNING: JWT_SECRET should be at least 32 characters for production security');
  }

  // Validate WALLET_ENCRYPTION_KEY format
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
  if (encryptionKey) {
    if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
      logger.error('CRITICAL: WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
      throw new Error('WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    // Check for weak/default keys
    const weakKeys = ['0'.repeat(64), 'a'.repeat(64), '1234567890'.repeat(6) + '1234'];
    if (weakKeys.includes(encryptionKey.toLowerCase())) {
      logger.error('CRITICAL: WALLET_ENCRYPTION_KEY cannot be a weak or default value');
      throw new Error('WALLET_ENCRYPTION_KEY cannot be a weak or default value');
    }
  }

  logger.log('Environment validation passed');
}

/**
 * Configure CORS with security in mind
 * CWE-522 Fix: Properly configured to accept HttpOnly cookies from frontend
 */
function configureCors(): {
  origin: string | string[] | boolean | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
} {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const frontendUrl = process.env.FRONTEND_URL;
  const additionalOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

  // In production, strictly limit CORS origins
  if (nodeEnv === 'production') {
    const origins: string[] = [];

    if (frontendUrl) {
      origins.push(frontendUrl);
    }

    origins.push(...additionalOrigins);

    if (origins.length === 0) {
      throw new Error('FRONTEND_URL or ALLOWED_ORIGINS must be set in production');
    }

    return {
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'Set-Cookie'],
      maxAge: 86400, // 24 hours
    };
  }

  // In development, explicitly allow localhost:3001 for cookie support
  const allowedDevelopmentOrigins = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];

  if (frontendUrl && !allowedDevelopmentOrigins.includes(frontendUrl)) {
    allowedDevelopmentOrigins.push(frontendUrl);
  }

  additionalOrigins.forEach(origin => {
    if (!allowedDevelopmentOrigins.includes(origin)) {
      allowedDevelopmentOrigins.push(origin);
    }
  });

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedDevelopmentOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true, // Critical: allows cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'Set-Cookie'],
    maxAge: 86400,
  };
}

/**
 * Configure Helmet security headers
 */
function configureHelmet() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        }
      : false, // Disable in development for easier debugging

    // Cross-Origin policies
    crossOriginEmbedderPolicy: isProduction,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },

    // Frameguard - prevent clickjacking
    frameguard: { action: 'deny' },

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // HSTS - force HTTPS in production
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,

    // IE No Open
    ieNoOpen: true,

    // No Sniff - prevent MIME type sniffing
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },

    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // XSS Filter
    xssFilter: true,
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate environment at startup (fail fast)
  validateEnvironment(logger);

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security middleware - apply Helmet first
  app.use(configureHelmet());

  // Cookie parser for HttpOnly cookie support
  app.use(cookieParser());

  // Configure CORS with security settings
  app.enableCors(configureCors());

  // Global validation pipe with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Disable detailed errors in production
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Set global prefix for API routes
  // OAuth routes are excluded because Google OAuth callback URL must match exactly
  app.setGlobalPrefix('api', {
    exclude: ['health', 'auth/google', 'auth/google/callback'],
  });

  // Swagger API Documentation (disable in production if needed)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('FundBrave API')
      .setDescription('Decentralized fundraising platform API with DeFi mechanics')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      })
      .addTag('Authentication', 'SIWE, Google OAuth, JWT endpoints')
      .addTag('Users', 'User management and profiles')
      .addTag('Fundraisers', 'Fundraiser CRUD operations')
      .addTag('Donations', 'Donation tracking and management')
      .addTag('Staking', 'Staking pools and rewards')
      .addTag('Upload', 'File upload to S3')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'FundBrave API Docs',
      customfavIcon: 'https://fundbrave.com/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log('Swagger documentation enabled at /api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log('='.repeat(80));
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  logger.log('='.repeat(80));

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    logger.log(`API Documentation: http://localhost:${port}/api/docs`);
  }

  logger.log(`Health Check: http://localhost:${port}/health`);
  logger.log(`Google OAuth: http://localhost:${port}/auth/google`);
  logger.log('');

  // Log security status
  logger.log('Security features enabled:');
  logger.log('  - Helmet security headers');
  logger.log('  - CORS protection with credentials support');
  logger.log('  - Cookie parser for HttpOnly tokens');
  logger.log('  - Input validation with whitelist');
  logger.log('  - AES-256-GCM wallet encryption');
  logger.log('  - CSRF state validation for OAuth');
  logger.log('  - One-time code exchange for OAuth');
  logger.log('  - Session fixation prevention');
  logger.log('');

  // Log CORS configuration
  const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const frontendUrl = process.env.FRONTEND_URL;
  logger.log('CORS Configuration:');
  logger.log(`  - Frontend URL: ${frontendUrl || 'http://localhost:3001'}`);
  logger.log(`  - Additional Origins: ${corsOrigins.join(', ') || 'none'}`);
  logger.log(`  - Credentials: enabled`);
  logger.log('='.repeat(80));
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
