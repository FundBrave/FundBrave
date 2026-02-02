import { Controller, Get, Inject, Optional } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractsService } from '../blockchain/contracts.service';

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
    @Optional() @Inject(ContractsService) private readonly contractsService?: ContractsService,
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
   * Blockchain health check
   * GET /health/blockchain
   */
  @Get('blockchain')
  @HealthCheck()
  async checkBlockchain() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          if (!this.contractsService) {
            return {
              blockchain: {
                status: 'down' as const,
                message: 'ContractsService not available',
              },
            };
          }

          const healthStatus = this.contractsService.getBlockchainHealth();

          if (!healthStatus.isHealthy) {
            return {
              blockchain: {
                status: 'down' as const,
                message: 'No blockchain providers connected',
                details: {
                  providers: healthStatus.providers.map(p => ({
                    chainId: p.chainId,
                    network: p.networkName,
                    connected: p.isConnected,
                    error: p.error,
                  })),
                },
              },
            };
          }

          const connectedProviders = healthStatus.providers.filter(p => p.isConnected);

          return {
            blockchain: {
              status: 'up' as const,
              message: `${connectedProviders.length}/${healthStatus.providers.length} chains connected`,
              details: {
                defaultChainConnected: healthStatus.defaultChainConnected,
                connectedChains: connectedProviders.map(p => ({
                  chainId: p.chainId,
                  network: p.networkName,
                  blockNumber: p.blockNumber,
                  latency: p.latency,
                })),
              },
            },
          };
        } catch (error) {
          return {
            blockchain: {
              status: 'down' as const,
              message: error instanceof Error ? error.message : 'Unknown error',
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
