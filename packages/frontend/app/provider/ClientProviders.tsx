'use client';

import dynamic from 'next/dynamic';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from '../components/theme';
import { ToastProvider } from '../components/ui/Toast';
import { PostsProvider } from './PostsContext';
import { SearchProvider } from './SearchProvider';
import { NotificationProvider } from './NotificationProvider';
import { SkipLink } from '../components/ui/SkipLink';
import { NotificationToast } from '../components/notifications';

// Dynamically import WalletProvider to prevent SSR issues with indexedDB
const WalletProvider = dynamic(
  () => import('./WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
);

interface ClientProvidersProps {
  children: React.ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}

export function ClientProviders({ children, messages, locale }: ClientProvidersProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <WalletProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="light" storageKey="fundbrave-theme">
            <ToastProvider>
              <PostsProvider>
                <SearchProvider>
                  <NotificationProvider>
                    {/* Skip Link - WCAG 2.2 AA: Bypass Blocks (2.4.1) */}
                    <SkipLink targetId="main-content" label="Skip to main content" />

                    {/* Notification Toasts */}
                    <NotificationToast />

                    {children}
                  </NotificationProvider>
                </SearchProvider>
              </PostsProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </WalletProvider>
    </NextIntlClientProvider>
  );
}
