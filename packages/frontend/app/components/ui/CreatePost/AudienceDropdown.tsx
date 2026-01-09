"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { Globe, Check, ChevronDown } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import type { AudienceDropdownProps, AudienceType } from "../types/CreatePost.types";

const AudienceDropdown: React.FC<AudienceDropdownProps> = ({
  selectedAudience,
  onAudienceChange,
  options,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  // Get the label for the selected audience
  const selectedLabel = options.find((opt) => opt.id === selectedAudience)?.label || "Everyone";

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // GSAP animations for dropdown menu
  useEffect(() => {
    if (menuRef.current) {
      if (isOpen) {
        gsap.fromTo(
          menuRef.current,
          { opacity: 0, y: -8, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
        );
      }
    }
  }, [isOpen]);

  // GSAP animation for chevron rotation
  useEffect(() => {
    if (chevronRef.current) {
      gsap.to(chevronRef.current, {
        rotation: isOpen ? 180 : 0,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, [isOpen]);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      if (menuRef.current) gsap.killTweensOf(menuRef.current);
      if (chevronRef.current) gsap.killTweensOf(chevronRef.current);
    };
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (audience: AudienceType) => {
      onAudienceChange(audience);
      setIsOpen(false);
    },
    [onAudienceChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger Button - Twitter style pill */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Audience: ${selectedLabel}`}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5",
          "rounded-full border border-purple-500/60",
          "text-purple-400 text-xs sm:text-sm font-medium",
          "hover:bg-purple-500/10 hover:border-purple-500",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
          "transition-colors duration-200"
        )}
      >
        <Globe size={14} className="flex-shrink-0" />
        <span className="truncate max-w-[80px] sm:max-w-[100px]">{selectedLabel}</span>
        <ChevronDown ref={chevronRef} size={14} className="flex-shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Select audience"
          className={cn(
            "absolute top-full mt-2 left-0 z-50",
            "bg-surface-sunken rounded-xl",
            "shadow-lg shadow-black/40",
            "border border-border-default",
            "py-2 min-w-[180px] sm:min-w-[200px]",
            "overflow-hidden"
          )}
        >
          {options.map((option) => {
            const isSelected = selectedAudience === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "w-full px-4 py-2.5",
                  "flex items-center justify-between gap-3",
                  "text-left text-sm",
                  "hover:bg-surface-overlay transition-colors duration-150",
                  isSelected ? "text-purple-400" : "text-text-secondary"
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium truncate">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-text-tertiary truncate">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check size={16} className="text-purple-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AudienceDropdown;
