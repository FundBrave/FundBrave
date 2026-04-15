"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "@/app/components/ui/icons";

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

export function SelectField({
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
            "focus:ring-2 focus:ring-primary/50",
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
