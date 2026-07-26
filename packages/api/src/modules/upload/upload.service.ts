import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHmac, randomBytes, randomUUID } from 'crypto';
import { createWriteStream, existsSync } from 'fs';
import { mkdir, stat, writeFile } from 'fs/promises';
import { dirname, join, normalize, resolve } from 'path';
import type { Readable } from 'stream';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './dto/presign.dto';

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  maxBytes: number;
  expiresInSeconds: number;
  /** 'PUT' for S3/local presign. Web uploader always PUTs the raw file. */
  method: 'PUT';
}

const KEY_RE = /^campaign-media\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.[a-z0-9]{1,8}$/;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  // Dev fallback
  private readonly devFallback: boolean;
  private readonly apiBaseUrl: string;
  private readonly localDir: string;
  private readonly localSecret = randomBytes(32); // per-process signing key for local PUT URLs

  constructor(config: ConfigService) {
    const region = config.get<string>('aws.region') ?? 'us-east-1';
    const accessKeyId = config.get<string>('aws.accessKeyId') ?? '';
    const secretAccessKey = config.get<string>('aws.secretAccessKey') ?? '';
    this.bucket = config.get<string>('aws.s3Bucket') ?? '';
    this.publicBaseUrl =
      config.get<string>('aws.s3PublicUrl') ||
      (this.bucket ? `https://${this.bucket}.s3.${region}.amazonaws.com` : '');

    this.client =
      accessKeyId && secretAccessKey && this.bucket && !accessKeyId.startsWith('your-')
        ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
        : null;

    this.devFallback = config.get<boolean>('uploads.devFallback') ?? false;
    this.apiBaseUrl = config.get<string>('apiBaseUrl') ?? 'http://localhost:4000';
    this.localDir = resolve(process.cwd(), config.get<string>('uploads.localDir') ?? 'dev-uploads');

    if (!this.client && this.devFallback) {
      this.logger.warn(
        `S3 not configured — using LOCAL disk uploads at ${this.localDir} (development only)`,
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null || this.devFallback;
  }

  private buildKey(userId: string, fileName: string): { key: string; isImage: boolean } {
    const ext = (fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.') + 1) : 'bin')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8) || 'bin';
    return {
      key: `campaign-media/${userId}/${randomUUID()}.${ext}`,
      isImage: false, // set by caller
    };
  }

  async presignUpload(userId: string, fileName: string, contentType: string): Promise<PresignResult> {
    const isImage = (IMAGE_TYPES as readonly string[]).includes(contentType);
    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    const { key } = this.buildKey(userId, fileName);
    const expiresInSeconds = 600;

    // S3 path
    if (this.client) {
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
      return {
        uploadUrl,
        publicUrl: `${this.publicBaseUrl}/${key}`,
        key,
        maxBytes,
        expiresInSeconds,
        method: 'PUT',
      };
    }

    // Local dev fallback
    if (this.devFallback) {
      const sig = this.signKey(key);
      const base = this.apiBaseUrl.replace(/\/$/, '');
      return {
        uploadUrl: `${base}/api/uploads/local?key=${encodeURIComponent(key)}&sig=${sig}`,
        publicUrl: `${base}/api/uploads/local/file?key=${encodeURIComponent(key)}`,
        key,
        maxBytes,
        expiresInSeconds,
        method: 'PUT',
      };
    }

    throw new ServiceUnavailableException(
      'Media uploads are not configured (set AWS_* and S3_BUCKET, or run in development for local uploads)',
    );
  }

  // ─── Local dev disk ops ───────────────────────────────────────

  private signKey(key: string): string {
    return createHmac('sha256', this.localSecret).update(key).digest('hex').slice(0, 32);
  }

  private validKey(key: string): boolean {
    return KEY_RE.test(key) && !key.includes('..');
  }

  /** Absolute on-disk path for a validated key (guaranteed inside localDir). */
  resolveLocalPath(key: string): string {
    if (!this.validKey(key)) throw new BadRequestException('Invalid key');
    const full = normalize(join(this.localDir, key));
    if (!full.startsWith(this.localDir)) throw new BadRequestException('Invalid path');
    return full;
  }

  verifyUploadSig(key: string, sig: string | undefined): boolean {
    if (!sig) return false;
    const expected = this.signKey(key);
    return expected.length === sig.length && expected === sig;
  }

  /** Stream an incoming request body to disk (dev fallback PUT handler). */
  async storeLocal(key: string, maxBytes: number, source: Readable): Promise<void> {
    const path = this.resolveLocalPath(key);
    await mkdir(dirname(path), { recursive: true });

    await new Promise<void>((resolvePromise, reject) => {
      let bytes = 0;
      const out = createWriteStream(path);
      source.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          out.destroy();
          source.destroy();
          reject(new BadRequestException('File exceeds the size limit'));
        }
      });
      source.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => resolvePromise());
      source.pipe(out);
    });
    this.logger.log(`Stored local upload ${key}`);
  }

  /** Write an already-buffered body to disk (when Nest pre-buffered rawBody). */
  async storeLocalBuffer(key: string, maxBytes: number, buf: Buffer): Promise<void> {
    if (buf.length > maxBytes) throw new BadRequestException('File exceeds the size limit');
    const path = this.resolveLocalPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buf);
    this.logger.log(`Stored local upload ${key} (${buf.length} bytes)`);
  }

  async localFileInfo(key: string): Promise<{ path: string; size: number } | null> {
    const path = this.resolveLocalPath(key);
    if (!existsSync(path)) return null;
    const s = await stat(path);
    return { path, size: s.size };
  }

  get devFallbackEnabled(): boolean {
    return this.client === null && this.devFallback;
  }

  maxBytesForKey(key: string): number {
    return /\.(mp4|webm)$/.test(key) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  }
}
