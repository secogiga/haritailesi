import { Module } from '@nestjs/common';
import { NewsletterAutomationService } from './newsletter-automation.service';

@Module({
  providers: [NewsletterAutomationService],
  exports: [NewsletterAutomationService],
})
export class NewsletterAutomationModule {}
