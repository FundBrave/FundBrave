/**
 * Search utility functions
 * Helpers for transforming search data between formats
 */

import { SearchCampaign } from '@/lib/api/search';
import { CampaignCardProps } from '@/app/components/campaigns/CampaignCard';

/**
 * Convert SearchCampaign to CampaignCardProps for UI rendering
 */
export function searchCampaignToCampaignCard(campaign: SearchCampaign): CampaignCardProps {
  return {
    id: campaign.id,
    title: campaign.title,
    imageUrl: campaign.imageUrl || '/images/placeholder-campaign.jpg',
    donorsCount: 0, // Not available in search results - would need separate API call
    amountRaised: parseFloat(campaign.amountRaised),
    targetAmount: campaign.targetAmount,
    currency: 'USD',
    status: campaign.status,
    category: campaign.category as any, // Type assertion needed due to category string flexibility
  };
}

/**
 * Calculate progress percentage for a campaign
 */
export function calculateProgress(amountRaised: string | number, targetAmount: number): number {
  const raised = typeof amountRaised === 'string' ? parseFloat(amountRaised) : amountRaised;
  return Math.min(Math.round((raised / targetAmount) * 100), 100);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: string | number, currency = 'USD'): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers with abbreviations (1K, 1M, etc.)
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}
