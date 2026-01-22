import type { Metadata } from "next";
import { getMessages, getLocale } from "next-intl/server";
import "./globals.css";
import { ClientProviders } from "./provider/ClientProviders";

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
      <body className="custom-scrollbar overflow-x-hidden" suppressHydrationWarning>
        <ClientProviders messages={messages} locale={locale}>
          <div className="w-full mx-auto max-w-[1400px]">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}

