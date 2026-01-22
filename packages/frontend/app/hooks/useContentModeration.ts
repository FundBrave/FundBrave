/**
 * useContentModeration Hook
 *
 * Provides content moderation functionality for user-generated content.
 * Integrates with the AI service moderation endpoint.
 */

import { useState, useCallback } from 'react';
import {
  aiServiceFetch,
  ModerationRequest,
  ModerationResponse,
} from '@/app/lib/ai-service';

export interface ContentModerationState {
  isChecking: boolean;
  result: ModerationResponse | null;
  error: string | null;
}

export interface UseContentModerationReturn extends ContentModerationState {
  checkContent: (
    content: string,
    contentType: ModerationRequest['content_type'],
    contentId?: string
  ) => Promise<ModerationResponse>;
  reset: () => void;
}

/**
 * Hook for content moderation
 *
 * @example
 * ```tsx
 * const { checkContent, isChecking, result } = useContentModeration();
 *
 * const handlePostSubmit = async (content: string) => {
 *   const result = await checkContent(content, 'user_message');
 *   if (!result.is_safe) {
 *     // Show warning to user
 *   }
 * };
 * ```
 */
export function useContentModeration(): UseContentModerationReturn {
  const [state, setState] = useState<ContentModerationState>({
    isChecking: false,
    result: null,
    error: null,
  });

  /**
   * Check content for policy violations
   */
  const checkContent = useCallback(
    async (
      content: string,
      contentType: ModerationRequest['content_type'],
      contentId?: string
    ): Promise<ModerationResponse> => {
      setState((prev) => ({ ...prev, isChecking: true, error: null }));

      try {
        const request: ModerationRequest = {
          content,
          content_type: contentType,
          content_id: contentId,
        };

        const result = await aiServiceFetch<ModerationResponse>('/api/advanced/moderate', {
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
        const errorMessage = err instanceof Error ? err.message : 'Moderation check failed';
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
   * Reset the moderation state
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
    checkContent,
    reset,
  };
}

/**
 * Get moderation action label for display
 */
export function getModerationActionLabel(action: ModerationResponse['action']): string {
  switch (action) {
    case 'approve':
      return 'Approved';
    case 'flag':
      return 'Flagged for Review';
    case 'reject':
      return 'Rejected';
    case 'quarantine':
      return 'Under Review';
    default:
      return 'Unknown';
  }
}

/**
 * Get moderation action color for UI styling
 */
export function getModerationActionColor(action: ModerationResponse['action']): string {
  switch (action) {
    case 'approve':
      return 'text-green-500';
    case 'flag':
      return 'text-yellow-500';
    case 'reject':
      return 'text-red-500';
    case 'quarantine':
      return 'text-orange-500';
    default:
      return 'text-gray-500';
  }
}

export default useContentModeration;
