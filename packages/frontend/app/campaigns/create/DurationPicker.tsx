"use client";

import { useState, useCallback, useMemo, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/app/components/ui/calendar";
import { CalendarIcon } from "@/app/components/ui/icons";
import { DURATION_PRESETS, calculateEndDate, calculateDuration } from "./schemas";

// ============================================================================
// Types
// ============================================================================

interface DurationPickerProps {
  /** Current duration in days as string */
  value: string;
  /** Whether using custom duration */
  isCustom: boolean;
  /** Custom end date if using custom duration */
  customEndDate?: Date | null;
  /** Callback when duration changes */
  onValueChange: (value: string) => void;
  /** Callback when custom mode changes */
  onCustomChange: (isCustom: boolean) => void;
  /** Callback when custom end date changes */
  onEndDateChange: (date: Date | null) => void;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional class name for the container */
  className?: string;
}

// ============================================================================
// Duration Option Button
// ============================================================================

interface DurationOptionProps {
  days: number;
  isSelected: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function DurationOption({
  days,
  isSelected,
  isPopular,
  onSelect,
  disabled,
}: DurationOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "px-4 py-3 min-h-[44px] min-w-[70px]",
        "text-sm font-medium rounded-xl",
        "border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        isSelected
          ? "bg-primary text-white border-primary shadow-md"
          : "bg-surface-sunken text-foreground border-border-subtle hover:border-primary/50 hover:bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {isPopular && (
        <span
          className={cn(
            "absolute -top-2 left-1/2 -translate-x-1/2",
            "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            "rounded-full whitespace-nowrap",
            isSelected
              ? "bg-white text-primary"
              : "bg-primary text-white"
          )}
        >
          Most Popular
        </span>
      )}
      <span className="text-lg font-bold">{days}</span>
      <span className={cn("text-xs", isSelected ? "text-white/80" : "text-text-tertiary")}>
        days
      </span>
    </button>
  );
}

// ============================================================================
// Custom Duration Button
// ============================================================================

interface CustomDurationButtonProps {
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function CustomDurationButton({
  isSelected,
  onSelect,
  disabled,
}: CustomDurationButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      className={cn(
        "flex items-center justify-center gap-2",
        "px-4 py-3 min-h-[44px]",
        "text-sm font-medium rounded-xl",
        "border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        isSelected
          ? "bg-primary text-white border-primary shadow-md"
          : "bg-surface-sunken text-foreground border-border-subtle hover:border-primary/50 hover:bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <CalendarIcon size={16} />
      <span>Custom</span>
    </button>
  );
}

// ============================================================================
// Date Picker Popover
// ============================================================================

interface DatePickerPopoverProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  onClose: () => void;
  minDate: Date;
  maxDate: Date;
}

function DatePickerPopover({
  selectedDate,
  onSelect,
  onClose,
  minDate,
  maxDate,
}: DatePickerPopoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute left-0 right-0 sm:left-auto sm:right-auto top-full mt-2 z-50",
        "bg-surface-elevated border border-border-subtle rounded-xl",
        "shadow-xl p-4"
      )}
    >
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          onSelect(date);
          if (date) onClose();
        }}
        disabled={[
          { before: minDate },
          { after: maxDate },
        ]}
        defaultMonth={selectedDate || new Date()}
        captionLayout="dropdown"
        fromYear={new Date().getFullYear()}
        toYear={new Date().getFullYear() + 1}
      />
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DurationPicker({
  value,
  isCustom,
  customEndDate,
  onValueChange,
  onCustomChange,
  onEndDateChange,
  error,
  disabled,
  className,
}: DurationPickerProps) {
  const id = useId();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedDays = parseInt(value) || 30;

  // Calculate date boundaries
  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }, []);

  const maxDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 365);
    return date;
  }, []);

  // Calculate end date display
  const endDateDisplay = useMemo(() => {
    if (isCustom && customEndDate) {
      return customEndDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const endDate = calculateEndDate(selectedDays);
    return endDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [isCustom, customEndDate, selectedDays]);

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (days: number) => {
      onValueChange(days.toString());
      onCustomChange(false);
      onEndDateChange(null);
    },
    [onValueChange, onCustomChange, onEndDateChange]
  );

  // Handle custom button click
  const handleCustomClick = useCallback(() => {
    onCustomChange(true);
    setShowDatePicker(true);
    // Set default custom date to 30 days if not set
    if (!customEndDate) {
      onEndDateChange(calculateEndDate(30));
      onValueChange("30");
    }
  }, [onCustomChange, customEndDate, onEndDateChange, onValueChange]);

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onEndDateChange(date);
        const duration = calculateDuration(date);
        onValueChange(duration.toString());
      }
    },
    [onEndDateChange, onValueChange]
  );

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm sm:text-base text-foreground">
          Campaign Duration
          <span className="text-destructive ml-1">*</span>
        </label>
      </div>

      {/* Duration presets */}
      <div
        className="flex flex-wrap gap-3"
        role="radiogroup"
        aria-label="Campaign duration options"
      >
        {DURATION_PRESETS.map((days) => (
          <DurationOption
            key={days}
            days={days}
            isSelected={!isCustom && selectedDays === days}
            isPopular={days === 30}
            onSelect={() => handlePresetSelect(days)}
            disabled={disabled}
          />
        ))}

        <CustomDurationButton
          isSelected={isCustom}
          onSelect={handleCustomClick}
          disabled={disabled}
        />
      </div>

      {/* Custom date picker */}
      <div className="relative">
        <AnimatePresence>
          {isCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  disabled={disabled}
                  className={cn(
                    "flex items-center gap-3 w-full",
                    "px-4 py-3 min-h-[44px]",
                    "bg-surface-sunken rounded-xl",
                    "border transition-all duration-200",
                    "text-left",
                    showDatePicker
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-border-subtle hover:border-primary/30",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <CalendarIcon size={18} className="text-text-tertiary" />
                  <div className="flex-1">
                    <span className="text-xs text-text-tertiary block">End Date</span>
                    <span className="text-sm font-medium text-foreground">
                      {customEndDate
                        ? customEndDate.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select end date"}
                    </span>
                  </div>
                </button>

                {/* Date picker popover */}
                <AnimatePresence>
                  {showDatePicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDatePicker(false)}
                        aria-hidden="true"
                      />
                      <DatePickerPopover
                        selectedDate={customEndDate || undefined}
                        onSelect={handleDateSelect}
                        onClose={() => setShowDatePicker(false)}
                        minDate={minDate}
                        maxDate={maxDate}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End date display */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          "bg-primary/5 border border-primary/20 rounded-xl"
        )}
      >
        <CalendarIcon size={16} className="text-primary" />
        <span className="text-sm text-foreground">
          Campaign ends on <span className="font-medium">{endDateDisplay}</span>
        </span>
      </div>

      {/* Helpful hint */}
      <p className="text-xs text-text-tertiary flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 0C3.136 0 0 3.136 0 7C0 10.864 3.136 14 7 14C10.864 14 14 10.864 14 7C14 3.136 10.864 0 7 0ZM7.7 10.5H6.3V6.3H7.7V10.5ZM7.7 4.9H6.3V3.5H7.7V4.9Z"
            fill="currentColor"
          />
        </svg>
        <span>Campaigns with deadlines raise 30% more</span>
      </p>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
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

export default DurationPicker;
