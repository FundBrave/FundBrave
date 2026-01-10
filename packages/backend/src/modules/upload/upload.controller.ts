import {
  Controller,
  Post,
  Delete,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Body,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService, UploadResult } from './upload.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; walletAddress: string };
}

/**
 * REST Controller for file upload operations
 * Uses multipart/form-data for file uploads
 */
@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload an avatar image
   * POST /upload/avatar
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadAvatar(file, req.user.id);
    return this.mapToResponse(result);
  }

  /**
   * Upload a banner image
   * POST /upload/banner
   */
  @Post('banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadBanner(file, req.user.id);
    return this.mapToResponse(result);
  }

  /**
   * Upload post media (single file)
   * POST /upload/post-media
   */
  @Post('post-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostMedia(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadPostMedia(file, req.user.id);
    return this.mapToResponse(result);
  }

  /**
   * Upload multiple post media files
   * POST /upload/post-media/multiple
   */
  @Post('post-media/multiple')
  @UseInterceptors(FilesInterceptor('files', 4)) // Max 4 files
  async uploadMultiplePostMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticatedRequest,
  ): Promise<MultipleUploadResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadService.uploadPostMedia(file, req.user.id)),
    );

    return {
      success: true,
      files: results.map((r) => this.mapToResponse(r)),
      count: results.length,
    };
  }

  /**
   * Upload message media
   * POST /upload/message-media
   */
  @Post('message-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMessageMedia(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadMessageMedia(file, req.user.id);
    return this.mapToResponse(result);
  }

  /**
   * Upload fundraiser media
   * POST /upload/fundraiser-media
   */
  @Post('fundraiser-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFundraiserMedia(
    @UploadedFile() file: Express.Multer.File,
    @Query('fundraiserId') fundraiserId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!fundraiserId) {
      throw new BadRequestException('Fundraiser ID is required');
    }

    const result = await this.uploadService.uploadFundraiserMedia(file, fundraiserId);
    return this.mapToResponse(result);
  }

  /**
   * Upload multiple fundraiser media files
   * POST /upload/fundraiser-media/multiple
   */
  @Post('fundraiser-media/multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleFundraiserMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('fundraiserId') fundraiserId: string,
  ): Promise<MultipleUploadResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (!fundraiserId) {
      throw new BadRequestException('Fundraiser ID is required');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadService.uploadFundraiserMedia(file, fundraiserId)),
    );

    return {
      success: true,
      files: results.map((r) => this.mapToResponse(r)),
      count: results.length,
    };
  }

  /**
   * Upload a document
   * POST /upload/document
   */
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadDocument(file, req.user.id);
    return this.mapToResponse(result);
  }

  /**
   * Delete a file
   * DELETE /upload
   */
  @Delete()
  async deleteFile(@Body() body: DeleteFileDto): Promise<DeleteResponse> {
    if (!body.fileUrl) {
      throw new BadRequestException('File URL is required');
    }

    await this.uploadService.deleteFile(body.fileUrl);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  /**
   * Get presigned URL for private file
   * GET /upload/presigned-url
   */
  @Get('presigned-url')
  async getPresignedUrl(
    @Query('fileUrl') fileUrl: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<PresignedUrlResponse> {
    if (!fileUrl) {
      throw new BadRequestException('File URL is required');
    }

    const expiration = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const presignedUrl = await this.uploadService.generatePresignedUrlFromFileUrl(
      fileUrl,
      expiration,
    );

    return {
      presignedUrl,
      expiresIn: expiration,
    };
  }

  // ==================== Helper Methods ====================

  private mapToResponse(result: UploadResult): UploadResponse {
    return {
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
      mimeType: result.mimeType,
      originalName: result.originalName,
    };
  }
}

// ==================== Response DTOs ====================

interface UploadResponse {
  success: boolean;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  originalName: string;
}

interface MultipleUploadResponse {
  success: boolean;
  files: UploadResponse[];
  count: number;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface PresignedUrlResponse {
  presignedUrl: string;
  expiresIn: number;
}

interface DeleteFileDto {
  fileUrl: string;
}
