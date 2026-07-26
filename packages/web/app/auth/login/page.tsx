import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Sign in | FundBrave",
  description: "Sign in to FundBrave with your email or Google account.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
