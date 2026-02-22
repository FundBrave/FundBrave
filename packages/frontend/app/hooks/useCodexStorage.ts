'use client';

import { useState, useCallback } from 'react';
import {
  uploadFile as codexUploadFile,
  downloadFile as codexDownloadFile,
  isCodexAvailable,
} from '@/lib/codex/codex-service';
import type { CodexUploadResult } from '@/app/types/web3-chat';

interface UseCodexStorageReturn {
  /** Upload a file to Codex with progress tracking */
  uploadFile: (file: File) => Promise<CodexUploadResult | null>;
  /** Download a file from Codex by CID */
  downloadFile: (cid: string) => Promise<Blob | null>;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  /** Whether a download is currently in progress */
  isDownloading: boolean;
  /** Upload progress (0-1) */
  uploadProgress: number;
  /** Error message, if any */
  error: string | null;
  /** Check whether Codex is reachable */
  checkAvailability: () => Promise<boolean>;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * React wrapper around the Codex storage service.
 *
 * Provides file upload/download with React-friendly state management
 * (loading indicators, progress tracking, error handling).
 */
export function useCodexStorage(): UseCodexStorageReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<CodexUploadResult | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await codexUploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (!result.ok) {
        setError(result.error);
        return null;
      }

      setUploadProgress(1);
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const downloadFile = useCallback(async (cid: string): Promise<Blob | null> => {
    setIsDownloading(true);
    setError(null);

    try {
      const result = await codexDownloadFile(cid);

      if (!result.ok) {
        setError(result.error);
        return null;
      }

      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      return await isCodexAvailable();
    } catch {
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadFile,
    downloadFile,
    isUploading,
    isDownloading,
    uploadProgress,
    error,
    checkAvailability,
    clearError,
  };
}
