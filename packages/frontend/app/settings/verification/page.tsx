"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Camera
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
type DocumentType = "passport" | "drivers_license" | "national_id";

interface VerificationData {
  status: VerificationStatus;
  documentType?: DocumentType;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export default function VerificationPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Mock verification status - Replace with actual query
  const [verificationData, setVerificationData] = useState<VerificationData>({
    status: "unverified",
  });

  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("passport");
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!frontImageFile || !selfieFile) {
      alert("Please upload all required documents");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual verification submission
      // const formData = new FormData();
      // formData.append("documentType", selectedDocType);
      // formData.append("frontImage", frontImageFile);
      // if (backImageFile) formData.append("backImage", backImageFile);
      // formData.append("selfie", selfieFile);
      // await submitVerification(formData);

      // Mock submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVerificationData({
        status: "pending",
        documentType: selectedDocType,
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Verification submission error:", error);
      alert("Failed to submit verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Verified</span>
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Pending Review</span>
          </div>
        );
      case "rejected":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-error/10 text-error border border-error/20">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Unverified</span>
          </div>
        );
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to access verification settings
            </p>
            <Button onClick={() => router.push("/auth")}>Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Identity Verification</h1>
              <p className="text-text-secondary">Verify your identity to unlock premium features</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-4">
            {getStatusBadge(verificationData.status)}
            {verificationData.status === "verified" && (
              <span className="text-sm text-text-tertiary">
                Verified on {new Date(verificationData.reviewedAt!).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Benefits of Verification</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Unlock higher donation limits</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Access to exclusive verified-only campaigns</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Increased trust badge on your profile</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Priority support from FundBrave team</span>
            </li>
          </ul>
        </div>

        {/* Verification Form */}
        {verificationData.status === "unverified" || verificationData.status === "rejected" ? (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Submit Verification Documents</h3>

            {/* Rejected reason */}
            {verificationData.status === "rejected" && verificationData.rejectionReason && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-error mb-1">Previous submission rejected</p>
                    <p className="text-sm text-text-secondary">{verificationData.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Document Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "passport", label: "Passport", icon: FileText },
                  { value: "drivers_license", label: "Driver's License", icon: FileText },
                  { value: "national_id", label: "National ID", icon: FileText },
                ].map((doc) => (
                  <button
                    key={doc.value}
                    onClick={() => setSelectedDocType(doc.value as DocumentType)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      selectedDocType === doc.value
                        ? "border-primary bg-primary/5"
                        : "border-border-subtle hover:border-border-default"
                    )}
                  >
                    <doc.icon className="w-5 h-5 mb-2 text-foreground" />
                    <div className="text-sm font-medium text-foreground">{doc.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-4 mb-6">
              {/* Front Image */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Document Front Side *
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-primary transition-colors">
                  {frontImageFile ? (
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                      <p className="text-sm text-foreground font-medium">{frontImageFile.name}</p>
                      <p className="text-xs text-text-tertiary">{(frontImageFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-foreground">Click to upload front side</p>
                      <p className="text-xs text-text-tertiary">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, setFrontImageFile)}
                  />
                </label>
              </div>

              {/* Back Image (Optional for passport) */}
              {selectedDocType !== "passport" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Document Back Side {selectedDocType === "passport" ? "(Optional)" : "*"}
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-primary transition-colors">
                    {backImageFile ? (
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                        <p className="text-sm text-foreground font-medium">{backImageFile.name}</p>
                        <p className="text-xs text-text-tertiary">{(backImageFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                        <p className="text-sm text-foreground">Click to upload back side</p>
                        <p className="text-xs text-text-tertiary">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, setBackImageFile)}
                    />
                  </label>
                </div>
              )}

              {/* Selfie */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Selfie with Document *
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-primary transition-colors">
                  {selfieFile ? (
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                      <p className="text-sm text-foreground font-medium">{selfieFile.name}</p>
                      <p className="text-xs text-text-tertiary">{(selfieFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-foreground">Click to upload selfie</p>
                      <p className="text-xs text-text-tertiary">Hold document next to your face</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, setSelfieFile)}
                  />
                </label>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary">
                  <p className="font-medium text-blue-400 mb-1">Privacy & Security</p>
                  <p>
                    Your documents are encrypted and stored securely. They will only be used for verification
                    purposes and will never be shared with third parties. We comply with GDPR and international
                    data protection regulations.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!frontImageFile || !selfieFile || isSubmitting || (selectedDocType !== "passport" && !backImageFile)}
              fullWidth
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        ) : verificationData.status === "pending" ? (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-12 text-center">
            <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Verification in Progress</h3>
            <p className="text-text-secondary mb-6">
              Your documents are being reviewed by our team. This usually takes 1-3 business days.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-sunken rounded-lg text-sm text-text-secondary">
              <span>Submitted on {new Date(verificationData.submittedAt!).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-success/10 to-green-500/10 border border-success/20 rounded-xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Verification Complete!</h3>
            <p className="text-text-secondary mb-6">
              Your identity has been verified. You now have access to all premium features.
            </p>
            <Button onClick={() => router.push("/profile")}>Go to Profile</Button>
          </div>
        )}
      </div>
    </div>
  );
}
