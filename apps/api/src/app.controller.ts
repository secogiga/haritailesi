import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { Response } from 'express';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('assets/logo-email.png')
  @Public()
  logoEmail(@Res() res: Response) {
    const candidates = [
      join(__dirname, 'assets', 'logo-email.png'),          // ts-node: src/assets/
      join(__dirname, '..', 'assets', 'logo-email.png'),    // dist: dist/../assets/
      join(process.cwd(), 'src', 'assets', 'logo-email.png'),
    ];
    const file = candidates.find(existsSync);
    if (!file) { res.status(404).end(); return; }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(readFileSync(file));
  }

  @Get('health')
  @Public()
  health() {
    return this.appService.health();
  }

  @Get('stats')
  @Public()
  getStats() {
    return this.appService.getStats();
  }

  @Get('search')
  search(
    @Query('q') q?: string,
    @Query('type') type?: string,
  ) {
    if (!q?.trim()) throw new BadRequestException('Arama terimi gereklidir.');
    const validType = ['all', 'posts', 'members'].includes(type ?? '') ? (type as 'all' | 'posts' | 'members') : 'all';
    return this.appService.search(q.trim(), validType);
  }

  @Get('og')
  scrapeOg(@Query('url') url?: string) {
    if (!url?.startsWith('http')) throw new BadRequestException('Geçersiz URL.');
    return this.appService.scrapeOg(url);
  }
}
