/**
 * AI Service Configuration and API Client
 *
 * Provides centralized configuration for connecting to the FundBrave AI service.
 */

// AI Service base URL - defaults to localhost for development
export const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

/**
 * API request helper with error handling
 */
export async function aiServiceFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${AI_SERVICE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `AI Service error: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload file to AI service with FormData
 */
export async function aiServiceUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${AI_SERVICE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type for FormData - browser sets it with boundary
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `AI Service error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Type Definitions for AI Service Responses
// ============================================================================

/**
 * Media verification response from deepfake detection
 */
export interface MediaVerificationResponse {
  is_authentic: boolean;
  confidence: number;
  requires_review: boolean;
  analysis: string;
  details: {
    processing_time?: number;
    file_name?: string;
    file_size_bytes?: number;
    [key: string]: unknown;
  };
}

/**
 * Image analysis response for content appropriateness
 */
export interface ImageAnalysisResponse {
  description: string;
  is_appropriate: boolean;
  confidence: number;
  tags: string[];
  details: Record<string, unknown>;
}

/**
 * Content moderation response
 */
export interface ModerationResponse {
  content_id: string;
  is_safe: boolean;
  action: 'approve' | 'flag' | 'reject' | 'quarantine';
  overall_score: number;
  categories: Array<{
    category: string;
    score: number;
    threshold: number;
    triggered: boolean;
  }>;
  reasons: string[];
  suggestions: string[];
}

/**
 * Content moderation request
 */
export interface ModerationRequest {
  content: string;
  content_type: 'campaign_title' | 'campaign_description' | 'comment' | 'user_message' | 'update';
  content_id?: string;
}

/**
 * Fraud detection response
 */
export interface FraudCheckResponse {
  campaign_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_review: boolean;
  indicators: Array<{
    type: string;
    severity: string;
    description: string;
    score: number;
  }>;
  recommendations: string[];
}

/**
 * Fraud detection request
 */
export interface FraudCheckRequest {
  campaign_id: string;
  name: string;
  description: string;
  creator_id: string;
  goal_amount: number;
  category: string;
}

/**
 * RAG query response
 */
export interface RAGQueryResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>;
  confidence: number;
  context_used: boolean;
}

/**
 * RAG query request
 */
export interface RAGQueryRequest {
  query: string;
  filter_category?: string;
  top_k?: number;
}

/**
 * Image-text coherence check response
 */
export interface CoherenceCheckResponse {
  is_coherent: boolean;
  confidence: number;
  match_score: number;
  analysis: string;
}
