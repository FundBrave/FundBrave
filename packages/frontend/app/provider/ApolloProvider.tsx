'use client';

import { ApolloProvider as ApolloClientProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { useMemo } from 'react';

interface ApolloProviderProps {
  children: React.ReactNode;
}

export function ApolloProvider({ children }: ApolloProviderProps) {
  // Create Apollo Client instance - memoized to prevent recreation on re-renders
  const client = useMemo(() => createApolloClient(), []);

  return <ApolloClientProvider client={client}>{children}</ApolloClientProvider>;
}
