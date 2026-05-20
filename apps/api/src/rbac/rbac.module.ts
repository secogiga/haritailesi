import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class RbacModule {}
