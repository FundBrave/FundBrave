"use client";

import { useCallback, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { User, Users, Building2 } from "@/app/components/ui/icons";
import { BENEFICIARY_TYPES, RELATIONSHIP_OPTIONS, type BeneficiaryType } from "./schemas";

// ============================================================================
// Types
// ============================================================================

interface BeneficiarySectionProps {
  /** Current beneficiary type */
  type: BeneficiaryType;
  /** Beneficiary name (for individual/organization) */
  name: string;
  /** Relationship to beneficiary (for individual) */
  relationship: string;
  /** Tax ID/EIN (for organization) */
  taxId: string;
  /** Callbacks */
  onTypeChange: (type: BeneficiaryType) => void;
  onNameChange: (name: string) => void;
  onRelationshipChange: (relationship: string) => void;
  onTaxIdChange: (taxId: string) => void;
  /** Errors */
  errors?: {
    type?: string;
    name?: string;
    relationship?: string;
    taxId?: string;
  };
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
}

// ============================================================================
// Type Card Component
// ============================================================================

interface TypeCardProps {
  type: BeneficiaryType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function TypeCard({
  type,
  title,
  description,
  icon,
  isSelected,
  onSelect,
  disabled,
}: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      className={cn(
        "flex flex-col items-center text-center gap-3",
        "p-4 sm:p-5 min-h-[120px]",
        "rounded-xl border-2 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        isSelected
          ? "bg-primary/10 border-primary shadow-md"
          : "bg-surface-sunken border-border-subtle hover:border-primary/30 hover:bg-surface-sunken/80",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full",
          isSelected ? "bg-primary text-white" : "bg-surface-elevated text-text-secondary"
        )}
      >
        {icon}
      </div>
      <div>
        <p className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>
          {title}
        </p>
        <p className="text-xs text-text-tertiary mt-1">{description}</p>
      </div>
    </button>
  );
}

// ============================================================================
// Input Field Component (simplified inline version)
// ============================================================================

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  helpText?: string;
  pattern?: string;
  inputMode?: "text" | "numeric";
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  maxLength,
  helpText,
  pattern,
  inputMode = "text",
}: InputFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-sm text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        pattern={pattern}
        aria-invalid={Boolean(error)}
        aria-describedby={`${helpText ? helpId : ""}${error ? ` ${errorId}` : ""}`}
        className={cn(
          "w-full bg-surface-sunken rounded-xl",
          "px-4 py-3 min-h-[44px]",
          "text-sm text-foreground",
          "placeholder:text-text-tertiary",
          "outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-primary/50",
          "border",
          error ? "border-destructive ring-2 ring-destructive/30" : "border-transparent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {helpText && !error && (
        <p id={helpId} className="text-xs text-text-tertiary">
          {helpText}
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
// Select Field Component
// ============================================================================

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  required,
  disabled,
}: SelectFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-sm text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full bg-surface-sunken rounded-xl appearance-none cursor-pointer",
            "px-4 py-3 pr-10 min-h-[44px]",
            "text-sm",
            value ? "text-foreground" : "text-text-tertiary",
            "outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-primary/50",
            "border",
            error ? "border-destructive ring-2 ring-destructive/30" : "border-transparent",
            "[&>option]:bg-surface-sunken [&>option]:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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

// ============================================================================
// Tax ID Input with formatting
// ============================================================================

interface TaxIdInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function TaxIdInput({ id, value, onChange, error, disabled }: TaxIdInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value.replace(/[^0-9-]/g, "");

      // Auto-format: add hyphen after 2 digits
      if (newValue.length === 2 && !newValue.includes("-") && value.length < newValue.length) {
        newValue = `${newValue}-`;
      }

      // Limit to XX-XXXXXXX format (10 chars including hyphen)
      if (newValue.length <= 10) {
        onChange(newValue);
      }
    },
    [onChange, value]
  );

  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-sm text-foreground">
        Tax ID / EIN
        <span className="text-text-tertiary ml-1 font-normal">(Optional)</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        placeholder="XX-XXXXXXX"
        disabled={disabled}
        maxLength={10}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full bg-surface-sunken rounded-xl",
          "px-4 py-3 min-h-[44px]",
          "text-sm text-foreground font-mono",
          "placeholder:text-text-tertiary placeholder:font-sans",
          "outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-primary/50",
          "border",
          error ? "border-destructive ring-2 ring-destructive/30" : "border-transparent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <p className="text-xs text-text-tertiary">
        Providing a Tax ID helps donors with tax deductions
      </p>
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
// Main Component
// ============================================================================

export function BeneficiarySection({
  type,
  name,
  relationship,
  taxId,
  onTypeChange,
  onNameChange,
  onRelationshipChange,
  onTaxIdChange,
  errors = {},
  disabled,
  className,
}: BeneficiarySectionProps) {
  const id = useId();

  const typeConfigs: Record<
    BeneficiaryType,
    { title: string; description: string; icon: React.ReactNode }
  > = {
    self: {
      title: "Myself",
      description: "I am raising funds for myself",
      icon: <User size={24} />,
    },
    individual: {
      title: "Individual",
      description: "I am raising funds for someone else",
      icon: <Users size={24} />,
    },
    organization: {
      title: "Organization",
      description: "I am raising funds for a nonprofit or business",
      icon: <Building2 size={24} />,
    },
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Section header */}
      <div>
        <h3 className="font-medium text-foreground">Who will receive the funds?</h3>
        <p className="text-sm text-text-tertiary mt-1">
          Select who this campaign is raising funds for
        </p>
      </div>

      {/* Type selector cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Beneficiary type"
      >
        {BENEFICIARY_TYPES.map((beneficiaryType) => {
          const config = typeConfigs[beneficiaryType];
          return (
            <TypeCard
              key={beneficiaryType}
              type={beneficiaryType}
              title={config.title}
              description={config.description}
              icon={config.icon}
              isSelected={type === beneficiaryType}
              onSelect={() => onTypeChange(beneficiaryType)}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Error for type selection */}
      <AnimatePresence>
        {errors.type && (
          <motion.p
            role="alert"
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {errors.type}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Conditional fields based on type */}
      <AnimatePresence mode="wait">
        {type === "individual" && (
          <motion.div
            key="individual-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-4 bg-surface-sunken rounded-xl border border-border-subtle">
              <InputField
                id={`${id}-name`}
                label="Beneficiary Name"
                value={name}
                onChange={onNameChange}
                placeholder="Enter the person's name"
                error={errors.name}
                required
                disabled={disabled}
                maxLength={100}
              />
              <SelectField
                id={`${id}-relationship`}
                label="Your Relationship"
                value={relationship}
                onChange={onRelationshipChange}
                options={RELATIONSHIP_OPTIONS}
                placeholder="Select relationship"
                error={errors.relationship}
                required
                disabled={disabled}
              />
            </div>
          </motion.div>
        )}

        {type === "organization" && (
          <motion.div
            key="organization-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-4 bg-surface-sunken rounded-xl border border-border-subtle">
              <InputField
                id={`${id}-org-name`}
                label="Organization Name"
                value={name}
                onChange={onNameChange}
                placeholder="Enter organization name"
                error={errors.name}
                required
                disabled={disabled}
                maxLength={100}
              />
              <TaxIdInput
                id={`${id}-tax-id`}
                value={taxId}
                onChange={onTaxIdChange}
                error={errors.taxId}
                disabled={disabled}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BeneficiarySection;
