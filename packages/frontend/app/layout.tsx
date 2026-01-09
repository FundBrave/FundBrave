import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme";
import { PostsProvider } from "./provider/PostsContext";
import { ToastProvider } from "./components/ui/Toast";



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
      <body className="custom-scrollbar">
        <ThemeProvider defaultTheme="dark" storageKey="fundbrave-theme">
          <ToastProvider>
            <PostsProvider>
              {children}
            </PostsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

