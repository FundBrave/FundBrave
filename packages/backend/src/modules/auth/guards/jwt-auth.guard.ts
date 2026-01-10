import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Utility function to extract the request object from either REST or GraphQL context
 * @param context - The execution context from NestJS
 * @returns The HTTP request object
 */
function getRequestFromContext(context: ExecutionContext): any {
  const contextType = context.getType<string>();

  // Handle GraphQL context
  if (contextType === 'graphql') {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  // Handle REST/HTTP context
  return context.switchToHttp().getRequest();
}

/**
 * JWT Authentication Guard for both REST and GraphQL endpoints
 * Validates JWT tokens from Authorization header or cookie
 *
 * Usage:
 * - REST: @UseGuards(JwtAuthGuard)
 * - GraphQL: @UseGuards(JwtAuthGuard)
 *
 * The guard automatically detects the context type and extracts
 * the request appropriately.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    return getRequestFromContext(context);
  }

  handleRequest(err: Error | null, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}

/**
 * Optional JWT Authentication Guard for both REST and GraphQL endpoints
 * Does not throw if no token provided, but validates if present
 *
 * Usage:
 * - REST: @UseGuards(OptionalJwtAuthGuard)
 * - GraphQL: @UseGuards(OptionalJwtAuthGuard)
 *
 * Useful for endpoints that behave differently when authenticated
 * (e.g., showing personalized content when logged in)
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    return getRequestFromContext(context);
  }

  handleRequest(err: Error | null, user: any) {
    // Return user if authenticated, undefined otherwise
    // Do not throw - this is intentionally optional
    return user || undefined;
  }
}
