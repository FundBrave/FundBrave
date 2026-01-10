import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Size limits (in bytes)
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_POST_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_POST_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface UploadOptions {
  folder: string;
  maxSize?: number;
  allowedTypes?: string[];
  isPublic?: boolean;
}

/**
 * Service for handling file uploads to AWS S3
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cdnUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', 'fundbrave-media');
    this.cdnUrl = this.configService.get<string>('CDN_URL');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const { folder, maxSize, allowedTypes, isPublic = true } = options;

    // Validate file type
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (maxSize && file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }

    // Generate unique key
    const fileExtension = this.getFileExtension(file.originalname);
    const key = `${folder}/${uuidv4()}${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: isPublic ? 'public-read' : 'private',
        Metadata: {
          'original-name': encodeURIComponent(file.originalname),
        },
      });

      await this.s3Client.send(command);

      const url = this.getFileUrl(key, isPublic);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        url,
        key,
        bucket: this.bucket,
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload an avatar image
   */
  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `avatars/${userId}`,
      maxSize: MAX_AVATAR_SIZE,
      allowedTypes: ALLOWED_IMAGE_TYPES,
      isPublic: true,
    });
  }

  /**
   * Upload a banner image
   */
  async uploadBanner(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `banners/${userId}`,
      maxSize: MAX_BANNER_SIZE,
      allowedTypes: ALLOWED_IMAGE_TYPES,
      isPublic: true,
    });
  }

  /**
   * Upload post media (image or video)
   */
  async uploadPostMedia(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const maxSize = isVideo ? MAX_POST_VIDEO_SIZE : MAX_POST_IMAGE_SIZE;
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

    return this.uploadFile(file, {
      folder: `posts/${userId}`,
      maxSize,
      allowedTypes,
      isPublic: true,
    });
  }

  /**
   * Upload message media
   */
  async uploadMessageMedia(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const maxSize = isVideo ? MAX_POST_VIDEO_SIZE : MAX_POST_IMAGE_SIZE;

    return this.uploadFile(file, {
      folder: `messages/${userId}`,
      maxSize,
      allowedTypes,
      isPublic: false, // Messages are private
    });
  }

  /**
   * Upload fundraiser media
   */
  async uploadFundraiserMedia(
    file: Express.Multer.File,
    fundraiserId: string,
  ): Promise<UploadResult> {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const maxSize = isVideo ? MAX_POST_VIDEO_SIZE : MAX_POST_IMAGE_SIZE;

    return this.uploadFile(file, {
      folder: `fundraisers/${fundraiserId}`,
      maxSize,
      allowedTypes,
      isPublic: true,
    });
  }

  /**
   * Upload a document
   */
  async uploadDocument(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `documents/${userId}`,
      maxSize: MAX_DOCUMENT_SIZE,
      allowedTypes: ALLOWED_DOCUMENT_TYPES,
      isPublic: false,
    });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);

      if (!key) {
        throw new BadRequestException('Invalid file URL');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Generate a presigned URL for private file access
   */
  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return presignedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error}`);
      throw new BadRequestException('Failed to generate presigned URL');
    }
  }

  /**
   * Generate presigned URL from file URL
   */
  async generatePresignedUrlFromFileUrl(
    fileUrl: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const key = this.extractKeyFromUrl(fileUrl);

    if (!key) {
      throw new BadRequestException('Invalid file URL');
    }

    return this.generatePresignedUrl(key, expiresIn);
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: Express.Multer.File,
    maxSize: number,
    allowedTypes: string[],
  ): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    return { valid: true };
  }

  // ==================== Helper Methods ====================

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return filename.substring(lastDotIndex).toLowerCase();
  }

  /**
   * Get public URL for a file
   */
  private getFileUrl(key: string, isPublic: boolean): string {
    if (isPublic && this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Extract S3 key from URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      // Handle CDN URLs
      if (this.cdnUrl && url.startsWith(this.cdnUrl)) {
        return url.replace(`${this.cdnUrl}/`, '');
      }

      // Handle S3 URLs
      const s3Pattern = new RegExp(
        `https?://${this.bucket}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`,
      );
      const match = url.match(s3Pattern);

      if (match) {
        return match[1];
      }

      // Handle alternative S3 URL format
      const altPattern = new RegExp(
        `https?://s3\\.${this.region}\\.amazonaws\\.com/${this.bucket}/(.+)`,
      );
      const altMatch = url.match(altPattern);

      if (altMatch) {
        return altMatch[1];
      }

      return null;
    } catch {
      return null;
    }
  }
}
