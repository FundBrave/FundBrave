import { PubSub } from 'graphql-subscriptions';

/**
 * PubSub injection token for dependency injection
 */
export const PUB_SUB = 'PUB_SUB';

/**
 * Shared PubSub instance for GraphQL subscriptions
 * This provider allows consistent subscription handling across all resolvers
 */
export const pubSubProvider = {
  provide: PUB_SUB,
  useValue: new PubSub(),
};
