import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerificationService, DOC_TYPES } from './verification.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Express } from 'express';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

class ReviewDto {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly storageService: StorageService,
  ) {}

  // ─── Kullanıcı: Belge Yükleme ─────────────────────────────────────────────────

  @Post('documents')
  @RequirePermission('verification.submit')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async submitDocument(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') documentType: string,
  ) {
    if (!file) throw new BadRequestException('Dosya gereklidir.');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Sadece JPEG, PNG, WebP veya PDF yüklenebilir.');
    }
    if (!(DOC_TYPES as readonly string[]).includes(documentType)) {
      throw new BadRequestException('Geçersiz belge tipi.');
    }

    const { key } = await this.storageService.upload(file.buffer, {
      folder: 'verification',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    return this.verificationService.submitDocument(user.id, {
      documentType,
      fileKey: key,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });
  }

  @Get('my-documents')
  @RequirePermission('verification.submit')
  getMyDocuments(@CurrentUser() user: RequestUser) {
    return this.verificationService.getMyDocuments(user.id);
  }

  // ─── Admin: İnceleme ──────────────────────────────────────────────────────────

  @Get('admin/documents')
  @RequirePermission('verification.review')
  listPendingDocuments(@Query('userId') userId?: string) {
    return this.verificationService.listPendingDocuments(userId);
  }

  @Get('admin/documents/:id/file-url')
  @RequirePermission('verification.review')
  async getDocumentFileUrl(@Param('id', ParseUUIDPipe) id: string) {
    const doc = await this.verificationService.getDocumentById(id);
    if (!doc) throw new NotFoundException('Belge bulunamadı.');
    const url = await this.storageService.getSignedUrl(doc.fileKey, 300);
    return { url };
  }

  @Patch('admin/documents/:id/review')
  @RequirePermission('verification.review')
  reviewDocument(
    @CurrentUser() admin: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.verificationService.reviewDocument(admin.id, id, dto.decision, dto.notes);
  }
}
