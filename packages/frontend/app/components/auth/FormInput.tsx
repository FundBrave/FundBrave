'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { Mail, Lock, User } from '@/app/components/ui/icons';

interface FormInputProps {
  id: string;
  name: string;
  type: 'text' | 'email' | 'password';
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  delay?: number;
  icon?: React.ReactNode;
  className?: string;
  /** Mobile keyboard optimization - determines which keyboard to show */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  /** Browser autofill hint */
  autoComplete?: string;
}

const defaultIcons = {
  password: <Lock className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  text: <User className="h-5 w-5" />,
};

export default function FormInput({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  error,
  delay = 0.9,
  icon,
  className = "",
  inputMode,
  autoComplete,
}: FormInputProps) {
  const displayIcon = icon || defaultIcons[type];
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(inputContainerRef.current);
    };
  }, []);

  // Shake animation when error appears
  useEffect(() => {
    // Only shake when error transitions from undefined/empty to having a value
    if (error && !prevErrorRef.current && inputContainerRef.current) {
      gsap.to(inputContainerRef.current, {
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

  return (
    <motion.div
      className={className}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <motion.label
        htmlFor={id}
        className="mb-2 block text-foreground"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.05, duration: 0.3 }}
      >
        {label}
      </motion.label>
      <motion.div ref={inputContainerRef} className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.3 }}

          className="absolute left-3 top-1/3 transform -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"

        >
          {displayIcon}
        </motion.div>
        <motion.input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={`w-full rounded-lg bg-surface-sunken py-3 pl-12 pr-4 text-foreground placeholder-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 ${
            error
              ? 'border border-destructive focus:ring-destructive'
              : 'focus:ring-primary'
          }`}
          whileFocus={{ scale: 1.02 }}
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-1 text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

