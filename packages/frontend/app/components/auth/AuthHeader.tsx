"use client";

import React from "react";
import { motion } from "motion/react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  delay?: number;
}

export default function AuthHeader({
  title,
  subtitle,
  delay = 0.3,
}: AuthHeaderProps) {
  return (
    <motion.div
      className="mb-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.h1
        className="mb-2 text-2xl font-bold text-foreground"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="text-text-secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
      >
        {subtitle}
      </motion.p>
    </motion.div>
  );
}
