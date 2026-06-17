'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import KoclukModal from './KoclukModal';
import KaynakTalepModal from './KaynakTalepModal';
import { cms, type Training, type SinavMerkeziKaynak } from '@/lib/api';

const EXAMS = [
  {
    key: 'kpss',
    emoji: '🏛',
    label: 'Kamu Personeli Seçme Sınavı (KPSS)',
    desc: 'Kamu Personeli Seçme Sınavı hazırlık sürecinize dair tüm içerikler.',
    headBg: 'bg-blue-50',
    headBorder: 'border-blue-100',
    iconBg: 'bg-blue-200',
    titleColor: 'text-blue-900',
    counts: { tuyor: 2, tarih: 3, kaynak: 12, egitim: 5 },
  },
  {
    key: 'gayrimenkul',
    emoji: '🏘',
    label: 'SPL Gayrimenkul Değerleme Lisans Sınavı',
    desc: 'Gayrimenkul değerleme lisans sınavına hazırlık sürecinize dair tüm içerikler.',
    headBg: 'bg-emerald-50',
    headBorder: 'border-emerald-100',
    iconBg: 'bg-emerald-200',
    titleColor: 'text-emerald-900',
    counts: { tuyor: 2, tarih: 4, kaynak: 15, egitim: 6 },
  },
  {
    key: 'iha',
    emoji: '🚁',
    label: 'İHA Pilot Eğitimleri',
    desc: 'İnsansız Hava Aracı (İHA) pilot eğitimleri için ihtiyacınız olan tüm içerikler.',
    headBg: 'bg-violet-50',
    headBorder: 'border-violet-100',
    iconBg: 'bg-violet-200',
    titleColor: 'text-violet-900',
    counts: { tuyor: 2, tarih: 5, kaynak: 10, egitim: 4 },
  },
];

function kaynak2ui(k: SinavMerkeziKaynak): { badge: string; badgeColor: string; icon: string; meta: string } {
  if (k.source === 'guide') {
    return { badge: 'Rehber', badgeColor: 'bg-emerald-100 text-emerald-700', icon: '📖', meta: 'Rehber' };
  }
  if (k.source === 'regulation') {
    return { badge: 'Mevzuat', badgeColor: 'bg-orange-100 text-orange-700', icon: '⚖️', meta: 'Mevzuat' + (k.publishDate ? ` · ${k.publishDate.slice(0, 4)}` : '') };
  }
  // document
  const typeMap: Record<string, { badge: string; badgeColor: string; icon: string }> = {
    pdf: { badge: 'PDF', badgeColor: 'bg-red-100 text-red-600', icon: '📄' },
    technical_spec: { badge: 'Teknik', badgeColor: 'bg-blue-100 text-blue-700', icon: '📋' },
    academic: { badge: 'Akademik', badgeColor: 'bg-violet-100 text-violet-700', icon: '🎓' },
    report: { badge: 'Rapor', badgeColor: 'bg-amber-100 text-amber-700', icon: '📊' },
    standard: { badge: 'Standart', badgeColor: 'bg-teal-100 text-teal-700', icon: '📏' },
    guide_doc: { badge: 'Kılavuz', badgeColor: 'bg-indigo-100 text-indigo-700', icon: '📑' },
  };
  const t = typeMap[k.type] ?? { badge: 'Doküman', badgeColor: 'bg-gray-100 text-gray-600', icon: '📄' };
  const meta = [t.badge, k.authorName, k.publishYear?.toString()].filter(Boolean).join(' · ');
  return { ...t, meta };
}


const TARIHLER = [
  { day: '15', month: 'Ağu', event: 'Başvurular Son Gün', sub: '15 Ağustos 2026', badge: '⚠ Acil', badgeColor: 'bg-red-100 text-red-600' },
  { day: '22', month: 'Eyl', event: 'KPSS Sınavı', sub: '22 Eylül 2026', badge: '98 gün', badgeColor: 'bg-amber-100 text-amber-700' },
  { day: '10', month: 'Eki', event: 'Sonuçların Açıklanması', sub: '10 Ekim 2026', badge: '116 gün', badgeColor: 'bg-gray-100 text-gray-500' },
];

