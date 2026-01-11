import "../globals.css";
import SessionProvider from "../provider/SessionProvider";

export const metadata = {
  title: "Auth - FundBrave",
  description: "Sign in to your FundBrave account",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider>{children}</SessionProvider>;
}
