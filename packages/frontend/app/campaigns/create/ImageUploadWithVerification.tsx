"use client";

import { useState, useCallback, useRef, useId, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Upload, X, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useDeepfakeDetection } from "@/app/hooks/useDeepfakeDetection";
import { useImageAnalysis } from "@/app/hooks/useImageAnalysis";
import {
  ImageVerificationBadge,
  InlineVerificationStatus,
} from "@/app/components/ai/ImageVerificationBadge";
import type { MediaVerificationResponse, ImageAnalysisResponse } from "@/app/lib/ai-service";

// ============================================================================
// Types
// ============================================================================

export interface VerificationResult {
  deepfake: MediaVerificationResponse | null;
  analysis: ImageAnalysisResponse | null;
  isComplete: boolean;
  canProceed: boolean;
  warnings: string[];
}

interface ImageUploadWithVerificationProps {
  /** Current image data */
  image: {
    file: File | null;
    preview: string | null;
  } | null;
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when image is removed */
  onRemove: () => void;
  /** Callback when verification completes */
  onVerificationComplete?: (result: VerificationResult) => void;
  /** Campaign name for context */
  campaignName?: string;
  /** Campaign description for context */
  campaignDescription?: string;
  /** Whether to block suspicious images */
  blockSuspicious?: boolean;
  /** Whether verification is required to proceed */
  verificationRequired?: boolean;
  /** Whether user is verified (can override blocks) */
  isVerifiedUser?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
}

