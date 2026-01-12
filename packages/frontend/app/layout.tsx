import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "./globals.css";
import { ThemeProvider } from "./components/theme";
import { PostsProvider } from "./provider/PostsContext";
import { ToastProvider } from "./components/ui/Toast";
import { SkipLink } from "./components/ui/SkipLink";
import { SearchProvider } from "./provider/SearchProvider";
import { NotificationProvider } from "./provider/NotificationProvider";
import { NotificationToast } from "./components/notifications";



export const metadata: Metadata = {
  title: "FundBrave",
  description: "A decentralized fundraising platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="custom-scrollbar overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="light" storageKey="fundbrave-theme">
            <ToastProvider>
              <PostsProvider>
                <SearchProvider>
                  <NotificationProvider>
                    {/* Skip Link - WCAG 2.2 AA: Bypass Blocks (2.4.1) */}
                    <SkipLink targetId="main-content" label="Skip to main content" />

                    {/* Notification Toasts */}
                    <NotificationToast />

                    {/* Main Content Container */}
                    <div className="w-full mx-auto max-w-[1400px]">
                      {children}
                    </div>
                  </NotificationProvider>
                </SearchProvider>
              </PostsProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

