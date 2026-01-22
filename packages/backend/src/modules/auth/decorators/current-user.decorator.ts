import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Decorator to extract the current authenticated user from the request context
 * Works with both REST and GraphQL endpoints
 *
 * Usage:
 * @Query()
 * @UseGuards(JwtAuthGuard)
 * async myQuery(@CurrentUser() user: { id: string; walletAddress: string }) {
 *   // user.id and user.walletAddress are available
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const contextType = context.getType<string>();

    // Handle GraphQL context
    if (contextType === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req?.user;
    }

    // Handle REST/HTTP context
    const request = context.switchToHttp().getRequest();
    return request?.user;
  },
);
