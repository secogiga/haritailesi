import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { AdminCmsController } from './admin-cms.controller';

@Module({
  providers: [CmsService],
  controllers: [CmsController, AdminCmsController],
  exports: [CmsService],
})
export class CmsModule {}
