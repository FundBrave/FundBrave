/**
 * useDeepfakeDetection Hook
 *
 * Provides deepfake/media verification functionality for campaign images.
 * Integrates with the AI service media verification endpoint.
 */

import { useState, useCallback } from 'react';
import {
  AI_SERVICE_URL,
  aiServiceUpload,
  MediaVerificationResponse,
} from '@/app/lib/ai-service';

export interface DeepfakeDetectionState {
  isVerifying: boolean;
  result: MediaVerificationResponse | null;
  error: string | null;
}

export interface UseDeepfakeDetectionReturn extends DeepfakeDetectionState {
  verifyImage: (file: File, campaignId?: string) => Promise<MediaVerificationResponse>;
  verifyImageUrl: (imageUrl: string, campaignId?: string) => Promise<MediaVerificationResponse>;
  reset: () => void;
}

/**
 * Hook for deepfake detection on images
 *
 * @example
 * ```tsx
 * const { verifyImage, isVerifying, result, error } = useDeepfakeDetection();
 *
 * const handleImageUpload = async (file: File) => {
 *   try {
 *     const result = await verifyImage(file);
 *     if (!result.is_authentic) {
 *       alert('This image may be manipulated');
 *     }
 *   } catch (err) {
 *     console.error('Verification failed:', err);
 *   }
 * };
 * ```
 */
export function useDeepfakeDetection(): UseDeepfakeDetectionReturn {
  const [state, setState] = useState<DeepfakeDetectionState>({
    isVerifying: false,
    result: null,
    error: null,
  });

  /**
   * Verify an image file for deepfake/manipulation
   */
  const verifyImage = useCallback(
    async (file: File, campaignId?: string): Promise<MediaVerificationResponse> => {
      setState((prev) => ({ ...prev, isVerifying: true, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (campaignId) {
          formData.append('campaign_id', campaignId);
        }

        const result = await aiServiceUpload<MediaVerificationResponse>(
          '/api/media',
          formData
        );

        setState({
          isVerifying: false,
          result,
          error: null,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setState((prev) => ({
          ...prev,
          isVerifying: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Verify an image from URL (fetches and sends to verification)
   */
  const verifyImageUrl = useCallback(
    async (imageUrl: string, campaignId?: string): Promise<MediaVerificationResponse> => {
      setState((prev) => ({ ...prev, isVerifying: true, error: null }));

      try {
        // Fetch the image from URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch image from URL');
        }

        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });

        return verifyImage(file, campaignId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setState((prev) => ({
          ...prev,
          isVerifying: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [verifyImage]
  );

  /**
   * Reset the verification state
   */
  const reset = useCallback(() => {
    setState({
      isVerifying: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    verifyImage,
    verifyImageUrl,
    reset,
  };
}

export default useDeepfakeDetection;
