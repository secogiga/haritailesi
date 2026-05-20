import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

// ─── Pages ─────────────────────────────────────────────────────────────────────

export class UpsertPageDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsBoolean()
  isPublished!: boolean;
}

// ─── Board Members ─────────────────────────────────────────────────────────────

export class CreateBoardMemberDto {
  @IsString()
  name!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoKey?: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsBoolean()
  isActive!: boolean;
}

export class UpdateBoardMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoKey?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Events ────────────────────────────────────────────────────────────────────

export class CreateEventDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  type!: string;

  @IsDateString()
  dateStart!: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  registrationUrl?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  coverImageKey?: string;

  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @IsOptional()
  @IsBoolean()
  isCancelled?: boolean;

  @IsOptional()
  @IsString()
  source?: string;

  @IsBoolean()
  isPublished!: boolean;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  registrationUrl?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  coverImageKey?: string;

  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @IsOptional()
  @IsBoolean()
  isCancelled?: boolean;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

// ─── Projects ──────────────────────────────────────────────────────────────────

import { IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsIn(['active', 'completed', 'archived'])
  status!: 'active' | 'completed' | 'archived';

  @IsOptional()
  @IsString()
  coverImageKey?: string;

  @IsBoolean()
  isPublished!: boolean;

  @IsOptional()
  @IsIn(['sahne', 'linkedin'])
  type?: 'sahne' | 'linkedin';

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  authorInitials?: string;

  @IsOptional()
  @IsString()
  authorAvatarColor?: string;

  @IsOptional()
  @IsString()
  authorTag?: string;

  @IsOptional()
  @IsString()
  authorTagColor?: string;

  @IsOptional()
  @IsString()
  accentGradient?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsArray()
  hashtags?: string[];

  @IsOptional()
  externalLinks?: Array<{ label: string; href: string }>;

  @IsOptional()
  @IsArray()
  imageKeys?: string[];
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsIn(['active', 'completed', 'archived'])
  status?: 'active' | 'completed' | 'archived';

  @IsOptional()
  @IsString()
  coverImageKey?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsIn(['sahne', 'linkedin'])
  type?: 'sahne' | 'linkedin';

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  authorInitials?: string;

  @IsOptional()
  @IsString()
  authorAvatarColor?: string;

  @IsOptional()
  @IsString()
  authorTag?: string;

  @IsOptional()
  @IsString()
  authorTagColor?: string;

  @IsOptional()
  @IsString()
  accentGradient?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsArray()
  hashtags?: string[];

  @IsOptional()
  externalLinks?: Array<{ label: string; href: string }>;

  @IsOptional()
  @IsArray()
  imageKeys?: string[];
}

// ─── Talents ───────────────────────────────────────────────────────────────────

export class CreateTalentDto {
  @IsString()
  displayName!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class AdminCreateTalentDto {
  @IsString()
  displayName!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class AdminUpdateTalentDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

