"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { BackHeader } from "@/app/components/common/BackHeader";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Sparkles,
  FileText,
  Clock,
  Eye,
  Loader2,
} from "@/app/components/ui/icons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { useCreateCampaign } from "@/app/hooks/useCreateCampaign";
import { useAccount } from "wagmi";
import { type Address } from "viem";
import { uploadApi } from "@/lib/api/upload";
import { USDC_DECIMALS } from "@/app/lib/contracts/config";

// New enhanced components
import { GoalAmountInput } from "./GoalAmountInput";
import { DurationPicker } from "./DurationPicker";
import { BeneficiarySection } from "./BeneficiarySection";
import { ImageUploadWithVerification, type VerificationResult } from "./ImageUploadWithVerification";
import { CampaignPreviewCard } from "./CampaignPreviewCard";
import { SuccessModal } from "./SuccessModal";
import { WalletAddressInput } from "@/app/components/ui/form/WalletAddressInput";
import {
  type Currency,
  type BeneficiaryType,
  CAMPAIGN_CATEGORIES,
  validateStep as schemaValidateStep,
} from "./schemas";

// ============================================================================
// Types
// ============================================================================

interface CampaignFormData {
  // Step 1: Basics
  title: string;
  category: string;
  goalAmount: string;
  currency: Currency;
  // Step 2: Story
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  imageVerificationResult: VerificationResult | null;
  videoUrl: string;
  // Step 3: Details
  duration: string;
  isCustomDuration: boolean;
  customEndDate: Date | null;
  beneficiaryType: BeneficiaryType;
  beneficiaryName: string;
  beneficiaryRelationship: string;
  organizationTaxId: string;
  beneficiaryWallet: string;
  showDonorNames: boolean;
  showDonationAmounts: boolean;
  allowAnonymousDonations: boolean;
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

const INITIAL_FORM_DATA: CampaignFormData = {
  title: "",
  category: "",
  goalAmount: "",
  currency: "USD",
  description: "",
  imageFile: null,
  imagePreview: null,
  imageVerificationResult: null,
  videoUrl: "",
  duration: "30",
  isCustomDuration: false,
  customEndDate: null,
  beneficiaryType: "self",
  beneficiaryName: "",
  beneficiaryRelationship: "",
  organizationTaxId: "",
  beneficiaryWallet: "",
  showDonorNames: true,
  showDonationAmounts: true,
  allowAnonymousDonations: true,
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

// Reduced motion variants
const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const reducedMotionTransition = {
  duration: 0,
};

// ============================================================================
// Step Indicator Component (Enhanced with a11y)
// ============================================================================

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  // Announce step changes to screen readers
  useEffect(() => {
    if (announcerRef.current) {
      const currentStepData = steps[currentStep - 1];
      announcerRef.current.textContent = `Step ${currentStep} of ${steps.length}: ${currentStepData?.title}. ${currentStepData?.description}`;
    }
  }, [currentStep, steps]);

  return (
    <div className="w-full">
      {/* Screen reader announcement */}
      <div
        ref={announcerRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Desktop horizontal stepper */}
      <nav
        aria-label="Campaign creation progress"
        className="hidden md:block mb-8"
      >
        <ol
          className="flex items-center justify-between"
          role="list"
        >
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = onStepClick && currentStep > step.id;
            const StepIcon = step.icon;

            return (
              <li key={step.id} className="flex items-center flex-1">
                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.title}: ${step.description}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-background",
                    isCompleted && "bg-primary cursor-pointer hover:bg-primary-600",
                    isCurrent && "bg-brand-gradient shadow-lg shadow-primary/30",
                    !isCompleted && !isCurrent && "bg-surface-sunken border border-border-subtle",
                    isClickable && "cursor-pointer"
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} className="text-white" aria-hidden="true" />
                  ) : (
                    <StepIcon
                      size={20}
                      className={cn(
                        isCurrent ? "text-white" : "text-text-tertiary"
                      )}
                      aria-hidden="true"
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
                  <div
                    className="flex-1 mx-4 h-0.5 bg-surface-sunken relative overflow-hidden"
                    aria-hidden="true"
                  >
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
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile progress bar */}
      <div className="md:hidden mb-6" role="group" aria-label="Campaign creation progress">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-text-secondary">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div
          className="h-2 bg-surface-sunken rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Step ${currentStep} of ${steps.length}`}
        >
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

// ============================================================================
// Input Field Components
// ============================================================================

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
  id?: string;
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
  id,
}: InputFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="font-medium text-sm sm:text-base text-foreground">
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
        {maxLength && (
          <span
            className={cn(
              "text-xs",
              value.length > maxLength * 0.9
                ? "text-destructive"
                : "text-text-tertiary"
            )}
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={`${helpText ? helpId : ""}${error ? ` ${errorId}` : ""}`}
        aria-required={required}
        className={cn(
          "w-full bg-surface-sunken rounded-xl",
          "px-4 py-3 sm:px-5 sm:py-4 min-h-[44px]",
          "text-sm sm:text-base text-foreground",
          "placeholder:text-text-tertiary",
          "outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-purple-500/50",
          "border border-transparent",
          error && "border-destructive ring-2 ring-destructive/30"
        )}
      />
      {helpText && !error && (
        <p id={helpId} className="text-xs text-text-tertiary">{helpText}</p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
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
  options: readonly string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  id?: string;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  required,
  id,
}: SelectFieldProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="font-medium text-sm sm:text-base text-foreground">
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          aria-required={required}
          className={cn(
            "w-full bg-surface-sunken rounded-xl appearance-none cursor-pointer",
            "px-4 py-3 sm:px-5 sm:py-4 pr-10 min-h-[44px]",
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
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronRight
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-secondary pointer-events-none"
          aria-hidden="true"
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
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
  id?: string;
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
  id,
}: TextAreaFieldProps) {
  const isBelowMin = minLength && value.length > 0 && value.length < minLength;
  const textareaId = id || label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={textareaId} className="font-medium text-sm sm:text-base text-foreground">
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
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
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        aria-required={required}
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
            id={errorId}
            role="alert"
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
        id="campaign-title"
      />

      <SelectField
        label="Category"
        value={formData.category}
        onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        options={CAMPAIGN_CATEGORIES}
        placeholder="Select a category"
        error={errors.category}
        required
        id="campaign-category"
      />

      <GoalAmountInput
        value={formData.goalAmount}
        currency={formData.currency}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, goalAmount: value }))}
        onCurrencyChange={(currency) => setFormData((prev) => ({ ...prev, currency }))}
        error={errors.goalAmount}
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
          imageVerificationResult: null, // Reset verification when new image is selected
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
      imageVerificationResult: null,
    }));
  }, [setFormData]);

  const handleVerificationComplete = useCallback(
    (result: VerificationResult) => {
      setFormData((prev) => ({
        ...prev,
        imageVerificationResult: result,
      }));
    },
    [setFormData]
  );

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

      <ImageUploadWithVerification
        image={
          formData.imagePreview
            ? { file: formData.imageFile, preview: formData.imagePreview }
            : null
        }
        onFileSelect={handleFileSelect}
        onRemove={handleRemoveImage}
        onVerificationComplete={handleVerificationComplete}
        campaignName={formData.title}
        campaignDescription={formData.description}
        blockSuspicious={true}
        verificationRequired={true}
        isVerifiedUser={false}
        error={errors.image}
      />

      <TextAreaField
        label="Campaign Description"
        value={formData.description}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
        placeholder="Tell potential donors about your cause, why you're fundraising, and how their contributions will be used..."
        error={errors.description}
        required
        maxLength={10000}
        minLength={100}
        rows={8}
        id="campaign-description"
      />

      <InputField
        label="Video URL"
        value={formData.videoUrl}
        onChange={(value) => setFormData((prev) => ({ ...prev, videoUrl: value }))}
        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
        error={errors.videoUrl}
        helpText="Add a YouTube or Vimeo video to help tell your story (optional)"
        id="campaign-video"
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

      <DurationPicker
        value={formData.duration}
        isCustom={formData.isCustomDuration}
        customEndDate={formData.customEndDate}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
        onCustomChange={(isCustom) => setFormData((prev) => ({ ...prev, isCustomDuration: isCustom }))}
        onEndDateChange={(date) => setFormData((prev) => ({ ...prev, customEndDate: date }))}
        error={errors.duration}
      />

      <div className="p-4 sm:p-6 bg-surface-sunken rounded-xl border border-border-subtle">
        <BeneficiarySection
          type={formData.beneficiaryType}
          name={formData.beneficiaryName}
          relationship={formData.beneficiaryRelationship}
          taxId={formData.organizationTaxId}
          onTypeChange={(type) => setFormData((prev) => ({ ...prev, beneficiaryType: type }))}
          onNameChange={(name) => setFormData((prev) => ({ ...prev, beneficiaryName: name }))}
          onRelationshipChange={(rel) => setFormData((prev) => ({ ...prev, beneficiaryRelationship: rel }))}
          onTaxIdChange={(taxId) => setFormData((prev) => ({ ...prev, organizationTaxId: taxId }))}
          errors={{
            name: errors.beneficiaryName,
            relationship: errors.beneficiaryRelationship,
            taxId: errors.organizationTaxId,
          }}
        />
      </div>

      <WalletAddressInput
        value={formData.beneficiaryWallet}
        onChange={(value) => setFormData((prev) => ({ ...prev, beneficiaryWallet: value }))}
        error={errors.beneficiaryWallet}
        label="Receiving Wallet Address"
        required
      />

      {/* Privacy toggles */}
      <div className="p-4 bg-surface-sunken rounded-xl border border-border-subtle space-y-4">
        <h3 className="font-medium text-foreground text-sm">Privacy Settings</h3>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-text-secondary">Show donor names publicly</span>
          <input
            type="checkbox"
            checked={formData.showDonorNames}
            onChange={(e) => setFormData((prev) => ({ ...prev, showDonorNames: e.target.checked }))}
            className="w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary-500/50"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-text-secondary">Show donation amounts publicly</span>
          <input
            type="checkbox"
            checked={formData.showDonationAmounts}
            onChange={(e) => setFormData((prev) => ({ ...prev, showDonationAmounts: e.target.checked }))}
            className="w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary-500/50"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-text-secondary">Allow anonymous donations</span>
          <input
            type="checkbox"
            checked={formData.allowAnonymousDonations}
            onChange={(e) => setFormData((prev) => ({ ...prev, allowAnonymousDonations: e.target.checked }))}
            className="w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary-500/50"
          />
        </label>
      </div>

      {/* Terms acceptance */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acceptTerms: e.target.checked }))
          }
          aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
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
            id="terms-error"
            role="alert"
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

