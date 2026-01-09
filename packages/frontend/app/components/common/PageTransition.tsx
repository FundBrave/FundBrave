"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";
import { PAGE_TRANSITION } from "@/lib/constants/animation";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const { initial, animate, exit, transition } = PAGE_TRANSITION.fade;

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