const CATS = [
  { icon: '💡', iconBg: 'bg-amber-50', label: 'Tüyolar', countKey: 'tuyor' as const, unit: 'içerik' },
  { icon: '📅', iconBg: 'bg-blue-50', label: 'Kritik Tarihler', countKey: 'tarih' as const, unit: 'tarih' },
  { icon: '📂', iconBg: 'bg-emerald-50', label: 'Kaynaklar', countKey: 'kaynak' as const, unit: 'kaynak' },
  { icon: '🎓', iconBg: 'bg-violet-50', label: 'Eğitim & Koçluk', countKey: 'egitim' as const, unit: 'program' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function SinavlarPageContent() {
  const [videolar, setVideolar] = useState<Training[]>([]);
  const [kaynaklar, setKaynaklar] = useState<SinavMerkeziKaynak[]>([]);
  const [talepSinav, setTalepSinav] = useState('KPSS');
  const [talepKaynak, setTalepKaynak] = useState('');
  const [talepModalOpen, setTalepModalOpen] = useState(false);

  useEffect(() => {
    cms.trainings({ sinavMerkezi: true }).then(async featured => {
      if (featured.length > 0) {
        setVideolar(featured.slice(0, 3));
      } else {
        const all = await cms.trainings();
        setVideolar(all.slice(0, 3));
      }
    });
    cms.sinavMerkeziKaynaklar().then(setKaynaklar);
  }, []);
  const [koclukOpen, setKoclukOpen] = useState(false);

  const handleTalepSubmit = () => {
    if (!talepKaynak.trim()) return;
    setTalepModalOpen(true);
  };

  return (
    <>
    <KoclukModal open={koclukOpen} onClose={() => setKoclukOpen(false)} />
    <KaynakTalepModal
      open={talepModalOpen}
      sinav={talepSinav}
      kaynak={talepKaynak}
      onClose={() => { setTalepModalOpen(false); setTalepKaynak(''); }}
    />
    <main className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <section className="bg-[#0b1829] relative overflow-hidden" style={{ paddingTop: 52, paddingBottom: 0 }}>
        <div
          className="absolute inset-0"
          style={{
            right: 0,
            background: 'url(/sinav.jpg) center right / cover no-repeat',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #0b1829 0%, #0b1829 20%, rgba(11,24,41,0.88) 36%, rgba(11,24,41,0.55) 56%, rgba(11,24,41,0.25) 76%, rgba(11,24,41,0.1) 100%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-12" style={{ paddingBottom: 51 }}>
            <div style={{ maxWidth: 520, flex: 1 }}>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-white/35 tracking-widest uppercase">Meslek Kütüphanesi</span>
              </div>
              <h1 className="text-white font-black leading-none mb-3" style={{ fontSize: 52, letterSpacing: -1.5 }}>
                Sınav<br /><span className="text-amber-400">Merkezi</span>
              </h1>
              <p className="text-white/55 leading-relaxed" style={{ fontSize: 14, maxWidth: 440 }}>
                Mesleki sınavlar için tüyolar, kaynaklar, kritik tarihler ve koçluk hizmetleriyle bir adım önde ol.
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
              {[
                { num: '4', lbl: 'Sınav' },
                { num: '18', lbl: 'Simülasyon' },
                { num: '12', lbl: 'Doküman' },
                { num: '35', lbl: 'Video' },
              ].map((s, i, arr) => (
                <div
                  key={s.lbl}
                  style={{
                    padding: '18px 24px',
                    borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
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

      {/* ── GÜNÜN TAVSİYESİ BANNER ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-base flex-shrink-0">💡</div>
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Günün Tavsiyesi</div>
            <div className="text-sm text-gray-700 leading-relaxed">
              Son 5 yılda çıkan KPSS sorularının %40&apos;ı CBS ve mekansal analiz konularından oluşmaktadır. Bu konulara fazladan vakit ayırman skor ortalamanı ciddi ölçüde artıracak.
            </div>
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, paddingTop: 24, paddingBottom: 48 }}
      >

        {/* ── MAIN COL ── */}
        <div className="flex flex-col gap-4">

          {/* Sınav Kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {EXAMS.map(exam => (
              <div
                key={exam.key}
                className="bg-white border border-gray-200 flex flex-col hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                style={{ borderRadius: 18, overflow: 'hidden' }}
              >
                <div className={`${exam.headBg} border-b ${exam.headBorder} p-5`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${exam.iconBg} w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                      {exam.emoji}
                    </div>
                    <div className={`text-sm font-black ${exam.titleColor}`} style={{ letterSpacing: -0.2 }}>{exam.label}</div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{exam.desc}</p>
                </div>
                <div className="flex flex-col flex-1">
                  {CATS.map((cat, i) => (
                    <div
                      key={cat.label}
                      className="flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-all duration-150 hover:pl-6"
                      style={{
                        padding: '11px 20px',
                        borderBottom: i < CATS.length - 1 ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <div className={`${cat.iconBg} w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
                        {cat.icon}
                      </div>
                      <span className="flex-1 text-sm font-semibold text-gray-700">{cat.label}</span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {exam.counts[cat.countKey]} {cat.unit}
                      </span>
                      <span className="text-gray-300 text-sm ml-1">›</span>
                    </div>
                  ))}
                </div>
                <div className="p-3.5 border-t border-gray-100">
                  <Link
                    href={`/kutuphane/sinavlar/${exam.key}`}
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-[#0b1829] border border-gray-200 rounded-xl py-2.5 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Modüle Git →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Kaynak Merkezi */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-base font-black text-[#0b1829]">📚 Kaynak Merkezi</span>
            </div>
            {kaynaklar.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-400">
                Henüz öne çıkan kaynak eklenmemiş.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, padding: '0 20px 20px' }}>
                {kaynaklar.slice(0, 5).map(k => {
                  const ui = kaynak2ui(k);
                  const href = k.externalUrl ?? k.fileUrl ?? (k.slug ? `/kutuphane/rehberler/${k.slug}` : '#');
                  return (
                    <a
                      key={k.id}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 cursor-pointer hover:bg-white hover:border-gray-300 transition-all block"
                    >
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${ui.badgeColor} inline-block mb-2`}>{ui.badge}</span>
                      <div className="text-2xl mb-2">{ui.icon}</div>
                      <div className="text-xs font-bold text-[#0b1829] leading-snug mb-1">{k.title}</div>
                      <div className="text-xs text-gray-400">{ui.meta}</div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Video Eğitimler */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-base font-black text-[#0b1829]">🎬 Video Eğitimler</span>
              <Link href="/egitim" className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                Tümünü Gör ›
              </Link>
            </div>
            {videolar.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-400">
                Henüz öne çıkan eğitim eklenmemiş.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '0 20px 20px' }}>
                {videolar.map(v => (
                  <Link key={v.id} href={`/egitim/${v.slug}`} className="rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-all block">
                    <div className="relative" style={{ height: 90 }}>
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: v.coverImageKey
                            ? `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(${API_BASE}/api/v1/media?key=${encodeURIComponent(v.coverImageKey)}) center/cover no-repeat`
                            : 'linear-gradient(135deg,#0b1829,#1e3a8a)',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center pl-0.5 text-sm">▶</div>
                      </div>
                      {v.duration && (
                        <span className="absolute bottom-1.5 right-2 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                          {v.duration}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <div className="text-xs font-bold text-[#0b1829] mb-0.5 truncate">{v.title}</div>
                      <div className="text-xs text-gray-400 truncate">{v.instructor ? `Eğitmen: ${v.instructor}` : 'Haritailesi'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Ekosistem */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4">
            {[
              { icon: '🎓', iconBg: 'bg-blue-50', name: 'Haritakademi', desc: 'Online eğitimlerle kariyer geliştir', link: 'Eğitimlere Git', href: 'https://www.linkedin.com/showcase/haritakademi' },
              { icon: '💼', iconBg: 'bg-amber-50', name: 'Haritakariyer', desc: 'İş fırsatlarını keşfet', link: 'Kariyer Merkezi', href: 'https://www.linkedin.com/showcase/haritakariyer' },
              { icon: '🌐', iconBg: 'bg-emerald-50', name: 'Haritailesi Sahne', desc: 'Etkinlikler ve buluşmalar', link: 'Etkinlikleri Gör', href: 'https://sahne.haritailesi.org' },
            ].map(e => (
              <Link key={e.name} href={e.href} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <div className={`${e.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{e.icon}</div>
                <div>
                  <div className="text-sm font-bold text-[#0b1829] mb-0.5">{e.name}</div>
                  <div className="text-xs text-gray-400 mb-1">{e.desc}</div>
                  <div className="text-xs font-bold text-blue-500">{e.link} ›</div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* ── SIDEBAR ── */}
        <div className="flex flex-col gap-4">

          {/* Kritik Tarihler */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-black text-[#0b1829]">📅 Kritik Tarihler</span>
              <span className="text-xs font-semibold text-blue-500">Tüm Takvim ›</span>
            </div>
            <div className="px-5 pb-5">
              {TARIHLER.map((t, i) => (
                <div key={t.event} className={`flex items-start gap-3 py-3 ${i < TARIHLER.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="text-center flex-shrink-0 w-9">
                    <div className="text-lg font-black text-[#0b1829] leading-none">{t.day}</div>
                    <div className="text-xs font-bold text-blue-500 uppercase">{t.month}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#0b1829] mb-0.5">{t.event}</div>
                    <div className="text-xs text-gray-400 mb-1.5">{t.sub}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${t.badgeColor}`}>{t.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Koçluk CTA */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e3a8a 100%)' }}
          >
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: 'rgba(99,102,241,0.12)' }} />
            <div className="absolute -bottom-10 right-5 w-28 h-28 rounded-full" style={{ background: 'rgba(251,191,36,0.07)' }} />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <span style={{ fontSize: 26 }}>🎯</span>
                <h3 className="text-white font-black leading-snug" style={{ fontSize: 15, letterSpacing: -0.3 }}>
                  Sınavlar için koçluk ihtiyacın var mı?
                </h3>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>
                Uzman koçlarla birebir çalış, kişiselleştirilmiş plan ve sorularınla hedef puanına ulaş.
              </p>
              <div className="flex flex-col gap-2.5 mb-5">
                {[
                  { icon: '🎥', text: 'Birebir online seans' },
                  { icon: '📋', text: 'Kişiye özel çalışma planı' },
                  { icon: '✏️', text: 'Soru çözüm ve performans analizi' },
                ].map(f => (
                  <div key={f.text} className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                      style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}
                    >
                      {f.icon}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12.5 }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setKoclukOpen(true)}
                className="w-full rounded-xl font-black text-sm py-3 transition-all hover:-translate-y-px"
                style={{
                  background: '#f59e0b',
                  color: '#0b1829',
                  fontSize: 13,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fbbf24'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f59e0b'; }}
              >
                Koçluk Hizmeti Al →
              </button>
            </div>
          </div>

          {/* Kaynak Talep */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-[#0b1829] leading-snug mb-1.5">Aradığınız kaynağı mı bulamadınız?</div>
                <div className="text-xs text-gray-500 leading-relaxed">Ekibimize talebinizi iletin, en kısa sürede dönüş yapalım.</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">📬</div>
            </div>
            <div className="flex gap-1.5">
              {['KPSS', 'Gayrimenkul', 'İHA'].map(s => (
                <button
                  key={s}
                  onClick={() => setTalepSinav(s)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
                  style={{
                    background: talepSinav === s ? '#0b1829' : '#fff',
                    color: talepSinav === s ? '#fff' : '#6b7280',
                    borderColor: talepSinav === s ? '#0b1829' : '#e5e7eb',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={talepKaynak}
              onChange={e => setTalepKaynak(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTalepSubmit(); }}
              placeholder="Talep ettiğiniz kaynak…"
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-gray-800 transition-colors"
              style={{ fontFamily: 'inherit' }}
            />
            <button
              onClick={handleTalepSubmit}
              disabled={!talepKaynak.trim()}
              className="w-full text-sm font-bold py-2.5 rounded-xl border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Kaynak Talep Et
            </button>
          </div>

        </div>
      </div>
    </main>
    </>
  );
}
