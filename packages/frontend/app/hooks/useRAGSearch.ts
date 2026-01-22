/**
 * useRAGSearch Hook
 *
 * Provides RAG (Retrieval Augmented Generation) search functionality.
 * Integrates with the AI service RAG query endpoint.
 */

import { useState, useCallback } from 'react';
import {
  aiServiceFetch,
  RAGQueryRequest,
  RAGQueryResponse,
} from '@/app/lib/ai-service';

export interface RAGSearchState {
  isSearching: boolean;
  result: RAGQueryResponse | null;
  error: string | null;
  searchHistory: string[];
}

export interface UseRAGSearchReturn extends RAGSearchState {
  search: (query: string, category?: string, topK?: number) => Promise<RAGQueryResponse>;
  clearHistory: () => void;
  reset: () => void;
}

// Maximum history items to keep
const MAX_HISTORY_ITEMS = 10;

/**
 * Hook for RAG-based knowledge search
 *
 * @example
 * ```tsx
 * const { search, isSearching, result, searchHistory } = useRAGSearch();
 *
 * const handleSearch = async (query: string) => {
 *   const result = await search(query);
 *   console.log('Answer:', result.answer);
 *   console.log('Sources:', result.sources);
 * };
 * ```
 */
export function useRAGSearch(): UseRAGSearchReturn {
  const [state, setState] = useState<RAGSearchState>({
    isSearching: false,
    result: null,
    error: null,
    searchHistory: [],
  });

  /**
   * Search the knowledge base with RAG
   */
  const search = useCallback(
    async (
      query: string,
      category?: string,
      topK: number = 5
    ): Promise<RAGQueryResponse> => {
      setState((prev) => ({ ...prev, isSearching: true, error: null }));

      try {
        const request: RAGQueryRequest = {
          query,
          filter_category: category,
          top_k: topK,
        };

        const result = await aiServiceFetch<RAGQueryResponse>('/api/advanced/rag/query', {
          method: 'POST',
          body: JSON.stringify(request),
        });

        // Add to search history (remove duplicates)
        setState((prev) => {
          const newHistory = [
            query,
            ...prev.searchHistory.filter((q) => q !== query),
          ].slice(0, MAX_HISTORY_ITEMS);

          return {
            isSearching: false,
            result,
            error: null,
            searchHistory: newHistory,
          };
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchHistory: [],
    }));
  }, []);

  /**
   * Reset the search state
   */
  const reset = useCallback(() => {
    setState((prev) => ({
      isSearching: false,
      result: null,
      error: null,
      searchHistory: prev.searchHistory, // Keep history
    }));
  }, []);

  return {
    ...state,
    search,
    clearHistory,
    reset,
  };
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.5) return 'Medium';
  if (confidence >= 0.3) return 'Low';
  return 'Very Low';
}

/**
 * Get confidence level color
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'text-green-500';
  if (confidence >= 0.5) return 'text-yellow-500';
  return 'text-orange-500';
}

/**
 * Format source citation
 */
export function formatSourceCitation(
  source: RAGQueryResponse['sources'][0],
  index: number
): string {
  const category = source.metadata?.category || 'general';
  const type = source.metadata?.type || 'document';
  return `[${index + 1}] ${category} - ${type}`;
}

export default useRAGSearch;
