import { Module } from '@nestjs/common';
import { AdminApplicationsController } from './admin-applications.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminFeedController } from './admin-feed.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [ApplicationsModule, UsersModule, MembershipModule],
  controllers: [
    AdminApplicationsController,
    AdminUsersController,
    AdminDashboardController,
    AdminFeedController,
  ],
})
export class AdminModule {}
