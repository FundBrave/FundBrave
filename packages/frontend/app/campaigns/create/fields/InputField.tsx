"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

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

export function InputField({
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
        aria-describedby={
          [helpText ? helpId : null, error ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-required={required}
        className={cn(
          "w-full bg-surface-sunken rounded-xl",
          "px-4 py-3 sm:px-5 sm:py-4 min-h-[44px]",
          "text-sm sm:text-base text-foreground",
          "placeholder:text-text-tertiary",
          "outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-primary/50",
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
