import Link from 'next/link';
import { notFound } from 'next/navigation';

const ITEMS = [
  {
    id: 1, slug: 'kentsel-donusumde-cbs-uygulamalari',
    title: 'Kentsel Dönüşümde CBS Uygulamaları',
    type: 'Makale', year: 2024, updated: '2024',
    institution: 'Jeodezi ve Fotogrametri Mühendisliği Dergisi', refNo: 'DOI: 10.9733/jfm.2024.001',
    desc: 'Kentsel dönüşüm süreçlerinde coğrafi bilgi sistemleri kullanımı ve mekânsal analiz yöntemleri.',
    content: `Bu çalışmada; Türkiye'deki kentsel dönüşüm projelerinde CBS tabanlı mekânsal analiz yöntemlerinin kullanımı incelenmiş, pilot alanlar üzerinde uygulama örnekleri sunulmuştur.\n\nAraştırmanın temel bulguları:\n- CBS entegrasyonunun proje süresini %30 kısalttığı gözlemlenmiştir\n- Parsel bazlı analiz yöntemleri ruhsat süreçlerini hızlandırmaktadır\n- 3B şehir modelleri ile görsel karar destek sistemleri birlikte kullanılabilmektedir\n- Mekânsal veri paylaşım platformlarının önemi vurgulanmıştır`,
    tags: ['Kentsel Dönüşüm', 'CBS', 'Mekânsal Analiz', '3B Model', 'Şehircilik'],
    isNew: true, popular: true,
  },
  {
    id: 2, slug: 'kadastral-yenileme-gps-mukayese',
    title: 'Kadastral Yenileme Süreçlerinin GPS ile Karşılaştırması',
    type: 'Bildiri', year: 2023, updated: '2023',
    institution: '14. Harita Kurultayı Bildirileri', refNo: 'HK2023-142',
    desc: 'TKGM kadastral yenileme projelerinde GPS/GNSS yöntemlerinin geleneksel tekniklerle kıyaslanması.',
    content: `Bu bildiri; seçilen pilot alanlarda yürütülen kadastral yenileme çalışmalarında GPS/GNSS tabanlı yöntemler ile geleneksel ölçü tekniklerinin doğruluk, maliyet ve süre açısından karşılaştırmalı değerlendirmesini sunmaktadır.`,
    tags: ['Kadastral Yenileme', 'GPS', 'GNSS', 'TKGM', 'Karşılaştırmalı Analiz'],
  },
  {
    id: 3, slug: 'iha-fotogrametrisi-3b-kent-modelleme',
    title: 'İHA Fotogrametrisi ile 3B Kent Modelleme',
    type: 'Tez', year: 2023, updated: '2023',
    institution: 'İTÜ Geomatik Mühendisliği ABD', refNo: 'ITU-GM-YL-2023-07',
    desc: 'Yüksek lisans tezi: İnsansız hava araçlarından elde edilen görüntülerle 3 boyutlu kent modeli üretimi.',
    content: `Bu yüksek lisans tezinde; çok rotorlu İHA sistemleri kullanılarak kentsel alanlarda yüksek çözünürlüklü 3 boyutlu modelleme yapılmıştır. SfM ve MVS algoritmaları ile elde edilen nokta bulutları değerlendirilmiş, LoD2 düzeyinde bina modelleri üretilmiştir.`,
    tags: ['İHA', 'Fotogrametri', '3B Modelleme', 'SfM', 'Kent Modeli'],
    isNew: true,
  },
  {
    id: 4, slug: 'mekansal-planlama-gis-el-kitabi',
    title: 'Mekânsal Planlama ve GIS El Kitabı',
    type: 'Kitap', year: 2022, updated: '2022',
    institution: 'HKMO Yayınları', refNo: 'ISBN: 978-975-XXX-XXX-X',
    desc: 'Mekânsal planlama süreçlerinde coğrafi bilgi sistemleri araçlarının etkin kullanımına yönelik kapsamlı kaynak.',
    content: `Bu el kitabı; nazım ve uygulama imar planlarının hazırlanmasında CBS araçlarının nasıl kullanılacağını, örnek uygulamalar eşliğinde ayrıntılı biçimde açıklamaktadır.`,
    tags: ['Mekânsal Planlama', 'GIS', 'İmar Planı', 'HKMO', 'Ders Kitabı'],
    popular: true,
  },
  {
    id: 5, slug: 'harita-muhendisliginde-yapay-zeka',
    title: 'Harita Mühendisliğinde Yapay Zeka Uygulamaları',
    type: 'Makale', year: 2024, updated: '2024',
    institution: 'Türkiye Jeodezi ve Jeofizik Birliği Dergisi', refNo: 'DOI: 10.1501/tujjb.2024.015',
    desc: 'Makine öğrenmesi ve derin öğrenme yöntemlerinin harita ve kadastro uygulamalarına entegrasyonu.',
    content: `Bu makalede; nesne tespiti, arazi örtüsü sınıflandırması ve parsel sınırı çıkarımı gibi görevlerde derin öğrenme modellerinin uydu ve hava görüntülerine uygulanması incelenmiştir.`,
    tags: ['Yapay Zeka', 'Derin Öğrenme', 'Nesne Tespiti', 'Uydu Görüntüsü', 'CBS'],
    isNew: true,
  },
  {
    id: 6, slug: 'zemin-etudu-metodolojileri-raporu',
    title: 'Zemin Etüdü Metodolojileri Araştırma Raporu',
    type: 'Rapor', year: 2021, updated: '2021',
    institution: 'TÜBİTAK – MAM', refNo: 'TUBITAK-MAM-2021-45',
    desc: 'İmar planlamasında zemin etüdü gereklilikleri ve yaygın metodolojilerin karşılaştırmalı değerlendirmesi.',
    content: `Bu araştırma raporu; Türkiye'de imar planlaması süreçlerinde zorunlu tutulan zemin etüdü çalışmalarının mevcut metodolojileri, standart gereksinimleri ve uygulama pratiklerini kapsamaktadır.`,
    tags: ['Zemin Etüdü', 'İmar Planı', 'Jeoteknik', 'TÜBİTAK', 'Metodoloji'],
  },
  {
    id: 7, slug: 'cografya-bilgi-sistemleri-temel-kavramlar',
    title: 'Coğrafi Bilgi Sistemleri: Temel Kavramlar',
    type: 'Kitap', year: 2020, updated: '2022',
    institution: 'Nobel Akademik Yayıncılık', refNo: 'ISBN: 978-625-XXX-XXX-X',
    desc: 'CBS\'nin temel kavramları, veri yapıları, mekânsal analiz yöntemleri ve uygulama alanlarını kapsayan ders kitabı.',
    content: `Bu ders kitabı; lisans ve lisansüstü öğrencileri ile CBS alanına yeni girenlere yönelik olarak hazırlanmıştır. Vektör ve raster veri yapılarından mekânsal sorgulamaya, projeksiyon sistemlerinden ağ analizine kadar geniş bir yelpazede konuları kapsamaktadır.`,
    tags: ['CBS', 'GIS', 'Mekânsal Analiz', 'Ders Kitabı', 'Veri Yapıları'],
    popular: true,
  },
  {
    id: 8, slug: 'deprem-riski-cbs-analizi',
    title: 'Deprem Riski Değerlendirmesinde CBS Analizi',
    type: 'Makale', year: 2023, updated: '2023',
    institution: 'Doğal Afetler ve Çevre Dergisi', refNo: 'DOI: 10.21324/dacd.2023.028',
    desc: 'Olasılıksal deprem tehlikesi analizi ile mekânsal risk değerlendirme modellerinin CBS ortamında uygulanması.',
    content: `Bu çalışma; seçilen pilot iller için deprem tehlikesi haritaları ve yapı stoku verileri birleştirilerek CBS ortamında mekânsal risk değerlendirme modelleri geliştirilmesini konu almaktadır.`,
    tags: ['Deprem Riski', 'CBS', 'Mekânsal Risk', 'Tehlike Haritası', 'Afet Yönetimi'],
  },
  {
    id: 9, slug: 'cors-agi-performans-degerlendirmesi',
    title: 'CORS Ağı Performans Değerlendirmesi',
    type: 'Bildiri', year: 2022, updated: '2022',
    institution: '13. Harita Kurultayı Bildirileri', refNo: 'HK2022-089',
    desc: 'Türkiye CORS ağının konum doğruluğu, güvenilirlik ve ağ geometrisi açısından performans analizi.',
    content: `Bu bildiride; TUSAGA-Aktif CORS ağından elde edilen ölçme sonuçları kullanılarak çeşitli bölgelerde ağ performansı değerlendirilmiş, doğruluk ve güvenilirlik analizleri gerçekleştirilmiştir.`,
    tags: ['CORS', 'TUSAGA-Aktif', 'GNSS', 'Ağ Geometrisi', 'Doğruluk Analizi'],
  },
  {
    id: 10, slug: 'kiyi-alanlari-uzaktan-algilama',
    title: 'Kıyı Alanları Yönetiminde Uzaktan Algılama',
    type: 'Tez', year: 2022, updated: '2022',
    institution: 'YTÜ Harita Mühendisliği ABD', refNo: 'YTU-HM-DR-2022-03',
    desc: 'Doktora tezi: Çok zamanlı uydu görüntüleri ile kıyı çizgisi değişim analizi ve yönetim stratejileri.',
    content: `Bu doktora tezinde; Ege ve Akdeniz kıyılarında 30 yıllık çok zamanlı uydu görüntüleri kullanılarak kıyı çizgisi değişimleri analiz edilmiş, CBS tabanlı karar destek sistemi önerilmiştir.`,
    tags: ['Kıyı Yönetimi', 'Uzaktan Algılama', 'Kıyı Çizgisi', 'Çok Zamanlı Analiz', 'CBS'],
  },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Makale':  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Bildiri': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Tez':     { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  'Kitap':   { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Rapor':   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const RELATED = [
  { slug: 'kentsel-donusumde-cbs-uygulamalari',       title: 'Kentsel Dönüşümde CBS Uygulamaları',           type: 'Makale' },
  { slug: 'cografya-bilgi-sistemleri-temel-kavramlar', title: 'Coğrafi Bilgi Sistemleri: Temel Kavramlar',   type: 'Kitap' },
  { slug: 'iha-fotogrametrisi-3b-kent-modelleme',      title: 'İHA Fotogrametrisi ile 3B Kent Modelleme',    type: 'Tez' },
];

export default async function AkademikYayinlarDetayPage({ params }: { params: Promise<{ slug: string }> }) {
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
            style={{ backgroundImage: "url('/akademik_detay.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
              <Link href="/kutuphane/teknik-arsiv/akademik-yayinlar" className="text-white/35 hover:text-white/60 transition-colors">Akademik Yayınlar</Link>
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
                <button className="bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-[7px] text-white font-extrabold cursor-pointer whitespace-nowrap" style={{ padding: '12px 24px', border: 'none', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
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
                { label: 'Yayın', value: item.institution, icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
                { label: 'Yıl', value: String(item.year), icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label: 'Son Güncelleme', value: item.updated, icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
                { label: 'DOI / Ref', value: item.refNo, icon: <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
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
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0b1829', marginBottom: 14 }}>Özet</h2>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{item.content}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: '20px 28px' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0b1829', marginBottom: 12 }}>Anahtar Kelimeler</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 hover:bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, color: '#374151' }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#b45309', marginBottom: 2 }}>Akademik / Hakemli Kaynak</div>
                <div style={{ fontSize: 12, color: '#92400e' }}>Bu yayın hakemli dergi, konferans bildirileri veya akademik yayınevleri tarafından değerlendirilmiş ve yayımlanmıştır.</div>
              </div>
            </div>

          </div>

          {/* Sağ: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>Erişim</div>
              <button className="bg-amber-600 hover:bg-amber-700 transition-colors w-full flex items-center justify-center gap-2 text-white font-extrabold cursor-pointer" style={{ padding: '11px', border: 'none', borderRadius: 10, fontSize: 13, marginBottom: 8 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
                PDF İndir
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 transition-colors w-full flex items-center justify-center gap-2 font-bold cursor-pointer" style={{ padding: '11px', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Yayında Görüntüle
              </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b1829', marginBottom: 14 }}>İlgili Yayınlar</div>
              {related.map(({ slug, title, type }, i) => {
                const rc = TYPE_COLORS[type] ?? { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
                return (
                  <Link key={slug} href={`/kutuphane/teknik-arsiv/akademik-yayinlar/${slug}`} className="hover:bg-gray-50 rounded-lg transition-colors" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px', marginLeft: -8, marginRight: -8, borderBottom: i < related.length - 1 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" fill="none" stroke={rc.color} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1829', lineHeight: 1.4 }}>{title}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: rc.color }}>{type}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link href="/kutuphane/teknik-arsiv/akademik-yayinlar" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e8e9ec', borderRadius: 14, padding: '14px 16px', textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Geri dön</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0b1829' }}>Tüm Yayınlar</div>
              </div>
            </Link>

          </div>
        </div>
      </main>
    </>
  );
}
