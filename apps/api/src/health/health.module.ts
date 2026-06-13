import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { EMAIL_QUEUE, PUSH_QUEUE } from '../redis/redis.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    BullModule.registerQueue({ name: PUSH_QUEUE }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
