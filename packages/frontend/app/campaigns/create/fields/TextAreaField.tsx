"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

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

export function TextAreaField({
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
          "focus:ring-2 focus:ring-primary/50",
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
