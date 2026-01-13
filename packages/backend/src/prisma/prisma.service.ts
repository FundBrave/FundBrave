import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Database Connection Pool Configuration for Supabase
 *
 * Supabase uses PgBouncer for connection pooling. There are two modes:
 *
 * 1. **Transaction Mode** (default, port 6543):
 *    - Connections are released after each transaction
 *    - Best for serverless/short-lived connections
 *    - Use: `?pgbouncer=true&connection_limit=1` in DATABASE_URL
 *
 * 2. **Session Mode** (port 5432 direct connection):
 *    - Connection persists for the session
 *    - Required for prepared statements, LISTEN/NOTIFY, advisory locks
 *    - Use: Standard connection without pgbouncer param
 *
 * DATABASE_URL Format for Supabase:
 * - Transaction pooler: postgres://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
 * - Session pooler: postgres://user:pass@db.xxx.supabase.co:5432/postgres
 * - Direct connection: postgres://user:pass@db.xxx.supabase.co:5432/postgres
 *
 * Connection Pool Settings:
 * - connection_limit: Maximum connections in pool (default varies by Supabase plan)
 * - pool_timeout: Seconds to wait for available connection (default: 10)
 * - connect_timeout: Seconds for initial connection (default: 10)
 * - statement_cache_size: Use 0 with pgbouncer transaction mode
 */

// Constants for connection retry logic
const CONNECTION_RETRY_ATTEMPTS = 3;
const CONNECTION_RETRY_DELAY_MS = 1000;
const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

// Prisma error codes for connection issues
const PRISMA_CONNECTION_ERROR_CODES = [
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1003', // Database does not exist
  'P1008', // Operations timed out
  'P1017', // Server closed the connection
  'P2024', // Timed out fetching a new connection from the connection pool
];

/**
 * Extended PrismaClient options for Supabase connection pooling
 */
