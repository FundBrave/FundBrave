"use client";

import React, { useState } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion } from "motion/react";
import { z } from "zod";
import { LinkedInIcon, XIcon, InstagramIcon } from "@/app/components/ui/icons/SocialIcons";
import OnboardingNavButtons from "@/app/components/onboarding/OnboardingNavButtons";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";

// Validation schema
const socialSchema = z.object({
  linkedin: z
    .string()
    .url("Please enter a valid URL")
    .regex(/linkedin\.com/i, "Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  twitter: z
    .string()
    .url("Please enter a valid URL")
    .regex(/x\.com|twitter\.com/i, "Please enter a valid X/Twitter URL")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .url("Please enter a valid URL")
    .regex(/instagram\.com/i, "Please enter a valid Instagram URL")
    .optional()
    .or(z.literal("")),
});

type SocialFormData = z.infer<typeof socialSchema>;

interface SocialField {
  id: keyof SocialFormData;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}

const SOCIAL_FIELDS: SocialField[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/",
    icon: <LinkedInIcon className="w-5 h-5" />,
  },
  {
    id: "twitter",
    label: "X (formerly Twitter)",
    placeholder: "https://x.com/",
    icon: <XIcon className="w-5 h-5" />,
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/",
    icon: <InstagramIcon className="w-5 h-5" />,
  },
];

const SocialProfile: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const { updateSocial } = useOnboardingData();
  const [formData, setFormData] = useState<SocialFormData>({
    linkedin: "",
    twitter: "",
    instagram: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SocialFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof SocialFormData>>(
    new Set()
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof SocialFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (field: keyof SocialFormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));

    const value = formData[field];
    if (value && value.trim() !== "") {
      try {
        socialSchema.pick({ [field]: true }).parse({ [field]: value });
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [field]: error.issues[0]?.message,
          }));
        }
      }
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const fieldErrors: Partial<Record<keyof SocialFormData, string>> = {};
    let hasErrors = false;

    Object.entries(formData).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        try {
          socialSchema.pick({ [key]: true }).parse({ [key]: value });
        } catch (error) {
          if (error instanceof z.ZodError) {
            fieldErrors[key as keyof SocialFormData] = error.issues[0]?.message;
            hasErrors = true;
          }
        }
      }
    });

    if (hasErrors) {
      setErrors(fieldErrors);
      setTouchedFields(
        new Set(Object.keys(formData) as Array<keyof SocialFormData>)
      );
      return;
    }

    setIsLoading(true);

    // Save social profiles to context
    updateSocial({
      twitter: formData.twitter,
      instagram: formData.instagram,
      linkedin: formData.linkedin,
      github: "", // Not collected in this form
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[554px] px-4 overflow-y-auto scrollbar-hidden">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-foreground tracking-wide">
          Social Profiles
        </h2>
        <p className="text-muted-foreground text-lg">
          Share your socials with other users
        </p>
      </motion.div>

      {/* Form Fields */}
      <div className="flex flex-col gap-6 mb-10">
        {SOCIAL_FIELDS.map((field, index) => (
          <motion.div
            key={field.id}
            className="flex flex-col gap-3 w-full"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <label
              htmlFor={field.id}
              className="text-foreground text-lg font-medium tracking-wide"
            >
              {field.label}
            </label>
            <div
              className={`h-[60px] bg-surface-elevated rounded-xl px-6 py-4 flex items-center gap-3 border ${
                errors[field.id] && touchedFields.has(field.id)
                  ? "border-red-500"
                  : "border-border-default"
              } focus-within:border-purple-500 transition-colors`}
            >
              <span className="text-muted-foreground">{field.icon}</span>
              <input
                id={field.id}
                type="url"
                name={field.id}
                value={formData[field.id]}
                onChange={handleInputChange}
                onBlur={() => handleBlur(field.id)}
                placeholder={field.placeholder}
                className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-text-tertiary font-medium tracking-wide"
              />
            </div>
            {errors[field.id] && touchedFields.has(field.id) && (
              <motion.p
                className="text-red-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors[field.id]}
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <OnboardingNavButtons
        onBack={onBack}
        onNext={handleSubmit}
        isLoading={isLoading}
        animationDelay={0.5}
      />
    </div>
  );
};

export default SocialProfile;
