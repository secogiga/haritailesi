'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import KoclukModal from '@/components/KoclukModal';

const EXAM_CONFIG = {
  kpss: {
    slug: 'kpss',
    emoji: '🏛',
    label: 'Kamu Personeli Seçme Sınavı (KPSS)',
    fullName: 'Kamu Personeli Seçme Sınavı',
    titleAmber: 'Kamu Personeli Seçme Sınavı',
    titleWhite: '(KPSS)',
    desc: 'Kamu kurumlarına alım sınavlarına hazırlık için gereken tüm kaynaklar, tüyolar ve destek içerikleri.',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-100',
    accentBadge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-200',
    hoverCls: 'hover:border-blue-200 hover:bg-blue-50/40',
    stats: [{ num: '47', lbl: 'Kaynak' }, { num: '3', lbl: 'Sınav Tarihi' }, { num: '12', lbl: 'Video' }, { num: '5', lbl: 'Koçluk' }],
  },
  gayrimenkul: {
    slug: 'gayrimenkul',
    emoji: '🏘',
    label: 'SPL Gayrimenkul Değerleme Lisans Sınavı',
    fullName: 'SPL Gayrimenkul Değerleme Lisans Sınavı',
    titleAmber: 'SPL Gayrimenkul Değerleme',
    titleWhite: 'Lisans Sınavı',
    desc: 'Gayrimenkul değerleme lisans sınavına hazırlık için gereken tüm kaynaklar, yasal mevzuat ve uygulama içerikleri.',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-100',
    accentBadge: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-200',
    hoverCls: 'hover:border-emerald-200 hover:bg-emerald-50/40',
    stats: [{ num: '38', lbl: 'Kaynak' }, { num: '4', lbl: 'Sınav Tarihi' }, { num: '9', lbl: 'Video' }, { num: '6', lbl: 'Koçluk' }],
  },
  iha: {
    slug: 'iha',
    emoji: '🚁',
    label: 'İHA Pilot Eğitimleri',
    fullName: 'İnsansız Hava Aracı (İHA) Pilot Eğitimleri',
    titleAmber: 'İnsansız Hava Aracı (İHA)',
    titleWhite: 'Pilot Eğitimleri',
    desc: 'SHY-İHA kapsamındaki sertifika sınavlarına hazırlık için gereken tüm teknik içerikler ve yasal gereksinimler.',
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-100',
    accentBadge: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-violet-200',
    hoverCls: 'hover:border-violet-200 hover:bg-violet-50/40',
    stats: [{ num: '29', lbl: 'Kaynak' }, { num: '5', lbl: 'Sınav Tarihi' }, { num: '7', lbl: 'Video' }, { num: '4', lbl: 'Koçluk' }],
  },
} as const;

type Slug = keyof typeof EXAM_CONFIG;

const TABS = ['Tüyolar', 'Kritik Tarihler', 'Kaynaklar', 'Eğitim & Koçluk'] as const;

