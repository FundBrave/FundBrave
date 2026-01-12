import { z } from 'zod';

export const campaignUpdateSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be under 100 characters'),
  content: z
    .string()
    .min(20, 'Update must be at least 20 characters')
    .max(5000, 'Update must be under 5,000 characters'),
  imageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  notifyDonors: z.boolean().default(true),
});

export type CampaignUpdateData = z.infer<typeof campaignUpdateSchema>;

/**
 * Validation helper to get field-specific errors
 * Note: Zod 4 uses .issues instead of .errors
 */
export function validateUpdateField(
  field: keyof CampaignUpdateData,
  value: unknown
): string | undefined {
  const partialSchema = campaignUpdateSchema.pick({ [field]: true } as Record<keyof CampaignUpdateData, true>);
  const result = partialSchema.safeParse({ [field]: value });

  if (!result.success) {
    return result.error.issues[0]?.message;
  }
  return undefined;
}

/**
 * Validate all update form data
 * Note: Zod 4 uses .issues instead of .errors
 */
export function validateUpdateForm(data: Partial<CampaignUpdateData>): {
  success: boolean;
  errors: Partial<Record<keyof CampaignUpdateData, string>>;
  data?: CampaignUpdateData;
} {
  const result = campaignUpdateSchema.safeParse(data);

  if (result.success) {
    return { success: true, errors: {}, data: result.data };
  }

  const errors: Partial<Record<keyof CampaignUpdateData, string>> = {};
  result.error.issues.forEach((issue: z.ZodIssue) => {
    const field = issue.path[0] as keyof CampaignUpdateData;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  });

  return { success: false, errors };
}
