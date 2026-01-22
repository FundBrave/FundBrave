/**
 * useFraudDetection Hook
 *
 * Provides fraud detection functionality for campaigns.
 * Integrates with the AI service fraud detection endpoint.
 */

import { useState, useCallback } from 'react';
import {
  aiServiceFetch,
  FraudCheckRequest,
  FraudCheckResponse,
} from '@/app/lib/ai-service';

export interface FraudDetectionState {
  isChecking: boolean;
  result: FraudCheckResponse | null;
  error: string | null;
}

export interface UseFraudDetectionReturn extends FraudDetectionState {
  analyzeCampaign: (request: FraudCheckRequest) => Promise<FraudCheckResponse>;
  reset: () => void;
}

/**
 * Hook for fraud detection on campaigns
 *
 * @example
 * ```tsx
 * const { analyzeCampaign, isChecking, result } = useFraudDetection();
 *
 * const handleCampaignAnalysis = async () => {
 *   const result = await analyzeCampaign({
 *     campaign_id: 'abc123',
 *     name: 'Campaign Name',
 *     description: 'Description',
 *     creator_id: 'user123',
 *     goal_amount: 10000,
 *     category: 'Medical',
 *   });
 *
 *   if (result.risk_level === 'high' || result.risk_level === 'critical') {
 *     // Show fraud warning
 *   }
 * };
 * ```
 */
export function useFraudDetection(): UseFraudDetectionReturn {
  const [state, setState] = useState<FraudDetectionState>({
    isChecking: false,
    result: null,
    error: null,
  });

  /**
   * Analyze a campaign for potential fraud
   */
  const analyzeCampaign = useCallback(
    async (request: FraudCheckRequest): Promise<FraudCheckResponse> => {
      setState((prev) => ({ ...prev, isChecking: true, error: null }));

      try {
        const result = await aiServiceFetch<FraudCheckResponse>('/api/advanced/fraud/analyze', {
          method: 'POST',
          body: JSON.stringify(request),
        });

        setState({
          isChecking: false,
          result,
          error: null,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Fraud analysis failed';
        setState((prev) => ({
          ...prev,
          isChecking: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Reset the fraud detection state
   */
  const reset = useCallback(() => {
    setState({
      isChecking: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeCampaign,
    reset,
  };
}

/**
 * Get risk level label for display
 */
export function getRiskLevelLabel(riskLevel: FraudCheckResponse['risk_level']): string {
  switch (riskLevel) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical Risk';
    default:
      return 'Unknown';
  }
}

/**
 * Get risk level color for UI styling
 */
export function getRiskLevelColor(riskLevel: FraudCheckResponse['risk_level']): string {
  switch (riskLevel) {
    case 'low':
      return 'text-green-500';
    case 'medium':
      return 'text-yellow-500';
    case 'high':
      return 'text-orange-500';
    case 'critical':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get risk level background color
 */
export function getRiskLevelBgColor(riskLevel: FraudCheckResponse['risk_level']): string {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-500/10';
    case 'medium':
      return 'bg-yellow-500/10';
    case 'high':
      return 'bg-orange-500/10';
    case 'critical':
      return 'bg-red-500/10';
    default:
      return 'bg-gray-500/10';
  }
}

/**
 * Get indicator severity icon
 */
export function getIndicatorSeverityIcon(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
      return 'alert-triangle';
    case 'critical':
      return 'alert-octagon';
    default:
      return 'info';
  }
}

export default useFraudDetection;
