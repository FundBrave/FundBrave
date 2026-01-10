"use client";
import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useAnimate, motion } from "motion/react";

interface SuccessCardProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
  showAnimation?: boolean;
}

const SuccessCard: React.FC<SuccessCardProps> = ({
  title = "Success!",
  message = "Congratulations, your withdrawal of 300 USD to 0x1234...5678 has been sent successfully, continue to home",
  buttonText = "Close",
  onButtonClick,
  className,
  showAnimation = true,
}) => {
  const [isVisible, setIsVisible] = React.useState(!showAnimation);
  const [showCheckmark, setShowCheckmark] = React.useState(!showAnimation);

  const [scope, animate] = useAnimate();
  const [buttonScope, animateButton] = useAnimate();

  // Handle initial animation on component mount
  React.useEffect(() => {
    if (showAnimation) {
      // Animate card entrance
      setTimeout(() => setIsVisible(true), 100);
      // Animate checkmark after card appears
      animate(
        scope.current,
        { pathLength: [0, 1] },
        { duration: 0.5, delay: 0.6 }
      );
    }
  }, [showAnimation]);

  // Method to run complex animation sequences
  const runAnimationSequence = async () => {
    // Animate the button with a pulse effect
    await animateButton(
      buttonScope.current,
      { scale: [1, 1.1, 1] },
      { duration: 0.4 }
    );

    // Animate the checkmark again with a different effect
    return animate(
      scope.current,
      {
        pathLength: [0, 1],
        stroke: ["#8762FA", "#cd82ff", "#8762FA"],
      },
      {
        duration: 0.6,
        ease: "easeOut",
      }
    );
  };
  return (
    <div
      className={cn(
        "relative w-full max-w-sm mx-auto p-10 rounded-2xl",
        "bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900",
        "shadow-xl border border-purple-500/20   text-white",
        className
      )}
    >
      {/* Success Icon with Diamond Accent */}
      <div className="flex flex-col items-center mb-8">
        {/* Diamond/Star Accent */}
        <div className="relative mb-4">
          <div
            className={"absolute -top-3 -right-2 w-4 h-4 rotate-45 shadow-lg"}
          />
          {/* Checkmark Icon */}
          <svg
            width="251"
            height="154"
            viewBox="0 0 251 154"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M125.5 40.1547C103.234 40.1547 85.0161 58.3724 85.0161 80.6385C85.0161 102.905 103.234 121.122 125.5 121.122C147.766 121.122 165.984 102.905 165.984 80.6385C165.984 58.3724 147.766 40.1547 125.5 40.1547ZM125.5 113.026C107.647 113.026 93.1129 98.4919 93.1129 80.6385C93.1129 62.7851 107.647 48.2514 125.5 48.2514C143.353 48.2514 157.887 62.7851 157.887 80.6385C157.887 98.4919 143.353 113.026 125.5 113.026ZM146.946 65.6292C145.366 64.0378 142.794 64.0332 141.208 65.619L120.932 85.8948C118.982 87.8448 115.821 87.8478 113.868 85.9017L109.775 81.8245C108.196 80.2519 105.642 80.2544 104.067 81.83C102.489 83.4079 102.489 85.966 104.067 87.5438L113.868 97.3449C115.82 99.2976 118.986 99.2976 120.939 97.3449L146.936 71.3475C148.514 69.7696 148.519 67.2127 146.946 65.6292Z"
              fill="#8762FA"
              ref={scope}
            />
            <motion.path
              d="M13.5352 129.839C13.5993 129.606 13.93 129.606 13.9941 129.839C15.3965 134.937 19.4806 138.91 24.5938 140.235C24.715 140.266 24.7782 140.358 24.7783 140.479C24.7783 140.6 24.7151 140.691 24.5938 140.723C19.4805 142.048 15.3964 146.021 13.9941 151.119C13.9299 151.352 13.5994 151.352 13.5352 151.119C12.1329 146.021 8.0487 142.048 2.93555 140.723C2.81419 140.691 2.75098 140.6 2.75098 140.479C2.75108 140.358 2.81429 140.266 2.93555 140.235C8.04858 138.91 12.1329 134.937 13.5352 129.839Z"
              stroke="#8762FA"
              ref={buttonScope}
            />
            <path
              d="M228.836 4.16824C229.14 3.02864 230.757 3.02864 231.061 4.16824C233.117 11.8686 239.132 17.883 246.832 19.9388C247.972 20.243 247.972 21.8602 246.832 22.1644C239.132 24.2202 233.117 30.2347 231.061 37.935C230.757 39.0746 229.14 39.0746 228.836 37.935C226.78 30.2347 220.766 24.2202 213.065 22.1644C211.926 21.8602 211.926 20.243 213.065 19.9388C220.766 17.883 226.78 11.8686 228.836 4.16824Z"
              fill="#8762FA"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className={"text-center mb-8 transition-all duration-500 delay-700"}>
        <h2 className="text-2xl font-bold mb-4 font-gilgan">{title}</h2>
        <p className="text-white/90 text-sm leading-relaxed font-montserrat">
          {message}
        </p>
      </div>

      {/* Action Button */}
      <div
        className={"flex justify-center transition-all duration-500 delay-800"}
        ref={buttonScope}
      >
        <Button
          variant="primary"
          size="md"
          fullWidth={false}
          onClick={(e) => {
            // Run the animation sequence
            runAnimationSequence().then(() => {
              // Then call the original onClick handler
              if (onButtonClick) onButtonClick();
            });
          }}
          className={cn(
            "bg-primary hover:bg-primary-600 text-white",
            "px-8 py-3  font-medium",
            "transition-all duration-200",
            "shadow-lg hover:shadow-xl hover:scale-105",
            "border-0 w-full max-w-[200px]",
            "focus:ring-2 focus:ring-primary-300 active:ring-offset-1 focus:ring-offset-purple-700"
          )}
        >
          {buttonText}
        </Button>
      </div>

      {/* Optional Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-2xl pointer-events-none" />

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 pointer-events-none" />
    </div>
  );
};

export default SuccessCard;
