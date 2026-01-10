"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { BackHeader } from "@/app/components/common/BackHeader";
import SuccessCard from "@/app/components/ui/SuccessCard";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Sparkles,
  FileText,
  Clock,
  Eye,
} from "@/app/components/ui/icons";

// ============================================================================
// Types
// ============================================================================

interface CampaignFormData {
  // Step 1: Basics
  title: string;
  category: string;
  goalAmount: string;
  // Step 2: Story
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  // Step 3: Details
  duration: string;
  beneficiaryName: string;
  beneficiaryWallet: string;
  // Metadata
  acceptTerms: boolean;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// ============================================================================
// Constants
// ============================================================================

const STEPS: StepConfig[] = [
  { id: 1, title: "Basics", description: "Campaign title and goal", icon: Sparkles },
  { id: 2, title: "Story", description: "Tell your story", icon: FileText },
  { id: 3, title: "Details", description: "Duration and beneficiary", icon: Clock },
  { id: 4, title: "Preview", description: "Review before publish", icon: Eye },
];

const CATEGORIES = [
  "Education",
  "Medical",
  "Emergency",
  "Community",
  "Environment",
  "Technology",
  "Creative",
  "Sports",
  "Animals",
  "Other",
];

const DURATION_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

const INITIAL_FORM_DATA: CampaignFormData = {
  title: "",
  category: "",
  goalAmount: "",
  description: "",
  imageFile: null,
  imagePreview: null,
  duration: "30",
  beneficiaryName: "",
  beneficiaryWallet: "",
  acceptTerms: false,
};

// Animation variants
const stepVariants = {
  initial: { opacity: 0, x: 50, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -50, filter: "blur(4px)" },
};

const stepTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  opacity: { duration: 0.2 },
  filter: { duration: 0.25 },
};

