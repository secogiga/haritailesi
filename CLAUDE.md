# Haritailesi Sahne-Mutfak — Claude Çalışma Kuralları

## Temel Kural
Bu projede tüm workspace'i gereksiz yere tarama. Önce ilgili alanı belirle, sonra sadece gerekli dosyaları oku.

## Kredi ve Context Koruma
- node_modules klasörünü okuma.
- .next, dist, build, coverage, .turbo ve log klasörlerini okuma.
- .env ve .env.* dosyalarını okuma.
- Büyük işleri küçük parçalara böl.
- Tek seferde yalnızca 1 uygulama, 1 modül veya 1 bileşen üzerinde çalış.
- Gereksiz uzun açıklama üretme.
- Her değişiklikten önce kısa plan yaz.
- Her değişiklikten sonra değişen dosyaları ve test adımını kısa özetle.

## Proje Yapısı
Bu proje Turborepo monorepo yapısındadır.

Ana uygulamalar:
- apps/web
- apps/sahne
- apps/mutfak
- apps/admin
- apps/api

Paylaşımlı paketler:
- packages/database
- packages/types
- packages/permissions
- packages/ui
- packages/config-ts
- packages/config-eslint

## Çalışma Disiplini
- Kullanıcı tüm projeyi incele demedikçe tüm repoyu tarama.
- Kullanıcı belirli bir modül verdiyse sadece o modüle odaklan.
- Önce dosya listesini çıkar, sonra gerekli dosyaları oku.
- Geçici çözüm yerine kök neden çöz.
- Kod değiştirmeden önce kullanıcıya kısa plan sun.

## Quick Reference

### Uygulama Görevleri
- **web** (3001): Vakıf tanıtımı + 3 başvuru formu (bireysel, kurumsal, genç)
- **sahne** (3002): Yarı açık vitrin + modül yönlendirme hub'ı
- **mutfak** (3003): Kapalı topluluk feed + üretim platformu
- **admin** (3004): Operasyon yönetim paneli (başvuru, üye, istatistik)
- **api** (3000): NestJS REST API backend

### Entry Point'ler

**API (NestJS):**
```
apps/api/src/main.ts
  → app.module.ts
  → [module]/[module].controller.ts
  → [module]/[module].service.ts
```

**Admin (Next.js):**
```
apps/admin/src/app/layout.tsx
  → (panel)/layout.tsx
  → (panel)/[sayfa]/page.tsx
27 sayfa: basvurular, uyeler, istatistikler, gorusler, sinavlar...
```

**Mutfak (Next.js):**
```
apps/mutfak/src/app/layout.tsx
  → (mutfak)/layout.tsx
  → (mutfak)/akis/page.tsx (ana feed)
  → (mutfak)/hesabim/, mesajlar/, onboarding/
```

**Sahne (Next.js):**
```
apps/sahne/src/app/layout.tsx
  → page.tsx (ana hub)
  → [modul]/page.tsx (anketler, bagis, egitim, etkinlikler...)
```

**Web (Next.js):**
```
apps/web/src/app/layout.tsx
  → page.tsx (ana sayfa)
  → genc/basvuru/, uye-ol/bireysel/, meslegin-gelecekleri/basvuru/
```

### Database Schema
```
packages/database/src/schema/
  → index.ts (tüm tabloların listesi)
  → [table].ts (26 tablo: users, applications, community...)
```

### Sık Kullanılan Akışlar

**Yeni API endpoint:**
1. `find apps/api/src -name "*.controller.ts"` → modül bul
2. Read: `apps/api/src/[module]/[module].controller.ts`
3. Read: `apps/api/src/[module]/[module].service.ts`
4. Read: `packages/database/src/schema/[table].ts`
5. Endpoint ekle → test yaz

**Yeni admin sayfası:**
1. `ls apps/admin/src/app/(panel)/` → benzer sayfa bul
2. Read: benzer sayfa
3. Yeni sayfa oluştur → API endpoint bağla

**Database değişikliği:**
1. Read: `packages/database/src/schema/[table].ts`
2. Schema güncelle
3. `cd apps/api && npx drizzle-kit generate`
4. `cd apps/api && npx drizzle-kit push`
5. Read/güncelle: `packages/types/src/[type].ts`

**Bug araştırma:**
1. Hangi app? → URL'den anla
2. Hangi endpoint? → Network tab'dan bul
3. `grep -r "functionName" apps/api/src/`
4. Controller → Service → Schema sırasıyla oku
5. Kök neden bul → düzelt
