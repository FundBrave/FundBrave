import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./provider/ClientProviders";

export const metadata: Metadata = {
  title: "FundBrave",
  description: "A decentralized fundraising platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="custom-scrollbar overflow-x-hidden">
        <ClientProviders>
          <div className="w-full mx-auto max-w-[1400px]">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}

