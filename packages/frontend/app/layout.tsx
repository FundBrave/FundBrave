import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme";
import { PostsProvider } from "./provider/PostsContext";
import { ToastProvider } from "./components/ui/Toast";
import { WalletProvider } from "./provider/WalletProvider";
import { AuthProvider } from "./provider/AuthProvider";



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
        <WalletProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="light" storageKey="fundbrave-theme">
              <ToastProvider>
                <PostsProvider>
                  <div className="w-full mx-auto max-w-[1400px]">
                    {children}
                  </div>
                </PostsProvider>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

