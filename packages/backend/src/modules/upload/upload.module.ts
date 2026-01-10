import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Store files in memory before uploading to S3
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 10, // Max 10 files per request
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
