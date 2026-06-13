import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { PushProcessor } from './push.processor';
import { EmailModule } from '../email/email.module';
import { PUSH_QUEUE } from '../redis/redis.constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: PUSH_QUEUE }),
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationOrchestratorService, PushProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
