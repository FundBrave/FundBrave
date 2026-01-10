import { ReactNode } from "react";
import { OnboardingProvider } from "@/app/provider/OnboardingContext";
import { OnboardingDataProvider } from "@/app/provider/OnboardingDataContext";
import { OnboardingAside } from "@/app/components/onboarding/OnboardingAside";
import { MobileProgressHeader } from "@/app/components/onboarding/MobileProgressHeader";

export const metadata = {
  title: "Onboarding - FundBrave",
  description: "Complete your onboarding process",
};

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <OnboardingDataProvider>
      <OnboardingProvider>
        <div className="min-h-screen bg-background flex items-center justify-center font-sans">
          <div className="w-full bg-background flex flex-col md:flex-row h-dvh h-vdh">
            {/* Desktop Sidebar */}
            <OnboardingAside />

            {/* Mobile Header */}
            <MobileProgressHeader />

            {/* Main content area with animated step transitions */}
            <main
              className="w-full md:w-2/3 p-6 md:p-12 flex items-start justify-center relative overflow-y-auto overflow-x-hidden custom-scrollbar bg-background"
              style={{
                transformOrigin: "top",
              }}
            >
              <div className="w-full max-w-2xl">{children}</div>
            </main>
          </div>
        </div>
      </OnboardingProvider>
    </OnboardingDataProvider>
  );
}
