import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * JWT Authentication Guard for GraphQL endpoints
 * Validates JWT tokens from Authorization header or cookie
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  handleRequest(err: Error | null, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}

/**
 * Optional JWT Authentication Guard
 * Does not throw if no token provided, but validates if present
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  handleRequest(err: Error | null, user: any) {
    // Return user if authenticated, undefined otherwise
    return user || undefined;
  }
}
