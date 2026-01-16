/**
 * Custom hook for handling media uploads (images/videos) to AWS S3
 * Supports multiple files, progress tracking, and error handling
 */

import { useState, useCallback } from "react";
import { uploadApi } from "@/lib/api/upload";

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  url?: string; // S3 URL after upload
  uploading: boolean;
  uploadProgress: number;
  error?: string;
}

export interface UseMediaUploadOptions {
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const { maxFiles = 4, onUploadComplete, onError } = options;

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Add files to the upload queue
   */
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Check if adding these files would exceed max
      if (mediaFiles.length + fileArray.length > maxFiles) {
        const error = `Maximum ${maxFiles} files allowed`;
        onError?.(error);
        return;
      }

      // Create preview URLs and add to queue
      const newMediaFiles: MediaFile[] = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploadProgress: 0,
      }));

      setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    },
    [mediaFiles.length, maxFiles, onError]
  );

  /**
   * Remove a file from the queue
   */
  const removeFile = useCallback((id: string) => {
    setMediaFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  /**
   * Clear all files
   */
  const clearAll = useCallback(() => {
    mediaFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setMediaFiles([]);
  }, [mediaFiles]);

  /**
   * Upload a single file to S3
   */
  const uploadFile = async (mediaFile: MediaFile): Promise<string> => {
    try {
      const result = await uploadApi.uploadPostMedia(mediaFile.file);
      return result.url;
    } catch (error) {
      throw error instanceof Error ? error : new Error("Upload failed");
    }
  };

  /**
   * Upload all files to S3
   */
  const uploadAll = useCallback(async (): Promise<string[]> => {
    if (mediaFiles.length === 0) {
      return [];
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Upload files one by one with progress tracking
      for (const mediaFile of mediaFiles) {
        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id
              ? { ...f, uploading: true, uploadProgress: 0 }
              : f
          )
        );

        try {
          const url = await uploadFile(mediaFile);
          uploadedUrls.push(url);

          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === mediaFile.id
                ? {
                    ...f,
                    url,
                    uploading: false,
                    uploadProgress: 100,
                    error: undefined,
                  }
                : f
            )
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === mediaFile.id
                ? {
                    ...f,
                    uploading: false,
                    uploadProgress: 0,
                    error: errorMessage,
                  }
                : f
            )
          );

          // Continue uploading other files even if one fails
          console.error(`Failed to upload ${mediaFile.file.name}:`, error);
        }
      }

      setIsUploading(false);

      // Only call onUploadComplete if all uploads succeeded
      if (uploadedUrls.length === mediaFiles.length) {
        onUploadComplete?.(uploadedUrls);
      } else {
        onError?.(
          `${mediaFiles.length - uploadedUrls.length} file(s) failed to upload`
        );
      }

      return uploadedUrls;
    } catch (error) {
      setIsUploading(false);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      onError?.(errorMessage);
      return uploadedUrls;
    }
  }, [mediaFiles, onUploadComplete, onError]);

  /**
   * Get all successfully uploaded URLs
   */
  const getUploadedUrls = useCallback((): string[] => {
    return mediaFiles.filter((f) => f.url).map((f) => f.url!);
  }, [mediaFiles]);

  /**
   * Check if there are any files with errors
   */
  const hasErrors = useCallback((): boolean => {
    return mediaFiles.some((f) => f.error);
  }, [mediaFiles]);

  /**
   * Retry failed uploads
   */
  const retryFailed = useCallback(async (): Promise<string[]> => {
    const failedFiles = mediaFiles.filter((f) => f.error && !f.url);

    if (failedFiles.length === 0) {
      return getUploadedUrls();
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const mediaFile of failedFiles) {
      setMediaFiles((prev) =>
        prev.map((f) =>
          f.id === mediaFile.id
            ? { ...f, uploading: true, uploadProgress: 0, error: undefined }
            : f
        )
      );

      try {
        const url = await uploadFile(mediaFile);
        newUrls.push(url);

        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id
              ? {
                  ...f,
                  url,
                  uploading: false,
                  uploadProgress: 100,
                  error: undefined,
                }
              : f
          )
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id
              ? {
                  ...f,
                  uploading: false,
                  uploadProgress: 0,
                  error: errorMessage,
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    return [...getUploadedUrls(), ...newUrls];
  }, [mediaFiles, getUploadedUrls]);

  return {
    mediaFiles,
    isUploading,
    addFiles,
    removeFile,
    clearAll,
    uploadAll,
    getUploadedUrls,
    hasErrors,
    retryFailed,
    canAddMore: mediaFiles.length < maxFiles,
  };
}
