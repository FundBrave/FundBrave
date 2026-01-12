"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Plus, X } from "@/app/components/ui/icons";
import {
  campaignUpdateSchema,
  type CampaignUpdateData,
  validateUpdateForm,
} from "./schemas";

export interface UpdateFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: CampaignUpdateData) => Promise<void> | void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Initial values for editing an existing update */
  initialValues?: Partial<CampaignUpdateData>;
  /** Whether the form is in loading state */
  isLoading?: boolean;
}

interface FieldErrors {
  title?: string;
  content?: string;
  imageUrl?: string;
}

/**
 * UpdateForm - Form component for creating/editing campaign updates
 * Features:
 * - Title input with character counter
 * - Content textarea with min/max validation
 * - Optional image URL attachment
 * - Notify donors checkbox
 * - Form validation with error feedback
 */
export function UpdateForm({
  onSubmit,
  onCancel,
  initialValues,
  isLoading = false,
}: UpdateFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [notifyDonors, setNotifyDonors] = useState(
    initialValues?.notifyDonors ?? true
  );
  const [showImageInput, setShowImageInput] = useState(!!initialValues?.imageUrl);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus title input on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Character counts
  const titleCharCount = title.length;
  const contentCharCount = content.length;
  const TITLE_MAX = 100;
  const CONTENT_MIN = 20;
  const CONTENT_MAX = 5000;

  // Validate a single field
  const validateField = useCallback(
    (field: keyof CampaignUpdateData, value: string | boolean) => {
      const formData: Partial<CampaignUpdateData> = {
        title,
        content,
        imageUrl: imageUrl || undefined,
        notifyDonors,
        [field]: value,
      };

      const result = validateUpdateForm(formData);
      return result.errors[field];
    },
    [title, content, imageUrl, notifyDonors]
  );

  // Handle blur to show validation
  const handleBlur = useCallback(
    (field: keyof CampaignUpdateData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const value =
        field === "title"
          ? title
          : field === "content"
          ? content
          : field === "imageUrl"
          ? imageUrl
          : notifyDonors;

      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [title, content, imageUrl, notifyDonors, validateField]
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: CampaignUpdateData = {
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      notifyDonors,
    };

    // Validate with Zod (Zod 4 uses .issues instead of .errors)
    const parseResult = campaignUpdateSchema.safeParse(formData);

    if (!parseResult.success) {
      const newErrors: FieldErrors = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      });
      setErrors(newErrors);
      setTouched({ title: true, content: true, imageUrl: true });

      // Shake animation on error
      if (formRef.current) {
        gsap.to(formRef.current, {
          keyframes: [
            { x: -8, duration: 0.06 },
            { x: 8, duration: 0.06 },
            { x: -6, duration: 0.06 },
            { x: 6, duration: 0.06 },
            { x: -3, duration: 0.06 },
            { x: 0, duration: 0.06 },
          ],
          ease: "power2.inOut",
        });
      }
      return;
    }

    try {
      await onSubmit(parseResult.data);
    } catch (error) {
      console.error("Failed to submit update:", error);
    }
  };

  // Toggle image input visibility
  const handleToggleImage = () => {
    if (showImageInput) {
      setImageUrl("");
      setShowImageInput(false);
    } else {
      setShowImageInput(true);
    }
  };

  // Check if form is valid for submission
  const isFormValid =
    title.trim().length >= 5 &&
    title.trim().length <= TITLE_MAX &&
    content.trim().length >= CONTENT_MIN &&
    content.trim().length <= CONTENT_MAX;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
    >
      {/* Title Field */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="update-title"
            className="text-sm font-medium text-foreground"
          >
            Update Title <span className="text-destructive">*</span>
          </label>
          <span
            className={cn(
              "text-xs transition-colors",
              titleCharCount > TITLE_MAX
                ? "text-destructive"
                : "text-text-tertiary"
            )}
          >
            {titleCharCount}/{TITLE_MAX}
          </span>
        </div>
        <input
          ref={titleInputRef}
          id="update-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (touched.title) {
              setErrors((prev) => ({
                ...prev,
                title: validateField("title", e.target.value),
              }));
            }
          }}
          onBlur={() => handleBlur("title")}
          placeholder="Give your update a title"
          maxLength={TITLE_MAX + 10} // Allow slight overflow for UX
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-surface-sunken border border-border-subtle",
            "text-foreground placeholder:text-text-tertiary",
            "text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200 min-h-[48px]",
            errors.title && touched.title && "border-destructive ring-destructive/20"
          )}
          aria-invalid={!!(errors.title && touched.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <AnimatePresence>
          {errors.title && touched.title && (
            <motion.p
              id="title-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-destructive"
              role="alert"
            >
              {errors.title}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content Field */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="update-content"
            className="text-sm font-medium text-foreground"
          >
            Update Content <span className="text-destructive">*</span>
          </label>
          <span
            className={cn(
              "text-xs transition-colors",
              contentCharCount > CONTENT_MAX
                ? "text-destructive"
                : contentCharCount > 0 && contentCharCount < CONTENT_MIN
                ? "text-yellow-500"
                : "text-text-tertiary"
            )}
          >
            {contentCharCount}/{CONTENT_MAX}
          </span>
        </div>
        <textarea
          ref={contentRef}
          id="update-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (touched.content) {
              setErrors((prev) => ({
                ...prev,
                content: validateField("content", e.target.value),
              }));
            }
          }}
          onBlur={() => handleBlur("content")}
          placeholder="Share exciting news, thank your donors, or provide progress updates..."
          rows={6}
          className={cn(
            "w-full px-4 py-3 rounded-xl resize-none",
            "bg-surface-sunken border border-border-subtle",
            "text-foreground placeholder:text-text-tertiary",
            "text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200 min-h-[150px]",
            errors.content && touched.content && "border-destructive ring-destructive/20"
          )}
          aria-invalid={!!(errors.content && touched.content)}
          aria-describedby={errors.content ? "content-error" : "content-hint"}
        />
        <div className="flex items-center justify-between">
          <span id="content-hint" className="text-xs text-text-tertiary">
            {CONTENT_MIN} chars min
          </span>
        </div>
        <AnimatePresence>
          {errors.content && touched.content && (
            <motion.p
              id="content-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-destructive"
              role="alert"
            >
              {errors.content}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Image Attachment */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Attach Image (optional)
        </span>
        <AnimatePresence mode="wait">
          {showImageInput ? (
            <motion.div
              key="image-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <input
                id="update-image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onBlur={() => handleBlur("imageUrl")}
                placeholder="https://example.com/image.jpg"
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl",
                  "bg-surface-sunken border border-border-subtle",
                  "text-foreground placeholder:text-text-tertiary",
                  "text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-all duration-200 min-h-[48px]",
                  errors.imageUrl && touched.imageUrl && "border-destructive"
                )}
                aria-invalid={!!(errors.imageUrl && touched.imageUrl)}
                aria-describedby={errors.imageUrl ? "image-error" : undefined}
              />
              <button
                type="button"
                onClick={handleToggleImage}
                className="p-3 rounded-xl border border-border-subtle hover:bg-surface-overlay transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Remove image"
              >
                <X size={18} className="text-text-secondary" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="add-image"
              type="button"
              onClick={handleToggleImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl",
                "border border-dashed border-border-subtle",
                "text-text-secondary text-sm font-medium",
                "hover:bg-surface-overlay hover:border-primary/50 transition-colors",
                "min-h-[48px]"
              )}
            >
              <Plus size={18} />
              Add Image
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {errors.imageUrl && touched.imageUrl && (
            <motion.p
              id="image-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-destructive"
              role="alert"
            >
              {errors.imageUrl}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Notify Donors Checkbox */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border-subtle bg-surface-sunken">
        <input
          id="notify-donors"
          type="checkbox"
          checked={notifyDonors}
          onChange={(e) => setNotifyDonors(e.target.checked)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded border-2 border-border-subtle",
            "text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
            "cursor-pointer accent-primary",
            "min-w-[20px] min-h-[20px]"
          )}
        />
        <label
          htmlFor="notify-donors"
          className="text-sm text-foreground cursor-pointer select-none"
        >
          Notify donors about this update
          <span className="block text-xs text-text-tertiary mt-0.5">
            Send an email notification to all campaign supporters
          </span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onCancel}
          disabled={isLoading}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          loadingText="Posting..."
          disabled={!isFormValid || isLoading}
          className="min-w-[120px]"
        >
          Post Update
        </Button>
      </div>
    </form>
  );
}

export default UpdateForm;
