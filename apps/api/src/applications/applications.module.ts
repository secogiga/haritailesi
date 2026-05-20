import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationSlaCron } from './application-sla.cron';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EmailModule, AuthModule, UsersModule, NotificationsModule],
  providers: [ApplicationsService, ApplicationSlaCron],
  controllers: [ApplicationsController],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
