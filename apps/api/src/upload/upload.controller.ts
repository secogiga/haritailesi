import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { RequirePermission } from '../rbac/rbac.decorator';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('upload')
export class UploadController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @RequirePermission('content.publish')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı.');
    if (!ALLOWED_MIME.has(file.mimetype))
      throw new BadRequestException('Desteklenmeyen dosya türü. Sadece resim yükleyebilirsiniz.');
    if (file.size > MAX_SIZE)
      throw new BadRequestException('Dosya boyutu 10 MB sınırını aşıyor.');

    return this.storage.upload(file.buffer, {
      folder: 'covers',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });
  }
}
