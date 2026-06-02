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
