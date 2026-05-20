import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';
import { ApplicationsModule } from './applications/applications.module';
import { AdminModule } from './admin/admin.module';
import { CmsModule } from './cms/cms.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { PostsModule } from './posts/posts.module';
import { SessionsModule } from './sessions/sessions.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { CommunityModule } from './community/community.module';
import { DonationsModule } from './donations/donations.module';
import { MembershipModule } from './membership/membership.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { ExamsModule } from './exams/exams.module';
import { SurveysModule } from './surveys/surveys.module';
import { StudentClubsModule } from './student-clubs/student-clubs.module';
import { QaModule } from './qa/qa.module';
import { UserThrottlerGuard } from './throttler/user-throttler.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
    ]),

    ScheduleModule.forRoot(),

    // Faz 0 — Zemin modülleri
    DatabaseModule,   // PostgreSQL + Drizzle (global)
    RedisModule,      // BullMQ + ioredis (global)
    StorageModule,    // MinIO/S3 (global)
    AuditModule,      // Audit + action logs (global)

    AuthModule,       // JWT access + refresh token
    RbacModule,       // Permission guard (global APP_GUARD)
    UsersModule,      // Kullanıcı yönetimi
    EmailModule,      // BullMQ email kuyruğu

    // Faz 1 — Başvuru pipeline
    ApplicationsModule, // Başvuru oluşturma, durum geçişleri, state machine
    AdminModule,        // Admin panel endpoints

    // CMS — Sayfa, etkinlik, proje, haber, yönetim kurulu yönetimi
    CmsModule,

    // Bülten aboneliği
    NewsletterModule,

    // Mentorluk sistemi
    MentorshipModule,

    // Topluluk feed
    PostsModule,

    // Video buluşma oturumları
    SessionsModule,

    // Medya yükleme (MinIO/S3)
    UploadModule,

    // Kullanıcı bildirimleri
    NotificationsModule,

    // Doğrudan mesajlaşma
    MessagesModule,

    // Topluluk — feedback, mentor başvuruları
    CommunityModule,

    // Bağış sistemi
    DonationsModule,

    // Üyelik aboneliği + ücret konfigürasyonu + hatırlatma cron
    MembershipModule,

    // Pazaryeri — içerik talepleri, ilan panosu
    MarketplaceModule,

    // Yarışmalar, Sınavlar, Anketler
    CompetitionsModule,
    ExamsModule,
    SurveysModule,

    // Öğrenci Kulüpleri
    StudentClubsModule,

    // Topluluk Soru-Cevap
    QaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Rate limiting — userId'e göre kişiye özel, anonim istekler IP'ye göre
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    // JWT guard tüm endpoint'lere uygulanır, @Public() ile muaf tutulabilir
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
