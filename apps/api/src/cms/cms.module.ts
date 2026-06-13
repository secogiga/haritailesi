import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { AdminCmsController } from './admin-cms.controller';
import { MediaController } from './media.controller';
import { IyzicoController } from './iyzico.controller';
import { IyzicoService } from './iyzico.service';
import { EventReminderCron } from './event-reminder.cron';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';
import { SmsModule } from '../sms/sms.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [EmailModule, StorageModule, SmsModule, WhatsappModule],
  providers: [CmsService, EventReminderCron, IyzicoService],
  controllers: [CmsController, AdminCmsController, MediaController, IyzicoController],
  exports: [CmsService],
})
export class CmsModule {}
