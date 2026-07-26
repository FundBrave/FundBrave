import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Put,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { UploadService } from './upload.service';

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

/**
 * DEV-ONLY local media storage — mimics an S3 presigned PUT + public GET so
 * the web uploader flow is unchanged when AWS isn't configured. The PUT is
 * gated by a per-process HMAC signature issued at presign time.
 */
@Controller('uploads/local')
@SkipThrottle()
export class LocalUploadController {
  constructor(private readonly uploads: UploadService) {}

  @Put()
  async put(
    @Query('key') key: string,
    @Query('sig') sig: string,
    @Req() req: Request,
  ) {
    if (!this.uploads.devFallbackEnabled) {
      throw new ServiceUnavailableException('Local uploads are disabled');
    }
    if (!key || !this.uploads.verifyUploadSig(key, sig)) {
      throw new BadRequestException('Invalid or missing upload signature');
    }
    const maxBytes = this.uploads.maxBytesForKey(key);

    // Nest may have pre-buffered the body; prefer that, else stream the request.
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (raw && raw.length > 0) {
      await this.uploads.storeLocalBuffer(key, maxBytes, raw);
    } else {
      await this.uploads.storeLocal(key, maxBytes, req);
    }
    return { ok: true, key };
  }

  @Get('file')
  async get(@Query('key') key: string, @Res() res: Response) {
    if (!this.uploads.devFallbackEnabled) {
      throw new ServiceUnavailableException('Local uploads are disabled');
    }
    const info = await this.uploads.localFileInfo(key);
    if (!info) throw new NotFoundException('File not found');

    const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Length', info.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(info.path).pipe(res);
  }
}
