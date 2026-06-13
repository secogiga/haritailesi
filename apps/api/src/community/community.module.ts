import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { CategoryWeightCron } from './category-weight.cron';
import { EmailModule } from '../email/email.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [EmailModule, WhatsappModule, RedisModule],
  controllers: [CommunityController],
  providers: [CommunityService, CategoryWeightCron],
  exports: [CommunityService],
})
export class CommunityModule {}
