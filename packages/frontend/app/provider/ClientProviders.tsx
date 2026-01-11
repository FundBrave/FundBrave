'use client';

import dynamic from 'next/dynamic';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from '../components/theme';
import { ToastProvider } from '../components/ui/Toast';
import { PostsProvider } from './PostsContext';

// Dynamically import WalletProvider to prevent SSR issues with indexedDB
const WalletProvider = dynamic(
  () => import('./WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
);

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <WalletProvider>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="fundbrave-theme">
          <ToastProvider>
            <PostsProvider>
              {children}
            </PostsProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </WalletProvider>
  );
}
