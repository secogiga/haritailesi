import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { EmailModule } from '../email/email.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [EmailModule, OtpModule],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
