import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { cookies } from 'next/headers';

/**
 * Server-side Apollo Client for Server Components
 * Creates a new client instance for each request with authentication cookies
 */
export async function getClient() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:3000/graphql',
    credentials: 'include',
    fetchOptions: {
      mode: 'cors',
    },
    // Forward cookies to GraphQL API for authentication
    headers: {
      cookie: cookieHeader,
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

  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            feed: {
              keyArgs: ['feedType'],
              merge(existing, incoming, { args }) {
                if (!args?.cursor) {
                  return incoming;
                }
                return {
                  ...incoming,
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
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
          },
        },
        Post: {
          fields: {
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
      query: {
        fetchPolicy: 'no-cache', // Server-side always fetches fresh data
        errorPolicy: 'all',
      },
    },
  });
}
