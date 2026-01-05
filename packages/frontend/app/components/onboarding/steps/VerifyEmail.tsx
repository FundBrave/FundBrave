"use client";

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";
import { Button } from "@/app/components/ui/button";

const VerifyEmail: React.FC<StepComponentProps> = ({ onNext }) => {
  const { data } = useOnboardingData();
  const [codes, setCodes] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(4).fill(null));

  const userEmail = data.email || "your email";

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      className="text-center w-full px-4 h-full flex flex-col justify-center items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Verify your email
      </h2>
      <p className="text-muted-foreground mb-8 text-sm md:text-base">
        We sent a code to <span className="text-purple-400">{userEmail}</span>
      </p>

      {/* Verification code inputs */}
      <div className="flex justify-center gap-2 md:gap-3 mb-8">
        {codes.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-12 md:w-16 md:h-16 text-2xl md:text-3xl text-center bg-neutral-dark-400 rounded-lg text-white border border-border focus:border-purple-500 outline-none transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          />
        ))}
      </div>

      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        Didn&apos;t get a code?{" "}
        <button className="text-purple-400 hover:text-purple-300 transition-colors">
          Click to resend
        </button>
      </p>

      <Button variant="primary" size="md" onClick={onNext} className="w-full max-w-xs mx-auto">
        Continue
      </Button>
    </motion.div>
  );
};

export default VerifyEmail;
