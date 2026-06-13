import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [NewsletterController],
})
export class NewsletterModule {}
