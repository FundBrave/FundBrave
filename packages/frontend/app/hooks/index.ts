/**
 * Hooks Index
 * Central export for all custom hooks
 */

// Campaign hooks
export { useCampaigns, useCampaign } from './useCampaigns';
export { useCreateCampaign } from './useCreateCampaign';
export { useDonate } from './useDonate';
export { useStake } from './useStake';

// AI Service hooks
export { useDeepfakeDetection } from './useDeepfakeDetection';
export { useContentModeration, getModerationActionLabel, getModerationActionColor } from './useContentModeration';
export { useImageAnalysis, getAppropriatenessLabel, getAppropriatenessColor } from './useImageAnalysis';
export { useFraudDetection, getRiskLevelLabel, getRiskLevelColor, getRiskLevelBgColor } from './useFraudDetection';
export { useRAGSearch, getConfidenceLabel, getConfidenceColor, formatSourceCitation } from './useRAGSearch';
