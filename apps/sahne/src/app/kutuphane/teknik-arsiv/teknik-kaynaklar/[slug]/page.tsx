import Link from 'next/link';
import { notFound } from 'next/navigation';

const ITEMS = [
  {
    id: 1, slug: 'hgm-fotogrametrik-sartname-2023',
    title: 'HGM Fotogrametrik Harita Yapım Şartnamesi',
    type: 'Şartname', year: 2023, updated: '2023',
    institution: 'Harita Genel Müdürlüğü', refNo: 'HGM-FS-2023',
    desc: 'Harita Genel Müdürlüğü tarafından yayımlanan güncel fotogrametrik harita yapım şartnamesi.',
    content: `Bu şartname; hava fotogrametrisi yöntemiyle üretilecek topografik haritaların, ortofotoların ve sayısal yükseklik modellerinin üretim sürecinde uyulacak teknik ve idari esasları kapsamaktadır.\n\nBaşlıca konu başlıkları:\n- Uçuş planlaması ve görüntü kalite gereksinimleri\n- Yer kontrol noktası tesisi ve ölçümü\n- Aerotriangülasyon ve blok dengeleme\n- Sayısal yükseklik modeli ve ortofoto üretimi\n- Kalite kontrol ve doğrulama süreçleri`,
    tags: ['Fotogrametri', 'HGM', 'Ortofoto', 'Sayısal Yükseklik', 'Hava Fotoğrafı'],
    isNew: true,
  },
  {
    id: 2, slug: 'cbs-veri-standardi-kilavuzu',
    title: 'CBS Veri Standardı Kılavuzu',
    type: 'Kılavuz', year: 2022, updated: '2023',
    institution: 'Cumhurbaşkanlığı Dijital Dönüşüm Ofisi', refNo: 'DDO-CBS-2022',
    desc: 'Kamu kurumlarında CBS veri üretimi ve paylaşımına ilişkin standart ve uygulama esasları.',
    content: `Bu kılavuz; kamu kurum ve kuruluşlarının coğrafi veri üretimi, depolanması ve paylaşımında uymaları gereken standart ve esasları belirlemektedir.\n\nKapsam:\n- Veri modeli ve referans sistemleri\n- Veri kalitesi ve meta veri standartları\n- Veri paylaşım protokolleri\n- OGC uyumlu servis gereksinimleri`,
    tags: ['CBS', 'Veri Standardı', 'Kamu', 'OGC', 'Meta Veri'],
  },
  {
    id: 3, slug: 'ts-en-iso-19111-referans-sistemleri',
    title: 'TS EN ISO 19111 – Mekânsal Referans Sistemleri',
    type: 'Standart', year: 2019, updated: '2021',
    institution: 'Türk Standartları Enstitüsü', refNo: 'TS EN ISO 19111:2019',
    desc: 'Koordinat referans sistemleri ve mekânsal konum tanımlamalarına ilişkin uluslararası standart.',
    content: `TS EN ISO 19111, coğrafi bilginin koordinat referans sistemleri aracılığıyla tanımlanmasına ilişkin kavramsal şemayı belirlemektedir.\n\nStandartta tanımlanan temel kavramlar:\n- Koordinat sistemleri ve koordinat referans sistemleri\n- Datum tanımları (jeodezik, dikey, mühendislik)\n- Koordinat dönüşümleri ve koordinat operasyonları\n- Bileşik koordinat referans sistemleri`,
    tags: ['ISO 19111', 'Koordinat Sistemi', 'Datum', 'Referans Sistemi', 'Jeodezi'],
    popular: true,
  },
  {
    id: 4, slug: 'kadastral-harita-teknik-sartnamesi',
    title: 'Kadastral Harita Yapım Teknik Şartnamesi',
    type: 'Şartname', year: 2021, updated: '2022',
    institution: 'Tapu ve Kadastro Genel Müdürlüğü', refNo: 'TKGM-KH-2021',
    desc: 'Kadastral harita ve planların üretiminde uyulacak teknik ve idari esaslar.',
    content: `Bu şartname; kadastral harita ve planların TKGM standartlarına uygun biçimde üretilmesine ilişkin teknik, idari ve kalite gereksinimlerini kapsar.\n\nTemel konular:\n- Ölçü yöntemleri ve doğruluk sınıfları\n- Koordinat dönüşümü esasları\n- Sayısal veri formatları\n- Parsel ve sınır noktası tanımlamaları`,
    tags: ['Kadastro', 'TKGM', 'Harita Üretimi', 'Parsel', 'Teknik Şartname'],
  },
  {
    id: 5, slug: 'yersel-fotogrametri-uygulama-kilavuzu',
    title: 'Yersel Fotogrametri Uygulama Kılavuzu',
    type: 'Kılavuz', year: 2020, updated: '2020',
    institution: 'Harita ve Kadastro Mühendisleri Odası', refNo: 'HKMO-YF-2020',
    desc: '1/500 ve daha büyük ölçekli yersel fotogrametrik ölçü ve değerlendirme teknikleri.',
    content: `Bu kılavuz; endüstriyel fotogrametri, cephe fotogrametrisi ve yakın mesafe fotogrametrisine ilişkin pratik uygulama bilgilerini bir araya getirmektedir.`,
    tags: ['Yersel Fotogrametri', 'Cephe Fotogrametrisi', 'HKMO', 'Yakın Mesafe'],
  },
  {
    id: 6, slug: 'lidar-veri-isleme-el-kitabi',
    title: 'LiDAR Veri Toplama ve İşleme El Kitabı',
    type: 'El Kitabı', year: 2023, updated: '2023',
    institution: 'Harita Genel Müdürlüğü', refNo: 'HGM-LIDAR-2023',
    desc: 'Hava ve kara LiDAR sistemleri ile nokta bulutu üretimi ve sayısal yüzey modelleme.',
    content: `Bu el kitabı; hava ve kara bazlı LiDAR sistemleri kullanılarak nokta bulutu verisi elde edilmesi, işlenmesi ve harita ürünlerine dönüştürülmesine ilişkin kapsamlı bir rehberdir.\n\nİşlenen konular:\n- LiDAR sistemi bileşenleri ve kalibrasyon\n- Nokta bulutu sınıflandırması\n- Sayısal arazi ve yüzey modeli üretimi\n- Bina ve bitki örtüsü çıkarımı`,
    tags: ['LiDAR', 'Nokta Bulutu', 'Sayısal Arazi Modeli', 'Hava Taraması'],
    isNew: true,
  },
  {
    id: 7, slug: 'gnss-konum-belirleme-teknik-raporu',
    title: 'GNSS ile Konum Belirleme Teknik Raporu',
    type: 'Teknik Rapor', year: 2022, updated: '2022',
    institution: 'Harita ve Kadastro Mühendisleri Odası', refNo: 'HKMO-GNSS-2022',
    desc: 'Statik, hızlı statik ve RTK yöntemleriyle hassas konum belirleme esasları ve hata analizi.',
    content: `Bu teknik rapor; farklı GNSS ölçü yöntemlerinin uygulanması, elde edilen sonuçların değerlendirilmesi ve hata kaynaklarının analizine ilişkin güncel teknik bilgileri sunmaktadır.`,
    tags: ['GNSS', 'GPS', 'RTK', 'Konum Belirleme', 'Hata Analizi'],
  },
  {
    id: 8, slug: 'ts-7910-harita-plan-standarti',
    title: 'TS 7910 Harita ve Plan Çizim Standardı',
    type: 'Standart', year: 2015, updated: '2020',
    institution: 'Türk Standartları Enstitüsü', refNo: 'TS 7910',
    desc: 'Türk Standartları Enstitüsü tarafından belirlenen harita ve plan çizim kuralları.',
    content: `TS 7910 standardı; topoğrafik haritalar, imar planları ve kadastral haritaların grafik gösteriminde kullanılacak semboller, renkler ve çizgi tiplerini tanımlamaktadır.`,
    tags: ['TS 7910', 'Harita Sembolü', 'Çizim Standardı', 'TSE', 'Topoğrafya'],
    popular: true,
  },
  {
    id: 9, slug: 'uzaktan-algilama-uygulama-kilavuzu',
    title: 'Uzaktan Algılama Uygulama Kılavuzu',
    type: 'Kılavuz', year: 2021, updated: '2021',
    institution: 'TÜBİTAK – BİLGEM', refNo: 'TUBITAK-UA-2021',
    desc: 'Uydu ve hava görüntülerinden arazi örtüsü ve kullanımı analizine yönelik teknikler.',
    content: `Bu kılavuz; çok bantlı uydu görüntüleri ve hava fotoğraflarının işlenmesi, sınıflandırılması ve yorumlanmasına ilişkin pratik teknik bilgiler içermektedir.`,
    tags: ['Uzaktan Algılama', 'Uydu Görüntüsü', 'Arazi Örtüsü', 'Sınıflandırma'],
  },
  {
    id: 10, slug: 'iha-fotogrametri-el-kitabi-2024',
    title: 'İHA ile Fotogrametrik Haritalama El Kitabı',
    type: 'El Kitabı', year: 2024, updated: '2024',
    institution: 'Harita Genel Müdürlüğü', refNo: 'HGM-IHA-2024',
    desc: 'İnsansız hava araçları ile yüksek çözünürlüklü ortofoto ve sayısal yükseklik modeli üretimi.',
    content: `Bu el kitabı; insansız hava araçları kullanılarak yürütülen fotogrametrik haritalama projelerinde uçuş planlamasından nihai harita ürününe kadar tüm süreçleri kapsamaktadır.\n\nİçerik:\n- İHA sistemi seçimi ve sensör kalibrasyonu\n- Uçuş planlaması ve otomatik görev yönetimi\n- SfM tabanlı nokta bulutu üretimi\n- Ortofoto ve DSM üretimi ve doğrulama`,
    tags: ['İHA', 'Drone', 'Fotogrametri', 'Ortofoto', 'SfM'],
    isNew: true, popular: true,
  },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Standart':     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Şartname':     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Kılavuz':      { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Teknik Rapor': { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  'El Kitabı':    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const RELATED = [
  { slug: 'ts-en-iso-19111-referans-sistemleri', title: 'TS EN ISO 19111 – Mekânsal Referans Sistemleri', type: 'Standart' },
  { slug: 'cbs-veri-standardi-kilavuzu',          title: 'CBS Veri Standardı Kılavuzu',                   type: 'Kılavuz' },
  { slug: 'iha-fotogrametri-el-kitabi-2024',      title: 'İHA ile Fotogrametrik Haritalama El Kitabı',    type: 'El Kitabı' },
];

export default async function TeknikKaynaklarDetayPage({ params }: { params: Promise<{ slug: string }> }) {
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
            style={{ backgroundImage: "url('/teknikkaynaklar_detay.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
              <Link href="/kutuphane/teknik-arsiv/teknik-kaynaklar" className="text-white/35 hover:text-white/60 transition-colors">Teknik Kaynaklar</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/50 truncate max-w-[200px]">{item.title}</span>
            </div>

            <div>
              {/* Tür + rozetler */}
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 11px', borderRadius: 20, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{item.type}</span>
                {'isNew' in item && item.isNew && <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', letterSpacing: '0.05em' }}>YENİ</span>}
                {'popular' in item && item.popular && <span className="text-amber-400 text-xs font-bold">★ Popüler</span>}
              </div>

              <h1 className="text-[42px] font-black leading-none tracking-[-1.3px] mb-4 text-white">{item.title}</h1>
              <p className="text-white/[0.48] text-sm leading-relaxed max-w-[480px] mb-8">{item.desc}</p>

              {/* Aksiyon butonları */}
              <div className="flex items-center gap-3">
                <button className="bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-[7px] text-white font-extrabold cursor-pointer whitespace-nowrap" style={{ padding: '12px 24px', border: 'none', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
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

        {/* Meta bilgi çubuğu */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e9ec' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 56 }}>
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

          {/* Sol */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0b1829', marginBottom: 14 }}>Hakkında</h2>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{item.content}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: '20px 28px' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0b1829', marginBottom: 12 }}>Etiketler</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 hover:bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, color: '#374151' }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8', marginBottom: 2 }}>Doğrulanmış Teknik Kaynak</div>
                <div style={{ fontSize: 12, color: '#1e40af' }}>Bu belge yetkili teknik kurum ve kuruluşlar tarafından yayımlanmış ve doğrulanmıştır.</div>
              </div>
            </div>

          </div>

          {/* Sağ: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>Erişim</div>
              <button className="bg-blue-600 hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2 text-white font-extrabold cursor-pointer" style={{ padding: '11px', border: 'none', borderRadius: 10, fontSize: 13, marginBottom: 8 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
                PDF İndir
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 transition-colors w-full flex items-center justify-center gap-2 font-bold cursor-pointer" style={{ padding: '11px', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Resmi Kaynakta Aç
              </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>İlgili Kaynaklar</div>
              {related.map(({ slug, title, type }, i) => {
                const rc = TYPE_COLORS[type] ?? { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
                return (
                  <Link key={slug} href={`/kutuphane/teknik-arsiv/teknik-kaynaklar/${slug}`} className="hover:bg-gray-50 rounded-lg transition-colors" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px', marginLeft: -8, marginRight: -8, borderBottom: i < related.length - 1 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none' }}>
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

            <Link href="/kutuphane/teknik-arsiv/teknik-kaynaklar" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e8e9ec', borderRadius: 14, padding: '14px 16px', textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Geri dön</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0b1829' }}>Tüm Teknik Kaynaklar</div>
              </div>
            </Link>

          </div>
        </div>
      </main>
    </>
  );
}
