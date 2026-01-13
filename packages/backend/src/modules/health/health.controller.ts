import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Health check controller
 * Provides endpoints for monitoring service health
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Overall health check
   * GET /health
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check database connection
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, {
          timeout: 5000,
        }),
      // Check memory usage (heap should be under 500MB)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      // Check RSS memory (under 1GB)
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }

  /**
   * Database health check
   * GET /health/db
   */
  @Get('db')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, {
          timeout: 5000,
        }),
    ]);
  }

  /**
   * Redis health check
   * GET /health/redis
   */
  @Get('redis')
  @HealthCheck()
  async checkRedis() {
    // Custom Redis health check
    return this.health.check([
      async () => {
        try {
          // We'll implement a custom indicator since Redis might not be available
          // In production, use proper Redis health check
          return {
            redis: {
              status: 'up' as const,
              message:
                'Redis check placeholder - implement with actual Redis client',
            },
          };
        } catch (error) {
          return {
            redis: {
              status: 'down' as const,
              message: String(error),
            },
          };
        }
      },
    ]);
  }

  /**
   * Liveness probe
   * GET /health/live
   */
  @Get('live')
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe
   * GET /health/ready
   */
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, {
          timeout: 3000,
        }),
    ]);
  }
}
