"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

// Types for onboarding data
export interface ProfileData {
  username: string;
  fullName: string;
  email: string;
  birthdate: string;
  bio: string;
  avatar: string;
}

export interface SocialData {
  twitter: string;
  instagram: string;
  linkedin: string;
  github: string;
}

export interface OnboardingData {
  email: string; // Email from signup
  profile: ProfileData;
  social: SocialData;
  goals: string[];
  isComplete: boolean;
}

interface OnboardingDataContextValue {
  data: OnboardingData;
  updateEmail: (email: string) => void;
  updateProfile: (profile: Partial<ProfileData>) => void;
  updateSocial: (social: Partial<SocialData>) => void;
  updateGoals: (goals: string[]) => void;
  markComplete: () => void;
  resetData: () => void;
}

const initialData: OnboardingData = {
  email: "",
  profile: {
    username: "",
    fullName: "",
    email: "",
    birthdate: "",
    bio: "",
    avatar: "",
  },
  social: {
    twitter: "",
    instagram: "",
    linkedin: "",
    github: "",
  },
  goals: [],
  isComplete: false,
};

const OnboardingDataContext = createContext<
  OnboardingDataContextValue | undefined
>(undefined);

interface OnboardingDataProviderProps {
  children: ReactNode;
}

export const OnboardingDataProvider = ({
  children,
}: OnboardingDataProviderProps) => {
  const [data, setData] = useState<OnboardingData>(() => {
    // Try to restore from localStorage on initial load
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("onboarding_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return initialData;
        }
      }
    }
    return initialData;
  });

  // Persist to localStorage whenever data changes
  const persistData = useCallback((newData: OnboardingData) => {
    setData(newData);
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_data", JSON.stringify(newData));
    }
  }, []);

  const updateEmail = useCallback(
    (email: string) => {
      persistData({ ...data, email, profile: { ...data.profile, email } });
    },
    [data, persistData]
  );

  const updateProfile = useCallback(
    (profile: Partial<ProfileData>) => {
      persistData({ ...data, profile: { ...data.profile, ...profile } });
    },
    [data, persistData]
  );

  const updateSocial = useCallback(
    (social: Partial<SocialData>) => {
      persistData({ ...data, social: { ...data.social, ...social } });
    },
    [data, persistData]
  );

  const updateGoals = useCallback(
    (goals: string[]) => {
      persistData({ ...data, goals });
    },
    [data, persistData]
  );

  const markComplete = useCallback(() => {
    const newData = { ...data, isComplete: true };
    persistData(newData);
    // Clean up localStorage after completion
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_data");
    }
  }, [data, persistData]);

  const resetData = useCallback(() => {
    persistData(initialData);
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_data");
    }
  }, [persistData]);

  const value = useMemo<OnboardingDataContextValue>(
    () => ({
      data,
      updateEmail,
      updateProfile,
      updateSocial,
      updateGoals,
      markComplete,
      resetData,
    }),
    [data, updateEmail, updateProfile, updateSocial, updateGoals, markComplete, resetData]
  );

  return (
    <OnboardingDataContext.Provider value={value}>
      {children}
    </OnboardingDataContext.Provider>
  );
};

export const useOnboardingData = (): OnboardingDataContextValue => {
  const context = useContext(OnboardingDataContext);
  if (!context) {
    throw new Error(
      "useOnboardingData must be used within an OnboardingDataProvider"
    );
  }
  return context;
};
