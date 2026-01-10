import { ReactNode } from "react";
import Image from "next/image";

export interface AuthHeroItem {
  key: "signup" | "login";
  title: string;
  subtitle: string;
  svg: ReactNode;
}

export const AuthHeroContent: AuthHeroItem[] = [
  {
    key: "signup",
    title: "Raise Funds Without Limits",
    subtitle:
      "Launch campaigns freely and get support directly, no middlemen, no bias, no limits.",
    svg: (
      <Image
        src={"/onBoard-1.png"}
        height={500}
        width={500}
        className="object-contain"
        alt="Onboarding-image"
      />
    ),
  },
  {
    key: "login",
    title: "Share Real-Time Updates",
    subtitle:
      "Keep your supporters in the loop with real-time progress, milestones, and impact stories.",
    svg: (
      <Image
        src={"/onBoard-2.png"}
        height={1000}
        width={1000}
        className="object-contain"
        alt="Onboarding-image"
      />
    ),
  },
];