function buildContent(slug: Slug, hoverCls: string): Record<typeof TABS[number], React.ReactNode> {
  const all: Record<Slug, Record<typeof TABS[number], React.ReactNode>> = {
    kpss: {
      'Tüyolar': <TuyolarList hoverCls={hoverCls} items={[
        { title: 'Son 5 yılda CBS soruları %40 artış gösterdi', desc: 'CBS ve mekansal analiz konularına fazladan vakit ayırmak skor ortalamasını ciddi ölçüde artırıyor.', tag: 'Strateji' },
        { title: 'Kadastro sorularında formül ezberlemek yerine kavra', desc: 'KPSS sınavında kadastro soruları kavrama odaklı — formül ezberi yerine uygulamayı anla.', tag: 'Kadastro' },
        { title: 'Deneme sınavı zamanlaması kritik', desc: 'Son 3 ayda haftada en az 1 deneme sınavı yaparak zaman yönetimini pratikleştir.', tag: 'Planlama' },
        { title: 'Harita projeksiyonları için görsel çalış', desc: 'Projeksiyon türlerini ezberlemek yerine harita üzerinde görsel olarak kavramak daha kalıcı.', tag: 'Haritacılık' },
      ]} />,
      'Kritik Tarihler': <TarihlerList hoverCls={hoverCls} items={[
        { day: '15', month: 'Ağu', event: 'Başvurular Son Gün', detail: 'ÖSYM üzerinden e-başvuru — 2026 sonbahar dönemi', badge: '⚠ Acil', badgeClass: 'bg-red-100 text-red-600' },
        { day: '22', month: 'Eyl', event: 'KPSS Sınavı', detail: 'Coğrafya, Tarih, Türkçe, Matematik oturumları', badge: '98 gün', badgeClass: 'bg-amber-100 text-amber-700' },
        { day: '10', month: 'Eki', event: 'Sonuçların Açıklanması', detail: 'ÖSYM resmi sonuç ilanı', badge: '116 gün', badgeClass: 'bg-gray-100 text-gray-500' },
      ]} />,
      'Kaynaklar': <KaynakList hoverCls={hoverCls} items={[
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'KPSS Coğrafya Özet Notları', meta: 'PDF · 48 sayfa · 2025' },
        { icon: '📊', badge: 'PPT', badgeCls: 'bg-orange-100 text-orange-600', title: 'Harita Bilgisi Slaytları', meta: 'Sunum · 60 slayt' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'Kadastro ve Tapu Özeti', meta: 'PDF · 22 sayfa' },
        { icon: '🎬', badge: 'VİDEO', badgeCls: 'bg-green-100 text-green-600', title: 'CBS Temelleri (Ders Serisi)', meta: 'Video · 8 bölüm · 4s 20dk' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'Son 10 Yıl Çıkmış Sorular', meta: 'PDF · 95 sayfa' },
        { icon: '📋', badge: 'FORM', badgeCls: 'bg-blue-100 text-blue-600', title: 'Konu Bazlı Çalışma Programı', meta: 'Şablon · 12 hafta' },
      ]} />,
      'Eğitim & Koçluk': <EgitimList hoverCls={hoverCls} items={[
        { emoji: '🎓', title: 'KPSS Coğrafya Yoğun Kamp', meta: '8 hafta · Online · Başlangıç: Tem 2026', badge: 'Kayıtlar Açık', badgeCls: 'bg-emerald-100 text-emerald-700' },
        { emoji: '🤝', title: 'Birebir Koçluk — KPSS Özel', meta: 'Esnek saatler · Online · Kişiye özel plan', badge: 'Müsait', badgeCls: 'bg-blue-100 text-blue-700' },
        { emoji: '📹', title: 'Harita Bilgisi Video Serisi', meta: 'Kendi hızında · 32 video · Ömür boyu erişim', badge: 'Yeni', badgeCls: 'bg-amber-100 text-amber-700' },
        { emoji: '📝', title: 'Deneme Sınavı Paketi (5\'li)', meta: 'Dijital · Otomatik analiz · Yanlış analizi', badge: 'Popüler', badgeCls: 'bg-violet-100 text-violet-700' },
      ]} />,
    },
    gayrimenkul: {
      'Tüyolar': <TuyolarList hoverCls={hoverCls} items={[
        { title: 'Değerleme yöntemlerini karşılaştırmalı öğren', desc: 'Gelir, maliyet ve piyasa yaklaşımını birlikte kavramak sınav sorularını kolaylaştırır.', tag: 'Strateji' },
        { title: 'Güncel SPK mevzuatını takip et', desc: 'Sınav soruları mevzuat değişikliklerini yansıtır — güncel yönetmelik değişikliklerini takip et.', tag: 'Mevzuat' },
        { title: 'Arazi değerlemesinde emsal analizi kritik', desc: 'Emsal karşılaştırma yöntemi sınav sorularının ağırlıklı konusudur, pratik yaparak pekiştir.', tag: 'Uygulama' },
        { title: 'Raporlama formatlarını iyi öğren', desc: 'Değerleme raporunun yasal gereklilikleri ve formatı sınavda sıkça sorulmaktadır.', tag: 'Raporlama' },
      ]} />,
      'Kritik Tarihler': <TarihlerList hoverCls={hoverCls} items={[
        { day: '30', month: 'Haz', event: 'Başvuru Dönemi Açılıyor', detail: 'SPK sınav başvuru dönemi — 2026 sonbahar', badge: '13 gün', badgeClass: 'bg-emerald-100 text-emerald-700' },
        { day: '15', month: 'Eyl', event: 'Değerleme Sınavı', detail: 'SPK Gayrimenkul Değerleme Uzmanlığı Sınavı', badge: '91 gün', badgeClass: 'bg-amber-100 text-amber-700' },
        { day: '30', month: 'Eyl', event: 'Sertifika Başvuruları', detail: 'Sınav sonrası sertifika başvuru süreci başlıyor', badge: '106 gün', badgeClass: 'bg-gray-100 text-gray-500' },
        { day: '10', month: 'Kas', event: 'Sonuçların Açıklanması', detail: 'SPK sınav sonuçları — kesin listeler', badge: '147 gün', badgeClass: 'bg-gray-100 text-gray-500' },
      ]} />,
      'Kaynaklar': <KaynakList hoverCls={hoverCls} items={[
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'SPK Değerleme Esasları (2025)', meta: 'PDF · 84 sayfa · Resmi' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'Değerleme Yöntemleri Karşılaştırma', meta: 'PDF · 35 sayfa' },
        { icon: '📊', badge: 'PPT', badgeCls: 'bg-orange-100 text-orange-600', title: 'Emsal Analizi Uygulamalı', meta: 'Sunum · 48 slayt' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'Tapu Kadastro Mevzuatı Özeti', meta: 'PDF · 28 sayfa' },
        { icon: '🎬', badge: 'VİDEO', badgeCls: 'bg-green-100 text-green-600', title: 'Gayrimenkul Hukuku Ders Serisi', meta: 'Video · 6 bölüm · 3s 10dk' },
        { icon: '📋', badge: 'FORM', badgeCls: 'bg-blue-100 text-blue-600', title: 'Değerleme Rapor Şablonu', meta: 'Word · SPK uyumlu format' },
      ]} />,
      'Eğitim & Koçluk': <EgitimList hoverCls={hoverCls} items={[
        { emoji: '🎓', title: 'Gayrimenkul Değerleme Yoğun Kamp', meta: '6 hafta · Online · Başlangıç: Ağu 2026', badge: 'Ön Kayıt', badgeCls: 'bg-amber-100 text-amber-700' },
        { emoji: '🤝', title: 'Birebir Koçluk — SPK Özel', meta: 'Esnek saatler · Online · Sınav odaklı', badge: 'Müsait', badgeCls: 'bg-blue-100 text-blue-700' },
        { emoji: '📹', title: 'Değerleme Yöntemleri Video Serisi', meta: 'Kendi hızında · 24 video · Ömür boyu erişim', badge: 'Yeni', badgeCls: 'bg-emerald-100 text-emerald-700' },
      ]} />,
    },
    iha: {
      'Tüyolar': <TuyolarList hoverCls={hoverCls} items={[
        { title: 'SHY-İHA kural kategorilerini iyi öğren', desc: 'A1/A2/A3 kategorilerinin farklı kural setleri var — her kategorinin sınırlarını netleştir.', tag: 'Mevzuat' },
        { title: 'Hava durumu ve NOTAM okumayı pratikle', desc: 'Sınavda meteoroloji soruları ve NOTAM yorumu sıkça çıkar — pratik yapmadan ezber işe yaramaz.', tag: 'Operasyon' },
        { title: 'Batarya ve güvenlik prosedürlerini ezberle', desc: 'LiPo batarya güvenlik kuralları ve acil durum prosedürleri her sınavda mutlaka çıkar.', tag: 'Güvenlik' },
        { title: 'Haritacılık arka planın avantaj sağlar', desc: 'Koordinat sistemi, projeksiyon ve ölçek konuları haritacılık geçmişiyle hızlı gelir.', tag: 'İpucu' },
      ]} />,
      'Kritik Tarihler': <TarihlerList hoverCls={hoverCls} items={[
        { day: '01', month: 'Ağu', event: 'Sınav Başvuruları', detail: 'DHMİ İHA Operatör Sınavı başvuru dönemi', badge: '45 gün', badgeClass: 'bg-emerald-100 text-emerald-700' },
        { day: '10', month: 'Eyl', event: 'Teorik Sınav', detail: 'İHA A2/A3 kategorisi teorik bilgi sınavı', badge: '86 gün', badgeClass: 'bg-amber-100 text-amber-700' },
        { day: '25', month: 'Eyl', event: 'Pratik Değerlendirme', detail: 'Uçuş beceri değerlendirmesi — DHMİ sahası', badge: '101 gün', badgeClass: 'bg-gray-100 text-gray-500' },
        { day: '20', month: 'Eki', event: 'Sertifika Teslimi', detail: 'Başarılı adaylara sertifika gönderimi', badge: '126 gün', badgeClass: 'bg-gray-100 text-gray-500' },
        { day: '01', month: 'Kas', event: 'Güz Dönemi Başvuruları', detail: 'Bir sonraki dönem başvuruları açılıyor', badge: '138 gün', badgeClass: 'bg-gray-100 text-gray-500' },
      ]} />,
      'Kaynaklar': <KaynakList hoverCls={hoverCls} items={[
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'SHY-İHA Yönetmeliği (2024)', meta: 'PDF · 62 sayfa · Resmi' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'İHA Meteoroloji Özet Notları', meta: 'PDF · 30 sayfa' },
        { icon: '📊', badge: 'PPT', badgeCls: 'bg-orange-100 text-orange-600', title: 'NOTAM Okuma Uygulamalı', meta: 'Sunum · 42 slayt' },
        { icon: '🎬', badge: 'VİDEO', badgeCls: 'bg-green-100 text-green-600', title: 'İHA Güvenlik Prosedürleri', meta: 'Video · 5 bölüm · 2s 45dk' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'Hava Hukuku ve Düzenlemeler', meta: 'PDF · 44 sayfa' },
        { icon: '📄', badge: 'PDF', badgeCls: 'bg-red-100 text-red-600', title: 'Sınav Örnek Soruları (50 Soru)', meta: 'PDF · 18 sayfa' },
      ]} />,
      'Eğitim & Koçluk': <EgitimList hoverCls={hoverCls} items={[
        { emoji: '🎓', title: 'İHA Teorik Sınav Hazırlık Kampı', meta: '4 hafta · Online + Saha · Başlangıç: Ağu 2026', badge: 'Kayıtlar Açık', badgeCls: 'bg-emerald-100 text-emerald-700' },
        { emoji: '🤝', title: 'Birebir Koçluk — DHMİ Sınav Özel', meta: 'Esnek saatler · Online · 5 seans paket', badge: 'Müsait', badgeCls: 'bg-blue-100 text-blue-700' },
        { emoji: '🚁', title: 'Pratik Uçuş Değerlendirme Simülasyonu', meta: 'Online simulator · 10 senaryo', badge: 'Beta', badgeCls: 'bg-amber-100 text-amber-700' },
      ]} />,
    },
  };
  return all[slug];
}

