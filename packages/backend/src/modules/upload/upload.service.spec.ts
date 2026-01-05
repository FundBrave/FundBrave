import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const MockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('UploadService', () => {
  let service: UploadService;
  let mockS3Send: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_S3_BUCKET: 'test-bucket',
        AWS_REGION: 'us-east-1',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    mockS3Send = jest.fn().mockResolvedValue({});
    MockS3Client.mockImplementation(() => ({
      send: mockS3Send,
    } as any));

    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com/file');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file to S3 and return the URL', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-image.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-image-data'),
        size: 1024,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile, 'test-folder');

      expect(result).toContain('https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/');
      expect(result).toContain('.png');
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'malicious.exe',
        encoding: '7bit',
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('fake-data'),
        size: 1024,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(
        service.uploadFile(mockFile, 'test-folder', {
          allowedMimeTypes: ['image/png', 'image/jpeg'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when file exceeds size limit', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'large-file.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('x'.repeat(100)),
        size: 10 * 1024 * 1024, // 10MB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(
        service.uploadFile(mockFile, 'test-folder', {
          maxSize: 5 * 1024 * 1024, // 5MB limit
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload an avatar image', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'avatar',
        originalname: 'avatar.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-avatar-data'),
        size: 500 * 1024, // 500KB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadAvatar(mockFile, 'user-123');

      expect(result).toContain('avatars/user-123/');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should reject non-image files for avatar', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'avatar',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('fake-pdf-data'),
        size: 100 * 1024,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.uploadAvatar(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject avatars larger than 5MB', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'avatar',
        originalname: 'huge-avatar.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('x'),
        size: 6 * 1024 * 1024, // 6MB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.uploadAvatar(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadBanner', () => {
    it('should upload a banner image', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'banner',
        originalname: 'banner.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-banner-data'),
        size: 1024 * 1024, // 1MB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadBanner(mockFile, 'user-123');

      expect(result).toContain('banners/user-123/');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should reject banners larger than 10MB', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'banner',
        originalname: 'huge-banner.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('x'),
        size: 11 * 1024 * 1024, // 11MB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.uploadBanner(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadPostMedia', () => {
    it('should upload post image', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'media',
        originalname: 'post-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 2 * 1024 * 1024,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadPostMedia(mockFile, 'user-123');

      expect(result).toContain('posts/user-123/');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should upload post video', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'media',
        originalname: 'post-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        buffer: Buffer.from('fake-video-data'),
        size: 50 * 1024 * 1024, // 50MB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadPostMedia(mockFile, 'user-123');

      expect(result).toContain('posts/user-123/');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should reject videos larger than 100MB', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'media',
        originalname: 'huge-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        buffer: Buffer.from('x'),
        size: 150 * 1024 * 1024, // 150MB
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.uploadPostMedia(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject unsupported file types', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'media',
        originalname: 'document.docx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('fake-doc-data'),
        size: 1024 * 1024,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await expect(service.uploadPostMedia(mockFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadMessageMedia', () => {
    it('should upload message attachment', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'attachment',
        originalname: 'attachment.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-attachment-data'),
        size: 1024 * 1024,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadMessageMedia(mockFile, 'user-123', 'conv-456');

      expect(result).toContain('messages/conv-456/');
      expect(mockS3Send).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from S3', async () => {
      const fileUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/file.png';

      await service.deleteFile(fileUrl);

      expect(mockS3Send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should handle deletion of non-existent file gracefully', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('NoSuchKey'));
      const fileUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/non-existent.png';

      // Should not throw
      await expect(service.deleteFile(fileUrl)).resolves.not.toThrow();
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate a presigned URL for file download', async () => {
      const fileKey = 'test-folder/file.png';

      const result = await service.generatePresignedUrl(fileKey);

      expect(result).toBe('https://signed-url.example.com/file');
      expect(mockGetSignedUrl).toHaveBeenCalled();
    });

    it('should generate presigned URL with custom expiration', async () => {
      const fileKey = 'test-folder/file.png';
      const expiresIn = 7200; // 2 hours

      await service.generatePresignedUrl(fileKey, expiresIn);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(GetObjectCommand),
        { expiresIn },
      );
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files and return array of URLs', async () => {
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'image1.png',
          encoding: '7bit',
          mimetype: 'image/png',
          buffer: Buffer.from('fake-data-1'),
          size: 1024,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        },
        {
          fieldname: 'files',
          originalname: 'image2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-data-2'),
          size: 2048,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      const results = await Promise.all(
        mockFiles.map((file) => service.uploadFile(file, 'test-folder')),
      );

      expect(results).toHaveLength(2);
      expect(mockS3Send).toHaveBeenCalledTimes(2);
    });
  });
});
