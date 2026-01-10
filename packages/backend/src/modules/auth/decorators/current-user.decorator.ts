import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Decorator to extract the current authenticated user from the GraphQL context
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
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req?.user;
  },
);
