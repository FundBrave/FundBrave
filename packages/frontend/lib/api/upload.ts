/**
 * Upload API Client
 * Handles all media upload requests to AWS S3
 *
 * Security features:
 * - File type validation on client and server
 * - File size limits enforced
 * - Authenticated requests only
 * - Automatic token refresh on 401
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UploadResponse {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
}

interface MultipleUploadResponse {
  files: UploadResponse[];
}

interface PresignedUrlResponse {
  url: string;
  expiresIn: number;
}

interface DeleteFileRequest {
  key: string;
}

interface DeleteFileResponse {
  success: boolean;
  message: string;
}

// File type constants
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// File size constants (in bytes)
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB

class UploadApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Validate file type against allowed types
   */
  private validateFileType(file: File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(file: File, maxSize: number): void {
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
  }

  /**
   * Upload file with automatic token refresh
   */
  private async uploadFile(
    endpoint: string,
    file: File,
    additionalFields?: Record<string, string>
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Add any additional fields
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send HttpOnly cookies for auth
      });

      // Handle 401 with token refresh
      if (response.status === 401) {
        // Try to refresh token
        const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Retry upload with refreshed token
          const retryResponse = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            throw new Error(`Upload failed: ${retryResponse.statusText}`);
          }

          return retryResponse.json();
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('File upload failed');
    }
  }

  /**
   * Upload avatar image
   * Max size: 5MB
   * Allowed types: JPEG, PNG, WebP, GIF
   */
  async uploadAvatar(file: File): Promise<UploadResponse> {
    this.validateFileType(file, ALLOWED_IMAGE_TYPES);
    this.validateFileSize(file, MAX_AVATAR_SIZE);

    return this.uploadFile('/api/upload/avatar', file);
  }

  /**
   * Upload banner image
   * Max size: 10MB
   * Allowed types: JPEG, PNG, WebP
   */
  async uploadBanner(file: File): Promise<UploadResponse> {
    this.validateFileType(file, ALLOWED_IMAGE_TYPES);
    this.validateFileSize(file, MAX_BANNER_SIZE);

    return this.uploadFile('/api/upload/banner', file);
  }

  /**
   * Upload post media (single file)
   * Max size: 10MB for images, 100MB for videos
   * Allowed types: Images and videos
   */
  async uploadPostMedia(file: File): Promise<UploadResponse> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    this.validateFileType(file, allowedTypes);

    const maxSize = ALLOWED_VIDEO_TYPES.includes(file.type)
      ? MAX_VIDEO_SIZE
      : MAX_IMAGE_SIZE;
    this.validateFileSize(file, maxSize);

    return this.uploadFile('/api/upload/post-media', file);
  }

  /**
   * Upload multiple post media files
   * Max 4 files per request
   */
  async uploadMultiplePostMedia(files: File[]): Promise<MultipleUploadResponse> {
    if (files.length > 4) {
      throw new Error('Maximum 4 files allowed per upload');
    }

    if (files.length === 0) {
      throw new Error('No files provided');
    }

    // Validate each file
    files.forEach((file) => {
      const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
      this.validateFileType(file, allowedTypes);

      const maxSize = ALLOWED_VIDEO_TYPES.includes(file.type)
        ? MAX_VIDEO_SIZE
        : MAX_IMAGE_SIZE;
      this.validateFileSize(file, maxSize);
    });

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const url = `${this.baseUrl}/api/upload/post-media/multiple`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      // Handle 401 with token refresh
      if (response.status === 401) {
        const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const retryResponse = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            throw new Error(`Upload failed: ${retryResponse.statusText}`);
          }

          return retryResponse.json();
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('File upload failed');
    }
  }

  /**
   * Upload fundraiser media
   */
  async uploadFundraiserMedia(
    file: File,
    fundraiserId: string
  ): Promise<UploadResponse> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    this.validateFileType(file, allowedTypes);

    const maxSize = ALLOWED_VIDEO_TYPES.includes(file.type)
      ? MAX_VIDEO_SIZE
      : MAX_IMAGE_SIZE;
    this.validateFileSize(file, maxSize);

    return this.uploadFile('/api/upload/fundraiser-media', file, {
      fundraiserId,
    });
  }

  /**
   * Upload message media (private)
   */
  async uploadMessageMedia(file: File): Promise<UploadResponse> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    this.validateFileType(file, allowedTypes);
    this.validateFileSize(file, MAX_VIDEO_SIZE);

    return this.uploadFile('/api/upload/message-media', file);
  }

  /**
   * Upload document
   * Max size: 25MB
   * Allowed types: PDF, Word documents
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    this.validateFileType(file, ALLOWED_DOCUMENT_TYPES);
    this.validateFileSize(file, MAX_DOCUMENT_SIZE);

    return this.uploadFile('/api/upload/document', file);
  }

  /**
   * Get presigned URL for private file access
   */
  async getPresignedUrl(key: string): Promise<PresignedUrlResponse> {
    const url = `${this.baseUrl}/api/upload/presigned-url?key=${encodeURIComponent(key)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const retryResponse = await fetch(url, {
            method: 'GET',
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            throw new Error(`Request failed: ${retryResponse.statusText}`);
          }

          return retryResponse.json();
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get presigned URL');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<DeleteFileResponse> {
    const url = `${this.baseUrl}/api/upload`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key } as DeleteFileRequest),
        credentials: 'include',
      });

      if (response.status === 401) {
        const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const retryResponse = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key } as DeleteFileRequest),
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            throw new Error(`Delete failed: ${retryResponse.statusText}`);
          }

          return retryResponse.json();
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Convert blob to File object
   */
  blobToFile(blob: Blob, filename: string, mimeType: string): File {
    return new File([blob], filename, { type: mimeType });
  }
}

// Export singleton instance
export const uploadApi = new UploadApiClient();

// Export types
export type {
  UploadResponse,
  MultipleUploadResponse,
  PresignedUrlResponse,
  DeleteFileRequest,
  DeleteFileResponse,
};