// ============================================================================
// Sub-components
// ============================================================================

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop horizontal stepper */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && currentStep > step.id;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                  isCompleted && "bg-primary cursor-pointer hover:bg-primary-600",
                  isCurrent && "bg-brand-gradient shadow-lg shadow-primary/30",
                  !isCompleted && !isCurrent && "bg-surface-sunken border border-border-subtle",
                  isClickable && "cursor-pointer"
                )}
              >
                {isCompleted ? (
                  <Check size={20} className="text-white" />
                ) : (
                  <StepIcon
                    size={20}
                    className={cn(
                      isCurrent ? "text-white" : "text-text-tertiary"
                    )}
                  />
                )}
              </button>

              {/* Step info */}
              <div className="ml-3 hidden lg:block">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-text-secondary"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-text-tertiary">{step.description}</p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-surface-sunken relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={{ width: "0%" }}
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile progress bar */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-text-secondary">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-gradient rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  helpText?: string;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  required,
  maxLength,
  helpText,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm sm:text-base text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {maxLength && (
          <span
            className={cn(
              "text-xs",
              value.length > maxLength * 0.9
                ? "text-destructive"
                : "text-text-tertiary"
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "w-full bg-surface-sunken rounded-xl",
          "px-4 py-3 sm:px-5 sm:py-4",
          "text-sm sm:text-base text-foreground",
          "placeholder:text-text-tertiary",
          "outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-purple-500/50",
          "border border-transparent",
          error && "border-destructive ring-2 ring-destructive/30"
        )}
      />
      {helpText && !error && (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  required,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm sm:text-base text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-surface-sunken rounded-xl appearance-none cursor-pointer",
            "px-4 py-3 sm:px-5 sm:py-4 pr-10",
            "text-sm sm:text-base",
            value ? "text-foreground" : "text-text-tertiary",
            "outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-purple-500/50",
            "border border-transparent",
            error && "border-destructive ring-2 ring-destructive/30",
            "[&>option]:bg-surface-sunken [&>option]:text-foreground"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <ChevronRight
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-secondary pointer-events-none"
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  rows?: number;
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  maxLength,
  minLength,
  rows = 6,
}: TextAreaFieldProps) {
  const isBelowMin = minLength && value.length > 0 && value.length < minLength;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm sm:text-base text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {maxLength && (
          <span
            className={cn(
              "text-xs",
              value.length > maxLength * 0.9
                ? "text-destructive"
                : isBelowMin
                ? "text-yellow-500"
                : "text-text-tertiary"
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "w-full bg-surface-sunken rounded-xl resize-none",
          "px-4 py-3 sm:px-5 sm:py-4",
          "text-sm sm:text-base text-foreground leading-relaxed",
          "placeholder:text-text-tertiary",
          "outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-purple-500/50",
          "border border-transparent",
          error && "border-destructive ring-2 ring-destructive/30"
        )}
      />
      {minLength && (
        <p className="text-xs text-text-tertiary">
          Minimum {minLength} characters recommended
        </p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ImageUploadProps {
  imagePreview: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function ImageUpload({ imagePreview, onFileSelect, onRemove, error }: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm sm:text-base text-foreground">
        Campaign Image
      </label>
      <div
        className={cn(
          "relative w-full aspect-video rounded-xl overflow-hidden",
          "bg-surface-sunken border-2 border-dashed",
          "transition-all duration-200",
          error ? "border-destructive" : "border-border-subtle hover:border-purple-500/50"
        )}
      >
        {imagePreview ? (
          <div className="relative w-full h-full group">
            <img
              src={imagePreview}
              alt="Campaign preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={onRemove}
                className="px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
            <Upload size={32} className="text-text-tertiary mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">
              Click to upload an image
            </p>
            <p className="text-xs text-text-tertiary">
              PNG, JPG or WebP (max 5MB)
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Step Components
// ============================================================================

interface StepProps {
  formData: CampaignFormData;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>;
  errors: FormErrors;
}

function BasicsStep({ formData, setFormData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Campaign Basics
        </h2>
        <p className="text-text-secondary">
          Start with the essential details of your fundraising campaign.
        </p>
      </div>

      <InputField
        label="Campaign Title"
        value={formData.title}
        onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
        placeholder="e.g., Help Build a School in Ghana"
        error={errors.title}
        required
        maxLength={80}
        helpText="A clear, compelling title helps people understand your cause"
      />

      <SelectField
        label="Category"
        value={formData.category}
        onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        options={CATEGORIES}
        placeholder="Select a category"
        error={errors.category}
        required
      />

      <InputField
        label="Fundraising Goal (USD)"
        value={formData.goalAmount}
        onChange={(value) => {
          // Only allow numbers and decimals
          const sanitized = value.replace(/[^0-9.]/g, "");
          setFormData((prev) => ({ ...prev, goalAmount: sanitized }));
        }}
        placeholder="e.g., 10000"
        error={errors.goalAmount}
        required
        type="text"
        helpText="Set a realistic goal that covers your needs"
      />
    </div>
  );
}

function StoryStep({ formData, setFormData, errors }: StepProps) {
  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    },
    [setFormData]
  );

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
    }));
  }, [setFormData]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Tell Your Story
        </h2>
        <p className="text-text-secondary">
          Share why this campaign matters and how donations will make a difference.
        </p>
      </div>

      <ImageUpload
        imagePreview={formData.imagePreview}
        onFileSelect={handleFileSelect}
        onRemove={handleRemoveImage}
        error={errors.image}
      />

      <TextAreaField
        label="Campaign Description"
        value={formData.description}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
        placeholder="Tell potential donors about your cause, why you're fundraising, and how their contributions will be used..."
        error={errors.description}
        required
        maxLength={5000}
        minLength={100}
        rows={8}
      />
    </div>
  );
}

function DetailsStep({ formData, setFormData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Campaign Details
        </h2>
        <p className="text-text-secondary">
          Set the duration and beneficiary information for your campaign.
        </p>
      </div>

      <SelectField
        label="Campaign Duration"
        value={formData.duration}
        onChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
        options={DURATION_OPTIONS}
        error={errors.duration}
        required
      />

      <div className="p-4 bg-surface-sunken rounded-xl border border-border-subtle">
        <h3 className="font-medium text-foreground mb-3">Beneficiary Information</h3>
        <div className="space-y-4">
          <InputField
            label="Beneficiary Name"
            value={formData.beneficiaryName}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, beneficiaryName: value }))
            }
            placeholder="Name of person or organization receiving funds"
            error={errors.beneficiaryName}
            required
          />

          <InputField
            label="Wallet Address"
            value={formData.beneficiaryWallet}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, beneficiaryWallet: value }))
            }
            placeholder="0x..."
            error={errors.beneficiaryWallet}
            required
            helpText="The wallet address where funds will be sent"
          />
        </div>
      </div>

      {/* Terms acceptance */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acceptTerms: e.target.checked }))
          }
          className="mt-1 w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary-500/50"
        />
        <span className="text-sm text-text-secondary leading-relaxed">
          I confirm that the information provided is accurate and I agree to
          FundBrave&apos;s{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      <AnimatePresence>
        {errors.acceptTerms && (
          <motion.p
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {errors.acceptTerms}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewStep({ formData }: { formData: CampaignFormData }) {
  const goalFormatted = useMemo(() => {
    const amount = parseFloat(formData.goalAmount) || 0;
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    });
  }, [formData.goalAmount]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Preview Your Campaign
        </h2>
        <p className="text-text-secondary">
          Review your campaign before publishing. You can go back to edit any details.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-surface-sunken rounded-2xl overflow-hidden border border-border-subtle">
        {/* Image */}
        {formData.imagePreview ? (
          <div className="aspect-video w-full">
            <img
              src={formData.imagePreview}
              alt={formData.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-neutral-dark-400 flex items-center justify-center">
            <p className="text-text-tertiary">No image uploaded</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Category badge */}
          {formData.category && (
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {formData.category}
            </span>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground">
            {formData.title || "Campaign Title"}
          </h3>

          {/* Goal */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{goalFormatted}</span>
            <span className="text-text-secondary">goal</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock size={16} />
            <span>{formData.duration} days campaign</span>
          </div>

          {/* Description preview */}
          <div className="pt-4 border-t border-border-subtle">
            <h4 className="font-medium text-foreground mb-2">About this campaign</h4>
            <p className="text-text-secondary text-sm line-clamp-4">
              {formData.description || "No description provided."}
            </p>
          </div>

          {/* Beneficiary info */}
          <div className="pt-4 border-t border-border-subtle">
            <h4 className="font-medium text-foreground mb-2">Beneficiary</h4>
            <p className="text-text-secondary text-sm">
              {formData.beneficiaryName || "Not specified"}
            </p>
            {formData.beneficiaryWallet && (
              <p className="text-text-tertiary text-xs font-mono mt-1 truncate">
                {formData.beneficiaryWallet}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validate current step
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: FormErrors = {};

      switch (step) {
        case 1:
          if (!formData.title.trim()) {
            newErrors.title = "Campaign title is required";
          } else if (formData.title.length < 10) {
            newErrors.title = "Title must be at least 10 characters";
          }
          if (!formData.category) {
            newErrors.category = "Please select a category";
          }
          if (!formData.goalAmount) {
            newErrors.goalAmount = "Goal amount is required";
          } else {
            const amount = parseFloat(formData.goalAmount);
            if (isNaN(amount) || amount <= 0) {
              newErrors.goalAmount = "Please enter a valid amount";
            } else if (amount < 100) {
              newErrors.goalAmount = "Minimum goal is $100";
            }
          }
          break;

        case 2:
          if (!formData.description.trim()) {
            newErrors.description = "Campaign description is required";
          } else if (formData.description.length < 100) {
            newErrors.description = "Description must be at least 100 characters";
          }
          break;

        case 3:
          if (!formData.duration) {
            newErrors.duration = "Please select a campaign duration";
          }
          if (!formData.beneficiaryName.trim()) {
            newErrors.beneficiaryName = "Beneficiary name is required";
          }
          if (!formData.beneficiaryWallet.trim()) {
            newErrors.beneficiaryWallet = "Wallet address is required";
          } else if (!formData.beneficiaryWallet.startsWith("0x")) {
            newErrors.beneficiaryWallet = "Please enter a valid wallet address";
          }
          if (!formData.acceptTerms) {
            newErrors.acceptTerms = "You must accept the terms to continue";
          }
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  }, [currentStep, validateStep]);

  // Handle previous step
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  }, [currentStep]);

  // Handle step click (for going back)
  const handleStepClick = useCallback(
    (step: number) => {
      if (step < currentStep) {
        setCurrentStep(step);
        setErrors({});
      }
    },
    [currentStep]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowSuccess(true);
  }, [currentStep, validateStep]);

  // Render current step content
  const renderStepContent = () => {
    const stepProps = { formData, setFormData, errors };

    switch (currentStep) {
      case 1:
        return <BasicsStep {...stepProps} />;
      case 2:
        return <StoryStep {...stepProps} />;
      case 3:
        return <DetailsStep {...stepProps} />;
      case 4:
        return <PreviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackHeader
        title="Create Campaign"
        subtitle="Start your fundraising journey"
        fallbackHref="/campaigns"
      />

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SuccessCard
              title="Campaign Created!"
              message={`Your campaign "${formData.title}" has been successfully created and is now live. Share it with your network to start receiving donations!`}
              buttonText="View Campaign"
              onButtonClick={() => router.push("/campaigns")}
              showAnimation={true}
            />
          </motion.div>
        </div>
      )}

      <div className="flex items-start justify-center py-6 sm:py-10 px-4">
        <div className="w-full max-w-3xl">
          {/* Step indicator */}
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />

          {/* Step content */}
          <div className="bg-background border border-border-subtle rounded-2xl p-6 sm:p-8 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={stepTransition}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border-subtle">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={cn(
                  "w-full sm:w-auto",
                  currentStep === 1 && "opacity-0 pointer-events-none"
                )}
              >
                <ChevronLeft size={18} />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="w-full sm:w-auto"
                >
                  Continue
                  <ChevronRight size={18} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  loadingText="Publishing..."
                  className="w-full sm:w-auto"
                >
                  Publish Campaign
                  <Sparkles size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
