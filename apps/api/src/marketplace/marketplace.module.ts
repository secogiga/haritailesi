import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceExpiryCron } from './marketplace-expiry.cron';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MarketplaceExpiryCron],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
