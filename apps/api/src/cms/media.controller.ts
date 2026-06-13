import { Controller, Get, Query, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { StorageService } from '../storage/storage.service';

@Controller('media')
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  // Kapak görselini doğrudan akıt (redirect değil, proxy)
  // Kullanım: GET /api/v1/media?key=covers/filename.jpg
  @Public()
  @Get()
  async getMedia(@Query('key') key: string, @Res() res: Response) {
    if (!key) throw new BadRequestException('key parametresi gerekli.');

    let signedUrl: string;
    try {
      signedUrl = await this.storage.getSignedUrl(key, 300);
    } catch {
      throw new NotFoundException('Medya bulunamadı.');
    }

    const upstream = await fetch(signedUrl);
    if (!upstream.ok) throw new NotFoundException('Medya bulunamadı.');

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Length', buffer.length);
    // Helmet varsayılanı same-origin koyar ama medya farklı port'tan yüklenebilmeli
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(200).send(buffer);
  }
}
