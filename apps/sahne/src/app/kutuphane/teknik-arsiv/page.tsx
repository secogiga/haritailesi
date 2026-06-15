'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useState } from 'react';

const MEVZUAT_ITEMS = ['3194 Sayılı İmar Kanunu', 'Deprem Yönetmeliği', 'Resmi Gazete Tebliğleri', 'Mekânsal Planlar Yapım Yönetmeliği', 'CBS Genelgesi (2024/1)'];
const TEKNIK_ITEMS  = ['TKGM Teknik Şartnamesi 2023', 'ISO 19115: Coğrafi Bilgi Standardı', 'Montaj Kılavuzu', 'TSE Standart Belgeleri', 'EPSG Koordinat Referans Sistemleri'];
const AKADEMIK_ITEMS = ['Harita Genel Müd. Teknik Raporları', 'CBS Uygulamaları: Akademik Derleme', 'Arazi Örtüsü Sınıflandırma Yöntemleri', 'Yüksek Lisans Tezleri', 'Uzaktan Algılama Uygulamaları'];

function TalepModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', kaynak: '', aciklama: '' });
  const [sent, setSent] = useState(false);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f1f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829' }}>Kaynak Talep Et</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Aradığınız kaynağı ekibimize bildirin</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 16, fontWeight: 700 }}>×</button>
        </div>
        {sent ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0b1829', marginBottom: 6 }}>Talebiniz alındı!</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>En kısa sürede size dönüş yapacağız.</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Tamam</button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'name',      label: 'Adınız',             placeholder: 'Ad Soyad' },
              { key: 'email',     label: 'E-posta',            placeholder: 'ornek@mail.com' },
              { key: 'kaynak',    label: 'Talep Edilen Kaynak', placeholder: 'Kaynak adı veya türü' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', marginBottom: 5 }}>{label}</div>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#0b1829', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Açıklama</div>
              <textarea
                placeholder="Kaynakla ilgili ek bilgi..."
                value={form.aciklama}
                onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#0b1829', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 700, color: '#6b7280', cursor: 'pointer' }}>İptal</button>
              <button onClick={() => form.name && form.email && form.kaynak ? setSent(true) : null} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#16a34a', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Gönder</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const DocIcon = ({ size = 14, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

export default function TeknikArsivPage() {
  const [query, setQuery] = useState('');
  const [showTalep, setShowTalep] = useState(false);
  const q = query.toLowerCase();
  const filtered = (items: string[]) => items.filter(i => i.toLowerCase().includes(q));

  return (
    <>
      <Navbar />
      {showTalep && <TalepModal onClose={() => setShowTalep(false)} />}
      <main className="min-h-screen" style={{ background: '#f5f6f8', color: '#0b1829' }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bg-[#0b1829] text-white relative min-h-[340px]">
          {/* teknikarsiv.jpg — sağ taraf, sola geçişli */}
          <div className="absolute inset-0 left-[38%]"
            style={{ backgroundImage: "url('/teknikarsiv.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 6%, rgba(11,24,41,0.82) 42%, rgba(11,24,41,0.18) 100%)' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[58px] pb-[50px]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-6 text-xs">
              <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Sahne</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane" className="text-white/35 hover:text-white/60 transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/50">Teknik Arşiv</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48 }}>
              {/* Sol */}
              <div style={{ flex: 1, maxWidth: 520 }}>
                <h1 className="text-[52px] font-black leading-none tracking-[-1.5px] mb-3.5">
                  <span className="text-amber-400">Teknik</span> Arşiv
                </h1>
                <p className="text-white/[0.48] text-sm leading-relaxed max-w-[400px] mb-6">
                  Mevzuat, teknik kaynaklar ve akademik yayınlar tek yerde. Güvenilir, güncel ve kapsamlı bilgiye hızlı erişin.
                </p>
                <div className="flex gap-2 max-w-[460px]">
                  <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="search"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Mevzuat, standart, makale ara…"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-[10px] text-sm text-white placeholder-white/25 focus:outline-none focus:bg-white/10 transition-all"
                    />
                  </div>
                  <button onClick={() => setQuery('')} className="px-5 py-3 bg-amber-500 hover:bg-amber-600 transition-colors rounded-[10px] text-sm text-white font-bold shrink-0 flex items-center cursor-pointer">
                    {query ? 'Temizle' : 'Ara'}
                  </button>
                </div>
              </div>

              {/* Sağ: Stats Panel */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(6px)', transform: 'translateY(17px)' }}>
                {[
                  { value: '520+', label: 'Mevzuat' },
                  { value: '380+', label: 'Doküman' },
                  { value: '240+', label: 'Yayın' },
                  { value: '8',    label: 'Kategori' },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{ padding: '18px 24px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Page grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 35, paddingBottom: 0, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

          {/* ── Highlight Bar (full width) ── */}
          <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: '0 8px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {[
              { icon: <svg width="17" height="17" fill="none" stroke="#f97316" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z"/><path d="M12 12c0 3-2 4-2 7a2 2 0 0 0 4 0c0-3-2-4-2-7z"/></svg>, iconBg: '#fff7ed', iconColor: '#f97316', label: 'Bu Hafta Öne Çıkanlar', value: 'Uzaktan Algılama Uygulamaları' },
              { icon: <svg width="17" height="17" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>, iconBg: '#fffbeb', iconColor: '#d97706', label: 'En Çok İndirilenler', value: 'TKGM Teknik Şartnamesi 2023' },
              { badge: 'YENİ', badgeBg: '#f0fdf4', badgeColor: '#16a34a', label: 'Yeni Eklenenler', value: 'CBS Genelgesi (2024/1)' },
              { icon: <svg width="17" height="17" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>, iconBg: '#faf5ff', iconColor: '#7c3aed', label: 'Editör Seçkisi', value: 'Mekânsal Planlar Yapım Yönetmeliği' },
            ].map(({ icon, iconBg, badge, badgeBg, badgeColor, label, value }, i, arr) => (
              <div key={label} className="hover:bg-gray-50 transition-colors" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px', borderRight: i < arr.length - 1 ? '1px solid #f0f1f3' : 'none', cursor: 'pointer' }}>
                {badge ? (
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: badgeBg, border: `1.5px solid ${badgeColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: badgeColor, letterSpacing: '0.06em' }}>{badge}</span>
                  </div>
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b0b7c3', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1829', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Left: Section cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ── MEVZUAT ── */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 18, overflow: 'hidden', display: 'grid', gridTemplateColumns: '390px 1fr' }}>
              <div style={{ padding: '22px 20px 20px', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="26" height="26" fill="none" stroke="#16a34a" strokeWidth="1.7" viewBox="0 0 24 24">
                      <line x1="12" y1="3" x2="12" y2="21" />
                      <path d="M3 9c0 2.5 2 4 4.5 4S12 11.5 12 9H3z" />
                      <path d="M12 9c0 2.5 2 4 4.5 4S21 11.5 21 9h-9z" />
                      <line x1="4" y1="21" x2="20" y2="21" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0b1829', letterSpacing: -0.4, lineHeight: 1.1 }}>Mevzuat</div>
                </div>
                <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.65, marginBottom: 14 }}>
                  Kanunlar, yönetmelikler, tebliğler ve genelgeler dahil tüm resmi düzenlemelere kolayca ulaşın.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {['Kanun', 'Yönetmelik', 'Tebliğ', 'Genelge'].map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a' }}>{t}</span>
                  ))}
                </div>
                <Link href="/kutuphane/teknik-arsiv/mevzuat" style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', cursor: 'pointer', textDecoration: 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <DocIcon stroke="#16a34a" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2, color: '#16a34a' }}>En Çok Okunan</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1829', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>3194 Sayılı İmar Kanunu</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>›</span>
                </Link>
                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DocIcon size={14} />
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>520+</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Kaynak</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>8</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Kategori</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div><div style={{ fontSize: 11, fontWeight: 800, color: '#374151', lineHeight: 1 }}>Son Güncelleme</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>12 Haz 2026</div></div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#16a34a', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Popüler İçerikler</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                  {filtered(MEVZUAT_ITEMS).length === 0
                    ? <li style={{ fontSize: 12, color: '#9ca3af', padding: '10px 6px' }}>Sonuç bulunamadı</li>
                    : filtered(MEVZUAT_ITEMS).map(item => (
                    <Link key={item} href="/kutuphane/teknik-arsiv/mevzuat" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', borderBottom: '1px solid #f3f4f6', textDecoration: 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#16a34a' }}><DocIcon /></div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0b1829', flex: 1, lineHeight: 1.35 }}>{item}</span>
                      <span style={{ color: '#c8cdd6', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>›</span>
                    </Link>
                  ))}
                </ul>
                <Link href="/kutuphane/teknik-arsiv/mevzuat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #16a34a', color: '#16a34a', background: 'transparent', textDecoration: 'none' }}>
                  Tüm Mevzuatı Gör →
                </Link>
              </div>
            </div>

            {/* ── TEKNİK KAYNAKLAR ── */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 18, overflow: 'hidden', display: 'grid', gridTemplateColumns: '390px 1fr' }}>
              <div style={{ padding: '22px 20px 20px', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="26" height="26" fill="none" stroke="#2563eb" strokeWidth="1.7" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="3" />
                      <line x1="12" y1="3" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="21" />
                      <line x1="3" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="21" y2="12" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0b1829', letterSpacing: -0.4, lineHeight: 1.1 }}>Teknik Kaynaklar</div>
                </div>
                <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.65, marginBottom: 14 }}>
                  TKGM şartnameleri, TSE standartları, uygulama kılavuzları ve teknik raporlara tek noktadan erişin.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {['Şartname', 'Standart', 'Kılavuz', 'Teknik Rapor'].map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb' }}>{t}</span>
                  ))}
                </div>
                <Link href="/kutuphane/teknik-arsiv/teknik-kaynaklar" style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', cursor: 'pointer', textDecoration: 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <DocIcon stroke="#2563eb" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2, color: '#2563eb' }}>En Çok İndirilen</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1829', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TKGM Teknik Şartnamesi 2023</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>›</span>
                </Link>
                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DocIcon size={14} />
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>610+</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Kaynak</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>12</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Kategori</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div><div style={{ fontSize: 11, fontWeight: 800, color: '#374151', lineHeight: 1 }}>Son Güncelleme</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>10 Haz 2026</div></div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2563eb', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Popüler İçerikler</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                  {filtered(TEKNIK_ITEMS).length === 0
                    ? <li style={{ fontSize: 12, color: '#9ca3af', padding: '10px 6px' }}>Sonuç bulunamadı</li>
                    : filtered(TEKNIK_ITEMS).map(item => (
                    <Link key={item} href="/kutuphane/teknik-arsiv/teknik-kaynaklar" className="hover:bg-blue-50/60 transition-colors" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', borderBottom: '1px solid #f3f4f6', textDecoration: 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#2563eb' }}><DocIcon /></div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0b1829', flex: 1, lineHeight: 1.35 }}>{item}</span>
                      <span style={{ color: '#c8cdd6', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>›</span>
                    </Link>
                  ))}
                </ul>
                <Link href="/kutuphane/teknik-arsiv/teknik-kaynaklar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #2563eb', color: '#2563eb', background: 'transparent', textDecoration: 'none' }}>
                  Tüm Teknik Kaynakları Gör →
                </Link>
              </div>
            </div>

            {/* ── AKADEMİK YAYINLAR ── */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 18, overflow: 'hidden', display: 'grid', gridTemplateColumns: '390px 1fr' }}>
              <div style={{ padding: '22px 20px 20px', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="26" height="26" fill="none" stroke="#d97706" strokeWidth="1.7" viewBox="0 0 24 24">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0b1829', letterSpacing: -0.4, lineHeight: 1.1 }}>Akademik Yayınlar</div>
                </div>
                <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.65, marginBottom: 14 }}>
                  Hakemli makaleler, yüksek lisans tezleri, araştırma raporları ve bildirilerle mesleğimizdeki bilgi birikimini keşfedin.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {['Makale', 'Rapor', 'Tez', 'Bildiri', 'Araştırma'].map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706' }}>{t}</span>
                  ))}
                </div>
                <Link href="/kutuphane/teknik-arsiv/akademik-yayinlar" style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', cursor: 'pointer', textDecoration: 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <DocIcon stroke="#d97706" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2, color: '#d97706' }}>Öne Çıkan</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1829', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>CBS Uygulamaları: Akademik Derleme</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>›</span>
                </Link>
                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DocIcon size={14} />
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>350+</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Kaynak</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>10</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Kategori</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div><div style={{ fontSize: 11, fontWeight: 800, color: '#374151', lineHeight: 1 }}>Son Güncelleme</div><div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>8 Haz 2026</div></div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#d97706', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Popüler İçerikler</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                  {filtered(AKADEMIK_ITEMS).length === 0
                    ? <li style={{ fontSize: 12, color: '#9ca3af', padding: '10px 6px' }}>Sonuç bulunamadı</li>
                    : filtered(AKADEMIK_ITEMS).map(item => (
                    <Link key={item} href="/kutuphane/teknik-arsiv/akademik-yayinlar" className="hover:bg-amber-50/60 transition-colors" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', borderBottom: '1px solid #f3f4f6', textDecoration: 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#d97706' }}><DocIcon /></div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0b1829', flex: 1, lineHeight: 1.35 }}>{item}</span>
                      <span style={{ color: '#c8cdd6', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>›</span>
                    </Link>
                  ))}
                </ul>
                <Link href="/kutuphane/teknik-arsiv/akademik-yayinlar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #d97706', color: '#d97706', background: 'transparent', textDecoration: 'none' }}>
                  Tüm Akademik Yayınları Gör →
                </Link>
              </div>
            </div>

          </div>{/* /sections */}

          {/* Right: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Son 7 Günde Eklenenler */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829' }}>Son 7 Günde Eklenenler</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>Tümünü Gör →</span>
              </div>
              {[
                { label: 'CBS Genelgesi (2024/1)', date: '12 Haziran 2026', isNew: true },
                { label: 'TKGM 2026/2 Genelgesi', date: '11 Haziran 2026', isNew: true },
                { label: 'Deprem Yönetmeliği Revizyonu', date: '10 Haziran 2026', isNew: false },
                { label: 'Yeni TSE 5737 Standardı', date: '9 Haziran 2026', isNew: false },
                { label: 'Uzaktan Algılama Uygulama Kılavuzu', date: '8 Haziran 2026', isNew: false },
              ].map(({ label, date, isNew }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#16a34a' }}>
                    <DocIcon size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0b1829', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 2 }}>{date}</div>
                  </div>
                  {isNew && (
                    <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '2px 7px' }}>Yeni</span>
                  )}
                </div>
              ))}
            </div>

            {/* Top 5 */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 12 }}>Teknik Arşiv Top 5</div>
              {[
                { rank: 1, top: true, color: 'g', label: '3194 Sayılı İmar Kanunu' },
                { rank: 2, top: true, color: 'b', label: 'TKGM Teknik Şartnamesi 2023' },
                { rank: 3, top: true, color: 'g', label: 'Deprem Yönetmeliği' },
                { rank: 4, top: false, color: 'b', label: 'ISO 19115: Coğrafi Bilgi Standardı' },
                { rank: 5, top: false, color: 'g', label: 'Mekânsal Planlar Yapım Yönetmeliği' },
              ].map(({ rank, top, color, label }) => (
                <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: rank < 5 ? '1px solid #f9fafb' : 'none', cursor: 'pointer' }}>
                  <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: top ? '#f59e0b' : '#d1d5db', textAlign: 'center', flexShrink: 0 }}>{rank}</span>
                  <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: color === 'g' ? '#f0fdf4' : '#eff6ff', color: color === 'g' ? '#16a34a' : '#2563eb' }}>
                    <DocIcon size={12} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0b1829', flex: 1, lineHeight: 1.3 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Yardımcı Olalım */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0b1829', marginBottom: 5, paddingRight: 48, lineHeight: 1.4 }}>Aradığınız kaynağı mı bulamadınız?</div>
                <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, marginBottom: 12 }}>Ekibimize talebinizi iletin, size en kısa sürede dönüş yapalım.</p>
                <button onClick={() => setShowTalep(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 9, borderRadius: 10, fontSize: 11.5, fontWeight: 700, color: '#16a34a', border: '1.5px solid #16a34a', background: 'transparent', cursor: 'pointer' }}>
                  Kaynak Talep Et
                </button>
              </div>
            </div>

            {/* Hızlı Filtreler */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 12 }}>Hızlı Filtreler</div>
              {[
                { icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>, label: 'En Yeni Eklenenler' },
                { icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, label: 'En Çok Görüntülenenler' },
                { icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>, label: 'Kurumlara Göre' },
                { icon: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: 'Yayın Yılına Göre' },
                { icon: <DocIcon size={12} />, label: 'Belge Türüne Göre' },
              ].map(({ icon, label }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#9ca3af' }}>{icon}</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', flex: 1 }}>{label}</span>
                  <span style={{ color: '#d1d5db', fontSize: 12 }}>›</span>
                </div>
              ))}
            </div>

          </div>{/* /sidebar */}

        </div>{/* /page grid */}

        {/* Footer Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ marginTop: 32, paddingBottom: 40 }}>
          <div style={{ borderRadius: 24, background: 'linear-gradient(90deg, #FCF4E6 0%, #FDF2E2 50%, #FBEED8 100%)', border: '1px solid #F3E1BC', boxShadow: '0 4px 24px rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', gap: 0, minHeight: 160, overflow: 'hidden' }}>

            {/* Klasör illüstrasyonu */}
            <div style={{ flexShrink: 0, width: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', background: '#FCF3E5' }}>
              <div style={{ width: 100, height: 108, position: 'relative', transform: 'translate(20px, -10px) scale(1.2)' }}>
                <div style={{ width: 84, height: 64, background: '#f59e0b', borderRadius: '9px 9px 8px 8px', position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
                  <div style={{ position: 'absolute', top: -12, left: 0, width: 34, height: 13, background: '#fbbf24', borderRadius: '7px 7px 0 0' }} />
                  <div style={{ position: 'absolute', top: -34, right: 4, width: 34, height: 44, background: '#fff', borderRadius: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', transform: 'rotate(10deg)', transformOrigin: 'bottom center' }}>
                    <div style={{ margin: '8px 7px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[16, 11, 14].map((w, i) => <div key={i} style={{ height: 2, width: w, background: '#e5e7eb', borderRadius: 1 }} />)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: -30, right: 16, width: 32, height: 40, background: '#f9fafb', borderRadius: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.09)', transform: 'rotate(-5deg)', transformOrigin: 'bottom center' }}>
                    <div style={{ margin: '8px 6px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[13, 9, 12].map((w, i) => <div key={i} style={{ height: 2, width: w, background: '#e5e7eb', borderRadius: 1 }} />)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
                    <svg width="14" height="14" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Metin + İstatistikler */}
            <div style={{ flex: 1, padding: '28px 40px' }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: -0.5, marginBottom: 6 }}>Aradığınız kaynağı bulamadınız mı?</p>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 400, lineHeight: 1.6, marginBottom: 20 }}>Talebinizi iletin, arşiv ekibimiz sizin için bulsun ve en kısa sürede erişime açsın.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { icon: <svg width="14" height="14" fill="none" stroke="#ea580c" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>, iconBg: '#fff0e8', value: '12 Saat', label: 'Ortalama dönüş süresi' },
                  { icon: <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>, iconBg: '#f0fdf4', value: '247', label: 'Tamamlanan talep' },
                  { icon: <svg width="14" height="14" fill="none" stroke="#db2777" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23,6 13,16 8,11 1,18"/><polyline points="17,6 23,6 23,12"/></svg>, iconBg: '#fdf2f8', value: '%93', label: 'Erişim başarı oranı' },
                ].map(({ icon, iconBg, value, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 14px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400, marginTop: 2 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buton */}
            <div style={{ flexShrink: 0, padding: '0 48px 0 0' }}>
              <button onClick={() => setShowTalep(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
                Kaynak Talep Et →
              </button>
            </div>

          </div>
        </div>

      </main>
    </>
  );
}
