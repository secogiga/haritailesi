import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PostsService, REACTION_TYPES, type PostType, type PostCategory } from './posts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Express } from 'express';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const POST_TYPES = [
  'general', 'question', 'idea', 'project_call', 'content_draft',
  'team_search', 'mentorship_experience', 'poll', 'announcement', 'resource',
] as const;

const POST_CATEGORIES = [
  'klasik_haritacilik', 'cbs', 'fotogrametri_uzaktan_algilama', 'insaat',
  'gayrimenkul_degerleme', 'yazilim_teknoloji', 'kariyer', 'egitim',
  'mentorluk', 'gonullulik', 'proje_gelistirme', 'haritailesi_duyurulari',
] as const;

class CreatePostDto {
  @IsIn(POST_TYPES)
  type!: PostType;

  @IsIn(POST_CATEGORIES)
  category!: PostCategory;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsString()
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  pollOptions?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  libraryRefs?: { type: string; slug: string; title: string }[];
}

class PollVoteDto {
  @IsUUID()
  optionId!: string;
}

class CreateCommentDto {
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

class ReactDto {
  @IsIn(REACTION_TYPES)
  type!: (typeof REACTION_TYPES)[number];
}

class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;
}

class PinDto {
  @IsIn([true, false])
  pinned!: boolean;
}

@ApiTags('posts')
@ApiBearerAuth('access-token')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ─── Feed ──────────────────────────────────────────────────────────────────────

  // Public forum endpoint — herkese açık gönderiler (Sahne /forum sayfası için)
  @Public()
  @Get('public')
  listPublicPosts(
    @Query('cursor') cursor?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.listPublicPosts({
      ...(cursor ? { cursor } : {}),
      ...(category ? { category } : {}),
      ...(limit ? { limit: Math.min(Number(limit), 50) } : {}),
    });
  }

  @Get('bookmarks/my')
  @RequirePermission('feed.read')
  getMyBookmarks(@CurrentUser() user: RequestUser) {
    return this.postsService.getMyBookmarks(user.id);
  }

  @Get()
  @RequirePermission('feed.read')
  listPosts(
    @CurrentUser() user: RequestUser,
    @Query('cursor') cursor?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('authorId') authorId?: string,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string,
  ) {
    return this.postsService.listPosts({
      ...(cursor ? { cursor } : {}),
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
      ...(q ? { q } : {}),
      ...(limit ? { limit: Math.min(Number(limit), 50) } : {}),
      ...(authorId ? { authorId } : {}),
      ...(filter === 'following' ? { followingOnly: true } : {}),
      ...(sort === 'hot' ? { sort: 'hot' as const } : {}),
      viewerId: user.id,
    });
  }

  @Get(':id')
  @RequirePermission('feed.read')
  getPost(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.getPost(id, user.id);
  }

  // ─── Post CRUD ────────────────────────────────────────────────────────────────

  @Post()
  @RequirePermission('feed.post.create')
  createPost(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.createPost(user.id, dto);
  }

  @Patch(':id')
  @RequirePermission('feed.post.create')
  updatePost(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(user.id, id, dto);
  }

  @Delete(':id')
  @RequirePermission('feed.post.delete_own')
  deletePost(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const canDeleteAny = user.functionalRoles.some((r) =>
      ['moderator', 'admin', 'super_admin'].includes(r),
    );
    return this.postsService.deletePost(user.id, id, canDeleteAny);
  }

  @Patch(':id/pin')
  @RequirePermission('feed.post.pin')
  pinPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PinDto,
  ) {
    return this.postsService.pinPost(id, dto.pinned);
  }

  @Post(':id/bookmark')
  @RequirePermission('feed.react')
  bookmark(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.toggleBookmark(user.id, id);
  }

  @Post(':id/images')
  @RequirePermission('feed.post.create')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadImage(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Dosya gereklidir.');
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Sadece JPEG, PNG veya WebP yüklenebilir.');
    }
    return this.postsService.uploadPostImage(user.id, id, file);
  }

  // ─── Poll ─────────────────────────────────────────────────────────────────────

  @Post(':id/vote')
  @RequirePermission('feed.react')
  voteOnPoll(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PollVoteDto,
  ) {
    return this.postsService.voteOnPoll(user.id, id, dto.optionId);
  }

  // ─── Reactions ────────────────────────────────────────────────────────────────

  @Post(':id/react')
  @RequirePermission('feed.react')
  react(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactDto,
  ) {
    return this.postsService.react(user.id, id, dto.type);
  }

  // ─── Comments ─────────────────────────────────────────────────────────────────

  @Get(':id/comments')
  @RequirePermission('feed.read')
  listComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.listComments(id);
  }

  @Post(':id/comments')
  @RequirePermission('feed.comment.create')
  addComment(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(user.id, id, dto.body, dto.parentId);
  }

  @Delete('comments/:id')
  @RequirePermission('feed.comment.delete_own')
  deleteComment(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const canDeleteAny = user.functionalRoles.some((r) =>
      ['moderator', 'admin', 'super_admin'].includes(r),
    );
    return this.postsService.deleteComment(user.id, id, canDeleteAny);
  }
}
