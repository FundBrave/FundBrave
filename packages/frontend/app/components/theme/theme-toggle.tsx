"use client";

import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { Moon, Sun } from "@/app/components/ui/icons";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const iconRef = useRef<SVGSVGElement>(null);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(iconRef.current);
    };
  }, []);

  // Animate icon on toggle
  const animateToggle = useCallback(() => {
    if (!iconRef.current) return;

    gsap.timeline()
      .to(iconRef.current, {
        rotation: 180,
        scale: 1.2,
        duration: 0.2,
        ease: "power2.out",
      })
      .to(iconRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "elastic.out(1, 0.5)",
      });
  }, []);

  const handleToggle = () => {
    animateToggle();
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={handleToggle}
      className="rounded-full p-2 focus:outline-none bg-soft-purple-100 cursor-pointer dark:bg-primary-700 text-primary-700 dark:text-white hover:bg-soft-purple-200 dark:hover:bg-primary-600 transition-colors"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      {theme !== "dark" ? (
        <Moon ref={iconRef} className="size-5" />
      ) : (
        <Sun ref={iconRef} className="size-5" />
      )}
    </button>
  );
}
