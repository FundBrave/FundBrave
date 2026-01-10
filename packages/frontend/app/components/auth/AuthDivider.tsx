"use client";

import React from "react";
import { motion } from "motion/react";

interface AuthDividerProps {
  text: string;
  delay?: number;
  className?: string;
}

export default function AuthDivider({
  text,
  delay = 0.8,
  className = "",
}: AuthDividerProps) {
  return (
    <motion.div
      className={`mb-6 flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.div
        className="flex-1 border-t border-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
        aria-hidden="true"
      />
      <motion.span
        className="text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.3 }}
      >
        {text}
      </motion.span>
      <motion.div
        className="flex-1 border-t border-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

