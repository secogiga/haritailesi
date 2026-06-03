# Admin Panel Context — Sadece Admin Üzerinde Çalışırken Oku

## Panel Yapısı

Admin paneli Next.js 15 App Router ile yapılmış operasyon yönetim arayüzüdür.

```
apps/admin/src/app/
├── (auth)/
│   └── login/          # Giriş sayfası
├── (panel)/            # Ana panel layout'u
│   ├── layout.tsx      # Sidebar + header
│   ├── basvurular/     # Başvuru yönetimi (state transitions)
│   ├── uyeler/         # Üye listesi & detay
│   ├── istatistikler/  # Dashboard & analytics
│   ├── gorusler/       # Kullanıcı geri bildirimleri
│   ├── sinavlar/       # Sınav yönetimi
│   ├── yarismalar/     # Yarışma yönetimi
│   ├── mesajlar/       # Mesaj inbox
│   ├── takvim/         # Etkinlik takvimi
│   ├── odemeler/       # Ödeme yönetimi
│   └── ...             # 27 sayfa toplam
└── (site)/             # Site içerik yönetimi
    └── site-etkinlikler/
```

## 27 Admin Sayfası

```
anketler        bagislar        basvurular      bilgilendirme
dogrulama       egitimler       etkinlikler     feed
gorusler        haberita        idoller         ilanlar
istatistikler   magaza          mentorluk       mesajlar
odemeler        ogrenci-kulupler projeler       sahne
sinavlar        sorular         takvim          talepler
uyeler          yarismalar      yetenekler
```

## Sayfa Akışı

### 1. Layout Chain
```
app/layout.tsx (root)
  → (panel)/layout.tsx (sidebar + header)
  → [sayfa]/page.tsx (içerik)
```

### 2. Veri Akışı
```typescript
// Server Component (default)
export default async function Page() {
  const data = await api.get('/admin/applications'); // Direct fetch
  return <ClientTable data={data} />;
}

// Client Component (interaktif)
'use client';
export function ClientTable({ data }) {
  const [filtered, setFiltered] = useState(data);
  // ...
}
```

### 3. API Bağlantısı
```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
  get: (path: string) => fetch(`${API_URL}/api/v1${path}`),
  post: (path: string, body: any) => fetch(`${API_URL}/api/v1${path}`, { method: 'POST', body }),
};
```

## Kritik Sayfalar

### basvururlar/page.tsx
- Başvuru state transition (approve, reject, interview)
- Tab navigasyon (pending, approved, rejected)
- Action butonları → API call → revalidate

### uyeler/page.tsx
- Üye listesi, filtreleme, arama
- Tier badge gösterimi
- Detay: `uyeler/[id]/page.tsx`

### istatistikler/page.tsx
- 4 widget: `_uyeler.tsx`, `_onboarding.tsx`, `_community-health.tsx`, `_insights.tsx`
- Server Component → paralel data fetch
- Chart.js veya basit istatistik kartları

## UI Components

```
apps/admin/src/components/
├── FloatingMessenger.tsx  # Sağ alt mesaj widget
├── RowMenu.tsx            # Tablo satır menüsü (3-dot)
└── ...
```

Paylaşımlı UI: `packages/ui/` (Button, Input, Card...)

## Stil Sistemi

- **Tailwind CSS 4** (PostCSS plugin)
- **@tailwindcss/forms** — form elemanları
- **globals.css** — custom CSS variables

## Çalışma Kuralları

1. **Yeni sayfa eklerken:**
   - Benzer bir sayfayı bul: `ls apps/admin/src/app/(panel)/`
   - Kopyala → düzenle → API endpoint bağla

2. **State transition (başvuru onaylama vb):**
   - API endpoint: `PATCH /admin/applications/:id/transition`
   - Frontend: optimistic update veya revalidate

3. **Tablo oluştururken:**
   - Server Component → data fetch
   - Client Component → interaktif tablo (sort, filter)
   - `RowMenu.tsx` → action dropdown

4. **API hatası:**
   - Network tab → endpoint kontrol
   - `apps/api/src/admin/` → ilgili controller'ı oku

5. **İstatistik widget:**
   - `istatistikler/_*.tsx` → ayrı dosyalarda
   - Paralel fetch için Promise.all kullan
