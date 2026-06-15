import Link from 'next/link';
import { notFound } from 'next/navigation';

const ITEMS = [
  {
    id: 1,
    slug: '3194-sayili-imar-kanunu',
    title: '3194 Sayılı İmar Kanunu',
    type: 'Kanun',
    year: 1985,
    updated: '2024',
    institution: 'TBMM',
    refNo: '3194',
    desc: 'İmar planlarının hazırlanması, onaylanması ve uygulanmasına ilişkin temel kanun.',
    content: `3194 Sayılı İmar Kanunu, Türkiye'de arazi kullanımı, yapılaşma ve imar planlamalarına ilişkin temel yasal çerçeveyi oluşturmaktadır. Kanun; belediyelerin ve diğer yetkili idarelerin imar planı yapma, onaylama ve uygulamaya koyma yetkilerini düzenlemekte; yapı ruhsatı, iskan ve yıkım süreçlerini tanımlamaktadır.

Kanunun başlıca düzenleme alanları şunlardır:
- Nazım ve uygulama imar planlarının hazırlanması
- Parselasyon ve arazi düzenlemesi
- Yapı ruhsatı ve yapı denetimi
- Kaçak yapı ve yıkım süreçleri
- İmar para cezaları`,
    tags: ['İmar Planı', 'Yapı Ruhsatı', 'Arazi Kullanımı', 'Belediye', 'Parselasyon'],
    popular: true,
  },
  {
    id: 2,
    slug: 'deprem-yonetmeligi-tbdy-2018',
    title: 'Deprem Yönetmeliği (TBDY 2018)',
    type: 'Yönetmelik',
    year: 2018,
    updated: '2018',
    institution: 'Çevre ve Şehircilik Bakanlığı',
    refNo: 'TBDY-2018',
    desc: 'Türkiye Bina Deprem Yönetmeliği — yapı tasarımı ve güçlendirme esasları.',
    content: `Türkiye Bina Deprem Yönetmeliği (TBDY 2018), depreme dayanıklı yapı tasarımı ve mevcut yapıların güçlendirilmesine ilişkin teknik esasları belirlemektedir.

Yönetmeliğin kapsadığı başlıca konular:
- Deprem tehlike haritaları ve zemin sınıflandırması
- Yapı tasarım ilkeleri ve performans hedefleri
- Betonarme, çelik ve ahşap yapı sistemleri
- Mevcut yapıların değerlendirilmesi ve güçlendirilmesi
- Zemin-yapı etkileşimi`,
    tags: ['Deprem', 'Yapı Tasarımı', 'Güçlendirme', 'Zemin'],
    popular: true,
  },
  {
    id: 3,
    slug: 'mekansal-planlar-yapim-yonetmeligi',
    title: 'Mekânsal Planlar Yapım Yönetmeliği',
    type: 'Yönetmelik',
    year: 2014,
    updated: '2023',
    institution: 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı',
    refNo: 'R.G. 14.06.2014/29030',
    desc: 'Mekânsal strateji planları, nazım imar planları ve uygulama imar planlarına ilişkin esaslar.',
    content: `Bu yönetmelik; mekânsal strateji planları, çevre düzeni planları, nazım imar planları ve uygulama imar planlarının yapımına, değiştirilmesine ve onaylanmasına ilişkin usul ve esasları düzenlemektedir.`,
    tags: ['Mekânsal Plan', 'Nazım İmar', 'Çevre Düzeni', 'Plan Hiyerarşisi'],
    popular: true,
  },
  {
    id: 4,
    slug: 'cbs-genelgesi-2024-1',
    title: 'CBS Genelgesi (2024/1)',
    type: 'Genelge',
    year: 2024,
    updated: '2024',
    institution: 'Cumhurbaşkanlığı Strateji ve Bütçe Başkanlığı',
    refNo: '2024/1',
    desc: 'Kamu kurumlarında Coğrafi Bilgi Sistemi kullanımına ilişkin usul ve esaslar.',
    content: `Bu genelge; kamu kurum ve kuruluşlarında coğrafi bilgi sistemlerinin kurulması, kullanılması ve paylaşılmasına ilişkin standart ve esasları belirlemektedir.`,
    tags: ['CBS', 'Coğrafi Bilgi', 'Kamu', 'Veri Standardı'],
    isNew: true,
  },
  {
    id: 5,
    slug: 'tapu-sicil-tuzugu',
    title: 'Tapu Sicil Tüzüğü',
    type: 'Tüzük',
    year: 2013,
    updated: '2022',
    institution: 'Tapu ve Kadastro Genel Müdürlüğü',
    refNo: 'R.G. 17.08.2013/28738',
    desc: 'Tapu sicilinin tutulmasına, tapu senetlerinin düzenlenmesine ilişkin kurallar.',
    content: `Tapu Sicil Tüzüğü; tapu sicilinin nasıl tutulacağını, kayıtların hangi esaslara göre yapılacağını ve tapu senetlerinin düzenlenmesine ilişkin usulleri belirlemektedir.`,
    tags: ['Tapu', 'Sicil', 'Tescil', 'TKGM'],
  },
  {
    id: 6,
    slug: 'buyuk-olcekli-harita-yapim-yonetmeligi',
    title: 'Büyük Ölçekli Harita Yapım Yönetmeliği',
    type: 'Yönetmelik',
    year: 2005,
    updated: '2021',
    institution: 'Harita Genel Müdürlüğü',
    refNo: 'R.G. 15.02.2005/25728',
    desc: '1/5000 ve daha büyük ölçekli harita ve planların yapımına ilişkin teknik esaslar.',
    content: `Bu yönetmelik; 1/5000 ve daha büyük ölçekli topoğrafik haritaların, kadastral haritaların ve kent haritalarının yapımında uyulacak teknik ve idari esasları düzenlemektedir.`,
    tags: ['Harita', 'Ölçek', 'Topoğrafya', 'Kadastral'],
  },
  {
    id: 7,
    slug: 'kadastro-kanunu-3402',
    title: 'Kadastro Kanunu (3402)',
    type: 'Kanun',
    year: 1987,
    updated: '2023',
    institution: 'TBMM',
    refNo: '3402',
    desc: 'Taşınmazların kadastrolanmasına ilişkin usul ve esasları düzenleyen temel kanun.',
    content: `3402 Sayılı Kadastro Kanunu; taşınmaz malların sınırlarının arazi ve harita üzerinde belirtilerek hukuki durumlarının ve üzerindeki hakların tespit edilmesine ilişkin esasları düzenlemektedir.`,
    tags: ['Kadastro', 'Taşınmaz', 'Hukuki Durum', 'TKGM'],
  },
  {
    id: 8,
    slug: 'tkgm-teknik-sartnamesi-2023',
    title: 'TKGM Teknik Şartnamesi 2023',
    type: 'Tebliğ',
    year: 2023,
    updated: '2023',
    institution: 'Tapu ve Kadastro Genel Müdürlüğü',
    refNo: 'TKGM-TS-2023',
    desc: 'Tapu ve Kadastro Genel Müdürlüğü tarafından yayımlanan güncel teknik şartname.',
    content: `Bu teknik şartname; kadastro çalışmalarında kullanılacak ölçü aletleri, yazılımlar ve veri formatlarına ilişkin teknik gereksinimleri belirlemektedir.`,
    tags: ['TKGM', 'Teknik Şartname', 'Kadastro', 'Ölçü'],
    isNew: true,
  },
  {
    id: 9,
    slug: 'resmi-gazete-teblikleri-2024',
    title: 'Resmi Gazete Tebliğleri (2024)',
    type: 'Tebliğ',
    year: 2024,
    updated: '2024',
    institution: 'Çeşitli Bakanlıklar',
    refNo: 'RG-2024',
    desc: 'Harita ve kadastro alanında 2024 yılında yayımlanan Resmi Gazete tebliğleri.',
    content: `2024 yılında harita, kadastro ve mekânsal planlama alanlarında yayımlanan tüm Resmi Gazete tebliğlerini kapsamaktadır.`,
    tags: ['Resmi Gazete', '2024', 'Tebliğ'],
  },
  {
    id: 10,
    slug: 'kiyi-kanunu-uygulama-yonetmeligi',
    title: 'Kıyı Kanunu Uygulama Yönetmeliği',
    type: 'Yönetmelik',
    year: 1990,
    updated: '2020',
    institution: 'Çevre ve Şehircilik Bakanlığı',
    refNo: 'R.G. 03.08.1990/20594',
    desc: 'Kıyılarda, sahil şeritlerinde ve dolgu alanlarında yapı ve tesislerine ilişkin esaslar.',
    content: `Bu yönetmelik; kıyıların, sahil şeritlerinin ve doldurularak kazanılan alanların kullanım ve yapılanma koşullarını, kıyı kenar çizgisinin belirlenmesini düzenlemektedir.`,
    tags: ['Kıyı', 'Sahil', 'Dolgu Alanı', 'Yapılaşma'],
  },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Kanun':       { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Yönetmelik':  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Tebliğ':      { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Genelge':     { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  'Tüzük':       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const RELATED = [
  { slug: '3194-sayili-imar-kanunu', title: '3194 Sayılı İmar Kanunu', type: 'Kanun' },
  { slug: 'mekansal-planlar-yapim-yonetmeligi', title: 'Mekânsal Planlar Yapım Yönetmeliği', type: 'Yönetmelik' },
  { slug: 'kadastro-kanunu-3402', title: 'Kadastro Kanunu (3402)', type: 'Kanun' },
];

export default async function MevzuatDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = ITEMS.find(i => i.slug === slug);
  if (!item) notFound();

  const tc = TYPE_COLORS[item.type] ?? { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  const related = RELATED.filter(r => r.slug !== item.slug).slice(0, 3);

  return (
    <>
      <main className="bg-[#f8f9fb] min-h-screen">

        {/* Hero */}
        <div className="bg-[#0b1829] text-white relative min-h-[320px]">
          <div className="absolute inset-0 left-[40%]"
            style={{ backgroundImage: "url('/mevzuat_alt.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 6%, rgba(11,24,41,0.85) 45%, rgba(11,24,41,0.2) 100%)' }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[58px] pb-[50px]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-6 text-xs flex-wrap">
              <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Sahne</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane" className="text-white/35 hover:text-white/60 transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane/teknik-arsiv" className="text-white/35 hover:text-white/60 transition-colors">Teknik Arşiv</Link>
              <span className="text-white/20">›</span>
              <Link href="/kutuphane/teknik-arsiv/mevzuat" className="text-white/35 hover:text-white/60 transition-colors">Mevzuat</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/50 truncate max-w-[200px]">{item.title}</span>
            </div>

            <div>
              <div>
                {/* Tür + rozetler */}
                <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 11px', borderRadius: 20, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{item.type}</span>
                  {item.isNew && <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', letterSpacing: '0.05em' }}>YENİ</span>}
                  {item.popular && <span className="text-amber-400 text-xs font-bold">★ Popüler</span>}
                </div>

                <h1 className="text-[42px] font-black leading-none tracking-[-1.3px] mb-4 text-white">{item.title}</h1>
                <p className="text-white/[0.48] text-sm leading-relaxed max-w-[480px] mb-8">{item.desc}</p>

                {/* Aksiyon butonları */}
                <div className="flex items-center gap-3">
                  <button className="bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-[7px] text-white font-extrabold cursor-pointer whitespace-nowrap" style={{ padding: '12px 24px', border: 'none', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
                    PDF İndir
                  </button>
                  <button className="bg-white/[0.08] hover:bg-white/[0.18] text-white/65 hover:text-white transition-colors flex items-center gap-[7px] font-bold cursor-pointer whitespace-nowrap" style={{ padding: '12px 20px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 13 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    Kaydet
                  </button>
                  <button className="bg-white/[0.08] hover:bg-white/[0.18] text-white/65 hover:text-white transition-colors flex items-center gap-[7px] font-bold cursor-pointer whitespace-nowrap" style={{ padding: '12px 20px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 13 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Paylaş
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Meta bilgi çubuğu */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e9ec' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0', height: 56 }}>
              {[
                { label: 'Kurum', value: item.institution, icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
                { label: 'Yıl', value: String(item.year), icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label: 'Son Güncelleme', value: item.updated, icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
                { label: 'Referans No', value: item.refNo, icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
              ].map(({ label, value, icon }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 28, marginRight: 28, borderRight: i < arr.length - 1 ? '1px solid #f0f1f3' : 'none', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {icon}
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0b1829', background: '#f8f9fb', padding: '3px 10px', borderRadius: 6, border: '1px solid #e8e9ec' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 28, paddingBottom: 48, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

          {/* Sol: İçerik */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Hakkında */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0b1829', marginBottom: 14 }}>Hakkında</h2>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{item.content}</div>
            </div>

            {/* Etiketler */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: '20px 28px' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0b1829', marginBottom: 12 }}>Etiketler</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 hover:bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, color: '#374151' }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Erişim Bilgisi */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d', marginBottom: 2 }}>Resmi Kaynak</div>
                <div style={{ fontSize: 12, color: '#166534' }}>Bu belge resmi kurumlar tarafından yayımlanmış ve doğrulanmıştır.</div>
              </div>
            </div>

          </div>

          {/* Sağ: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* İndir */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>Erişim</div>
              <button className="bg-green-600 hover:bg-green-700 transition-colors w-full flex items-center justify-center gap-2 text-white font-extrabold cursor-pointer" style={{ padding: '11px', border: 'none', borderRadius: 10, fontSize: 13, marginBottom: 8 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
                PDF İndir
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 transition-colors w-full flex items-center justify-center gap-2 font-bold cursor-pointer" style={{ padding: '11px', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Resmi Kaynakta Aç
              </button>
            </div>

            {/* İlgili Mevzuat */}
            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>İlgili Mevzuat</div>
              {related.map(({ slug, title, type }, i) => {
                const rc = TYPE_COLORS[type] ?? { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
                return (
                  <Link key={slug} href={`/kutuphane/teknik-arsiv/mevzuat/${slug}`} className="hover:bg-gray-50 rounded-lg transition-colors" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px', marginLeft: -8, marginRight: -8, borderBottom: i < related.length - 1 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" fill="none" stroke={rc.color} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1829', lineHeight: 1.4 }}>{title}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: rc.color }}>{type}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Geri dön */}
            <Link href="/kutuphane/teknik-arsiv/mevzuat" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e8e9ec', borderRadius: 14, padding: '14px 16px', textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Geri dön</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0b1829' }}>Tüm Mevzuatlar</div>
              </div>
            </Link>

          </div>
        </div>
      </main>
    </>
  );
}
