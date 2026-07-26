"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const UploadCloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ZoomInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const ZoomOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

interface AvatarUploaderHorizontalProps {
  avatarPreview: string | null;
  initials: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
  acceptedFormats?: string;
  animationDelay?: number;
  enableCrop?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * Horizontal layout avatar uploader with modern UX patterns.
 * Features: drag-drop, hover overlay, image cropping, loading states.
 *
 * Props:
 * - avatarPreview: string | null
 * - initials: string
 * - onFileSelect: (file: File) => void
 * - onRemove: () => void
 * - error?: string
 * - acceptedFormats?: string
 * - animationDelay?: number
 * - enableCrop?: boolean
 * - isLoading?: boolean
 * - disabled?: boolean
 * - title?: string
 * - subtitle?: string
 */
const AvatarUploaderHorizontal: React.FC<AvatarUploaderHorizontalProps> = ({
  avatarPreview,
  initials,
  onFileSelect,
  onRemove,
  error,
  acceptedFormats = "image/png,image/jpeg,image/jpg,image/webp",
  animationDelay = 0.1,
  enableCrop = true,
  isLoading = false,
  disabled = false,
  title = "Profile photo",
  subtitle = "PNG, JPG or WebP up to 5MB",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled]);

  const processFile = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (enableCrop && typeof result === 'string') {
        setTempImage(result);
        setCropPosition({ x: 0, y: 0 });
        setZoom(1);
        setShowCropModal(true);
      } else {
        onFileSelect(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleCropConfirm = () => {
    if (!tempImage) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      const cropSize = Math.min(img.width, img.height) / zoom;
      const startX = (img.width - cropSize) / 2 - (cropPosition.x * img.width / 100);
      const startY = (img.height - cropSize) / 2 - (cropPosition.y * img.height / 100);
      
      canvas.width = 400;
      canvas.height = 400;
      
      ctx?.drawImage(
        img,
        Math.max(0, startX),
        Math.max(0, startY),
        cropSize,
        cropSize,
        0, 0, 400, 400
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          onFileSelect(file);
        }
        setShowCropModal(false);
        setTempImage(null);
      }, "image/jpeg", 0.9);
    };
    
    img.src = tempImage;
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setTempImage(null);
    setCropPosition({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropDrag = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...cropPosition };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / 3;
      const deltaY = (moveEvent.clientY - startY) / 3;
      setCropPosition({
        x: Math.max(-30, Math.min(30, startPos.x + deltaX)),
        y: Math.max(-30, Math.min(30, startPos.y + deltaY)),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      <motion.div
        ref={dropZoneRef}
        className={`
          relative flex gap-6 items-center p-5 rounded-2xl
          border-2 border-dashed transition-all duration-300
          ${isDragging 
            ? "border-emerald-500/60 bg-emerald-500/5" 
            : "border-zinc-700/50 hover:border-zinc-600/70 bg-zinc-900/30"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Avatar Circle */}
        <motion.div
          className="relative shrink-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            className={`
              relative w-24 h-24 rounded-full cursor-pointer overflow-hidden
              ring-2 transition-all duration-300
              ${isDragging 
                ? "ring-emerald-400/60 ring-offset-2 ring-offset-zinc-900" 
                : "ring-zinc-700/50 hover:ring-zinc-500"
              }
            `}
            onClick={() => !disabled && fileInputRef.current?.click()}
            whileTap={{ scale: 0.97 }}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />
            
            {/* Content */}
            {avatarPreview ? (
              <motion.img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative z-10">
                <span className="text-2xl font-bold text-zinc-400/80 tracking-wider select-none">
                  {initials}
                </span>
              </div>
            )}

            {/* Hover Overlay */}
            <AnimatePresence>
              {(isHovered || isDragging) && !disabled && (
                <motion.div
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CameraIcon className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Remove Button */}
          <AnimatePresence>
            {avatarPreview && !disabled && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="
                  absolute -top-1 -right-1 z-40
                  w-6 h-6 rounded-full
                  bg-red-500 hover:bg-red-600
                  flex items-center justify-center
                  shadow-lg transition-colors
                "
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XIcon className="w-3 h-3 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info & Actions */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-200 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="
                inline-flex items-center gap-2 px-4 py-2.5
                bg-zinc-800 hover:bg-zinc-700
                border border-zinc-700 hover:border-zinc-600
                rounded-xl text-sm font-medium text-zinc-200
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UploadCloudIcon className="w-4 h-4" />
              Upload
            </motion.button>

            {avatarPreview && (
              <motion.button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="
                  inline-flex items-center gap-2 px-4 py-2.5
                  bg-red-500/10 hover:bg-red-500/20
                  border border-red-500/30 hover:border-red-500/50
                  rounded-xl text-sm font-medium text-red-400
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TrashIcon className="w-4 h-4" />
                Remove
              </motion.button>
            )}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-sm text-red-400"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Drag Indicator */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-emerald-400 font-medium flex items-center gap-2">
                <UploadCloudIcon className="w-6 h-6" />
                Drop your image here
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </motion.div>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropModal && tempImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={handleCropCancel}
            />

            <motion.div
              className="relative z-10 w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="px-6 py-4 border-b border-zinc-800">
                <h3 className="text-lg font-semibold text-white">Crop your photo</h3>
                <p className="text-sm text-zinc-400 mt-0.5">Drag to reposition • Use slider to zoom</p>
              </div>

              <div className="relative aspect-square bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div 
                    className="rounded-full border-2 border-white/30"
                    style={{ 
                      width: "75%", 
                      height: "75%",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)"
                    }}
                  />
                </div>

                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-move"
                  onMouseDown={handleCropDrag}
                >
                  <img
                    src={tempImage}
                    alt="Crop preview"
                    className="max-w-none select-none"
                    style={{
                      transform: `translate(${cropPosition.x}%, ${cropPosition.y}%) scale(${zoom})`,
                      transition: "transform 0.1s ease-out",
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-800">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    <ZoomOutIcon className="w-5 h-5" />
                  </button>
                  
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-white"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    <ZoomInIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AvatarUploaderHorizontal;