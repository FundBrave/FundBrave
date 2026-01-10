"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";

interface AuthLogoProps {
  delay?: number;
}

export default function AuthLogo({ delay = 0.1 }: AuthLogoProps) {
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
          src={"/FundBrave_light_logo.png"}
          alt="FundBrave logo"
          width={100}
          height={100}
          className="w-[150px]"
        />
      </motion.div>
    </motion.div>
  );
}
