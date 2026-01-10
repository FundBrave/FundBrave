'use client';
import React from 'react';
import { motion } from "motion/react";
import { Spinner } from "@/app/components/ui/Spinner";
import WalletLoginButton from "../../components/auth/WalletLoginButton";

interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  handleWalletError: any;
  delay?: number;
  isGoogleLoading?: boolean;
  className?: string;
}

const buttonVariants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

export default function SocialLoginButtons({
  onGoogleLogin,
  delay = 0.4,
  isGoogleLoading = false,
  handleWalletError,
}: SocialLoginButtonsProps) {
  return (
    <motion.div
      className="mb-6 flex flex-col gap-4 md:flex-row"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.button
        onClick={onGoogleLogin}
        disabled={isGoogleLoading}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border-[2px] shadow-[3px] border-border-subtle bg-transparent py-3 text-foreground transition-colors hover:bg-foreground/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        variants={buttonVariants}
        whileHover={!isGoogleLoading ? "hover" : undefined}
        whileTap={!isGoogleLoading ? "tap" : undefined}
      >
        {isGoogleLoading ? (
          <Spinner size="md" color="white" />
        ) : (
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
            className="h-5 w-5"
          >
            <path
              d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
              fill="#FFC107"
            />
            <path
              d="M3.15308 7.3455L6.43858 9.755C7.32758 7.554 9.48058 6 12.0001 6C13.5296 6 14.9211 6.577 15.9806 7.5195L18.8091 4.691C17.0231 3.0265 14.6341 2 12.0001 2C8.15908 2 4.82808 4.1685 3.15308 7.3455Z"
              fill="#FF3D00"
            />
            <path
              d="M12.0002 22.0001C14.5832 22.0001 16.9302 21.0116 18.7047 19.4041L15.6097 16.7851C14.5721 17.5746 13.3039 18.0015 12.0002 18.0001C9.39916 18.0001 7.19066 16.3416 6.35866 14.0271L3.09766 16.5396C4.75266 19.7781 8.11366 22.0001 12.0002 22.0001Z"
              fill="#4CAF50"
            />
            <path
              d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
              fill="#1976D2"
            />
          </motion.svg>
        )}
        {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
      </motion.button>


     <motion.div
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border-[2px] shadow-[3px] border-border-subtle bg-transparent py-3 text-foreground transition-colors hover:bg-foreground/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        variants={buttonVariants}
        whileHover={!isGoogleLoading ? "hover" : undefined}
        whileTap={!isGoogleLoading ? "tap" : undefined}
      >
         <WalletLoginButton onError={handleWalletError} />
      </motion.div>
    </motion.div>
  );
}