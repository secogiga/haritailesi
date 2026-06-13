import { Module } from '@nestjs/common';
import { AdminApplicationsController } from './admin-applications.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminFeedController } from './admin-feed.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminMessagesController } from './admin-messages.controller';
import { AdminNewsletterController } from './admin-newsletter.controller';
import { AdminNewsletterAutomationController } from './admin-newsletter-automation.controller';
import { NewsletterAutomationModule } from './newsletter-automation.module';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { MembershipModule } from '../membership/membership.module';
import { MemberProfileModule } from '../member-profile/member-profile.module';
import { EmailModule } from '../email/email.module';
import { MessagesModule } from '../messages/messages.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [NewsletterAutomationModule, ApplicationsModule, UsersModule, MembershipModule, MemberProfileModule, EmailModule, MessagesModule, WhatsappModule],
  controllers: [
    AdminApplicationsController,
    AdminUsersController,
    AdminDashboardController,
    AdminFeedController,
    AdminPaymentsController,
    AdminMessagesController,
    AdminNewsletterController,
    AdminNewsletterAutomationController,
  ],
  providers: [],
})
export class AdminModule {}
