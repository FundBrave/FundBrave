import { ComponentType } from "react";
import {
  VerifyEmail,
  ProfileDetails,
  SocialProfile,
  Goals,
  Welcome,
} from "../app/components/onboarding/steps";

import {
  MailIcon,
  UserIcon,
  GroupPersonIcon,
  PencilIcon,
  RocketIcon,
} from "../app/components/onboarding/icons";

export interface StepComponentProps {
  onNext?: () => void;
  onBack?: () => void;
}

export interface OnboardingStep {
  slug: string;
  title: string;
  subtitle: string;
  Icon: ComponentType<{ className?: string }>;
  Component: ComponentType<StepComponentProps>;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    slug: "verify-email",
    title: "Verify your email",
    subtitle: "Enter verification code",
    Icon: MailIcon,
    Component: VerifyEmail,
  },
  {
    slug: "profile-details",
    title: "Profile details",
    subtitle: "Provide profile information",
    Icon: UserIcon,
    Component: ProfileDetails,
  },
  {
    slug: "social-profile",
    title: "Social profile",
    subtitle: "Let's know your social media handles",
    Icon: GroupPersonIcon,
    Component: SocialProfile,
  },
  {
    slug: "goals",
    title: "Goals",
    subtitle: "What do you hope to achieve?",
    Icon: PencilIcon,
    Component: Goals,
  },
  {
    slug: "welcome",
    title: "Welcome to FundBrave",
    subtitle: "Get your goals running",
    Icon: RocketIcon,
    Component: Welcome,
  },
];
