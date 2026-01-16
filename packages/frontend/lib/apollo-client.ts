import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:3000/graphql',
  credentials: 'include', // Include cookies for authentication
  fetchOptions: {
    mode: 'cors',
  },
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Configure Apollo Client with optimistic UI and caching
export function createApolloClient() {
  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Pagination type policies for feed
            feed: {
              keyArgs: ['feedType'],
              merge(existing, incoming, { args }) {
                if (!args?.cursor) {
                  // First page - replace
                  return incoming;
                }
                // Subsequent pages - merge
                return {
                  ...incoming,
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
            // Pagination for posts
            posts: {
              keyArgs: ['filter', 'sortBy', 'order'],
              merge(existing, incoming, { args }) {
                const offset = args?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for user posts
            userPosts: {
              keyArgs: ['userId'],
              merge(existing, incoming, { args }) {
                const offset = args?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for comments
            postComments: {
              keyArgs: ['postId'],
              merge(existing, incoming, { args }) {
                const offset = args?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for followers
            followers: {
              keyArgs: ['userId'],
              merge(existing, incoming, { args }) {
                const offset = args?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for following
            following: {
              keyArgs: ['userId'],
              merge(existing, incoming, { args }) {
                const offset = args?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for notifications
            notifications: {
              keyArgs: ['input.types', 'input.unreadOnly'],
              merge(existing, incoming, { args }) {
                const offset = args?.input?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for conversations
            conversations: {
              keyArgs: [],
              merge(existing, incoming, { args }) {
                const offset = args?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
            // Pagination for messages
            messages: {
              keyArgs: ['input.conversationId'],
              merge(existing, incoming, { args }) {
                const offset = args?.input?.offset || 0;
                if (offset === 0) {
                  return incoming;
                }
                return {
                  ...incoming,
                  items: [...(existing?.items || []), ...incoming.items],
                };
              },
            },
          },
        },
        Post: {
          fields: {
            // Optimistic updates for post interactions
            isLiked: {
              read(existing) {
                return existing ?? false;
              },
            },
            isBookmarked: {
              read(existing) {
                return existing ?? false;
              },
            },
            isReposted: {
              read(existing) {
                return existing ?? false;
              },
            },
          },
        },
        Comment: {
          fields: {
            isLiked: {
              read(existing) {
                return existing ?? false;
              },
            },
          },
        },
        User: {
          fields: {
            isFollowing: {
              read(existing) {
                return existing ?? false;
              },
            },
            isFollowedBy: {
              read(existing) {
                return existing ?? false;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-first',
        nextFetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    connectToDevTools: process.env.NODE_ENV === 'development',
  });
}
