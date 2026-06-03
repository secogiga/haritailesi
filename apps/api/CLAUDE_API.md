# API Context — Sadece API Üzerinde Çalışırken Oku

## Modül Yapısı

37 modül, her biri kendi klasöründe:

```
apps/api/src/
├── admin/              # Admin panel endpoint'leri
├── applications/       # Başvuru pipeline (state machine)
├── audit/              # Denetim logları
├── auth/               # JWT authentication
├── automation/         # Otomasyon engine
├── cms/                # İçerik yönetimi
├── community/          # Feed, post, yorum
├── competitions/       # Yarışma sistemi
├── donations/          # Bağış yönetimi
├── email/              # Email template & queue (BullMQ)
├── exams/              # Sınav sistemi
├── marketplace/        # İlan/pazar yeri
├── member-profile/     # Profil yönetimi
├── membership/         # Üyelik tier'ları
├── mentorship/         # Mentor-mentee eşleştirme
├── messages/           # Direkt mesajlaşma
├── newsletter/         # Bülten sistemi
├── notifications/      # SSE + Web Push
├── posts/              # Feed post'ları
├── qa/                 # Soru-Cevap
├── rbac/               # Role-Based Access Control
├── redis/              # Cache servisi
├── scheduling/         # Takvim & etkinlikler
├── sessions/           # Oturum yönetimi
├── sms/                # SMS entegrasyonu
├── storage/            # MinIO dosya yönetimi
├── student-clubs/      # Öğrenci kulüpleri
├── surveys/            # Anket sistemi
├── throttler/          # Rate limiting
├── upload/             # Dosya yükleme
├── users/              # Kullanıcı CRUD
├── verification/       # Kimlik doğrulama
└── whatsapp/           # WhatsApp entegrasyonu
```

## Standart Modül Pattern

```
module-name/
├── module-name.module.ts         # Module tanımı, provider'lar
├── module-name.controller.ts     # HTTP endpoints (GET/POST/PATCH/DELETE)
├── module-name.service.ts        # Business logic
├── module-name.service.spec.ts   # Unit tests
└── dto/                          # Data transfer objects (validation)
    ├── create-*.dto.ts
    └── update-*.dto.ts
```

## Controller → Service → Schema Akışı

```typescript
// 1. Controller (HTTP katmanı)
@Controller('users')
export class UsersController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}

// 2. Service (business logic)
export class UsersService {
  async findById(id: string) {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }
}

// 3. Database schema
import { users } from '@haritailesi/database/schema';
```

## Sık Kullanılan Import'lar

```typescript
import { db } from '@haritailesi/database';
import { users, applications, posts } from '@haritailesi/database/schema';
import { PERMISSIONS } from '@haritailesi/permissions';
import type { User, Application } from '@haritailesi/types';
```

## Kritik Modüller

### applications/ — State Machine
- `state-machine.ts` → 3 ayrı pipeline (bireysel, kurumsal, gelecekler)
- `application-events.listener.ts` → state değişikliklerinde email tetikle
- Değişiklik yaparken `state-machine.spec.ts` testlerini unutma

### auth/ — JWT
- Access token: 15 dakika
- Refresh token: 30 gün
- Cookie-based (httpOnly)

### rbac/ — Permission Guard
- `rbac.guard.ts` → her endpoint'te kontrol
- `permissions.ts` → tüm permission tanımları
- Controller'da: `@RequirePermissions('users.read')`

### redis/ — Cache Pattern
```typescript
await this.redisService.get('feed:list:...');
await this.redisService.setex('members:list:...', 300, data);
```

### email/ — Queue Pattern
```typescript
await this.emailQueue.add('welcome-email', { userId });
```

## Test Komutları

```bash
# Unit testler
npm test --workspace=apps/api

# E2E testler
npm run test:e2e --workspace=apps/api

# Tek modül test
npm test --workspace=apps/api -- users.service.spec.ts
```

## Çalışma Kuralları

1. **Endpoint eklerken:** Controller → Service → DTO → Test sırasıyla
2. **State machine değişikliği:** Spec dosyasını güncelle
3. **Cache kullan:** Redis key pattern: `[entity]:list:[filter]` veya `[entity]:[id]`
4. **Permission ekle:** `rbac/permissions.ts` + controller decorator
5. **Email gönder:** Queue kullan (senkron gönderme)
