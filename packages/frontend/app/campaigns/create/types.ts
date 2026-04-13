import type { Currency, BeneficiaryType } from "./schemas";
import type { VerificationResult } from "./ImageUploadWithVerification";

export interface CampaignFormData {
  // Step 1: Basics
  title: string;
  category: string;
  goalAmount: string;
  currency: Currency;
  // Step 2: Story
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  imageVerificationResult: VerificationResult | null;
  videoUrl: string;
  // Step 3: Details
  duration: string;
  isCustomDuration: boolean;
  customEndDate: Date | null;
  beneficiaryType: BeneficiaryType;
  beneficiaryName: string;
  beneficiaryRelationship: string;
  organizationTaxId: string;
  beneficiaryWallet: string;
  showDonorNames: boolean;
  showDonationAmounts: boolean;
  allowAnonymousDonations: boolean;
  // Metadata
  acceptTerms: boolean;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface StepProps {
  formData: CampaignFormData;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>;
  errors: FormErrors;
}
