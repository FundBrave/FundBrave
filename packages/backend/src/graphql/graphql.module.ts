import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { pubSubProvider, PUB_SUB } from './pubsub.provider';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        // Custom error formatting
        const graphQLFormattedError = {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          path: error.path,
        };
        return graphQLFormattedError;
      },
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
  ],
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class GraphqlConfigModule {}

export { PUB_SUB } from './pubsub.provider';
