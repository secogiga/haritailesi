import {
  Body, Controller, Get, HttpCode, Param, ParseIntPipe,
  Post, Put, Query,
} from '@nestjs/common';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { MembershipService } from './membership.service';
import type { MembershipTier } from '@haritailesi/types';

const TIERS: MembershipTier[] = [
  'haritailesi_genc', 'new_graduate_member', 'individual_member', 'corporate_member',
];

class UpsertFeeConfigDto {
  @IsInt() @Min(2024) year!: number;
  @IsIn(TIERS) tier!: MembershipTier;
  @IsNumber() @Min(0) amountKurus!: number;
  @IsString() @MinLength(2) label!: string;
  @IsOptional() @IsString() description?: string;
}

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // ─── Public: Yıllık Ücret Listesi ───────────────────────────────────────────

  @Public()
  @Get('fees')
  getCurrentFees() {
    return this.membershipService.getCurrentFeeConfigs();
  }

  // ─── Üye: Kendi Aboneliği ────────────────────────────────────────────────────

  @Get('my')
  @RequirePermission('user.profile.read')
  getMySubscription(@CurrentUser() user: RequestUser) {
    return this.membershipService.getActiveSubscription(user.id);
  }

  // ─── Admin: İstatistikler ────────────────────────────────────────────────────

  @Get('admin/stats')
  @RequirePermission('admin.dashboard.read')
  stats() {
    return this.membershipService.getStats();
  }

  // ─── Admin: Abonelik Listesi ─────────────────────────────────────────────────

  @Get('admin/subscriptions')
  @RequirePermission('user.manage')
  list(
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.membershipService.listSubscriptions({
      ...(status ? { status } : {}),
      ...(tier ? { tier } : {}),
      ...(userId ? { userId } : {}),
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
      ...(cursor ? { cursor } : {}),
    });
  }

  // ─── Admin: Ücret Konfigürasyonu ─────────────────────────────────────────────

  @Get('admin/fees/:year')
  @RequirePermission('admin.settings.manage')
  getFeesByYear(@Param('year', ParseIntPipe) year: number) {
    // Yıla göre tüm konfigürasyonları listele
    return this.membershipService.getCurrentFeeConfigs();
  }

  @Put('admin/fees')
  @HttpCode(200)
  @RequirePermission('admin.settings.manage')
  upsertFeeConfig(@Body() dto: UpsertFeeConfigDto) {
    return this.membershipService.upsertFeeConfig(dto);
  }

  // ─── Admin: Manuel Abonelik Oluştur (ücretsiz tier veya banka transferi) ─────

  @Post('admin/activate')
  @HttpCode(201)
  @RequirePermission('user.manage')
  async adminActivate(
    @Body() body: { userId: string; tier: MembershipTier; notes?: string },
  ) {
    return this.membershipService.createSubscription({
      userId: body.userId,
      tier: body.tier,
      ...(body.notes ? { notes: body.notes } : {}),
    });
  }
}
