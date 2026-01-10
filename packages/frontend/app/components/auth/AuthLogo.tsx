"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useTheme } from "@/app/components/theme/theme-provider";

interface AuthLogoProps {
  delay?: number;
}

export default function AuthLogo({ delay = 0.1 }: AuthLogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Resolve the actual theme (handles "system" preference)
  useEffect(() => {
    if (!mounted) return;

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme, mounted]);

  // Use dark logo for light mode, light logo for dark mode
  const logoSrc =
    resolvedTheme === "light"
      ? "/FundBrave_dark_logo.png"
      : "/FundBrave_light_logo.png";

  return (
    <motion.div
      className="mb-6 flex justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: delay + 0.1,
          duration: 0.5,
          type: "spring",
          stiffness: 200,
        }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Image
          src={logoSrc}
          alt="FundBrave logo"
          width={100}
          height={100}
          className="w-[150px]"
          priority
        />
      </motion.div>
    </motion.div>
  );
}
