# Haritailesi Dijital Ekosistemi — Master Mimari Özeti

> Bu döküman, tüm mimari kararların tek referans noktasıdır.

---

## Platform Kimliği

Haritailesi Vakfı dijital ekosistemi; harita, geomatik, kadastro, CBS, fotogrametri, uzaktan algılama, gayrimenkul değerleme ve inşaat sektörü profesyonellerine yönelik **community-first mesleki platformdur**.

**Ana Felsefe:** "Haritailesi Win-Win Ekosistemi — herkesin kazandığı bir dünya mümkün."

---

## 4 Ana Yüzey

| Yüzey | URL | Kapsam | Erişim |
|---|---|---|---|
| Ana site | haritailesi.org | Vakıf tanıtımı + 3 başvuru formu | Herkese açık |
| Sahne | sahne.haritailesi.org | Vitrin + modül geçiş ekranı | Yarı açık |
| Mutfak | mutfak.haritailesi.org | Kapalı topluluk, feed, üretim | Onaylı üyeler |
| Admin | admin.haritailesi.org | Operasyon paneli | Yetkili ekip |

---

## Üyelik Mimarisi

### Bireysel (Mesleğin Değer Ortakları)

| Tier | Hedef | Ücret | Erişim |
|---|---|---|---|
| Haritailesi Genç | Öğrenci | Ücretsiz | Sahne tam + Mutfak sınırlı |
| Yeni Mezun | Yeni mezun | 750 TL/yıl | Kariyer/networking+ |
| Bireysel Üye | Profesyonel | 1750 TL/yıl | Tam + mentör olabilir |

### Kurumsal (Mesleğe Değer Katan Markalar)
SHKM, LİHKAB, Şirketler

### Program
**Mesleğin Gelecekleri** — 25 kontenjanlı seçilmiş öğrenci gelişim programı

---

## Başvuru Pipeline'ları

### Bireysel (10 state)
`submitted → under_review → [interview_needed → interview_scheduled] → approved → [waiting_payment] → waiting_verification → active ↔ passive`

### Kurumsal (11 state)
`submitted → under_review → interview_needed → approved → waiting_payment → waiting_verification → verified → active | rejected | passive`

### Mesleğin Gelecekleri (11 state)
`submitted → under_review → shortlisted → interview_needed → interview_completed → accepted | waitlisted | rejected → waiting_student_verification → active_program_member → program_completed`

### Doğrulama (5 state)
`unverified → verification_requested → verification_submitted → verified | verification_rejected`

---

## Kritik Ürün Kararları

| Karar | Tercih | Neden |
|---|---|---|
| Platform tipi | Custom (Odoo yok) | Tam kontrol, özel mimari |
| Gamification | İlk fazda görünmez, veri toplanır | Kültürü puan yarışmasına dönüştürmemek |
| Doğrulama zamanı | Onboarding'de değil, doğrulama aşamasında | Sürtünmeyi azaltmak |
| Üyelik tipi seçimi | Kullanıcı seçmez, sistem segmentasyon yapar | UX sadeliği + doğru yönlendirme |
| Onboarding limbo | Provisionary preview + tetikleyici email serisi | Bağı canlı tutmak |
| Doğrulama modeli | Tier bazlı (her seviyeye uygun sürtünme) | Dengeleme |
| Mentor eşleştirme | Hybrid (açık dizin + admin rubber-stamp) | Özerklik + kalite kontrolü |
| Kurumsal feed | Faz 1'de feed'de yer almaz, sadece Sahne'de | Feed kültürünü korumak |

---

## Rozet Sistemi

- Doğrulanmış Üye
- Doğrulanmış Kuruluş
- Doğrulanmış Mentör
- Mesleğin Gelecekleri Katılımcısı

---

## Kullanıcı Rolleri (12 rol)

**Membership tiers (dışlayıcı, hiyerarşik):**
`visitor < registered_user < haritailesi_genc < new_graduate_member < individual_member`
`corporate_member` (paralel hiyerarşi)

**Functional roles (eklemeli):**
`mentor | moderator | editor | meslegin_gelecekleri_participant | admin | super_admin`

---

## Feed Sistemi (Mutfak)

**Model:** Hybrid LinkedIn + Reddit
- LinkedIn: kimlik ve mesleki görünürlük
- Reddit: konu/kategori/soru-cevap/tartışma
- Kapalı ve kontrollü topluluk

**Post Tipleri (10):** Genel paylaşım, Soru, Fikir, Proje çağrısı, İçerik taslağı, Ekip arayışı, Mentörlük deneyimi, Anket, Duyuru, Kaynak paylaşımı

**Kategoriler (12):** Klasik Haritacılık, CBS, Fotogrametri & Uzaktan Algılama, İnşaat, Gayrimenkul Değerleme, Yazılım & Teknoloji, Kariyer, Eğitim, Mentörlük, Gönüllülük, Proje Geliştirme, Haritailesi Duyuruları

---

## Aksiyon Sistemi

Her aksiyon backend'de tutulur, Faz 1'de kullanıcıya gösterilmez.

Gelecekteki puan tipleri: katkı puanı, içerik puanı, mentörlük puanı, topluluk puanı, görünürlük puanı

---

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Backend | Node.js + NestJS (TypeScript) |
| Veritabanı | PostgreSQL 15 + Redis 7 |
| Frontend | Next.js (Turborepo monorepo) |
| File Storage | MinIO (self-hosted, S3-compat) |
| Email | Brevo (300/gün ücretsiz) |
| Error Tracking | GlitchTip (self-hosted) |
| Proxy/SSL | Caddy |
| Process | Docker + Docker Compose |
| CI/CD | GitHub Actions |

**Sunucu:** 4 Core Intel E5 | 8 GB DDR4 | 100 GB NVMe | 379 TL/ay

---

## Admin Panel Modülleri (17)

Dashboard, Başvurular, Üyelik Yönetimi, Kurumsal Üyelik Yönetimi, Mesleğin Gelecekleri Yönetimi, Doğrulama Yönetimi, Kullanıcı Yönetimi, Roller & Yetkiler, Feed Moderasyonu, İçerik Yönetimi, Etkinlik Yönetimi, Eğitim Yönetimi, Mentörlük Yönetimi, Aksiyon Yönetimi, Bildirimler, Raporlar, Ayarlar

---

## Proje Döküman Dizini

```
docs/
  master-mimari-ozet.md           ← bu dosya
  sahne-modul-yapisi.md           ← Sahne görsel referansı
  forms/
    bireysel-uyelik-formu.md
    kurumsal-uyelik-formu.md
    meslegin-gelecekleri-formu.md
```
