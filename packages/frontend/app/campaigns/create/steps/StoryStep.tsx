"use client";

import { useCallback } from "react";
import type { StepProps } from "../types";
import type { VerificationResult } from "../ImageUploadWithVerification";
import { InputField, TextAreaField } from "../fields";
import { ImageUploadWithVerification } from "../ImageUploadWithVerification";

export function StoryStep({ formData, setFormData, errors }: StepProps) {
  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: e.target?.result as string,
          imageVerificationResult: null,
        }));
      };
      reader.readAsDataURL(file);
    },
    [setFormData]
  );

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
      imageVerificationResult: null,
    }));
  }, [setFormData]);

  const handleVerificationComplete = useCallback(
    (result: VerificationResult) => {
      setFormData((prev) => ({
        ...prev,
        imageVerificationResult: result,
      }));
    },
    [setFormData]
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Tell Your Story
        </h2>
        <p className="text-text-secondary">
          Share why this campaign matters and how donations will make a difference.
        </p>
      </div>

      <ImageUploadWithVerification
        image={
          formData.imagePreview
            ? { file: formData.imageFile, preview: formData.imagePreview }
            : null
        }
        onFileSelect={handleFileSelect}
        onRemove={handleRemoveImage}
        onVerificationComplete={handleVerificationComplete}
        campaignName={formData.title}
        campaignDescription={formData.description}
        blockSuspicious={true}
        verificationRequired={true}
        isVerifiedUser={false}
        error={errors.image}
      />

      <TextAreaField
        label="Campaign Description"
        value={formData.description}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
        placeholder="Tell potential donors about your cause, why you're fundraising, and how their contributions will be used..."
        error={errors.description}
        required
        maxLength={10000}
        minLength={100}
        rows={8}
        id="campaign-description"
      />

      <InputField
        label="Video URL"
        value={formData.videoUrl}
        onChange={(value) => setFormData((prev) => ({ ...prev, videoUrl: value }))}
        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
        error={errors.videoUrl}
        helpText="Add a YouTube or Vimeo video to help tell your story (optional)"
        id="campaign-video"
      />
    </div>
  );
}
