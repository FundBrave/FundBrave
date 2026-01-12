"use client";

import { useState, useCallback, useRef, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Upload, X, Plus } from "@/app/components/ui/icons";

// ============================================================================
// Types
// ============================================================================

interface ImageData {
  file: File | null;
  preview: string | null;
  url?: string | null;
  uploadProgress?: number;
  error?: string;
}

interface ImageUploadEnhancedProps {
  /** Current image data */
  image: ImageData | null;
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when image is removed */
  onRemove: () => void;
  /** Error message to display */
  error?: string;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
  /** Label text */
  label?: string;
  /** Aspect ratio class */
  aspectRatio?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Accepted file types */
  acceptedTypes?: string[];
}

interface GalleryUploadProps {
  /** Current gallery images */
  images: ImageData[];
  /** Callback when files are selected */
  onFilesSelect: (files: File[]) => void;
  /** Callback when image is removed */
  onRemove: (index: number) => void;
  /** Maximum number of images */
  maxImages?: number;
  /** Error message to display */
  error?: string;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
}

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
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
          Uploading... {progress}%
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Drop Zone
// ============================================================================

interface DropZoneProps {
  isDragging: boolean;
  onDrop: (files: FileList) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDragEnter: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  acceptedTypes: string[];
  disabled?: boolean;
  children: React.ReactNode;
}

function DropZone({
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onDragEnter,
  inputRef,
  acceptedTypes,
  disabled,
  children,
}: DropZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && e.dataTransfer.files.length > 0) {
        onDrop(e.dataTransfer.files);
      }
    },
    [onDrop, disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnter={onDragEnter}
      className="relative w-full h-full"
    >
      {children}

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
  );
}

// ============================================================================
// Main Image Upload Component
// ============================================================================

export function ImageUploadEnhanced({
  image,
  onFileSelect,
  onRemove,
  error,
  isUploading = false,
  uploadProgress = 0,
  disabled,
  className,
  label = "Campaign Image",
  aspectRatio = "aspect-video",
  maxSizeMB = 5,
  acceptedTypes = ["image/png", "image/jpeg", "image/webp"],
}: ImageUploadEnhancedProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;
  const hasImage = Boolean(image?.preview || image?.url);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `File type not supported. Please use ${acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File size must be under ${maxSizeMB}MB`;
      }
      return null;
    },
    [acceptedTypes, maxSizeMB]
  );

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setLocalError(validationError);
        } else {
          setLocalError(null);
          onFileSelect(file);
        }
      }
    },
    [validateFile, onFileSelect]
  );

  // Handle drop
  const handleDrop = useCallback(
    (files: FileList) => {
      setIsDragging(false);
      const file = files[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setLocalError(validationError);
        } else {
          setLocalError(null);
          onFileSelect(file);
        }
      }
    },
    [validateFile, onFileSelect]
  );

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Label */}
      <label className="font-medium text-sm sm:text-base text-foreground">{label}</label>

      {/* Upload area */}
      <DropZone
        isDragging={isDragging}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        inputRef={inputRef}
        acceptedTypes={acceptedTypes}
        disabled={disabled}
      >
        <div
          className={cn(
            "relative w-full rounded-xl overflow-hidden",
            aspectRatio,
            "bg-surface-sunken border-2 border-dashed",
            "transition-all duration-200",
            displayError
              ? "border-destructive"
              : "border-border-subtle hover:border-primary/50",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {hasImage ? (
            <div className="relative w-full h-full group">
              <img
                src={image?.preview || image?.url || ""}
                alt="Campaign preview"
                className="w-full h-full object-cover"
              />

              {/* Upload progress overlay */}
              {isUploading && <ProgressBar progress={uploadProgress} />}

              {/* Hover overlay with remove button */}
              {!isUploading && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={onRemove}
                    className={cn(
                      "px-4 py-2 min-h-[44px]",
                      "bg-destructive text-white rounded-lg font-medium",
                      "hover:bg-destructive/90 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-white/50"
                    )}
                  >
                    Remove
                  </button>
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
                {acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")} (max{" "}
                {maxSizeMB}MB)
              </p>
              <input
                id={`${id}-input`}
                ref={inputRef}
                type="file"
                accept={acceptedTypes.join(",")}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload campaign image"
                disabled={disabled}
              />
            </label>
          )}
        </div>
      </DropZone>

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

// ============================================================================
// Gallery Upload Component
// ============================================================================

export function GalleryUpload({
  images,
  onFilesSelect,
  onRemove,
  maxImages = 10,
  error,
  isUploading,
  disabled,
  className,
}: GalleryUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;
  const canAddMore = images.length < maxImages;

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        const remainingSlots = maxImages - images.length;
        const filesToAdd = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
          setLocalError(`Maximum ${maxImages} images allowed. Only first ${remainingSlots} files were added.`);
        } else {
          setLocalError(null);
        }

        onFilesSelect(filesToAdd);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [images.length, maxImages, onFilesSelect]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ["image/png", "image/jpeg", "image/webp"].includes(f.type)
      );

      if (files.length > 0) {
        const remainingSlots = maxImages - images.length;
        const filesToAdd = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
          setLocalError(`Maximum ${maxImages} images allowed.`);
        } else {
          setLocalError(null);
        }

        onFilesSelect(filesToAdd);
      }
    },
    [images.length, maxImages, onFilesSelect]
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm sm:text-base text-foreground">
          Gallery Images
          <span className="text-text-tertiary ml-1 font-normal">(Optional)</span>
        </label>
        <span className="text-xs text-text-tertiary">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Gallery grid */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          "relative grid gap-3",
          images.length === 0
            ? "grid-cols-1"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        )}
      >
        {/* Existing images */}
        {images.map((img, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-surface-sunken group"
          >
            <img
              src={img.preview || img.url || ""}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {img.uploadProgress !== undefined && img.uploadProgress < 100 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-3/4">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${img.uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className={cn(
                "absolute top-2 right-2",
                "w-8 h-8 flex items-center justify-center",
                "bg-black/60 hover:bg-destructive rounded-full",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              aria-label={`Remove image ${index + 1}`}
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        ))}

        {/* Add more button */}
        {canAddMore && (
          <label
            htmlFor={`${id}-gallery-input`}
            className={cn(
              "aspect-square flex flex-col items-center justify-center",
              "rounded-lg border-2 border-dashed cursor-pointer",
              "transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border-subtle hover:border-primary/50 bg-surface-sunken",
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            <Plus size={24} className="text-text-tertiary mb-1" />
            <span className="text-xs text-text-tertiary">Add image</span>
            <input
              id={`${id}-gallery-input`}
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled || !canAddMore}
            />
          </label>
        )}

        {/* Drag overlay for empty state */}
        <AnimatePresence>
          {isDragging && images.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0",
                "flex flex-col items-center justify-center gap-3",
                "bg-primary/10 border-2 border-dashed border-primary rounded-xl"
              )}
            >
              <Upload size={32} className="text-primary" />
              <p className="text-primary font-medium text-sm">Drop images to upload</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help text */}
      <p className="text-xs text-text-tertiary">
        Add up to {maxImages} images to showcase your campaign
      </p>

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

export default ImageUploadEnhanced;
