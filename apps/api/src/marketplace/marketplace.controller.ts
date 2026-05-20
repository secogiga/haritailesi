import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { MarketplaceService } from './marketplace.service';

class CreateContentRequestDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) displayName!: string;
  @IsIn(['sahne', 'mutfak']) source!: 'sahne' | 'mutfak';
  @IsIn(['magaza', 'etkinlik', 'egitim', 'ilan']) type!: 'magaza' | 'etkinlik' | 'egitim' | 'ilan';
  @IsString() @MinLength(3) title!: string;
  @IsString() @MinLength(10) description!: string;
  @IsOptional() @IsString() contactInfo?: string;
  @IsOptional() @IsString() attachmentUrl?: string;
}

class ReviewContentRequestDto {
  @IsIn(['approved', 'rejected']) status!: 'approved' | 'rejected';
  @IsOptional() @IsString() adminNotes?: string;
}

class UpdateContentRequestDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() contactInfo?: string;
}

const ALL_LISTING_TYPES = [
  'isbirligi', 'proje', 'teknik_destek', 'freelancer', 'teknoloji_ekipman',
  'ikinci_el', 'mesleki_arac', 'firsat', 'duyuru',
  'satilik', 'kiralik', 'aranan', 'hizmet', 'diger', 'full_time', 'part_time', 'freelance', 'internship',
] as const;
type ListingType = typeof ALL_LISTING_TYPES[number];

class CreateJobListingDto {
  @IsString() @MinLength(3) title!: string;
  @IsString() @MinLength(2) company!: string;
  @IsOptional() @IsString() location?: string;
  @IsIn([...ALL_LISTING_TYPES]) type!: ListingType;
  @IsString() @MinLength(10) description!: string;
  @IsOptional() @IsString() applyUrl?: string;
  @IsOptional() @IsEmail() applyEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() price?: string;
  @IsOptional() @IsArray() tags?: string[];
}

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ─── Content Requests (Authenticated — sahne bağlantılı veya mutfak panel) ────

  @Post('content-requests')
  @HttpCode(201)
  createContentRequest(@Body() dto: CreateContentRequestDto, @CurrentUser() user: RequestUser) {
    return this.marketplaceService.createContentRequest({
      userId: user.id,
      email: dto.email,
      displayName: dto.displayName,
      source: dto.source,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      contactInfo: dto.contactInfo,
      attachmentUrl: dto.attachmentUrl,
    });
  }

  // Sahne'den public talep (giriş yapmayan ziyaretçi de gönderebilir)
  @Public()
  @Post('content-requests/public')
  @HttpCode(201)
  createPublicContentRequest(@Body() dto: CreateContentRequestDto) {
    return this.marketplaceService.createContentRequest({
      email: dto.email,
      displayName: dto.displayName,
      source: dto.source,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      contactInfo: dto.contactInfo,
      attachmentUrl: dto.attachmentUrl,
    });
  }

  // ─── Job Listings (Herkese açık) ─────────────────────────────────────────────

  @Public()
  @Get('job-listings')
  listJobListings(
    @Query('type') type?: string,
    @Query('tags') tags?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.listJobListings({
      type, tags, cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ─── Admin endpoints ─────────────────────────────────────────────────────────

  @Get('admin/content-requests')
  @RequirePermission('content.publish')
  listContentRequests(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.listContentRequests({
      status, type, source, cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('admin/content-requests/:id')
  @RequirePermission('content.publish')
  updateContentRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentRequestDto,
  ) {
    return this.marketplaceService.updateContentRequest(id, dto);
  }

  @Patch('admin/content-requests/:id/review')
  @RequirePermission('content.publish')
  reviewContentRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewContentRequestDto,
    @CurrentUser() admin: RequestUser,
  ) {
    return this.marketplaceService.reviewContentRequest(id, admin.id, dto.status, dto.adminNotes);
  }

  @Get('admin/job-listings')
  @RequirePermission('content.publish')
  listAdminJobListings(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.marketplaceService.listAdminJobListings({ ...(status ? { status } : {}), ...(type ? { type } : {}) });
  }

  @Post('admin/job-listings')
  @RequirePermission('content.publish')
  @HttpCode(201)
  createJobListing(@Body() dto: CreateJobListingDto, @CurrentUser() admin: RequestUser) {
    return this.marketplaceService.createJobListing(admin.id, dto);
  }

  @Patch('admin/job-listings/:id')
  @RequirePermission('content.publish')
  updateJobListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateJobListingDto & { status: 'draft' | 'published' | 'closed' }>,
  ) {
    return this.marketplaceService.updateJobListing(id, dto);
  }

  @Delete('admin/job-listings/:id')
  @RequirePermission('content.publish')
  deleteJobListing(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.deleteJobListing(id);
  }

  @Patch('admin/job-listings/:id/status')
  @RequirePermission('content.publish')
  updateJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'published' | 'closed' },
  ) {
    return this.marketplaceService.updateJobListingStatus(id, body.status);
  }
}
