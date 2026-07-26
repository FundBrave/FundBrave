import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";

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
      <body
        className="custom-scrollbar overflow-x-hidden"
        suppressHydrationWarning
      >
        <Providers>
          <Header />
          <div className="w-full mx-auto max-w-[1400px]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
