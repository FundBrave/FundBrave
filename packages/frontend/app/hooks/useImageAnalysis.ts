/**
 * useImageAnalysis Hook
 *
 * Provides image content analysis for appropriateness checking.
 * Integrates with the AI service image analysis endpoint.
 */

import { useState, useCallback } from 'react';
import {
  aiServiceUpload,
  ImageAnalysisResponse,
  CoherenceCheckResponse,
} from '@/app/lib/ai-service';

export interface ImageAnalysisState {
  isAnalyzing: boolean;
  result: ImageAnalysisResponse | null;
  coherenceResult: CoherenceCheckResponse | null;
  error: string | null;
}

export interface UseImageAnalysisReturn extends ImageAnalysisState {
  analyzeImage: (
    file: File,
    campaignName?: string,
    campaignDescription?: string
  ) => Promise<ImageAnalysisResponse>;
  checkCoherence: (
    file: File,
    description: string
  ) => Promise<CoherenceCheckResponse>;
  reset: () => void;
}

/**
 * Hook for image content analysis and appropriateness checking
 *
 * @example
 * ```tsx
 * const { analyzeImage, isAnalyzing, result } = useImageAnalysis();
 *
 * const handleImageUpload = async (file: File) => {
 *   const result = await analyzeImage(file, 'Campaign Name', 'Description');
 *   if (!result.is_appropriate) {
 *     alert('Image content is not appropriate');
 *   }
 * };
 * ```
 */
export function useImageAnalysis(): UseImageAnalysisReturn {
  const [state, setState] = useState<ImageAnalysisState>({
    isAnalyzing: false,
    result: null,
    coherenceResult: null,
    error: null,
  });

  /**
   * Analyze an image for content and appropriateness
   */
  const analyzeImage = useCallback(
    async (
      file: File,
      campaignName?: string,
      campaignDescription?: string
    ): Promise<ImageAnalysisResponse> => {
      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (campaignName) {
          formData.append('campaign_name', campaignName);
        }
        if (campaignDescription) {
          formData.append('campaign_description', campaignDescription);
        }

        const result = await aiServiceUpload<ImageAnalysisResponse>(
          '/api/media/analyze',
          formData
        );

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          result,
          error: null,
        }));

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Image analysis failed';
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Check if image matches its claimed description
   */
  const checkCoherence = useCallback(
    async (file: File, description: string): Promise<CoherenceCheckResponse> => {
      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);

        const result = await aiServiceUpload<CoherenceCheckResponse>(
          '/api/media/coherence',
          formData
        );

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          coherenceResult: result,
          error: null,
        }));

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Coherence check failed';
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Reset the analysis state
   */
  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      result: null,
      coherenceResult: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeImage,
    checkCoherence,
    reset,
  };
}

/**
 * Get appropriateness status label
 */
export function getAppropriatenessLabel(isAppropriate: boolean, confidence: number): string {
  if (isAppropriate) {
    if (confidence >= 0.9) return 'Appropriate';
    if (confidence >= 0.7) return 'Likely Appropriate';
    return 'May Be Appropriate';
  } else {
    if (confidence >= 0.9) return 'Inappropriate';
    if (confidence >= 0.7) return 'Likely Inappropriate';
    return 'May Be Inappropriate';
  }
}

/**
 * Get appropriateness status color
 */
export function getAppropriatenessColor(isAppropriate: boolean, confidence: number): string {
  if (isAppropriate) {
    if (confidence >= 0.7) return 'text-green-500';
    return 'text-yellow-500';
  } else {
    if (confidence >= 0.7) return 'text-red-500';
    return 'text-orange-500';
  }
}

export default useImageAnalysis;
