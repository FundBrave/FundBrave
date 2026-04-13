"use client";

import type { StepProps } from "../types";
import { InputField, SelectField } from "../fields";
import { GoalAmountInput } from "../GoalAmountInput";
import { CAMPAIGN_CATEGORIES } from "../schemas";

export function BasicsStep({ formData, setFormData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Campaign Basics
        </h2>
        <p className="text-text-secondary">
          Start with the essential details of your fundraising campaign.
        </p>
      </div>

      <InputField
        label="Campaign Title"
        value={formData.title}
        onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
        placeholder="e.g., Help Build a School in Ghana"
        error={errors.title}
        required
        maxLength={80}
        helpText="A clear, compelling title helps people understand your cause"
        id="campaign-title"
      />

      <SelectField
        label="Category"
        value={formData.category}
        onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
        options={CAMPAIGN_CATEGORIES}
        placeholder="Select a category"
        error={errors.category}
        required
        id="campaign-category"
      />

      <GoalAmountInput
        value={formData.goalAmount}
        currency={formData.currency}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, goalAmount: value }))}
        onCurrencyChange={(currency) => setFormData((prev) => ({ ...prev, currency }))}
        error={errors.goalAmount}
      />
    </div>
  );
}
