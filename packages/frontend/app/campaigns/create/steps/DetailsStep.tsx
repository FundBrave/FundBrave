"use client";

import { motion, AnimatePresence } from "motion/react";
import type { StepProps } from "../types";
import { DurationPicker } from "../DurationPicker";
import { BeneficiarySection } from "../BeneficiarySection";
import { WalletAddressInput } from "@/app/components/ui/form/WalletAddressInput";

export function DetailsStep({ formData, setFormData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Campaign Details
        </h2>
        <p className="text-text-secondary">
          Set the duration and beneficiary information for your campaign.
        </p>
      </div>

      <DurationPicker
        value={formData.duration}
        isCustom={formData.isCustomDuration}
        customEndDate={formData.customEndDate}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
        onCustomChange={(isCustom) => setFormData((prev) => ({ ...prev, isCustomDuration: isCustom }))}
        onEndDateChange={(date) => setFormData((prev) => ({ ...prev, customEndDate: date }))}
        error={errors.duration}
      />

      <div className="p-4 sm:p-6 bg-surface-sunken rounded-xl border border-border-subtle">
        <BeneficiarySection
          type={formData.beneficiaryType}
          name={formData.beneficiaryName}
          relationship={formData.beneficiaryRelationship}
          taxId={formData.organizationTaxId}
          onTypeChange={(type) => setFormData((prev) => ({ ...prev, beneficiaryType: type }))}
          onNameChange={(name) => setFormData((prev) => ({ ...prev, beneficiaryName: name }))}
          onRelationshipChange={(rel) => setFormData((prev) => ({ ...prev, beneficiaryRelationship: rel }))}
          onTaxIdChange={(taxId) => setFormData((prev) => ({ ...prev, organizationTaxId: taxId }))}
          errors={{
            name: errors.beneficiaryName,
            relationship: errors.beneficiaryRelationship,
            taxId: errors.organizationTaxId,
          }}
        />
      </div>

      <WalletAddressInput
        value={formData.beneficiaryWallet}
        onChange={(value) => setFormData((prev) => ({ ...prev, beneficiaryWallet: value }))}
        error={errors.beneficiaryWallet}
        label="Receiving Wallet Address"
        required
      />

      {/* Privacy toggles */}
      <fieldset className="p-4 bg-surface-sunken rounded-xl border border-border-subtle space-y-4">
        <legend className="font-medium text-foreground text-sm">Privacy Settings</legend>

        <label htmlFor="show-donor-names" className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-text-secondary">Show donor names publicly</span>
          <input
            id="show-donor-names"
            type="checkbox"
            checked={formData.showDonorNames}
            onChange={(e) => setFormData((prev) => ({ ...prev, showDonorNames: e.target.checked }))}
            className="w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label htmlFor="show-donation-amounts" className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-text-secondary">Show donation amounts publicly</span>
          <input
            id="show-donation-amounts"
            type="checkbox"
            checked={formData.showDonationAmounts}
            onChange={(e) => setFormData((prev) => ({ ...prev, showDonationAmounts: e.target.checked }))}
            className="w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label htmlFor="allow-anonymous" className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-text-secondary">Allow anonymous donations</span>
          <input
            id="allow-anonymous"
            type="checkbox"
            checked={formData.allowAnonymousDonations}
            onChange={(e) => setFormData((prev) => ({ ...prev, allowAnonymousDonations: e.target.checked }))}
            className="w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary/50"
          />
        </label>
      </fieldset>

      {/* Terms acceptance */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, acceptTerms: e.target.checked }))
          }
          aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
          className="mt-1 w-5 h-5 rounded border-2 border-border-subtle bg-surface-sunken text-primary focus:ring-2 focus:ring-primary-500/50"
        />
        <span className="text-sm text-text-secondary leading-relaxed">
          I confirm that the information provided is accurate and I agree to
          FundBrave&apos;s{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      <AnimatePresence>
        {errors.acceptTerms && (
          <motion.p
            id="terms-error"
            role="alert"
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {errors.acceptTerms}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
