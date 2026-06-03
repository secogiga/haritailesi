# Mutfak Context — Sadece Mutfak Üzerinde Çalışırken Oku

## Mutfak Nedir?

Haritailesi'nin kapalı topluluk feed platformu. Sadece onaylı üyeler erişebilir.

**Model:** Hybrid LinkedIn + Reddit
- LinkedIn: Kimlik ve mesleki görünürlük
- Reddit: Konu/kategori/soru-cevap/tartışma

## Yapı

```
apps/mutfak/src/app/
├── (mutfak)/           # Ana layout (sidebar + feed)
│   ├── layout.tsx      # Sidebar, StatsBar, ActivityWidget
│   ├── akis/           # Ana feed sayfası (post listesi)
│   │   └── page.tsx
│   ├── hesabim/        # Profil düzenleme
│   │   └── _components/ProfileEditForm.tsx
│   ├── mesajlar/       # Direkt mesajlaşma
│   │   └── page.tsx
│   └── onboarding/     # İlk giriş rehberi
│       └── page.tsx
└── sifre-belirle/      # İlk şifre belirleme (invite link)
```

## Feed Sistemi

### Akış
```
API: GET /community/posts
  → Redis cache kontrol (feed:list:...)
  → Cache miss → DB query
  → Cache hit → direkt dön

Frontend: TanStack Query
  → useQuery('posts', fetchPosts)
  → Infinite scroll (cursor-based pagination)
```

### Post Türleri
- **Gönderi:** Genel paylaşım (text, image, link)
- **Soru:** Q&A formatı
- **Tartışma:** Thread-style
- **Duyuru:** Moderatör/admin paylaşımı

### Etkileşim
- Like/reaction
- Yorum (nested comments)
- Paylaş
- Kaydet

## Bileşenler

```
apps/mutfak/src/components/
├── Sidebar.tsx          # Sol menü (navigasyon + kategoriler)
├── StatsBar.tsx         # Üst bar (istatistikler)
├── ActivityWidget.tsx   # Sağ widget (son aktiviteler)
├── SuggestedMembers.tsx # Öneri kartları
└── FloatingMessenger.tsx # Mesaj balonu
```

## Veri Akışı

### TanStack Query Pattern
```typescript
// lib/api.ts
export const api = {
  getPosts: () => fetch('/api/v1/community/posts').then(r => r.json()),
  createPost: (data) => fetch('/api/v1/community/posts', { method: 'POST', body: JSON.stringify(data) }),
};

// Component
'use client';
export function Feed() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: api.getPosts,
  });
}
```

### Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: api.createPost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

## Context'ler

```
apps/mutfak/src/contexts/
└── (potansiyel auth/notification context'leri)
```

## Hooks

```
apps/mutfak/src/hooks/
└── (custom hooks: usePost, useComment, useNotification)
```

## Stil Sistemi

- **Tailwind CSS 4** (PostCSS)
- Responsive: mobile-first
- Dark mode: (potansiyel)

## API Endpoint'leri

```
GET    /community/posts              # Feed listesi
POST   /community/posts              # Yeni post
GET    /community/posts/:id          # Post detayı
POST   /community/posts/:id/like     # Beğen
POST   /community/posts/:id/comment  # Yorum ekle
GET    /users/suggested              # Öneri üyeler
GET    /users/me                     # Mevcut kullanıcı
PATCH  /users/me                     # Profil güncelle
```

## Çalışma Kuralları

1. **Feed akışı değişikliği:**
   - `apps/mutfak/src/app/(mutfak)/akis/page.tsx` → oku
   - API: `apps/api/src/community/community.controller.ts` → oku
   - Redis cache key: `feed:list:...` → kontrol et

2. **Yeni widget eklerken:**
   - `components/` altına ekle
   - `(mutfak)/layout.tsx`'e import et
   - TanStack Query kullan (SSR değil)

3. **Profil düzenleme:**
   - `hesabim/_components/ProfileEditForm.tsx` → React Hook Form + Zod
   - API: `PATCH /users/me`

4. **Mesajlaşma:**
   - `mesajlar/page.tsx` → direkt mesaj listesi
   - API: `apps/api/src/messages/` modülü

5. **Onboarding akışı:**
   - `onboarding/page.tsx` → multi-step form
   - İlk giriş → profilini tamamla → ilgi alanları seç → feed'e yönlendir