// ============================================================================
// Progress Bar Component
// ============================================================================

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      <div className="w-3/4 max-w-xs">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <p className="text-white text-sm text-center mt-2 font-medium">
          Verifying... {progress}%
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ImageUploadWithVerification({
  image,
  onFileSelect,
  onRemove,
  onVerificationComplete,
  campaignName,
  campaignDescription,
  blockSuspicious = true,
  verificationRequired = true,
  isVerifiedUser = false,
  error,
  disabled,
  className,
}: ImageUploadWithVerificationProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [overrideWarning, setOverrideWarning] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);

  // AI verification hooks
  const {
    verifyImage,
    isVerifying: isDeepfakeVerifying,
    result: deepfakeResult,
    error: deepfakeError,
    reset: resetDeepfake,
  } = useDeepfakeDetection();

  const {
    analyzeImage,
    isAnalyzing: isAnalyzing,
    result: analysisResult,
    error: analysisError,
    reset: resetAnalysis,
  } = useImageAnalysis();

  const displayError = error || localError || deepfakeError || analysisError;
  const hasImage = Boolean(image?.preview);
  const isVerifying = isDeepfakeVerifying || isAnalyzing;

  // Calculate verification result
  const verificationResult: VerificationResult = {
    deepfake: deepfakeResult,
    analysis: analysisResult,
    isComplete: Boolean(deepfakeResult) && Boolean(analysisResult),
    canProceed: true,
    warnings: [],
  };

  // Check if image is suspicious
  if (deepfakeResult && !deepfakeResult.is_authentic) {
    verificationResult.warnings.push("This image may be digitally manipulated or AI-generated");
    if (blockSuspicious && !overrideWarning) {
      verificationResult.canProceed = false;
    }
  }

  if (deepfakeResult && deepfakeResult.requires_review) {
    verificationResult.warnings.push("This image requires manual review");
  }

  // Check if image content is inappropriate
  if (analysisResult && !analysisResult.is_appropriate) {
    verificationResult.warnings.push("This image may contain inappropriate content");
    if (blockSuspicious && !overrideWarning) {
      verificationResult.canProceed = false;
    }
  }

  // Update progress during verification
  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setVerificationProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setVerificationProgress(100);
      // Reset after animation
      setTimeout(() => setVerificationProgress(0), 500);
    }
  }, [isVerifying]);

  // Notify parent when verification completes
  useEffect(() => {
    if (verificationResult.isComplete && onVerificationComplete) {
      onVerificationComplete(verificationResult);
    }
  }, [verificationResult.isComplete, onVerificationComplete]);

  // Run verification when image is uploaded
  const runVerification = useCallback(
    async (file: File) => {
      if (!verificationRequired) return;

      setVerificationProgress(0);

      try {
        // Run both verifications in parallel
        await Promise.all([
          verifyImage(file),
          analyzeImage(file, campaignName, campaignDescription),
        ]);
      } catch (err) {
        console.error("Verification error:", err);
      }
    },
    [verifyImage, analyzeImage, campaignName, campaignDescription, verificationRequired]
  );

  // Handle file selection
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset states
      setLocalError(null);
      setOverrideWarning(false);
      resetDeepfake();
      resetAnalysis();

      // Validate file
      const validTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setLocalError("Please upload a PNG, JPEG, or WebP image");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setLocalError("File size must be under 5MB");
        return;
      }

      // Select the file
      onFileSelect(file);

      // Run verification
      await runVerification(file);
    },
    [onFileSelect, runVerification, resetDeepfake, resetAnalysis]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      // Reset states
      setLocalError(null);
      setOverrideWarning(false);
      resetDeepfake();
      resetAnalysis();

      // Validate file
      const validTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setLocalError("Please upload a PNG, JPEG, or WebP image");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setLocalError("File size must be under 5MB");
        return;
      }

      // Select the file
      onFileSelect(file);

      // Run verification
      await runVerification(file);
    },
    [onFileSelect, runVerification, resetDeepfake, resetAnalysis]
  );

  // Handle remove
  const handleRemove = useCallback(() => {
    onRemove();
    resetDeepfake();
    resetAnalysis();
    setLocalError(null);
    setOverrideWarning(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onRemove, resetDeepfake, resetAnalysis]);

  // Handle override for verified users
  const handleOverride = useCallback(() => {
    if (isVerifiedUser) {
      setOverrideWarning(true);
    }
  }, [isVerifiedUser]);

  // Retry verification
  const handleRetryVerification = useCallback(async () => {
    if (image?.file) {
      resetDeepfake();
      resetAnalysis();
      await runVerification(image.file);
    }
  }, [image, runVerification, resetDeepfake, resetAnalysis]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm sm:text-base text-foreground">
          Campaign Image
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        </label>
        {verificationRequired && (
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            AI Verified
          </span>
        )}
      </div>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          "relative w-full aspect-video rounded-xl overflow-hidden",
          "bg-surface-sunken border-2 border-dashed",
          "transition-all duration-200",
          displayError
            ? "border-destructive"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-border-subtle hover:border-primary/50",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {hasImage ? (
          <div className="relative w-full h-full group">
            <img
              src={image?.preview || ""}
              alt="Campaign preview"
              className="w-full h-full object-cover"
            />

            {/* Verification progress overlay */}
            {isVerifying && <ProgressBar progress={verificationProgress} />}

            {/* Verification badge overlay */}
            {!isVerifying && deepfakeResult && (
              <div className="absolute top-3 left-3">
                <ImageVerificationBadge
                  result={deepfakeResult}
                  isVerifying={isVerifying}
                  error={deepfakeError}
                  showDetails={false}
                  compact
                />
              </div>
            )}

            {/* Hover overlay with remove button */}
            {!isVerifying && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" onClick={handleRemove}>
                  Remove Image
                </Button>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor={`${id}-input`}
            className={cn(
              "flex flex-col items-center justify-center",
              "w-full h-full cursor-pointer p-6 text-center"
            )}
          >
            <Upload size={32} className="text-text-tertiary mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-text-tertiary">
              PNG, JPEG, or WebP (max 5MB)
            </p>
            <p className="text-xs text-primary mt-2">
              Images are verified by AI for authenticity
            </p>
            <input
              id={`${id}-input`}
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />
          </label>
        )}

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 z-10",
                "flex flex-col items-center justify-center gap-3",
                "bg-primary/10 border-2 border-dashed border-primary rounded-xl",
                "pointer-events-none"
              )}
            >
              <Upload size={40} className="text-primary" />
              <p className="text-primary font-medium">Drop to upload</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verification result details */}
      {hasImage && !isVerifying && deepfakeResult && (
        <ImageVerificationBadge
          result={deepfakeResult}
          isVerifying={false}
          error={null}
          showDetails
          onRetry={handleRetryVerification}
        />
      )}

      {/* Warnings */}
      {verificationResult.warnings.length > 0 && !isVerifying && (
        <div className="space-y-2">
          {verificationResult.warnings.map((warning, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-500">{warning}</p>
                {!verificationResult.canProceed && isVerifiedUser && !overrideWarning && (
                  <button
                    onClick={handleOverride}
                    className="text-xs text-yellow-500 hover:underline mt-1"
                  >
                    I understand, proceed anyway (verified user)
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {!verificationResult.canProceed && !isVerifiedUser && (
            <p className="text-xs text-text-secondary">
              Please upload a different image or contact support if you believe this is an error.
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.p
            role="alert"
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImageUploadWithVerification;
