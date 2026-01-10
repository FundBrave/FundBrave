"use client";

import { motion } from "motion/react";
import { AuthHeroContent } from "./AuthHeroContent";

interface AuthHeroProps {
  variant: "signup" | "login";
}

// an engaging user experience that guides attention naturally.
export default function AuthHero({ variant }: AuthHeroProps) {
  const hero = AuthHeroContent.find((item) => item.key === variant);

  if (!hero) {
    return null;
  }

  return (
    <motion.section
      className="flex h-full w-full flex-col items-center justify-center gap-8 px-6 text-foreground relative"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl" />
      </motion.div>

      <div className="relative md:w-70 md:h-50 2xl:w-96 2xl:h-96 flex items-center justify-center flex-shrink-0">
        {/* a gradient color effect that starts from the center and radiates up and down top into the background */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl" /> */}

        {/* Main container with subtle rotation */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.65, opacity: 0, rotateY: -65 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 260,
            damping: 18,
          }}
          whileHover={{
            scale: 1.05,
            rotateY: 10,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          }}
        >
          {/* Icon with floating animation */}
          <motion.div
            className="absolute z-10 size-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            whileHover={{
              y: -5,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
          >
            {hero.svg}
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center max-w-md space-y-4 relative z-10">
        <motion.h2
          className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.35,
            type: "spring",
            stiffness: 320,
            damping: 18,
          }}
        >
          {hero.title}
        </motion.h2>

        <motion.p
          className="text-lg text-text-secondary leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.45,
            duration: 0.4,
            ease: "easeOut",
          }}
        >
          {hero.subtitle}
        </motion.p>
      </div>

      {/*
          Subtle floating elements that add visual interest without
          overwhelming the main content. These create depth and movement. */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: 0.5,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-pink-400/30 rounded-full"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: 1.5,
          ease: "easeInOut",
        }}
      />
    </motion.section>
  );
}