function PreviewStep({
  formData,
  onEdit,
}: {
  formData: CampaignFormData;
  onEdit: (step: number) => void;
}) {
  return (
    <CampaignPreviewCard
      data={{
        title: formData.title,
        category: formData.category,
        goalAmount: formData.goalAmount,
        currency: formData.currency,
        description: formData.description,
        imagePreview: formData.imagePreview,
        duration: formData.duration,
        beneficiaryType: formData.beneficiaryType,
        beneficiaryName: formData.beneficiaryName,
        beneficiaryWallet: formData.beneficiaryWallet,
      }}
      onEdit={onEdit}
    />
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CreateCampaignPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Campaign creation hook (on-chain + backend)
  const {
    createCampaign,
    reset: resetCreateCampaign,
    step: createStep,
    error: createError,
    txHash,
    onChainId,
    campaignId,
    isProcessing,
  } = useCreateCampaign();

  // Watch for successful creation
  useEffect(() => {
    if (createStep === 'success' && campaignId) {
      setCreatedCampaignId(campaignId);
      setIsSubmitting(false);
      setShowSuccess(true);
    }
  }, [createStep, campaignId]);

  // Watch for errors
  useEffect(() => {
    if (createStep === 'error' && createError) {
      setSubmitError(createError);
      setIsSubmitting(false);
    }
  }, [createStep, createError]);

  // Get animation variants based on motion preference
  const animationVariants = prefersReducedMotion ? reducedMotionVariants : stepVariants;
  const animationTransition = prefersReducedMotion ? reducedMotionTransition : stepTransition;

  // Validate current step
  const validateStepForm = useCallback(
    (step: number): boolean => {
      const result = schemaValidateStep(step, formData);

      if (!result.success) {
        setErrors(result.errors);
        return false;
      }

      setErrors({});
      return true;
    },
    [formData]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateStepForm(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  }, [currentStep, validateStepForm]);

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

  // Handle edit from preview
  const handleEditFromPreview = useCallback((step: number) => {
    setCurrentStep(step);
    setErrors({});
  }, []);

  // Handle form submission — real on-chain + backend flow
  const handleSubmit = useCallback(async () => {
    if (!isConnected || !address) {
      setSubmitError("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Upload image if provided
      let imageUrl = "";
      if (formData.imageFile) {
        try {
          const uploadResult = await uploadApi.uploadPostMedia(formData.imageFile);
          imageUrl = uploadResult.url;
        } catch (uploadErr) {
          // Image upload is optional — proceed without it
          console.warn("Image upload failed, proceeding without image:", uploadErr);
        }
      }

      // Step 2: Prepare data for smart contract
      const goalInUSDC = BigInt(
        Math.round(parseFloat(formData.goalAmount) * Math.pow(10, USDC_DECIMALS))
      );

      const beneficiaryAddress: Address =
        formData.beneficiaryType === "self"
          ? address
          : (formData.beneficiaryWallet as Address) || address;

      const durationDays = parseInt(formData.duration, 10) || 30;

      // Step 3: Call smart contract + save to backend (handled by useCreateCampaign)
      await createCampaign({
        title: formData.title,
        description: formData.description,
        goal: goalInUSDC,
        duration: durationDays,
        category: formData.category,
        imageUrl: imageUrl || undefined,
        images: imageUrl ? [imageUrl] : [],
        categories: [formData.category],
        region: "",
        beneficiary: beneficiaryAddress,
      });

      // The rest is handled by useEffect watching createStep
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create campaign";
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      console.error("Failed to create campaign:", error);
    }
  }, [formData, address, isConnected, createCampaign]);

  // Handle success modal actions
  const handleViewCampaign = useCallback(() => {
    router.push(`/campaigns/${createdCampaignId || ""}`);
  }, [router, createdCampaignId]);

  const handleCreateAnother = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);
    setShowSuccess(false);
    setCreatedCampaignId(undefined);
    setSubmitError(null);
    resetCreateCampaign();
  }, [resetCreateCampaign]);

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
        return <PreviewStep formData={formData} onEdit={handleEditFromPreview} />;
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

      {/* Success modal */}
      <SuccessModal
        isOpen={showSuccess}
        campaignTitle={formData.title}
        campaignId={createdCampaignId}
        onViewCampaign={handleViewCampaign}
        onCreateAnother={handleCreateAnother}
        onClose={() => setShowSuccess(false)}
      />

      <main className="flex items-start justify-center py-6 sm:py-10 px-4">
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
                variants={animationVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={animationTransition}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Transaction progress feedback */}
            {isSubmitting && currentStep === STEPS.length && (
              <div className="mt-6 p-4 bg-surface-sunken rounded-xl border border-border-subtle">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {createStep === 'uploading' && 'Uploading image...'}
                      {createStep === 'confirming_wallet' && 'Confirm transaction in your wallet...'}
                      {createStep === 'mining' && 'Transaction submitted, waiting for confirmation...'}
                      {createStep === 'saving_backend' && 'Saving campaign data...'}
                      {createStep === 'idle' && 'Preparing...'}
                    </p>
                    {txHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-400 hover:text-primary-300 mt-1 inline-block"
                      >
                        View on BaseScan
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{submitError}</p>
                <button
                  onClick={() => { setSubmitError(null); resetCreateCampaign(); }}
                  className="text-xs text-red-300 hover:text-red-200 mt-2 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Wallet not connected warning */}
            {currentStep === STEPS.length && !isConnected && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-sm text-yellow-400">
                  Please connect your wallet to publish this campaign on-chain.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border-subtle">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className={cn(
                  "w-full sm:w-auto min-h-[44px]",
                  currentStep === 1 && "opacity-0 pointer-events-none"
                )}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Continue
                  <ChevronRight size={18} aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isConnected}
                  loading={isSubmitting}
                  loadingText={
                    createStep === 'confirming_wallet' ? 'Confirm in Wallet...' :
                    createStep === 'mining' ? 'Mining...' :
                    createStep === 'saving_backend' ? 'Saving...' :
                    'Publishing...'
                  }
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Publish Campaign
                  <Sparkles size={18} aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