function TuyolarList({ items, hoverCls = 'hover:border-amber-200 hover:bg-amber-50/40' }: { items: { title: string; desc: string; tag: string }[]; hoverCls?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <div key={item.title} className={`bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-all cursor-default ${hoverCls}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-sm font-black text-[#0b1829] leading-snug">{item.title}</div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">{item.tag}</span>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
        </div>
      ))}
    </div>
  );
}

function TarihlerList({ items, hoverCls = 'hover:border-amber-200 hover:bg-amber-50/40' }: { items: { day: string; month: string; event: string; detail: string; badge: string; badgeClass: string }[]; hoverCls?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <div key={item.event} className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-all cursor-default ${hoverCls}`}>
          <div className="text-center flex-shrink-0 w-10 bg-gray-50 rounded-xl py-2">
            <div className="text-lg font-black text-[#0b1829] leading-none">{item.day}</div>
            <div className="text-xs font-bold text-blue-500 uppercase">{item.month}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="text-sm font-black text-[#0b1829]">{item.event}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${item.badgeClass}`}>{item.badge}</span>
            </div>
            <div className="text-xs text-gray-500">{item.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KaynakList({ items, hoverCls = 'hover:border-amber-200 hover:bg-amber-50/40' }: { items: { icon: string; badge: string; badgeCls: string; title: string; meta: string }[]; hoverCls?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.title} className={`bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer ${hoverCls}`}>
          <div className="text-2xl flex-shrink-0">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#0b1829] mb-0.5 truncate">{item.title}</div>
            <div className="text-xs text-gray-400">{item.meta}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-black px-2 py-1 rounded-lg ${item.badgeCls}`}>{item.badge}</span>
            <button className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="2.2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19,12 12,19 5,12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EgitimList({ items, hoverCls = 'hover:border-amber-200 hover:bg-amber-50/40' }: { items: { emoji: string; title: string; meta: string; badge: string; badgeCls: string }[]; hoverCls?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <div key={item.title} className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-all cursor-default ${hoverCls}`}>
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="text-sm font-black text-[#0b1829]">{item.title}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${item.badgeCls}`}>{item.badge}</span>
            </div>
            <div className="text-xs text-gray-500">{item.meta}</div>
          </div>
          <button className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0b1829] text-white hover:bg-[#1e3a5f] transition-colors flex-shrink-0">
            İncele →
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SinavDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Tüyolar');
  const [koclukOpen, setKoclukOpen] = useState(false);

  const exam = EXAM_CONFIG[slug as Slug];
  if (!exam) notFound();

  const content = buildContent(slug as Slug, exam.hoverCls);

  return (
    <>
    <KoclukModal open={koclukOpen} defaultSinav={exam.label} onClose={() => setKoclukOpen(false)} />
    <main className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <section className="bg-[#0b1829] relative overflow-hidden" style={{ paddingTop: 52 }}>
        <div
          className="absolute inset-0"
          style={{ background: 'url(/sinav.jpg) center right / cover no-repeat' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 20%, rgba(11,24,41,0.88) 36%, rgba(11,24,41,0.55) 56%, rgba(11,24,41,0.25) 76%, rgba(11,24,41,0.1) 100%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 mb-6 text-xs">
            <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Sahne</Link>
            <span className="text-white/20">›</span>
            <Link href="/kutuphane" className="text-white/35 hover:text-white/60 transition-colors">Meslek Kütüphanesi</Link>
            <span className="text-white/20">›</span>
            <Link href="/kutuphane/sinavlar" className="text-white/35 hover:text-white/60 transition-colors">Sınav Merkezi</Link>
            <span className="text-white/20">›</span>
            <span className="text-white/55">{exam.label}</span>
          </div>

          <div className="flex items-end justify-between gap-12 pb-[51px]">
            <div style={{ maxWidth: 520, flex: 1 }}>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-white/35 tracking-widest uppercase">Sınav Merkezi</span>
              </div>
              <h1 className="font-black leading-tight mb-3" style={{ fontSize: 42, letterSpacing: -1.5 }}>
                <span className="text-amber-400">{exam.titleAmber}</span>{' '}
                <span className="text-white">{exam.titleWhite}</span>
              </h1>
              <p className="text-white/55 leading-relaxed" style={{ fontSize: 14, maxWidth: 440 }}>
                {exam.desc}
              </p>
            </div>
            <div
              className="flex-shrink-0 flex flex-row overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 16,
                backdropFilter: 'blur(6px)',
                transform: 'translateY(17px)',
              }}
            >
              {exam.stats.map((s, i) => (
                <div
                  key={s.lbl}
                  style={{
                    padding: '18px 22px',
                    borderRight: i < exam.stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}
                >
                  <div className="text-white font-black leading-none" style={{ fontSize: 22, letterSpacing: -0.5 }}>{s.num}</div>
                  <div className="text-white/38 font-medium mt-1" style={{ fontSize: 11 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB BAR ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-14">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-bold px-5 py-2 rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-[#0b1829] text-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, paddingTop: 24, paddingBottom: 48 }}
      >

        {/* Main */}
        <div>
          {content[activeTab]}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">

          {/* Koçluk CTA */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e3a8a 100%)' }}
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99,102,241,0.12)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg leading-none">🎯</span>
                <div className="text-sm font-black text-white leading-snug">{exam.label} Sınavı için koçluk ihtiyacın var mı?</div>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Deneyimli uzmanların rehberliğinde artık {exam.label} süreci daha kolay.
              </p>
              <button
                onClick={() => setKoclukOpen(true)}
                className="w-full rounded-xl font-black text-xs py-2.5 transition-all hover:-translate-y-px"
                style={{ background: '#f59e0b', color: '#0b1829' }}
              >
                Koçluk Hizmeti Al →
              </button>
            </div>
          </div>

          {/* Diğer Sınavlar */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-black text-[#0b1829]">Diğer Sınavlar</span>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {Object.values(EXAM_CONFIG).filter(e => e.slug !== slug).map(e => (
                <Link
                  key={e.slug}
                  href={`/kutuphane/sinavlar/${e.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`${e.iconBg} w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0`}>
                    {e.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0b1829]">{e.label}</div>
                    <div className="text-xs text-gray-400">{e.stats[0].num} kaynak</div>
                  </div>
                  <span className="ml-auto text-gray-300 text-sm">›</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── SEPARATOR + FOOTER CTA ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="border-t border-gray-200 mb-6" />
        <div
          className="rounded-2xl px-8 py-7 flex items-center justify-between gap-8"
          style={{ background: '#0b1829' }}
        >
          <div>
            <h2 className="text-white font-black leading-tight mb-1" style={{ fontSize: 22, letterSpacing: -0.5 }}>
              Mesleğimizin yaşayan<br />en büyük bilgi platformu
            </h2>
            <p className="text-white/40 text-sm">Katkıda bulun, soru sor, içerik üret.</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/15 hover:border-white/30 transition-colors" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Asistan
            </button>
            <Link
              href="/uye-ol"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:-translate-y-px"
              style={{ background: '#f59e0b', color: '#0b1829' }}
            >
              Üye Ol →
            </Link>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
