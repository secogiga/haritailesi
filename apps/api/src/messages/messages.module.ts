import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { EmailModule } from '../email/email.module';
import { EMAIL_QUEUE } from '../redis/redis.constants';

@Module({
  imports: [
    EmailModule,
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
