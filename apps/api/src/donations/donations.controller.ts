import {
  BadRequestException,
  Body, Controller, Get, HttpCode, NotFoundException,
  Param, ParseUUIDPipe, Patch, Post, Query, Req,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsEmail, IsIn, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Request } from 'express';
import { DonationsService } from './donations.service';
import { IyzicoService } from './iyzico.service';
import { StorageService } from '../storage/storage.service';

interface RequestWithUser extends Request { user?: { sub: string } }

class CreateDonationDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) fullName!: string;
  @IsNumber() @IsPositive() amount!: number;
  @IsIn(['one_time', 'recurring']) type!: 'one_time' | 'recurring';
  @IsIn(['bank_transfer', 'iyzico']) method!: 'bank_transfer' | 'iyzico';
  @IsOptional() @IsIn(['vakif', 'sirket']) paymentAccount?: 'vakif' | 'sirket';
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsIn(['kurumsal', 'bireysel', 'genc', 'mezun', 'genel']) donationCategory?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsIn(['bronz', 'gumus', 'altin']) packageTier?: string;
}

class CheckoutDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) surname!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() ip?: string;
  @IsOptional() @IsString() callbackUrl?: string;
}

@Controller('donations')
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    private readonly iyzicoService: IyzicoService,
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateDonationDto, @CurrentUser() user?: RequestUser) {
    return this.donationsService.create({
      userId: user?.id,
      email: dto.email,
      fullName: dto.fullName,
      amount: Math.round(dto.amount * 100),
      currency: dto.currency,
      type: dto.type,
      method: dto.method,
      paymentAccount: dto.paymentAccount ?? 'vakif',
      notes: dto.notes,
      donationCategory: dto.donationCategory,
      companyName: dto.companyName,
      packageTier: dto.packageTier,
    });
  }

  // iyzico vakıf webhook callback
  @Public()
  @Post('iyzico/webhook')
  @HttpCode(200)
  iyzicoWebhook(@Body() body: { token?: string; paymentId?: string; conversationId?: string; status: string }) {
    return this.donationsService.handleIyzicoWebhook(body);
  }

  // iyzico redirect callback (form POST — 3D Secure sonrası)
  @Public()
  @Post('iyzico/callback')
  @HttpCode(200)
  async iyzicoCallback(@Body() body: { token: string; status: string }) {
    const result = await this.iyzicoService.retrieveCheckoutForm('vakif', body.token);
    if (result.paymentStatus === 'SUCCESS') {
      await this.donationsService.handleIyzicoWebhook({
        token: body.token,
        ...(result.paymentId ? { paymentId: result.paymentId } : {}),
        ...(result.conversationId ? { conversationId: result.conversationId } : {}),
        status: 'success',
      });
    }
    return { status: 'ok' };
  }

  @Get()
  @RequirePermission('donation.view')
  list(
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('account') account?: string,
    @Query('userId') userId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.donationsService.list({
      status, method, account, userId, cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('stats')
  @RequirePermission('admin.dashboard.read')
  stats() {
    return this.donationsService.getStats();
  }

  @Patch(':id/confirm')
  @RequirePermission('donation.update')
  confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: RequestUser) {
    return this.donationsService.confirm(id, admin.id);
  }

  @Post(':id/proof')
  @HttpCode(200)
  @RequirePermission('donation.update')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadProof(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Dosya gerekli.');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException('Desteklenmeyen dosya türü. JPEG, PNG veya PDF yükleyin.');

    const donation = await this.donationsService.findById(id);
    if (!donation) throw new NotFoundException('Bağış bulunamadı.');

    const { key } = await this.storageService.upload(file.buffer, {
      folder: `donations/proof`,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    await this.donationsService.saveProof(id, key);
    return { proofKey: key };
  }

  @Get(':id/proof/url')
  @RequirePermission('donation.view')
  async getProofUrl(@Param('id', ParseUUIDPipe) id: string) {
    const donation = await this.donationsService.findById(id);
    if (!donation) throw new NotFoundException('Bağış bulunamadı.');
    if (!donation.proofKey) throw new NotFoundException('Belge bulunamadı.');
    const url = await this.storageService.getSignedUrl(donation.proofKey, 300); // 5 dakika
    return { url };
  }

  @Post(':id/checkout')
  @Public()
  async checkout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CheckoutDto,
    @Req() req: RequestWithUser,
  ) {
    const donation = await this.donationsService.findById(id);
    if (!donation) throw new NotFoundException('Bağış bulunamadı.');

    const account = (donation.paymentAccount as 'vakif' | 'sirket') ?? 'vakif';
    const isUyelik = donation.donationCategory === 'bireysel' || donation.donationCategory === 'kurumsal';
    const priceTL = (donation.amount / 100).toFixed(2);

    const result = await this.iyzicoService.initializeCheckoutForm(account, {
      conversationId: donation.id,
      price: priceTL,
      paidPrice: priceTL,
      callbackUrl: body.callbackUrl
        ?? `${process.env['SAHNE_URL'] ?? 'http://localhost:3002'}/bagis/callback`,
      basketName: isUyelik ? 'Haritailesi Üyelik Bağışı' : 'Haritailesi Bağış',
      basketCategory: isUyelik ? 'Üyelik' : 'Bağış',
      buyer: {
        id: req.user?.sub ?? donation.email,
        name: body.name,
        surname: body.surname,
        email: body.email,
        ip: body.ip ?? '127.0.0.1',
      },
    });

    if (result.token) {
      await this.donationsService.setIyzicoToken(id, result.token);
    }

    return result;
  }
}
