"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      onClear,
      placeholder = "Search campaigns...",
      className,
      autoFocus = false,
      onKeyDown,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Use controlled value if provided, otherwise use internal state
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setInternalValue("");
      }
      onChange?.("");
      onClear?.();
      inputRef.current?.focus();
    };

    return (
      <div className={cn("relative flex items-center", className)}>
        {/* Search Icon */}
        <Search className="absolute left-4 w-5 h-5 text-text-secondary pointer-events-none" />

        {/* Input */}
        <input
          ref={ref || inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full h-12 pl-12 pr-12",
            "bg-background-secondary border border-border-default rounded-lg",
            "text-foreground placeholder:text-text-secondary",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "transition-all duration-200"
          )}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-3",
              "w-11 h-11 min-h-[44px] min-w-[44px] rounded-full",
              "flex items-center justify-center",
              "text-text-secondary hover:text-foreground",
              "hover:bg-muted active:scale-[0.95]",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
