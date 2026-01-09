import React, { useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { ChevronDown } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import IconButton from "../icon-button";
import type {
  MediaActionsProps,
  SelectFieldProps,
  InputFieldProps,
  TextAreaFieldProps,
} from "../types/CreatePost.types";
import {
  GifIcon,
  PollIcon,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Smile,
} from "../index";

// FieldError Component
interface FieldErrorProps {
  error?: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ error }) => (
  <AnimatePresence>
    {error && (
      <motion.p
        className="mt-1.5 text-sm text-destructive"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
      >
        {error}
      </motion.p>
    )}
  </AnimatePresence>
);

// CharacterCount Component
interface CharacterCountProps {
  current: number;
  max: number;
  min?: number;
}

const CharacterCount: React.FC<CharacterCountProps> = ({ current, max, min }) => {
  const countRef = useRef<HTMLSpanElement>(null);
  const prevCurrentRef = useRef(current);

  // Pulse animation when reaching 90% of max
  useEffect(() => {
    const wasBelow90 = prevCurrentRef.current < max * 0.9;
    const isNowAbove90 = current >= max * 0.9;

    if (wasBelow90 && isNowAbove90 && countRef.current) {
      gsap.fromTo(countRef.current,
        { scale: 1 },
        { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
    prevCurrentRef.current = current;
  }, [current, max]);

  const isOverLimit = current > max;
  const isBelowMin = min !== undefined && current > 0 && current < min;

  return (
    <span
      ref={countRef}
      className={cn(
        "text-xs transition-colors",
        isOverLimit ? "text-destructive" :
        isBelowMin ? "text-yellow-500" : "text-text-tertiary"
      )}
    >
      {current}/{max}
    </span>
  );
};

// Media Actions Component
const MediaActions: React.FC<MediaActionsProps> = ({
  onImageClick,
  onGifClick,
  onPollClick,
  onEmojiClick,
  onCalendarClick,
  onLocationClick,
}) => {
  const mediaButtons = [
    { icon: ImageIcon, label: "Insert Image", onClick: onImageClick },
    { icon: GifIcon, label: "Insert GIF", onClick: onGifClick },
    { icon: PollIcon, label: "Insert Poll", onClick: onPollClick },
    { icon: Smile, label: "Insert Emoji", onClick: onEmojiClick },
    { icon: Calendar, label: "Insert Calendar", onClick: onCalendarClick },
    { icon: MapPin, label: "Insert Location", onClick: onLocationClick },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-4 mt-4 flex-wrap">
      {mediaButtons.map(({ icon: Icon, label, onClick }) => (
        <IconButton
          key={label}
          ariaLabel={label}
          type="button"
          onClick={onClick}
          className="hover:bg-surface-overlay transition-colors p-2"
        >
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </IconButton>
      ))}
    </div>
  );
};

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
  error,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);
  const prevValueRef = useRef(value);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(containerRef.current);
      gsap.killTweensOf(selectRef.current);
    };
  }, []);

  // Shake animation when error appears
  useEffect(() => {
    if (error && !prevErrorRef.current && containerRef.current) {
      gsap.to(containerRef.current, {
        keyframes: [
          { x: -10, duration: 0.07 },
          { x: 10, duration: 0.07 },
          { x: -8, duration: 0.07 },
          { x: 8, duration: 0.07 },
          { x: -4, duration: 0.07 },
          { x: 4, duration: 0.07 },
          { x: 0, duration: 0.07 },
        ],
        ease: "power2.inOut",
      });
    }
    prevErrorRef.current = error;
  }, [error]);

  // Subtle bounce on selection
  useEffect(() => {
    if (value && value !== prevValueRef.current && selectRef.current) {
      gsap.fromTo(selectRef.current,
        { scale: 1 },
        { scale: 1.02, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
    prevValueRef.current = value;
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="font-['Poppins'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] text-foreground tracking-[0.72px] leading-[28px] sm:leading-[32px] lg:leading-[36px]">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <select
          ref={selectRef}
          value={value}
          onChange={handleChange}
          aria-label={label}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full bg-surface-sunken rounded-[12px] sm:rounded-[16px] lg:rounded-[20px]",
            "pl-4 sm:pl-6 lg:pl-8 pr-10 sm:pr-12 lg:pr-14 py-4 sm:py-5 lg:py-5",
            "min-h-[56px] sm:min-h-[60px] lg:min-h-[64px]",
            "font-['Poppins'] font-medium text-[14px] sm:text-[15px] lg:text-[16px]",
            "tracking-[0.64px] leading-normal",
            "text-foreground appearance-none cursor-pointer outline-none",
            "focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
            "transition-all duration-200",
            error && "ring-2 ring-destructive/50",
            disabled && "opacity-50 cursor-not-allowed",
            "[&>option]:bg-surface-sunken [&>option]:text-foreground [&>option]:py-2"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
      </div>
      <FieldError error={error} />
    </div>
  );
};

// InputField Component
export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  error,
  maxLength,
  showCharacterCount = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(containerRef.current);
      gsap.killTweensOf(inputRef.current);
    };
  }, []);

  // Shake animation when error appears
  useEffect(() => {
    if (error && !prevErrorRef.current && containerRef.current) {
      gsap.to(containerRef.current, {
        keyframes: [
          { x: -10, duration: 0.07 },
          { x: 10, duration: 0.07 },
          { x: -8, duration: 0.07 },
          { x: 8, duration: 0.07 },
          { x: -4, duration: 0.07 },
          { x: 4, duration: 0.07 },
          { x: 0, duration: 0.07 },
        ],
        ease: "power2.inOut",
      });
    }
    prevErrorRef.current = error;
  }, [error]);

  // Focus/blur glow animation
  const handleFocus = useCallback(() => {
    if (inputRef.current) {
      gsap.to(inputRef.current, {
        boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.5)",
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, []);

  const handleBlur = useCallback(() => {
    if (inputRef.current) {
      gsap.to(inputRef.current, {
        boxShadow: "none",
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-['Poppins'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] text-foreground tracking-[0.72px] leading-[28px] sm:leading-[32px] lg:leading-[36px]">
          {label}
        </label>
        {showCharacterCount && maxLength && (
          <CharacterCount current={value.length} max={maxLength} />
        )}
      </div>
      <div ref={containerRef}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={cn(
            "w-full bg-surface-sunken rounded-[12px] sm:rounded-[16px] lg:rounded-[20px]",
            "px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-[18px]",
            "h-12 sm:h-13 lg:h-14",
            "font-['Poppins'] font-medium text-[14px] sm:text-[15px] lg:text-[16px]",
            "tracking-[0.64px] leading-[28px] sm:leading-[32px] lg:leading-[36px]",
            "text-foreground placeholder:text-text-secondary outline-none",
            "focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
            "transition-all duration-200",
            error && "ring-2 ring-destructive/50"
          )}
        />
      </div>
      <FieldError error={error} />
    </div>
  );
};

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  minHeight = "272px",
  showMediaActions = true,
  required = false,
  mediaActions,
  error,
  maxLength,
  showCharacterCount = false,
  minLength,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(containerRef.current);
    };
  }, []);

  // Shake animation when error appears
  useEffect(() => {
    if (error && !prevErrorRef.current && containerRef.current) {
      gsap.to(containerRef.current, {
        keyframes: [
          { x: -10, duration: 0.07 },
          { x: 10, duration: 0.07 },
          { x: -8, duration: 0.07 },
          { x: 8, duration: 0.07 },
          { x: -4, duration: 0.07 },
          { x: 4, duration: 0.07 },
          { x: 0, duration: 0.07 },
        ],
        ease: "power2.inOut",
      });
    }
    prevErrorRef.current = error;
  }, [error]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Convert minHeight to Tailwind class if it's a standard value
  const getMinHeightClass = (height: string) => {
    switch (height) {
      case "272px":
        return "min-h-[200px] sm:min-h-[240px] lg:min-h-[272px]";
      case "188px":
        return "min-h-[150px] sm:min-h-[170px] lg:min-h-[188px]";
      default:
        return "";
    }
  };

  const minHeightClass = getMinHeightClass(minHeight);
  const containerStyle = minHeightClass ? {} : { minHeight };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-['Poppins'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] text-foreground tracking-[0.72px] leading-[28px] sm:leading-[32px] lg:leading-[36px]">
          {label}
        </label>
        {showCharacterCount && maxLength && (
          <CharacterCount current={value.length} max={maxLength} min={minLength} />
        )}
      </div>
      <div
        ref={containerRef}
        className={cn(
          "bg-surface-sunken rounded-[12px] sm:rounded-[16px] lg:rounded-[20px]",
          "p-4 sm:p-6 lg:p-8 flex flex-col justify-between",
          "focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-opacity-50",
          "transition-all duration-200",
          minHeightClass,
          error && "ring-2 ring-destructive/50"
        )}
        {...(Object.keys(containerStyle).length > 0 && {
          style: containerStyle,
        })}
      >
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={cn(
            "bg-transparent text-foreground font-['Poppins'] font-medium",
            "text-[14px] sm:text-[15px] lg:text-[16px] tracking-[0.64px]",
            "placeholder:text-text-secondary resize-none flex-1 outline-none",
            "leading-[28px] sm:leading-[32px] lg:leading-[36px]"
          )}
        />
        {showMediaActions && mediaActions && <MediaActions {...mediaActions} />}
      </div>
      <FieldError error={error} />
    </div>
  );
};
