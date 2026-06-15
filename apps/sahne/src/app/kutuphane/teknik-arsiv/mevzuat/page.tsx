import Link from 'next/link';

const ITEMS = [
  { id: 1, slug: '3194-sayili-imar-kanunu', title: '3194 Sayılı İmar Kanunu', type: 'Kanun', year: 1985, updated: '2024', desc: 'İmar planlarının hazırlanması, onaylanması ve uygulanmasına ilişkin temel kanun.', popular: true },
  { id: 2, slug: 'deprem-yonetmeligi-tbdy-2018', title: 'Deprem Yönetmeliği (TBDY 2018)', type: 'Yönetmelik', year: 2018, updated: '2018', desc: 'Türkiye Bina Deprem Yönetmeliği — yapı tasarımı ve güçlendirme esasları.', popular: true },
  { id: 3, slug: 'mekansal-planlar-yapim-yonetmeligi', title: 'Mekânsal Planlar Yapım Yönetmeliği', type: 'Yönetmelik', year: 2014, updated: '2023', desc: 'Mekânsal strateji planları, nazım imar planları ve uygulama imar planlarına ilişkin esaslar.', popular: true },
  { id: 4, slug: 'cbs-genelgesi-2024-1', title: 'CBS Genelgesi (2024/1)', type: 'Genelge', year: 2024, updated: '2024', desc: 'Kamu kurumlarında Coğrafi Bilgi Sistemi kullanımına ilişkin usul ve esaslar.', isNew: true },
  { id: 5, slug: 'tapu-sicil-tuzugu', title: 'Tapu Sicil Tüzüğü', type: 'Tüzük', year: 2013, updated: '2022', desc: 'Tapu sicilinin tutulmasına, tapu senetlerinin düzenlenmesine ilişkin kurallar.' },
  { id: 6, slug: 'buyuk-olcekli-harita-yapim-yonetmeligi', title: 'Büyük Ölçekli Harita Yapım Yönetmeliği', type: 'Yönetmelik', year: 2005, updated: '2021', desc: '1/5000 ve daha büyük ölçekli harita ve planların yapımına ilişkin teknik esaslar.' },
  { id: 7, slug: 'kadastro-kanunu-3402', title: 'Kadastro Kanunu (3402)', type: 'Kanun', year: 1987, updated: '2023', desc: 'Taşınmazların kadastrolanmasına ilişkin usul ve esasları düzenleyen temel kanun.' },
  { id: 8, slug: 'tkgm-teknik-sartnamesi-2023', title: 'TKGM Teknik Şartnamesi 2023', type: 'Tebliğ', year: 2023, updated: '2023', desc: 'Tapu ve Kadastro Genel Müdürlüğü tarafından yayımlanan güncel teknik şartname.', isNew: true },
  { id: 9, slug: 'resmi-gazete-teblikleri-2024', title: 'Resmi Gazete Tebliğleri (2024)', type: 'Tebliğ', year: 2024, updated: '2024', desc: 'Harita ve kadastro alanında 2024 yılında yayımlanan Resmi Gazete tebliğleri.' },
  { id: 10, slug: 'kiyi-kanunu-uygulama-yonetmeligi', title: 'Kıyı Kanunu Uygulama Yönetmeliği', type: 'Yönetmelik', year: 1990, updated: '2020', desc: 'Kıyılarda, sahil şeritlerinde ve dolgu alanlarında yapı ve tesislerine ilişkin esaslar.' },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Kanun':       { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Yönetmelik':  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Tebliğ':      { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Genelge':     { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  'Tüzük':       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const CATEGORIES = ['Tümü', 'Kanun', 'Yönetmelik', 'Tebliğ', 'Genelge', 'Tüzük'];
const YEARS = ['Yıl', '2024', '2023', '2022', '2021', '2020 ve öncesi'];

export default function MevzuatPage() {
  return (
    <>
      <main className="bg-[#f8f9fb] min-h-screen">

        {/* Hero */}
        <div className="bg-[#0b1829] text-white relative" style={{ paddingTop: 52, paddingBottom: 52 }}>
          <div className="absolute inset-0 left-[50%]"
            style={{ backgroundImage: "url('/mevzuat.png')", backgroundSize: 'cover', backgroundPosition: 'calc(50% - 25px) -75px' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 6%, rgba(11,24,41,0.85) 45%, rgba(11,24,41,0.2) 100%)' }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-6 text-xs">
              <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Sahne</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane" className="text-white/35 hover:text-white/60 transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane/teknik-arsiv" className="text-white/35 hover:text-white/60 transition-colors">Teknik Arşiv</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/55">Mevzuat</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48 }}>
              {/* Sol */}
              <div style={{ flex: 1, maxWidth: 520 }}>
                <h1 className="text-[52px] font-black leading-none tracking-[-1.5px] mb-3.5">
                  <span className="text-emerald-400">Mevzuat</span>
                </h1>
                <p className="text-white/[0.48] text-sm leading-relaxed mb-7">
                  Mesleğimizin iş alanlarındaki kanunlar, yönetmelikler, tebliğler, genelgeler ve ilgili tüm mevzuatlar.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="search" placeholder="Kanun, yönetmelik, tebliğ ara…" className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-[10px] text-sm text-white placeholder-white/25 focus:outline-none focus:bg-white/10 transition-all" />
                  </div>
                  <button className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-[10px] text-sm text-white font-bold shrink-0 flex items-center cursor-pointer">Ara</button>
                </div>
              </div>

              {/* Sağ: Stats Panel */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(6px)' }}>
                {[
                  { value: '520+', label: 'Mevzuat' },
                  { value: '148',  label: 'Kanun' },
                  { value: '263',  label: 'Yönetmelik' },
                  { value: '109',  label: 'Genelge' },
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

        {/* Filtre Çubuğu */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 h-[54px]">
              {/* Tür filtresi */}
              <div className="flex items-center gap-1.5">
                {CATEGORIES.map((c, i) => (
                  i === 0
                    ? <span key={c} className="text-[12px] font-bold px-4 py-[5px] rounded-full bg-[#0b1829] text-white border border-[#0b1829] cursor-pointer select-none">{c}</span>
                    : <span key={c} className="text-[12px] font-bold px-4 py-[5px] rounded-full bg-white text-gray-500 border border-gray-200 cursor-pointer select-none hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-colors">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* İçerik Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 28, paddingBottom: 48, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

          {/* Sol: Liste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ITEMS.map(item => {
              const tc = TYPE_COLORS[item.type] ?? { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
              return (
                <div key={item.id} className="bg-white border border-[#e8e9ec] hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm transition-all duration-150" style={{ borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* İkon */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" fill="none" stroke={tc.color} strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>

                  {/* Bilgi */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 20, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{item.type}</span>
                      {item.isNew && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', letterSpacing: '0.05em' }}>YENİ</span>}
                      {item.popular && <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>★ Popüler</span>}
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginLeft: 2 }}>{item.year} · Güncelleme: {item.updated}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0b1829', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                  </div>

                  {/* Aksiyon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Link href={`/kutuphane/teknik-arsiv/mevzuat/${item.slug}`} className="text-[12px] font-bold px-[14px] py-[7px] rounded-[8px] bg-gray-100 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors whitespace-nowrap" style={{ textDecoration: 'none' }}>Görüntüle</Link>
                    <button className="flex items-center justify-center shrink-0 bg-[#f0fdf4] border border-[#bbf7d0] hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer" style={{ width: 34, height: 34, borderRadius: 8 }}>
                      <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Daha Fazla */}
            <button style={{ marginTop: 8, width: '100%', padding: '12px', borderRadius: 12, background: '#fff', border: '1px solid #e8e9ec', fontSize: 13, fontWeight: 700, color: '#6b7280', cursor: 'pointer' }}>
              Daha fazla yükle →
            </button>
          </div>

          {/* Sağ: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Kategoriye Göre */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>Kategoriye Göre</div>
              {[
                { label: 'Kanun', count: 48, color: '#2563eb', bg: '#eff6ff' },
                { label: 'Yönetmelik', count: 187, color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Tebliğ', count: 142, color: '#ea580c', bg: '#fff7ed' },
                { label: 'Genelge', count: 96, color: '#7c3aed', bg: '#faf5ff' },
                { label: 'Tüzük', count: 47, color: '#dc2626', bg: '#fef2f2' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} className="flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg cursor-pointer" style={{ padding: '8px 6px', borderBottom: '1px solid #f3f4f6', margin: '0 -6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0b1829' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: bg, color }}>{count}</span>
                </div>
              ))}
            </div>

            {/* Öne Çıkanlar */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>En Çok İndirildi</div>
              {[
                { title: '3194 Sayılı İmar Kanunu', type: 'Kanun' },
                { title: 'Deprem Yönetmeliği', type: 'Yönetmelik' },
                { title: 'CBS Genelgesi (2024/1)', type: 'Genelge' },
                { title: 'Tapu Sicil Tüzüğü', type: 'Tüzük' },
              ].map(({ title, type }, i) => {
                const tc = TYPE_COLORS[type] ?? { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
                return (
                  <div key={title} className="flex items-center gap-[10px] hover:bg-gray-50 transition-colors rounded-lg cursor-pointer" style={{ padding: '9px 6px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none', margin: '0 -6px' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#d1d5db', width: 16, flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1829', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tc.color }}>{type}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Teknik Arşiv'e Dön */}
            <Link href="/kutuphane/teknik-arsiv" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e8e9ec', borderRadius: 14, padding: '14px 16px', textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Geri dön</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0b1829' }}>Teknik Arşiv</div>
              </div>
            </Link>

          </div>
        </div>
      </main>
    </>
  );
}
