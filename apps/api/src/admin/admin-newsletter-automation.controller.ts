import { Controller, Get, Post, Put, Patch, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { RequirePermission } from '../rbac/rbac.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Perm } from '../rbac/permissions';
import { NewsletterAutomationService } from './newsletter-automation.service';

@Controller('admin/newsletter/automations')
export class AdminNewsletterAutomationController {
  constructor(private readonly automationService: NewsletterAutomationService) {}

  @Get()
  @RequirePermission(Perm.NEWSLETTER_READ)
  list() { return this.automationService.list(); }

  @Post()
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  create(@Body() body: { name: string; description?: string; triggerType: string; steps: Array<{ delayDays: number; subject: string; htmlBody: string; previewText?: string }> }) {
    if (!body.name?.trim()) throw new BadRequestException('name zorunludur');
    if (!body.triggerType?.trim()) throw new BadRequestException('triggerType zorunludur');
    if (!Array.isArray(body.steps) || body.steps.length === 0) throw new BadRequestException('En az 1 adım gerekli');
    return this.automationService.create(body);
  }

  @Put(':id')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string; steps?: Array<{ delayDays: number; subject: string; htmlBody: string; previewText?: string }>; status?: string }) {
    return this.automationService.update(id, body);
  }

  @Patch(':id/status')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  setStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'paused' | 'archived' }) {
    if (!['active', 'paused', 'archived'].includes(body.status)) throw new BadRequestException('Geçersiz status');
    return this.automationService.update(id, { status: body.status });
  }

  @Delete(':id')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  remove(@Param('id') id: string) { return this.automationService.remove(id); }

  @Get(':id/logs')
  @RequirePermission(Perm.NEWSLETTER_READ)
  getLogs(@Param('id') id: string) { return this.automationService.getLogs(id); }

  // Trigger endpoint for internal use (e.g., from application approval handler)
  @Post('trigger')
  @Public()
  async trigger(@Body() body: { triggerType: string; email: string; secret?: string; metadata?: Record<string, unknown> }) {
    // Require a shared secret to protect this internal endpoint
    const expectedSecret = process.env['AUTOMATION_TRIGGER_SECRET'];
    if (expectedSecret && body.secret !== expectedSecret) {
      throw new BadRequestException('Yetkisiz');
    }
    if (!body.triggerType || !body.email) throw new BadRequestException('triggerType ve email zorunludur');
    await this.automationService.triggerAutomation(body.triggerType, body.email, body.metadata);
    return { ok: true };
  }
}
