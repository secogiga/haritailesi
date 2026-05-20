# Haritailesi Mutfak — Monorepo

Harita, geomatik ve CBS sektörü profesyonellerine yönelik kapalı topluluk platformu. Turborepo monorepo içinde iki uygulama ve bir paylaşımlı veritabanı paketi bulunur.

## Yapı

```
apps/
  api/        # NestJS REST API (port 3000)
  mutfak/     # Next.js 15 frontend (port 3003)
packages/
  database/   # Drizzle ORM şema + client (@haritailesi/database)
infra/        # Docker Compose (PostgreSQL, Redis, MinIO)
scripts/      # Seed ve migration yardımcıları
```

## Hızlı Başlangıç

**Gereksinimler:** Node.js 22+, Docker

```bash
# Altyapıyı başlat
docker compose -f infra/docker-compose.yml up -d

# Bağımlılıkları kur
npm install

# Database paketini derle
npm run build --workspace=packages/database

# Migration çalıştır
cd apps/api && npx drizzle-kit push

# Uygulamaları başlat (paralel)
npm run dev
```

Mutfak: http://localhost:3003  
API Swagger: http://localhost:3000/api/docs

## Ortam Değişkenleri

`apps/api/.env` dosyasını `apps/api/.env.example`'dan kopyala ve doldur.

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı URL'si |
| `REDIS_URL` | Redis bağlantı URL'si |
| `JWT_SECRET` | Access token imzalama anahtarı |
| `JWT_REFRESH_SECRET` | Refresh token imzalama anahtarı |
| `MINIO_ENDPOINT` / `MINIO_*` | MinIO S3-uyumlu depolama |
| `BREVO_API_KEY` | Transactional email (Brevo/Sendinblue) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push bildirimleri için VAPID anahtarları |
| `GLITCHTIP_DSN` | Hata izleme (opsiyonel) |

VAPID anahtarları üretmek için: `node -e "const wp=require('web-push'); console.log(wp.generateVAPIDKeys())"`

## Önemli Komutlar

```bash
# TypeScript tip kontrolü
npx tsc --noEmit -p apps/mutfak/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json

# Testler
npm test --workspace=apps/api

# Database paketini yeniden derle (schema değişikliği sonrası)
npm run build --workspace=packages/database

# Yeni migration oluştur
cd apps/api && npx drizzle-kit generate
cd apps/api && npx drizzle-kit push
```

## Mimari

**API:** NestJS + Drizzle ORM + BullMQ (email queue) + NestJS Schedule (cron jobs)  
**Frontend:** Next.js 15 App Router + TanStack Query + Tailwind CSS  
**Auth:** JWT access (15dk) + refresh token (30 gün) + RBAC permission sistemi  
**Bildirimler:** SSE (gerçek zamanlı) + Web Push (VAPID) + Email (Brevo)  
**Depolama:** MinIO (görseller, dosyalar)  
**Cache:** Redis — feed listesi (`feed:list:*`), üye listesi (`members:list:*`)

Detaylı mimari: [docs/master-mimari-ozet.md](docs/master-mimari-ozet.md)  
Modül yapısı: [docs/sahne-modul-yapisi.md](docs/sahne-modul-yapisi.md)
