import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationQueryService } from './application-query.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationSlaCron } from './application-sla.cron';
import { ApplicationEventsListener } from './application-events.listener';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { SmsModule } from '../sms/sms.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { NewsletterAutomationModule } from '../admin/newsletter-automation.module';

@Module({
  imports: [NewsletterAutomationModule, EmailModule, AuthModule, NotificationsModule, AuditModule, SmsModule, WhatsappModule],
  providers: [ApplicationsService, ApplicationQueryService, ApplicationSlaCron, ApplicationEventsListener],
  controllers: [ApplicationsController],
  exports: [ApplicationsService, ApplicationQueryService],
})
export class ApplicationsModule {}
