import { Module } from '@nestjs/common';
import { MemberProfileService } from './member-profile.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [MemberProfileService],
  exports: [MemberProfileService],
})
export class MemberProfileModule {}
