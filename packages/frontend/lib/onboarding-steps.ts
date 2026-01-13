import { ComponentType } from "react";
import {
  VerifyEmail,
  ProfileDetails,
  SocialProfile,
  Goals,
  Welcome,
  Interests,
  ConnectWallet,
  FollowSuggestions,
} from "../app/components/onboarding/steps";

import {
  MailIcon,
  UserIcon,
  GroupPersonIcon,
  PencilIcon,
  RocketIcon,
  HeartIcon,
  WalletIcon,
  UsersIcon,
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
  /** Whether this step is required to complete onboarding */
  required?: boolean;
  /** Whether this step can be skipped */
  skippable?: boolean;
}

/**
 * Onboarding steps configuration
 *
 * Flow order (per PHASE2_UX_SPECS.md Section 5):
 * 1. Verify Email (required)
 * 2. Profile Details (required)
 * 3. Goals (required)
 * 4. Interests (optional, skippable)
 * 5. Connect Wallet (optional, skippable)
 * 6. Follow Suggestions (optional, skippable)
 * 7. Social Profile (optional, skippable)
 * 8. Welcome/Completion (required)
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    slug: "verify-email",
    title: "Verify your email",
    subtitle: "Enter verification code",
    Icon: MailIcon,
    Component: VerifyEmail,
    required: true,
    skippable: false,
  },
  {
    slug: "profile-details",
    title: "Profile details",
    subtitle: "Provide profile information",
    Icon: UserIcon,
    Component: ProfileDetails,
    required: true,
    skippable: false,
  },
  {
    slug: "goals",
    title: "Goals",
    subtitle: "What do you hope to achieve?",
    Icon: PencilIcon,
    Component: Goals,
    required: true,
    skippable: false,
  },
  {
    slug: "interests",
    title: "Interests",
    subtitle: "Select topics you care about",
    Icon: HeartIcon,
    Component: Interests,
    required: false,
    skippable: true,
  },
  {
    slug: "connect-wallet",
    title: "Connect Wallet",
    subtitle: "Enable crypto donations",
    Icon: WalletIcon,
    Component: ConnectWallet,
    required: false,
    skippable: true,
  },
  {
    slug: "follow-suggestions",
    title: "Follow creators",
    subtitle: "Discover people and causes",
    Icon: UsersIcon,
    Component: FollowSuggestions,
    required: false,
    skippable: true,
  },
  {
    slug: "social-profile",
    title: "Social profile",
    subtitle: "Add your social media handles",
    Icon: GroupPersonIcon,
    Component: SocialProfile,
    required: false,
    skippable: true,
  },
  {
    slug: "welcome",
    title: "Welcome to FundBrave",
    subtitle: "Get your goals running",
    Icon: RocketIcon,
    Component: Welcome,
    required: true,
    skippable: false,
  },
];

/**
 * Get a step by its slug
 */
export function getStepBySlug(slug: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((step) => step.slug === slug);
}

/**
 * Get the index of a step by its slug
 */
export function getStepIndex(slug: string): number {
  return ONBOARDING_STEPS.findIndex((step) => step.slug === slug);
}

/**
 * Get the next step after a given slug
 */
export function getNextStep(currentSlug: string): OnboardingStep | undefined {
  const currentIndex = getStepIndex(currentSlug);
  if (currentIndex === -1 || currentIndex >= ONBOARDING_STEPS.length - 1) {
    return undefined;
  }
  return ONBOARDING_STEPS[currentIndex + 1];
}

/**
 * Get the previous step before a given slug
 */
export function getPreviousStep(currentSlug: string): OnboardingStep | undefined {
  const currentIndex = getStepIndex(currentSlug);
  if (currentIndex <= 0) {
    return undefined;
  }
  return ONBOARDING_STEPS[currentIndex - 1];
}

/**
 * Get all required steps
 */
export function getRequiredSteps(): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((step) => step.required);
}

/**
 * Get all optional (skippable) steps
 */
export function getOptionalSteps(): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((step) => step.skippable);
}
