"use client";

import { motion } from "motion/react";
import { PAGE_TRANSITION } from "@/lib/constants/animation";

export default function CampaignTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initial, animate, exit, transition } = PAGE_TRANSITION.slideRight;

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
