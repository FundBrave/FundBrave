import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { PrivyAuthGuard, RegisteredGuard } from '../auth/privy-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UploadService } from './upload.service';
import { PresignDto } from './dto/presign.dto';

@Controller('uploads')
@UseGuards(PrivyAuthGuard, RegisteredGuard)
export class UploadController {
  constructor(private readonly uploads: UploadService) {}

  @Post('presign')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  presign(@CurrentUser() user: User, @Body() dto: PresignDto) {
    return this.uploads.presignUpload(user.id, dto.fileName, dto.contentType);
  }
}
