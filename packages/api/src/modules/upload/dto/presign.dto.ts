import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

export class PresignDto {
  @IsString()
  @MaxLength(200)
  @Matches(/^[^/\\]+$/, { message: 'fileName must not contain path separators' })
  fileName!: string;

  @IsIn([...IMAGE_TYPES, ...VIDEO_TYPES])
  contentType!: string;
}
