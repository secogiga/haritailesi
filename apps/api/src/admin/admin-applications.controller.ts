import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { TransitionStateDto } from '../applications/dto/create-application.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { IsOptional, IsString } from 'class-validator';

class ListApplicationsQuery {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

class UpdateNotesDto {
  @IsString()
  adminNotes!: string;
}

@Controller('admin/applications')
export class AdminApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @RequirePermission('application.review')
  list(@Query() query: ListApplicationsQuery) {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    return this.applicationsService.list({
      ...(query.type ? { type: query.type } : {}),
      ...(query.state ? { state: query.state } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
  }

  @Get(':id')
  @RequirePermission('application.review')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.findById(id);
  }

  @Patch(':id/state')
  @RequirePermission('application.review')
  transitionState(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionStateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.transitionState(id, dto, actor);
  }

  @Patch(':id/notes')
  @RequirePermission('application.review')
  updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotesDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.updateNotes(id, dto.adminNotes, actor);
  }

  @Post(':id/resend-setup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('application.approve')
  resendSetup(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.resendAccountSetup(id);
  }
}
