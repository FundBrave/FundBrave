'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

/**
 * Password Strength Indicator Component
 * Shows password requirements and visual feedback
 */
export default function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const requirements: PasswordRequirement[] = [
    {
      regex: /.{8,}/,
      text: 'At least 8 characters',
      met: /.{8,}/.test(password),
    },
    {
      regex: /[A-Z]/,
      text: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      regex: /[a-z]/,
      text: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      regex: /\d/,
      text: 'One number',
      met: /\d/.test(password),
    },
    {
      regex: /[@$!%*?&]/,
      text: 'One special character (@$!%*?&)',
      met: /[@$!%*?&]/.test(password),
    },
  ];

  const metRequirements = requirements.filter((req) => req.met).length;
  const strength = (metRequirements / requirements.length) * 100;

  // Calculate strength level and color
  const getStrengthLevel = () => {
    if (strength === 0) return { label: '', color: 'bg-gray-600' };
    if (strength < 40) return { label: 'Weak', color: 'bg-red-500' };
    if (strength < 80) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const strengthLevel = getStrengthLevel();

  if (!password && !showRequirements) return null;

  return (
    <motion.div
      className="mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Strength bar */}
      {password && (
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Password Strength</span>
            {strengthLevel.label && (
              <span className={`text-xs font-medium ${
                strengthLevel.color === 'bg-red-500' ? 'text-red-400' :
                strengthLevel.color === 'bg-yellow-500' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {strengthLevel.label}
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <motion.div
              className={`h-full ${strengthLevel.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${strength}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Requirements list */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Password must contain:</p>
          {requirements.map((req, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                  req.met
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-600/20 text-gray-500'
                }`}
              >
                <AnimatePresence mode="wait">
                  {req.met ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="x"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-3 w-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span
                className={`text-xs transition-colors ${
                  req.met ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {req.text}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
