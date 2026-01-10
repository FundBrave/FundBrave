import { redirect } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";

export default function OnboardingPage() {
  // Redirect to the first onboarding step
  redirect(`/onboarding/${ONBOARDING_STEPS[0].slug}`);
}
