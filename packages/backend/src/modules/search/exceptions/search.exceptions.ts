import {
  HttpException,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Base exception for search-related errors
 */
export abstract class SearchException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}

/**
 * Thrown when search query is invalid or malformed
 */
export class InvalidSearchQueryException extends BadRequestException {
  constructor(query: string, reason?: string) {
    super({
      code: 'INVALID_SEARCH_QUERY',
      message: reason || `Invalid search query: "${query}"`,
      details: { query, reason },
    });
  }
}

/**
 * Thrown when search query is too short
 */
export class SearchQueryTooShortException extends BadRequestException {
  constructor(minLength: number = 2) {
    super({
      code: 'SEARCH_QUERY_TOO_SHORT',
      message: `Search query must be at least ${minLength} characters`,
      details: { minLength },
    });
  }
}

/**
 * Thrown when search query contains potentially dangerous content
 */
export class SearchQueryUnsafeException extends BadRequestException {
  constructor(query: string) {
    super({
      code: 'SEARCH_QUERY_UNSAFE',
      message: 'Search query contains invalid characters',
      details: { sanitized: true },
    });
  }
}

/**
 * Thrown when search service encounters a database error
 */
export class SearchDatabaseException extends InternalServerErrorException {
  constructor(operation: string, error?: string) {
    super({
      code: 'SEARCH_DATABASE_ERROR',
      message: `Search operation failed: ${operation}`,
      details: { operation, error: error || 'Unknown database error' },
    });
  }
}

/**
 * Thrown when search times out
 */
export class SearchTimeoutException extends HttpException {
  constructor(timeoutMs: number) {
    super(
      {
        code: 'SEARCH_TIMEOUT',
        message: `Search operation timed out after ${timeoutMs}ms`,
        details: { timeoutMs },
      },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}

/**
 * Thrown when search results cannot be cached
 */
export class SearchCacheException extends InternalServerErrorException {
  constructor(operation: 'get' | 'set' | 'delete', error?: string) {
    super({
      code: 'SEARCH_CACHE_ERROR',
      message: `Cache ${operation} operation failed`,
      details: { operation, error },
    });
  }
}

/**
 * Thrown when rate limit is exceeded for search
 */
export class SearchRateLimitException extends HttpException {
  constructor(retryAfterSeconds: number) {
    super(
      {
        code: 'SEARCH_RATE_LIMITED',
        message: 'Too many search requests. Please try again later.',
        details: { retryAfterSeconds },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Thrown when search filters are invalid
 */
export class InvalidSearchFiltersException extends BadRequestException {
  constructor(filters: string[], reason: string) {
    super({
      code: 'INVALID_SEARCH_FILTERS',
      message: `Invalid search filters: ${reason}`,
      details: { filters, reason },
    });
  }
}
