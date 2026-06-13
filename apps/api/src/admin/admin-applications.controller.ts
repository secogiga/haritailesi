import {
  Body,
  Controller,
  Delete,
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
import { ApplicationQueryService } from '../applications/application-query.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TransitionStateDto } from '../applications/dto/create-application.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

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

class WaivePaymentDto {
  @IsString()
  reason!: string;
}

class ExtendDueDateDto {
  @IsInt()
  @IsPositive()
  extraDays!: number;
}

class SendInterviewInviteDto {
  @IsOptional()
  @IsString()
  meetUrl?: string;
}

class MarkPaymentFailedDto {
  @IsString()
  reason!: string;
}

class SendWhatsappDto {
  @IsString()
  message!: string;
}

@Controller('admin/applications')
export class AdminApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly queryService: ApplicationQueryService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Get()
  @RequirePermission('application.view')
  list(@Query() query: ListApplicationsQuery) {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    return this.queryService.list({
      ...(query.type   ? { type: query.type }     : {}),
      ...(query.state  ? { state: query.state }   : {}),
      ...(query.cursor ? { cursor: query.cursor }  : {}),
      ...(limit !== undefined ? { limit }          : {}),
    });
  }

  @Get(':id')
  @RequirePermission('application.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryService.findById(id);
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
  @RequirePermission('application.notes.edit')
  updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotesDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.updateNotes(id, dto.adminNotes, actor);
  }

  @Post(':id/resend-state-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('application.review')
  resendStateEmail(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.resendStateEmail(id);
  }

  @Post(':id/resend-setup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('member.activate')
  resendSetup(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.resendAccountSetup(id);
  }

  @Post(':id/resend-payment-reminder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('payment.remind')
  resendPaymentReminder(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.resendPaymentReminder(id);
  }

  @Post(':id/waive-payment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('payment.waive')
  waivePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WaivePaymentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.waivePayment(id, dto.reason, actor);
  }

  @Patch(':id/payment/extend-due-date')
  @RequirePermission('payment.extend_due_date')
  extendDueDate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendDueDateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.extendPaymentDueDate(id, dto.extraDays, actor);
  }

  @Patch(':id/payment/mark-failed')
  @RequirePermission('payment.fail')
  markFailed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaymentFailedDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.markPaymentFailed(id, dto.reason, actor);
  }

  @Post(':id/payment/revoke-waiver')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('payment.revoke_waiver')
  revokeWaiver(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.revokeWaiver(id, actor);
  }

  @Get(':id/timeline')
  @RequirePermission('application.notes.view')
  getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryService.getTimeline(id);
  }

  @Post(':id/send-interview-invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('interview.schedule')
  sendInterviewInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendInterviewInviteDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.sendInterviewInviteDirect(id, dto.meetUrl, actor);
  }

  @Post(':id/send-whatsapp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('application.review')
  async sendWhatsapp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendWhatsappDto,
  ) {
    const app = await this.queryService.findById(id);
    const fd = (app.formData ?? {}) as Record<string, unknown>;
    const phone = app.type === 'corporate'
      ? (fd['temsilciTelefon'] as string | undefined) ?? null
      : (fd['telefon'] as string | undefined) ?? null;
    if (!phone) throw new Error('Bu başvuruda telefon numarası yok.');
    const name = String(fd['adSoyad'] ?? app.applicantEmail);
    await this.whatsappService.sendTemplate(
      phone,
      'basvuru_durum_bildir',
      'tr',
      [{ type: 'body', parameters: [{ type: 'text', text: name }, { type: 'text', text: dto.message }] }],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('application.delete')
  deleteApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.applicationsService.deleteApplication(id, actor);
  }
}
