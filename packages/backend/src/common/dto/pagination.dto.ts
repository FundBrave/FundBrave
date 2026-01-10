import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Input for paginated queries
 */
@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  offset: number = 0;
}

/**
 * Cursor-based pagination input
 */
@InputType()
export class CursorPaginationInput {
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @Field({ nullable: true })
  @IsOptional()
  cursor?: string;
}

/**
 * Pagination metadata for responses
 */
@ObjectType()
export class PaginationMeta {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;

  @Field()
  hasMore: boolean;
}

/**
 * Cursor pagination metadata
 */
@ObjectType()
export class CursorPaginationMeta {
  @Field({ nullable: true })
  nextCursor?: string;

  @Field()
  hasMore: boolean;
}
