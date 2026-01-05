"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { UploadIcon, X } from "@/app/components/ui/icons";

interface AvatarUploaderProps {
  avatarPreview: string | null;
  initials: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  error?: string;
  acceptedFormats?: string;
  animationDelay?: number;
}

/**
 * Reusable avatar upload component with preview, initials fallback, and validation display.
 */
const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  avatarPreview,
  initials,
  onFileSelect,
  onRemove,
  error,
  acceptedFormats = "image/png,image/jpeg,image/jpg",
  animationDelay = 0.1,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      className="flex gap-7 items-start"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay }}
    >
      {/* Avatar Circle */}
      <div className="relative w-[100px] h-[100px] rounded-full cursor-pointer bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center shrink-0 overflow-hidden">
        {avatarPreview ? (
          <>
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={onRemove}
              type="button"
              className="absolute top-0 right-0 w-6 h-6 cursor-pointer bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </>
        ) : (
          <span className="text-4xl font-semibold text-purple-400/70 tracking-wider">
            {initials}
          </span>
        )}
      </div>

      {/* Upload Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-white text-lg font-medium tracking-wide">
            Upload image
          </p>
          <p className="text-muted-foreground text-base">
            Min 400x400px, PNG or JPEG
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={onFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          className="px-10 py-4 bg-primary/10 border border-primary-500 rounded-[20px] text-white font-semibold text-base tracking-wide backdrop-blur-md shadow-[0px_8px_30px_0px_rgba(29,5,82,0.35)] hover:bg-primary/15 transition-colors flex items-center gap-2 justify-center"
        >
          <UploadIcon className="w-5 h-5" />
          Upload
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </motion.div>
  );
};

export default AvatarUploader;
