"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "@/app/components/ui/icons";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  /** Start of the year dropdown range (defaults to 100 years ago) */
  startMonth?: Date;
  /** End of the year dropdown range (defaults to current date) */
  endMonth?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  minDate,
  maxDate,
  startMonth = new Date(new Date().getFullYear() - 100, 0),
  endMonth = new Date(),
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-[60px] bg-neutral-dark-400 rounded-xl px-6 py-4 flex items-center gap-3 border border-transparent",
          "focus:border-purple-500 focus:outline-none transition-colors text-left",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-purple-500"
        )}
      >
        <CalendarIcon className="w-6 h-6 text-muted-foreground shrink-0" />
        <span
          className={cn(
            "flex-1 text-base font-medium tracking-wide",
            value ? "text-white" : "text-muted-foreground"
          )}
        >
          {value ? format(value, "MMMM d, yyyy") : placeholder}
        </span>
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-neutral-dark-400 border border-purple-900/50 rounded-xl shadow-2xl shadow-purple-900/20 animate-in fade-in-0 zoom-in-95">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            defaultMonth={value || endMonth}
          />
        </div>
      )}
    </div>
  );
}