const getPrismaClientOptions = (): Prisma.PrismaClientOptions => {
  const databaseUrl = process.env.DATABASE_URL || '';
  const isSupabasePgBouncer = databaseUrl.includes('pgbouncer=true');
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    log: isProduction
      ? [{ level: 'error', emit: 'event' }]
      : [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // For Supabase with PgBouncer in transaction mode, disable prepared statements
    // This is handled via the DATABASE_URL with statement_cache_size=0
  };
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private connectionAttempts = 0;

  constructor() {
    super(getPrismaClientOptions());
    this.setupEventListeners();
  }

  /**
   * Initialize database connection with retry logic
   */
  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
    this.startHealthCheck();
  }

  /**
   * Graceful shutdown of database connections
   */
  async onModuleDestroy(): Promise<void> {
    this.stopHealthCheck();
    await this.disconnect();
  }

  /**
   * Connect to database with exponential backoff retry
   */
  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= CONNECTION_RETRY_ATTEMPTS; attempt++) {
      try {
        this.connectionAttempts = attempt;
        this.logger.log(
          `Attempting database connection (attempt ${attempt}/${CONNECTION_RETRY_ATTEMPTS})...`,
        );

        await this.$connect();
        this.isConnected = true;

        this.logger.log('Database connection established successfully');
        this.logConnectionInfo();
        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Database connection attempt ${attempt} failed: ${errorMessage}`,
        );

        if (attempt < CONNECTION_RETRY_ATTEMPTS) {
          const delay = CONNECTION_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          this.logger.warn(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          this.logger.error('All database connection attempts failed');
          throw new Error(
            `Failed to connect to database after ${CONNECTION_RETRY_ATTEMPTS} attempts: ${errorMessage}`,
          );
        }
      }
    }
  }

  /**
   * Disconnect from database gracefully
   */
  private async disconnect(): Promise<void> {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error disconnecting from database: ${errorMessage}`);
    }
  }

  /**
   * Setup Prisma event listeners for logging and monitoring
   */
  private setupEventListeners(): void {
    // Log queries in development
    if (process.env.NODE_ENV !== 'production') {
      // @ts-expect-error - Prisma event typing
      this.$on('query', (e: Prisma.QueryEvent) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    // Always log errors
    // @ts-expect-error - Prisma event typing
    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Database error: ${e.message}`);
    });

    // @ts-expect-error - Prisma event typing
    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  /**
   * Log connection information (sanitized)
   */
  private logConnectionInfo(): void {
    const databaseUrl = process.env.DATABASE_URL || '';
    const isSupabasePgBouncer = databaseUrl.includes('pgbouncer=true');
    const connectionLimit =
      databaseUrl.match(/connection_limit=(\d+)/)?.[1] || 'default';

    this.logger.log(
      `Connection mode: ${isSupabasePgBouncer ? 'Supabase PgBouncer (Transaction)' : 'Direct/Session'}`,
    );
    this.logger.log(`Connection limit: ${connectionLimit}`);
    this.logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (process.env.NODE_ENV === 'test') {
      return; // Skip health checks in test environment
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL_MS);

    this.logger.log(
      `Database health check started (interval: ${HEALTH_CHECK_INTERVAL_MS}ms)`,
    );
  }

  /**
   * Stop periodic health checks
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.log('Database health check stopped');
    }
  }

  /**
   * Perform a database health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1`;
      if (!this.isConnected) {
        this.isConnected = true;
        this.logger.log('Database connection restored');
      }
    } catch (error) {
      this.isConnected = false;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${errorMessage}`);

      // Attempt reconnection
      try {
        await this.reconnect();
      } catch (reconnectError) {
        this.logger.error('Database reconnection failed');
      }
    }
  }

  /**
   * Attempt to reconnect to the database
   */
  private async reconnect(): Promise<void> {
    this.logger.warn('Attempting database reconnection...');
    try {
      await this.$disconnect();
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database reconnection successful');
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Check if a Prisma error is a connection-related error
   */
  isConnectionError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return PRISMA_CONNECTION_ERROR_CODES.includes(error.code);
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return true;
    }
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return true;
    }
    // Check for connection timeout errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('pool') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }
    return false;
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): { isConnected: boolean; attempts: number } {
    return {
      isConnected: this.isConnected,
      attempts: this.connectionAttempts,
    };
  }

  /**
   * Execute a database operation with retry logic for transient connection failures
   *
   * @param operation - The database operation to execute
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param retryDelayMs - Initial delay between retries in milliseconds (default: 1000)
   * @returns The result of the operation
   * @throws The last error if all retries fail
   *
   * @example
   * ```typescript
   * const user = await this.prisma.executeWithRetry(
   *   () => this.prisma.user.findUnique({ where: { id: userId } }),
   *   3,
   *   500
   * );
   * ```
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on connection errors
        if (!this.isConnectionError(error)) {
          throw error;
        }

        this.logger.warn(
          `Database operation failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`,
        );

        if (attempt < maxRetries) {
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(`Retrying database operation in ${delay}ms...`);
          await this.sleep(delay);

          // Try to reconnect before retry
          if (!this.isConnected) {
            try {
              await this.reconnect();
            } catch {
              // Continue with retry anyway
            }
          }
        }
      }
    }

    throw lastError ?? new Error('Database operation failed');
  }

  /**
   * Helper to sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enable shutdown hooks for graceful termination
   * @deprecated Use onModuleDestroy instead. This method is kept for backward compatibility.
   */
  async enableShutdownHooks(app: {
    close: () => Promise<void>;
  }): Promise<void> {
    this.logger.warn(
      'enableShutdownHooks is deprecated. NestJS OnModuleDestroy lifecycle hook handles shutdown automatically.',
    );

    process.on('beforeExit', async () => {
      await app.close();
    });

    // Handle SIGTERM for containerized environments
    process.on('SIGTERM', async () => {
      this.logger.log('Received SIGTERM signal');
      await this.disconnect();
      await app.close();
      process.exit(0);
    });

    // Handle SIGINT for local development
    process.on('SIGINT', async () => {
      this.logger.log('Received SIGINT signal');
      await this.disconnect();
      await app.close();
      process.exit(0);
    });
  }
}

/**
 * User-friendly error messages for Prisma connection errors
 */
export const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  P1001: 'Unable to connect to the database. Please try again later.',
  P1002: 'Database connection timed out. Please try again.',
  P1003: 'Database configuration error. Please contact support.',
  P1008: 'Operation timed out. Please try again.',
  P1017: 'Database connection was lost. Please try again.',
  P2024: 'Database is currently busy. Please try again in a moment.',
};

/**
 * Get user-friendly error message for a Prisma error code
 */
export function getPrismaErrorMessage(errorCode: string): string {
  return (
    PRISMA_ERROR_MESSAGES[errorCode] ||
    'An unexpected database error occurred. Please try again.'
  );
}
