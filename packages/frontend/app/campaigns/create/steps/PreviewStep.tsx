"use client";

import type { CampaignFormData } from "../types";
import { CampaignPreviewCard } from "../CampaignPreviewCard";

interface PreviewStepProps {
  formData: CampaignFormData;
  onEdit: (step: number) => void;
}

export function PreviewStep({ formData, onEdit }: PreviewStepProps) {
  return (
    <CampaignPreviewCard
      data={{
        title: formData.title,
        category: formData.category,
        goalAmount: formData.goalAmount,
        currency: formData.currency,
        description: formData.description,
        imagePreview: formData.imagePreview,
        duration: formData.duration,
        beneficiaryType: formData.beneficiaryType,
        beneficiaryName: formData.beneficiaryName,
        beneficiaryWallet: formData.beneficiaryWallet,
      }}
      onEdit={onEdit}
    />
  );
}
