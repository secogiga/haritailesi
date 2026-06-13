import { Module } from '@nestjs/common';
import { CompetitionsController } from './competitions.controller';
import { CompetitionsService } from './competitions.service';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [StorageModule, EmailModule, OtpModule],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
