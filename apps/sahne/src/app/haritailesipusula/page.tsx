'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type FeedbackType = 'talep' | 'gorus' | 'reklam';
type Step = 'intro' | 'clarify' | 'confirm' | 'form' | 'success';

interface Category {
  id: string;
  icon: string;
  label: string;
  desc: string;
  type: FeedbackType;
  bodyHint: string;
  smartQuestion: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'teknik', icon: '🔧', label: 'Teknik Destek',
    desc: 'Platform, araç, yazılım veya sistem sorunu', type: 'talep',
    bodyHint: 'Hangi sayfada veya işlemde sorun yaşıyorsunuz? Ne zaman başladı?',
    smartQuestion: 'Teknik bir sorunla mı karşılaştınız?',
  },
  {
    id: 'mesleki-cozum', icon: '🛠️', label: 'Mesleki Çözüm',
    desc: 'Saha, ölçüm veya teknik iş süreçleri için araç, yöntem ya da uygulama önerisi', type: 'talep',
    bodyHint: 'Hangi iş sürecinde takıldınız? Şu an ne kullanıyorsunuz, ne arıyorsunuz?',
    smartQuestion: 'Mesleki çalışmanız için bir araç, uygulama veya yöntem mi arıyorsunuz?',
  },
  {
    id: 'egitim', icon: '🎓', label: 'Eğitim & Kariyer',
    desc: 'Eğitim, sertifika, kariyer veya mesleki gelişim', type: 'talep',
    bodyHint: 'Hangi konuda destek arıyorsunuz? Mevcut durumunuzu ve hedefinizi paylaşın.',
    smartQuestion: 'Eğitim veya kariyer konusunda destek mi arıyorsunuz?',
  },
  {
    id: 'uyelik', icon: '📋', label: 'Üyelik & Başvuru',
    desc: 'Üyelik işlemleri, başvuru, ödeme ve avantajlar', type: 'talep',
    bodyHint: 'Başvurunuz veya üyeliğinizle ilgili konuyu açıklayın.',
    smartQuestion: 'Üyelik veya başvuru süreciyle ilgili yardım mı istiyorsunuz?',
  },
  {
    id: 'mevzuat', icon: '⚖️', label: 'Mevzuat & Hukuk',
    desc: 'Mesleki mevzuat, uygulama yorumu veya hukuki yönlendirme', type: 'talep',
    bodyHint: 'Hangi mevzuat veya konu hakkında bilgi almak istiyorsunuz?',
    smartQuestion: 'Mesleki mevzuat veya hukuki bir konuda yönlendirme mi istiyorsunuz?',
  },
  {
    id: 'sektor', icon: '🗺️', label: 'Sektörel Soru',
    desc: 'Harita, CBS, geomatik ve mesleki gelecek', type: 'talep',
    bodyHint: 'Sektörel teknik sorunuzu ve bağlamını yazın.',
    smartQuestion: 'Harita, CBS veya geomatik alanında sektörel bir sorunuz mu var?',
  },
  {
    id: 'oneri', icon: '💡', label: 'Öneri & Görüş',
    desc: 'Platform, vakıf veya sektörel çalışmalar için geri bildirim', type: 'gorus',
    bodyHint: 'Önerinizi veya görüşünüzü detaylıca paylaşın.',
    smartQuestion: 'Bir iyileştirme önerisi veya geri bildirim mi paylaşmak istiyorsunuz?',
  },
  {
    id: 'mentorluk', icon: '🤝', label: 'Mentörlük & Rehberlik',
    desc: 'Deneyimli meslektaştan birebir destek veya kariyer rehberliği', type: 'talep',
    bodyHint: 'Ne konuda rehberlik arıyorsunuz? Kısa özgeçmişinizi ve hedefinizi paylaşın.',
    smartQuestion: 'Deneyimli bir meslektaştan birebir rehberlik mi istiyorsunuz?',
  },
  {
    id: 'kariyer-danismanligi', icon: '🎯', label: 'Kariyer Danışmanlığı',
    desc: 'İş yeri sorunları, kariyer kararları veya mesleki yol ayrımı için rehberlik', type: 'talep',
    bodyHint: 'İş hayatınızda yaşadığınız durumu ve almak istediğiniz desteği paylaşın.',
    smartQuestion: 'Kariyer kararları veya iş hayatında yaşadığınız bir sorun için destek mi istiyorsunuz?',
  },
  {
    id: 'is-staj', icon: '💼', label: 'İş, Staj & Fırsatlar',
    desc: 'İş, staj, proje veya gönüllülük fırsatları', type: 'talep',
    bodyHint: 'Hangi tür fırsatlar arıyorsunuz? Deneyim seviyenizi ve tercihlerinizi belirtin.',
    smartQuestion: 'İş ilanı, staj fırsatı veya eşleşme mi arıyorsunuz?',
  },
  {
    id: 'indirim', icon: '🏷️', label: 'İndirim & Avantaj',
    desc: 'Eğitim, yazılım, cihaz veya hizmet indirimi', type: 'talep',
    bodyHint: 'Hangi ürün veya hizmet için indirimli teklif istiyorsunuz?',
    smartQuestion: 'İndirimli fiyat veya özel teklif mi arıyorsunuz?',
  },
  {
    id: 'kurumsal', icon: '🏢', label: 'Kurumsal Destek',
    desc: 'Şirket veya kurum için iş birliği, eğitim ve danışmanlık', type: 'talep',
    bodyHint: 'Kurumunuzu ve talep ettiğiniz işbirliği türünü kısaca açıklayın.',
    smartQuestion: 'Kurumsal iş birliği veya destek paketi mi istiyorsunuz?',
  },
  {
    id: 'tanitim', icon: '📣', label: 'Tanıtım & Duyuru',
    desc: 'Etkinlik duyurusu, firma/ürün tanıtımı veya sponsorluk', type: 'reklam',
    bodyHint: 'Ne tanıtmak veya duyurmak istiyorsunuz? Hedef kitlenizi ve amacınızı paylaşın.',
    smartQuestion: 'Etkinliğinizi, firmanızı veya ürününüzü Haritailesi topluluğuna mı duyurmak istiyorsunuz?',
  },
];


const ECOSYSTEM_HINTS: Record<string, Array<{ icon: string; label: string; desc: string; href: string }>> = {
  egitim: [
    { icon: '📚', label: 'Haritakademi', desc: 'Eğitim programları ve kursları', href: '/egitim' },
    { icon: '🌟', label: "Mesleğin Gelecekleri", desc: 'Burs ve kariyer destekleri', href: '/meslegin-gelecekleri' },
  ],
  'is-staj': [
    { icon: '💼', label: 'Haritakariyer İlanları', desc: 'İş ve staj ilanlarına göz atın', href: '/ilanlar' },
  ],
  mentorluk: [
    { icon: '🤝', label: 'Mentör Eşleşme', desc: 'Mentörlük başvurusu yapın', href: '/mentorlesme' },
    { icon: '📚', label: 'Haritakademi', desc: 'Mesleki gelişim eğitimleri', href: '/egitim' },
  ],
  'kariyer-danismanligi': [
    { icon: '🤝', label: 'Mentör Eşleşme', desc: 'Deneyimli meslektaştan kariyer rehberliği', href: '/mentorlesme' },
    { icon: '💼', label: 'İş İlanları', desc: 'Yeni bir başlangıç için sektör ilanları', href: '/ilanlar' },
  ],
  kurumsal: [
    { icon: '🏢', label: 'Vitrin', desc: 'Kurumsal profil ve tanıtım sayfanız', href: '/magaza' },
  ],
  tanitim: [
    { icon: '🏢', label: 'Vitrin / Mağaza', desc: 'Firma profilinizi ve ürünlerinizi sergileyin', href: '/magaza' },
    { icon: '📅', label: 'Etkinlikler', desc: 'Etkinliğinizi topluluğa duyurun', href: '/etkinlikler' },
  ],
  indirim: [
    { icon: '📚', label: 'Haritakademi', desc: 'İndirimli eğitim paketleri', href: '/egitim' },
    { icon: '🏢', label: 'Vitrin', desc: 'Partner firma katalog ve indirimleri', href: '/magaza' },
  ],
  sektor: [
    { icon: '📚', label: 'Haritakademi', desc: 'Teknik eğitim ve sektörel kurslar', href: '/egitim' },
  ],
  'mesleki-cozum': [
    { icon: '🤝', label: 'Mentör Eşleşme', desc: 'Deneyimli bir meslektaştan yönlendirme alın', href: '/mentorlesme' },
    { icon: '📚', label: 'Haritakademi', desc: 'Teknik eğitim ve pratik kurslar', href: '/egitim' },
  ],
  mevzuat: [
    { icon: '📚', label: 'Haritakademi', desc: 'Mevzuat ve hukuk eğitimleri', href: '/egitim' },
  ],
};

// ─── Deteksiyon sinyalleri ────────────────────────────────────────────────────

// Türkçe olumsuzlama: "sorun yok", "hata değil", "hiçbir problem" → nötrleştir
function deNegateText(text: string): string {
  return text
    // "kelime yok/değil/olmadı/olmaz/etmedi/yaşamadım" → NÖTR
    .replace(/\b(\w+)\s+(yok|değil|olmadı|olmaz|etmedi|etmez|yaşamıyorum|yaşamadım)\b/gi, 'NÖTR $2')
    // "hiç/hiçbir kelime" → NÖTR
    .replace(/\b(?:hiç(?:bir)?)\s+(\w+)\b/gi, 'NÖTR');
}

// Türkçe morfoloji normalizer — çekim eklerini soyar, OR ile sadece true positive ekler
function normalizeTR(text: string): string {
  return text.split(/(\s+)/).map(seg => {
    if (/^\s+$/.test(seg) || seg.length < 4) return seg;
    let w = seg;
    w = w.replace(/(?:a|e)(?:mı|mi|mu|mü)yo(?:rum|rsun|r|ruz|rsunuz|rlar)$/i, 'amak');
    w = w.replace(/(?:ı|i|u|ü)yo(?:rum|rsun|r|ruz|rsunuz|rlar)$/i, '');
    w = w.replace(/(?:d|t)(?:ı|i|u|ü)(?:m|n|k|nız|lar)?$/i, '');
    w = w.replace(/(?:mış|miş|muş|müş)(?:sın|sınız|lar)?$/i, '');
    w = w.replace(/(?:y)?(?:a|e)c(?:ak|ek)(?:sın|sınız|lar)?$/i, '');
    w = w.replace(/(?:lar|ler)$/i, '');
    w = w.replace(/(?:dan|den|tan|ten)$/i, '');
    w = w.replace(/(?:da|de|ta|te)$/i, '');
    w = w.replace(/(?:n)?(?:ın|in|un|ün)$/i, '');
    w = w.replace(/(?:y)?(?:ı|i|u|ü)$/i, '');
    w = w.replace(/(?:y)?(?:a|e)$/i, '');
    return w.length >= 3 ? w : seg;
  }).join('');
}

// Mesleki alan: saha teknolojileri, CBS, ölçme-harita, sektör yazılımları
const SIG_ALAN = /\b(saha|arazi|ölçüm|ölçme|ölçümler|nivelman|nivelamn|nivelama|tachymetre|takyometre|takymetre|takyometere|total.?station|rtk[\s-]?gnss|drone.?ölçüm|lidar|fotogrametri|gnss|cbs\b|harita|geodezi|jeodezi|kadastro|gis\b|geomatik|kml|\.shp|shapefile|gpx|dwg|dxf|geojson|raster|vektör|nokta.?bulutu|cors.?ağ|yer.?ölçüm|yer.?tarama|arazi.?ölçüm|ölçme.?aleti|coğrafi.?bilgi|kent.?bilgi|parsel|mülkiyet.?sınır|arcgis|qgis|netcad|autocad|mapinfo|erdas|envi|surfer|civil\s*3d|trimble|leica|topcon|netgsm|cors|gnss.?alıcı|gnss.?cihaz|emlid|tersus|hi.?target|south.?gnss|bynav)\b/i;

// Çözüm/araç arayışı niyeti
const SIG_NIYET_COZUM = /\b(bulamıyorum|bulamıyom|bulamadım|arıyorum|arıyoruz|lazım|ihtiyacım\s+var|önerisi|önerir\s+misiniz|ne\s+kullanayım|ne\s+yapayım|ne\s+önerirsiniz|nasıl\s+kullanmalıyım|hangi\s+(uygulama|yazılım|program|araç|çözüm|yöntem)|tavsiye\s+(eder\s+misiniz|istiyorum)|alternatif\s+(arıyorum|öneri)|nasıl\s+(yapabilirim|çözebilirim|bulabilirim|çözeyim|yapılır)|çare|bir\s+çözüm\s+(var\s+mı|arıyorum)|yardımcı\s+ol(ur\s+musunuz|abilir\s+misiniz|abilirsiniz|manızı)|yardım\s+(eder\s+misiniz|edebilir\s+misiniz|lazım|istiyorum)|yapamıyorum|yapamıyom|başaramıyorum|beceremedim|olmuyor|ne\s+yapmalıyım|çözüm\s+(arıyorum|lazım|önerisi|önerir)|mobil\s+(çözüm|uygulama|yazılım|araç))\b/i;

// Platform/sistem problemi
const SIG_TEKNIK = /\b(platform|giriş\s+yapamı|oturum\s+açamı|login\s+yapamı|şifre\s+(unuttum|sıfırla)|çalışmıyor|bozuk|açamıyorum|açılmıyor|çalıştıramıyorum|yüklenmiyor|donuyor|crash|çöküyor|uygulama\s+sorunu|sistem\s+(hatası|sorunu|çöktü)|erişim\s+(sorunu|hatası|engeli)|güncelleme\s+sonrası|hata\s+kodu|404|500|bug)\b/i;

type CategoryBias = Record<string, number>;

interface DetectionResult {
  primary: Category;
  secondary: Category | null;
  dualQuestion?: string;
  topScore: number;
  scoreDiff: number;
}

// Sinyalleri verilen metne uygular ve skoru günceller
function applySignals(
  t: string,
  w: number,
  add: (cat: string, n: number) => void,
): { hasAlan: boolean; hasNiyet: boolean; hasTeknik: boolean; hasIsYeri: boolean } {
  const hasAlan = SIG_ALAN.test(t);
  const hasNiyet = SIG_NIYET_COZUM.test(t);
  const hasTeknik = SIG_TEKNIK.test(t);

  if (hasAlan && hasNiyet) add('mesleki-cozum', 4 * w);
  else if (hasNiyet && !hasTeknik) add('mesleki-cozum', 1 * w);

  if (hasTeknik) add('teknik', 3 * w);
  if (/\b(hata|erişim|sistem)\b/i.test(t) && !hasAlan) add('teknik', 1 * w);

  if (hasAlan && !hasNiyet) add('sektor', 2 * w);
  if (hasAlan) add('sektor', 1 * w);

  if (/\b(mevzuat|yönetmelik|hukuk|lisans|ruhsat|yasal|kanun|tüzük|dava|hukuki|mevzuata|yönetmeliğe|yasal\s+düzenlem)\b/i.test(t)) add('mevzuat', 3 * w);
  if (/\b(eğitim|sertifika|kurs|öğrenmek|diploma|yeterlilik|gelişim|eğitim\s+alm|kursa\s+kaydol|mezun|öğrenim)\b/i.test(t)) add('egitim', 2 * w);
  if (/\b(mentör|mentorluk|koçluk|rehberlik|bire\s+bir|birebir|koç|tecrübeli\s+(biri|birinden))\b/i.test(t)) add('mentorluk', 2 * w);
  if (/\b(staj|iş\s+ilanı|iş\s+arıyorum|istihdam|proje\s+ortaklığı|iş\s+fırsatı|iş\s+bulm|çalışmak\s+istiyor)\b/i.test(t)) add('is-staj', 2 * w);
  if (/\b(kurumsal|işbirliği|iş\s+birliği|partner|kurum\s+(adına|için|ile)|organizasyon\s+için)\b/i.test(t)) add('kurumsal', 2 * w);
  if (/\b(indirim|teklif|fiyat|pahalı|ucuz|avantaj|paket|lisans\s+fiyat|uygun\s+fiyat|fiyatlandırma)\b/i.test(t)) add('indirim', 2 * w);
  if (/\b(öneri|fikir|iyileştir|özellik\s+ekle|geliştir|şikayet|geri\s+bildirim|görüşüm|memnun\s+(değilim|kalmadım)|eksik\s+olan)\b/i.test(t)) add('oneri', 2 * w);
  if (/\b(üyelik|başvuru|abone|abonelik|kayıt\s+ol|üye\s+olmak|üye\s+olm|başvurmak|üyeliğim)\b/i.test(t)) add('uyelik', 2 * w);

  const hasEtkinlik = /\b(etkinlik|seminer|webinar|konferans|panel|çalıştay|workshop|organizasyon|toplantı)\b/i.test(t);
  const hasTanitimNiyet = /\b(tanıt|duyur|broşür|katalog|reklam|ilan\s+ver|sponsor|destekçi|katılım\s+artır|ulaşmak\s+istiyorum|topluluğa|sektöre\s+duyur|görünür\s+ol)\b/i.test(t);
  const hasFirma = /\b(firma(m|mız)?|şirket(im|imiz)?|marka(m|mız)?|ürünüm|hizmetim|üretici|distribütör)\b/i.test(t);
  if (hasEtkinlik && hasTanitimNiyet) add('tanitim', 4 * w);
  else if (hasFirma && hasTanitimNiyet) add('tanitim', 4 * w);
  else if (hasEtkinlik || hasTanitimNiyet) add('tanitim', 2 * w);

  const hasIsYeri = /\b(mobbing|taciz|baskı|zorbalık|yıldırma|psikolojik\s+(şiddet|baskı)|haksız\s+muamele|ayrımcılık|iş\s+yerinde\s+(sorun|sıkıntı|problem)|haklarım\s+(ne|neler|var\s+mı)|kötü\s+(muamele|davranış)|çalışma\s+(koşul|ortam)|kıdem\s+tazminat|ihbar\s+tazminat|haksız\s+fesih|işten\s+çıkarıl|tazminat\s+hakkım)\b/i.test(t);
  if (hasIsYeri) { add('kariyer-danismanligi', 3 * w); add('mevzuat', 3 * w); }

  return { hasAlan, hasNiyet, hasTeknik, hasIsYeri };
}

function detectCategories(text: string, bias: CategoryBias = {}): DetectionResult {
  const score: Record<string, number> = {};
  const add = (cat: string, n: number) => { score[cat] = (score[cat] ?? 0) + n; };

  const t = deNegateText(text.toLowerCase());
  const tNorm = normalizeTR(t);

  // Tam metin — orijinal ve normalize (OR mantığı: yalnızca true positive ekler)
  const { hasIsYeri } = applySignals(t, 1, add);
  applySignals(tNorm, 1, add); // normalize edilmiş → daha fazla köke ulaşır

  // Cümle ağırlığı: ilk cümle ×2 etkisi için bonus tur
  const sentences = t.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
  if (sentences.length > 1) {
    const t1 = deNegateText(sentences[0]!);
    applySignals(t1, 1, add);           // +1 bonus → toplam 2× ağırlık
    applySignals(normalizeTR(t1), 1, add);
  }

  // Öğrenilmiş bias'ı regex skorlarına uygula (kendi kendine öğrenme katmanı)
  for (const [catId, delta] of Object.entries(bias)) {
    if (score[catId] !== undefined) score[catId] = Math.max(0, score[catId]! + delta);
  }

  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0]?.[1] ?? 0;
  const secondScore = sorted[1]?.[1] ?? 0;
  const scoreDiff = topScore - secondScore;
  const fallback = CATEGORIES.find(c => c.id === 'oneri')!;
  const primary = CATEGORIES.find(c => c.id === sorted[0]?.[0]) ?? fallback;
  const tied = scoreDiff === 0 && sorted.length >= 2;
  const secondary = tied ? (CATEGORIES.find(c => c.id === sorted[1]?.[0]) ?? null) : null;

  let dualQuestion: string | undefined;
  if (tied && hasIsYeri && secondary) {
    dualQuestion = 'İş yerinde yaşadığınız durumu aktarmak için hukuki bilgi mi, yoksa deneyimli bir meslektaştan kariyer rehberliği mi almak istiyorsunuz?';
  }

  return dualQuestion
    ? { primary, secondary, dualQuestion, topScore, scoreDiff }
    : { primary, secondary, topScore, scoreDiff };
}

async function fetchLLMClassification(
  text: string,
  regexSignals: { topCategory: string; topScore: number; scoreDiff: number },
): Promise<{
  categoryId: string;
  confidence: number;
  reasoning: string;
  clarifyingQuestion?: string;
  clarifyOptions?: string[];
} | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/community/classify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 500), regexSignals }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.json() as {
      categoryId: string;
      confidence: number;
      reasoning: string;
      clarifyingQuestion?: string;
      clarifyOptions?: string[];
    };
  } catch {
    return null;
  }
}

function buildSmartQuestion(text: string, cat: Category): string {
  const swMatch = /\b(netcad|arcgis|qgis|autocad|mapinfo|erdas|envi|surfer|civil 3d|trimble|leica|topcon|matlab|revit)\b/i.exec(text);
  const sw = swMatch?.[1];
  const fileMatch = /\b(kml|shp|shapefile|gpx|dwg|dxf|geojson|raster|lidar)\b/i.exec(text);
  const file = fileMatch?.[1]?.toUpperCase();
  const hasSaha = /saha|arazi/i.test(text);
  const taskMatch = /\b(nivelman|röperle|tachymetre|takyometre|total station|rtk|gnss|drone|insansız|fotogrametri|tarama)\b/i.exec(text);
  const task = taskMatch?.[1];

  if (cat.id === 'mesleki-cozum') {
    if (task && hasSaha) return `Sahada ${task} yaparken kullanabileceğiniz bir mobil çözüm mü arıyorsunuz?`;
    if (task) return `${task} işlemi için doğru araç veya uygulamayı mı arıyorsunuz?`;
    if (hasSaha) return 'Saha çalışmalarınızı kolaylaştıracak bir araç veya uygulama mı arıyorsunuz?';
    if (sw) return `${sw} yerine kullanabileceğiniz veya birlikte çalışabileceğiniz bir çözüm mü arıyorsunuz?`;
    return cat.smartQuestion;
  }
  if (cat.id === 'tanitim') {
    if (/sponsor|destekçi/i.test(text)) return 'Etkinliğiniz için sponsor veya kurumsal destekçi mi arıyorsunuz?';
    if (/etkinlik|seminer|webinar|konferans/i.test(text)) return 'Etkinliğinizi Haritailesi topluluğuna mı duyurmak istiyorsunuz?';
    if (/firma|şirket|markam|ürünüm|broşür/i.test(text)) return 'Firmanızı veya ürününüzü Haritailesi sektör topluluğuna mı tanıtmak istiyorsunuz?';
    return cat.smartQuestion;
  }
  if (cat.id === 'indirim' && sw) return `${sw} için indirimli teklif mi arıyorsunuz?`;
  if (cat.id === 'teknik' && sw) return `${sw} ile ilgili teknik bir sorun mu yaşıyorsunuz?`;
  if (cat.id === 'sektor' && file)
    return hasSaha
      ? `Sahada ${file} dosyasıyla ilgili bir sorun mu yaşıyorsunuz?`
      : `${file} dosyasıyla ilgili teknik bir sorun mu yaşıyorsunuz?`;
  if (cat.id === 'sektor' && sw) return `${sw} ile ilgili sektörel bir sorunuz mu var?`;
  return cat.smartQuestion;
}

function extractSubject(text: string): string {
  const first = text.split(/[.\n!?]/)[0]?.trim() ?? '';
  return first.length > 4 ? first.slice(0, 90) : text.slice(0, 90);
}

// ─── Satisfaction panel ────────────────────────────────────────────────────────

function SatisfactionPanel({ feedbackId }: { feedbackId: string }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!score || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/community/feedback/${feedbackId}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız');
      setSubmitted(true);
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-10">
        <div className="text-2xl mb-2">🙏</div>
        <p className="font-semibold text-green-800 text-sm">Değerlendirmeniz için teşekkürler!</p>
      </div>
    );
  }

  const labels = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

  return (
    <div className="bg-white border border-[#26496b]/20 rounded-2xl p-6 mb-10 shadow-sm">
      <p className="text-xs font-bold text-[#26496b]/50 uppercase tracking-widest mb-1">Memnuniyet Değerlendirmesi</p>
      <p className="font-semibold text-gray-800 text-sm mb-4">Talebiniz çözüme kavuştu. Aldığınız desteği nasıl değerlendirirsiniz?</p>
      <div className="flex items-center justify-center gap-2 mb-3">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button" onClick={() => setScore(s)}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none">
            {(hover || score) >= s ? '★' : '☆'}
          </button>
        ))}
      </div>
      {(hover || score) > 0 && (
        <p className="text-xs text-center text-gray-500 mb-3">{labels[hover || score]}</p>
      )}
      {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}
      <button type="button" disabled={!score || busy} onClick={() => void submit()}
        className="w-full bg-[#26496b] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 hover:bg-[#1e3a56] transition-colors">
        {busy ? 'Gönderiliyor…' : 'Değerlendirimi Gönder'}
      </button>
    </div>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function GoruslerinizInner() {
  const params = useSearchParams();
  const rateId = params.get('rate');

  const [step, setStep] = useState<Step>('intro');
  const [freeText, setFreeText] = useState('');
  const [detectedCat, setDetectedCat] = useState<Category>(CATEGORIES[5]!);
  const [confirmedCat, setConfirmedCat] = useState<Category>(CATEGORIES[5]!);
  const [secondaryCat, setSecondaryCat] = useState<Category | null>(null);
  const [dualQuestion, setDualQuestion] = useState<string | undefined>(undefined);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [extraNote, setExtraNote] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    subject: '', body: '', urgency: 'normal', kvkk: false,
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [clarifyOptions, setClarifyOptions] = useState<string[]>([]);
  const [bias, setBias] = useState<CategoryBias>({});
  const [showMoreCats, setShowMoreCats] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [ticketNo, setTicketNo] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // OTP doğrulama state
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [otpSentTo, setOtpSentTo] = useState('');  // doğrulama gönderildiğinde snapshot
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Bot koruması: sayfa yüklenme zamanı + honeypot (görünmez tuzak alan)
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');

  // Öğrenilmiş bias'ı yükle (1 saatlik browser cache)
  useEffect(() => {
    const cacheKey = 'category_bias_cache';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setBias(JSON.parse(cached) as CategoryBias); return; } catch { /* ignore */ }
    }
    void fetch(`${API_URL}/api/v1/community/category-bias`)
      .then(r => r.ok ? r.json() : {})
      .then((data: unknown) => {
        if (data && typeof data === 'object') {
          setBias(data as CategoryBias);
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  // Formdaki ilgili alandan contact'ı türet
  const otpContact = otpType === 'email' ? form.email.trim() : form.phone.trim();

  async function handleSendOtp() {
    if (!otpContact || otpBusy) return;
    setOtpBusy(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/community/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: otpContact, type: otpType }),
      });
      if (!res.ok) {
        const d = await res.json() as { message?: string | string[] };
        throw new Error(Array.isArray(d.message) ? d.message[0] : (d.message ?? 'Kod gönderilemedi'));
      }
      setOtpSentTo(otpContact);
      setOtpSent(true);
      setOtpCooldown(60);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6 || otpBusy) return;
    setOtpBusy(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/community/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: otpSentTo, type: otpType, code: otpCode.trim() }),
      });
      if (!res.ok) {
        const d = await res.json() as { message?: string | string[] };
        throw new Error(Array.isArray(d.message) ? d.message[0] : (d.message ?? 'Kod doğrulanamadı'));
      }
      const data = await res.json() as { token: string };
      setOtpToken(data.token);
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setOtpBusy(false);
    }
  }

  function resetOtp() {
    setOtpSentTo(''); setOtpCode(''); setOtpSent(false);
    setOtpVerified(false); setOtpToken(''); setOtpBusy(false);
    setOtpError(''); setOtpCooldown(0); setOtpType('email');
  }

  async function handleContinue() {
    if (!freeText.trim()) return;
    // Bot koruması: honeypot dolu veya sayfa çok hızlı submit edildi
    if (honeypot || Date.now() - loadTime < 2000) return;

    const { primary, secondary, dualQuestion: dq, topScore, scoreDiff } = detectCategories(freeText, bias);

    // Regex sonucunu varsayılan olarak ata (LLM başarısız olursa kullanılır)
    setDetectedCat(primary);
    setConfirmedCat(primary);
    setSecondaryCat(secondary);
    setDualQuestion(dq);
    setShowCategoryPicker(false);

    // AI-first: her mesajda Claude çağrılır; regex sinyalleri bağlam olarak iletilir
    // topScore=0 ise regex anlamlı sinyal üretemedi — Claude'u serbest bırak
    setDetecting(true);
    const llmResult = await fetchLLMClassification(freeText, {
      topCategory: topScore > 0 ? primary.id : 'belirsiz',
      topScore,
      scoreDiff,
    });
    setDetecting(false);

    if (llmResult) {
      const llmCat = CATEGORIES.find(c => c.id === llmResult.categoryId);
      if (llmCat) {
        setDetectedCat(llmCat);
        setConfirmedCat(llmCat);
        setSecondaryCat(null);
        setDualQuestion(undefined);
      }

      if (llmResult.clarifyingQuestion && (llmResult.clarifyOptions?.length ?? 0) >= 2) {
        setClarifyQuestion(llmResult.clarifyingQuestion);
        setClarifyOptions(llmResult.clarifyOptions ?? []);
        setStep('clarify');
        return;
      }
    }

    setStep('confirm');
  }

  async function handleClarifyAnswer(answer: string) {
    setClarifyQuestion('');
    setClarifyOptions([]);
    setDetecting(true);

    const enrichedText = `${freeText}\n[Ek bilgi: ${answer}]`;
    const { primary: regexPrimary, topScore, scoreDiff } = detectCategories(enrichedText, bias);
    const llmResult = await fetchLLMClassification(enrichedText, {
      topCategory: regexPrimary.id,
      topScore,
      scoreDiff,
    });

    setDetecting(false);

    if (llmResult) {
      const cat = CATEGORIES.find(c => c.id === llmResult.categoryId);
      if (cat) {
        setDetectedCat(cat);
        setConfirmedCat(cat);
        setSecondaryCat(null);
        setDualQuestion(undefined);
      }
    }

    setStep('confirm');
  }

  function handleDualChoice(cat: Category) {
    setConfirmedCat(cat);
    setDetectedCat(cat);
    setSecondaryCat(null);
    setForm(f => ({ ...f, subject: extractSubject(freeText), body: freeText }));
    setStep('form');
  }

  function handleToForm() {
    setForm(f => ({ ...f, subject: extractSubject(freeText), body: freeText }));
    setStep('form');
    // Kullanıcı tespiti onayladı → zayıf pozitif öğrenme sinyali
    void fetch(`${API_URL}/api/v1/community/category-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: freeText.slice(0, 300), categoryId: confirmedCat.id }),
    }).catch(() => null);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files) return;
    const toUpload = Array.from(files).slice(0, 3 - attachments.length);
    for (const file of toUpload) {
      const key = `${file.name}-${file.lastModified}`;
      setUploadingFiles(prev => ({ ...prev, [key]: true }));
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_URL}/api/v1/community/upload`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json() as { url: string };
        setAttachments(prev => [...prev, url]);
      } catch {
        // silently ignore
      } finally {
        setUploadingFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.kvkk) return;
    if (!otpVerified) {
      setError('Gönderim için iletişim doğrulaması gereklidir.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const validUrls = attachments.filter(u => u.trim());
      const bodyFinal = extraNote.trim() ? `${form.body}\n\n${extraNote.trim()}` : form.body;
      const res = await fetch(`${API_URL}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(form.name ? { name: form.name } : {}),
          ...(form.email ? { email: form.email } : {}),
          ...(form.phone ? { phone: form.phone } : {}),
          verificationToken: otpToken,
          subject: `[${confirmedCat.label}] ${form.subject}`,
          body: bodyFinal,
          type: confirmedCat.type,
          source: 'sahne',
          urgency: form.urgency,
          ...(validUrls.length ? { attachmentUrls: validUrls } : {}),
        }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız oldu.');
      const data = await res.json() as { id: string; ticketNo: number };
      setTicketNo(data.ticketNo);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep('intro');
    setFreeText('');
    setClarifyQuestion('');
    setClarifyOptions([]);
    setShowCategoryPicker(false);
    setShowExtraDetails(false);
    setExtraNote('');
    setForm({ name: '', email: '', phone: '', subject: '', body: '', urgency: 'normal', kvkk: false });
    setAttachments([]);
    setUploadingFiles({});
    setError('');
    setDetecting(false);
    setTicketNo(0);
    setDetectedCat(CATEGORIES[5]!);
    setConfirmedCat(CATEGORIES[5]!);
    setSecondaryCat(null);
    setDualQuestion(undefined);
    resetOtp();
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 bg-white';

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-talepler" />
      <main className="min-h-screen bg-[#f4f7fa]">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative bg-[#0c1824] overflow-hidden">
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 via-transparent to-[#66aca9]/15 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:pt-16 sm:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-16">

              {/* Sol — Başlık */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-5 bg-[#66aca9]/10 border border-[#66aca9]/20 px-3.5 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" />
                    <path strokeLinecap="round" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
                  </svg>
                  Haritailesi Pusula
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
                  {step === 'success' ? (
                    <>Talebiniz<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">İletildi.</span></>
                  ) : (
                    <>Anlat,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">Doğru Yolu</span><br />Birlikte Bulalım.</>
                  )}
                </h1>

                {step === 'intro' && (
                  <div className="flex items-start gap-3 max-w-lg mb-8 mt-2">
                    <div className="w-0.5 shrink-0 h-full bg-[#66aca9]/40 rounded-full mt-1" style={{ minHeight: '2.5rem' }} />
                    <p className="text-slate-400 text-sm italic leading-relaxed">
                      Bir harita mühendisi, teknikeri, teknisyeni asla tam anlamıyla kaybolmaz.<br />Sadece bazen pusulasına ihtiyaç duyar.
                    </p>
                  </div>
                )}
                {step !== 'intro' && (
                  <p className="text-slate-400 text-base sm:text-lg max-w-md leading-relaxed mb-7">
                    {step === 'clarify' && 'Sizi daha iyi anlayabilmek için bir sorum var.'}
                    {step === 'confirm' && 'Anlattıklarınızı değerlendirdik. Onaylayıp devam edin.'}
                    {step === 'form' && 'Son birkaç bilgiyi ekleyin, talebinizi oluşturalım.'}
                    {step === 'success' && 'Ekibimiz en kısa sürede değerlendirip size dönüş yapacak.'}
                  </p>
                )}

                {step === 'intro' && (
                  <div className="flex gap-3">
                    {[
                      { value: '1.2K+', label: 'İletilen Talep', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
                      { value: '%91', label: 'Çözüme Kavuştu', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                      { value: '2 Gün', label: 'Yanıt Süresi', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                    ].map(s => (
                      <div key={s.value} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center backdrop-blur-sm min-w-[72px]">
                        <p className="text-xl sm:text-2xl font-black tabular-nums text-[#66aca9]">{s.value}</p>
                        <div className="flex items-center justify-center gap-1 mt-1.5 text-slate-500">
                          {s.icon}
                          <span className="text-[10px] font-medium">{s.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Sağ — Kategori önizleme kartı */}
              {step === 'intro' && (
                <div className="shrink-0 lg:w-[460px] xl:w-[500px] mt-[20px] ml-[15px]">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66aca9] opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#66aca9]" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Ne konusunda yardımcı olalım?</span>
                    </div>
                    {(() => {
                      const mainIds = ['is-staj','mesleki-cozum','mentorluk','sektor','egitim','indirim','tanitim','kariyer-danismanligi','kurumsal','mevzuat'];
                      const moreIds = ['teknik','uyelik','oneri'];
                      const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
                      return (
                        <>
                          <div className="p-4 grid grid-cols-2 gap-2">
                            {mainIds.map(id => {
                              const cat = catMap[id]!;
                              return (
                                <div key={id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-600 font-medium">
                                  <span>{cat.icon}</span>
                                  <span className="truncate">{cat.label}</span>
                                </div>
                              );
                            })}
                            </div>
                          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400">+3 Kategori</span>
                            <span className="text-xs font-semibold text-[#26496b]">Haritailesi yapay zekası yön gösterir →</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#f4f7fa]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </section>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div className="px-4 pb-16 pt-6">
          <div className="max-w-2xl mx-auto">

            {rateId && <SatisfactionPanel feedbackId={rateId} />}

          {/* ── Adım 1: Serbest metin ── */}
          {step === 'intro' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Merhaba, nasıl yardımcı olabiliriz?
              </label>
              <textarea
                ref={textareaRef}
                rows={6}
                className={`${inp} resize-none`}
                placeholder="Yaşadığınız sorunu, ihtiyacınızı veya almak istediğiniz desteği kendi cümlelerinizle anlatın…"
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleContinue(); }}
              />
              <div className="flex items-center justify-between mt-1.5">
                {freeText ? (
                  <button type="button" onClick={() => setFreeText('')} className="text-[11px] text-gray-400 hover:text-[#26496b] transition-colors">× Temizle</button>
                ) : <span />}
                <p className="text-[11px] text-gray-400">{freeText.length} / 2000</p>
              </div>

              {/* Örnek başlangıçlar */}
              {!freeText && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    'Bir CAD yazılımında geometrik kontrol yapamıyorum, bunu bana ayrıntılı anlatacak eğitmen bulabilir misiniz?',
                    'Bir CBS yazılımı satın almak istiyorum, indirim sağlayabilir misiniz?',
                    'Kariyerimde yön değiştirmek istiyorum, rehberlik yapabilir misiniz?',
                    'Staj arıyorum, çok az vakit kaldı, yardımcı olur musunuz?',
                  ].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setFreeText(ex)}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-left text-xs text-gray-500 hover:border-[#26496b]/40 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors"
                      title={ex}
                    >
                      <span className="text-gray-300 shrink-0 mt-px">→</span>
                      <span className="line-clamp-2">{ex}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Honeypot — görünmez bot tuzağı, gerçek kullanıcılar görmez/doldurmaz */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }}
              />

              <button
                type="button"
                disabled={!freeText.trim() || detecting}
                onClick={() => void handleContinue()}
                className="mt-5 w-full bg-[#26496b] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-40 text-sm flex items-center justify-center gap-2"
              >
                {detecting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analiz ediliyor…
                  </>
                ) : 'Devam Et →'}
              </button>
            </div>
          )}

          {/* ── Adım 1.5: Netleştirici soru ── */}
          {step === 'clarify' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8">
              <button type="button" onClick={() => setStep('intro')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#26496b] transition-colors mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Düzenle
              </button>
              <div className="mb-6">
                <p className="text-xs text-[#26496b]/50 uppercase font-bold tracking-widest mb-3">Biraz daha anlayalım</p>
                <p className="text-base font-semibold text-gray-800 leading-snug">{clarifyQuestion}</p>
              </div>
              <div className="flex flex-col gap-3">
                {clarifyOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    disabled={detecting}
                    onClick={() => void handleClarifyAnswer(opt)}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#26496b] hover:bg-[#26496b]/5 text-left text-sm font-medium text-gray-700 hover:text-[#26496b] transition-all disabled:opacity-40"
                  >
                    {detecting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analiz ediliyor…
                      </span>
                    ) : opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={detecting}
                onClick={() => setStep('confirm')}
                className="mt-4 text-sm text-gray-400 hover:text-[#26496b] transition-colors w-full text-center py-2 disabled:opacity-40"
              >
                Bu soruyu atla →
              </button>
            </div>
          )}

          {/* ── Adım 2: Akıllı onay ── */}
          {step === 'confirm' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8 space-y-5">
              <button type="button" onClick={() => setStep('intro')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#26496b] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Düzenle
              </button>

              {/* Yazdığı metin özeti */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Anlattıklarınız</p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{freeText}</p>
              </div>

              {/* Akıllı soru — tek veya dual-choice */}
              {secondaryCat ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#26496b] text-center leading-snug">
                    {dualQuestion ?? 'Hangisi daha yakın?'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[detectedCat, secondaryCat].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleDualChoice(cat)}
                        className="p-4 rounded-2xl border-2 border-gray-200 hover:border-[#26496b] hover:bg-[#26496b]/5 text-left transition-all group"
                      >
                        <span className="text-2xl block mb-2">{cat.icon}</span>
                        <p className="font-semibold text-sm text-gray-800 group-hover:text-[#26496b] transition-colors">{cat.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{cat.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSecondaryCat(null); setShowCategoryPicker(true); }}
                    className="w-full text-sm text-center text-gray-400 hover:text-[#26496b] py-1 transition-colors"
                  >
                    Farklı bir konu →
                  </button>
                </div>
              ) : (
                <div className="bg-[#26496b]/5 border border-[#26496b]/15 rounded-2xl px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{detectedCat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-[#26496b] leading-snug">
                        {buildSmartQuestion(freeText, detectedCat)}
                      </p>
                      <p className="text-xs text-[#26496b]/60 mt-1">{detectedCat.label} · {detectedCat.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleToForm}
                      className="flex-1 bg-[#26496b] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1e3a56] transition-colors"
                    >
                      Evet, devam et →
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryPicker(v => !v)}
                      className="text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-[#26496b]/40 hover:text-[#26496b] transition-colors whitespace-nowrap"
                    >
                      {showCategoryPicker ? 'Kapat ↑' : 'Hayır, değiştir ↓'}
                    </button>
                  </div>
                </div>
              )}

              {/* Kategori seçici — "Hayır" tıklanırsa */}
              {showCategoryPicker && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Doğru konuyu seçin</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (cat.id !== detectedCat.id) {
                            void fetch(`${API_URL}/api/v1/community/category-correction`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: freeText.slice(0, 300), detected: detectedCat.id, corrected: cat.id }),
                            }).catch(() => null);
                          }
                          setConfirmedCat(cat);
                          setDetectedCat(cat);
                          setShowCategoryPicker(false);
                        }}
                        className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                          confirmedCat.id === cat.id
                            ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-[#26496b]/30'
                        }`}
                      >
                        <span className="block text-lg mb-1">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ekosistem ipucu */}
              {ECOSYSTEM_HINTS[confirmedCat.id] && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                  <p className="text-[11px] font-bold text-blue-500/70 uppercase tracking-widest mb-2.5">Hemen bakabilirsiniz</p>
                  <div className="flex flex-col gap-1.5">
                    {ECOSYSTEM_HINTS[confirmedCat.id]!.map(hint => (
                      <a key={hint.href} href={hint.href}
                        className="flex items-center gap-3 text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100/60 rounded-lg px-3 py-2 transition-colors group">
                        <span className="text-base flex-shrink-0">{hint.icon}</span>
                        <div className="min-w-0">
                          <span className="font-semibold">{hint.label}</span>
                          <span className="text-xs text-blue-400 ml-1.5 truncate">{hint.desc}</span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-blue-300 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Aciliyet */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Aciliyet</label>
                <select className={inp} value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                  <option value="dusuk">Düşük — acele değil</option>
                  <option value="normal">Normal</option>
                  <option value="yuksek">Yüksek — bu hafta</option>
                  <option value="kritik">Kritik — bugün</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Adım 3: Form ── */}
          {step === 'form' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => setStep('confirm')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="inline-flex items-center gap-2 bg-[#26496b]/10 text-[#26496b] text-sm font-semibold px-3 py-1.5 rounded-lg">
                  <span>{confirmedCat.icon}</span>
                  {confirmedCat.label}
                </span>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

                {/* İletişim bilgileri */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Ad Soyad</label>
                      <input type="text" className={inp} placeholder="Adınız Soyadınız" maxLength={100}
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Telefon</label>
                      <input type="tel" className={inp} placeholder="05xx xxx xx xx" maxLength={20}
                        value={form.phone}
                        onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); if (otpType === 'phone') resetOtp(); }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">E-posta</label>
                    <input type="email" className={inp} placeholder="yanit@email.com"
                      value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (otpType === 'email') resetOtp(); }} />
                  </div>
                </div>

                {/* Doğrulama */}
                <div className={`rounded-xl border p-4 space-y-3 transition-colors ${otpVerified ? 'bg-green-50 border-green-200' : 'bg-[#26496b]/5 border-[#26496b]/15'}`}>
                  {otpVerified ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-xs font-semibold text-green-700">
                        {otpType === 'email' ? 'E-posta' : 'WhatsApp'} doğrulandı:{' '}
                        <span className="font-mono">{otpSentTo}</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-[#26496b]">Sizinle nasıl iletişim kuralım?</p>
                        <div className="flex rounded-lg overflow-hidden border border-[#26496b]/20 flex-shrink-0">
                          <button type="button"
                            onClick={() => { setOtpType('email'); resetOtp(); }}
                            className={`text-xs px-3 py-1.5 font-medium transition-colors ${otpType === 'email' ? 'bg-[#26496b] text-white' : 'bg-white text-[#26496b]/70 hover:bg-[#26496b]/5'}`}>
                            E-posta
                          </button>
                          <button type="button"
                            onClick={() => { setOtpType('phone'); resetOtp(); }}
                            className={`text-xs px-3 py-1.5 font-medium transition-colors ${otpType === 'phone' ? 'bg-[#26496b] text-white' : 'bg-white text-[#26496b]/70 hover:bg-[#26496b]/5'}`}>
                            WhatsApp
                          </button>
                        </div>
                      </div>

                      {!otpSent ? (
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-[#26496b]/60 flex-1">
                            {otpType === 'email'
                              ? (form.email ? `${form.email} adresine doğrulama kodu gönderilecek` : 'Yukarıya e-posta adresinizi girin')
                              : (form.phone ? `${form.phone} numarasına WhatsApp kodu gönderilecek` : 'Yukarıya telefon numaranızı girin')}
                          </p>
                          <button type="button"
                            disabled={!otpContact || otpBusy || otpCooldown > 0}
                            onClick={() => void handleSendOtp()}
                            className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#26496b] text-white hover:bg-[#1e3a56] disabled:opacity-40 transition-colors whitespace-nowrap flex-shrink-0">
                            Kod Gönder
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-[#26496b]/70">
                            {otpType === 'email' ? '📧' : '💬'}{' '}
                            <span className="font-mono font-medium">{otpSentTo}</span> adresine 6 haneli kod gönderildi
                          </p>
                          <div className="flex gap-2">
                            <input type="text" inputMode="numeric" maxLength={6}
                              className={`${inp} flex-1 text-center tracking-[0.3em] font-mono text-lg`}
                              placeholder="000000" value={otpCode}
                              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                              disabled={otpBusy} />
                            <button type="button" disabled={otpCode.length !== 6 || otpBusy}
                              onClick={() => void handleVerifyOtp()}
                              className="text-xs font-semibold px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors whitespace-nowrap flex-shrink-0">
                              Doğrula
                            </button>
                          </div>
                          <button type="button" disabled={otpCooldown > 0 || otpBusy}
                            onClick={() => void handleSendOtp()}
                            className="text-[11px] text-[#26496b]/50 hover:text-[#26496b] disabled:opacity-40 transition-colors">
                            {otpCooldown > 0 ? `Tekrar gönder (${otpCooldown}s)` : 'Tekrar gönder'}
                          </button>
                        </div>
                      )}
                      {otpError && <p className="text-xs text-red-600">{otpError}</p>}
                    </>
                  )}
                </div>

                {/* Daha fazla detay — isteğe bağlı */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowExtraDetails(v => !v)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#26496b] transition-colors w-full py-1"
                  >
                    <svg className={`w-4 h-4 transition-transform ${showExtraDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Daha fazla detay eklemek ister misiniz?
                  </button>

                  {showExtraDetails && (
                    <div className="mt-3 space-y-4 border-t border-gray-100 pt-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Eklemek istediğiniz bir şey var mı? <span className="text-gray-400">(opsiyonel)</span></label>
                        <textarea rows={3} maxLength={500}
                          className={`${inp} resize-none`}
                          placeholder="Ek bilgi, bağlam veya notlarınızı buraya yazabilirsiniz…"
                          value={extraNote}
                          onChange={e => setExtraNote(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">
                          Ek Dosya veya Bağlantı <span className="text-gray-400">(maks. 3)</span>
                        </label>
                        <div className="space-y-2">
                          {attachments.map((url, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600">
                              <span className="text-base flex-shrink-0">📎</span>
                              <span className="flex-1 truncate">{url.split('/').pop() ?? url}</span>
                              <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0">×</button>
                            </div>
                          ))}
                          {Object.keys(uploadingFiles).length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse px-1">
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Yükleniyor…
                            </div>
                          )}
                          {attachments.length < 3 && (
                            <div className="flex gap-2">
                              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                                multiple className="hidden" onChange={e => void handleFileUpload(e.target.files)} />
                              <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-[#26496b]/50 hover:text-[#26496b] transition-colors">
                                📂 Dosya seç
                              </button>
                              <button type="button"
                                onClick={() => { const url = prompt('Bağlantı URL\'si:'); if (url?.trim()) setAttachments(prev => [...prev, url.trim()]); }}
                                className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-[#26496b]/50 hover:text-[#26496b] transition-colors">
                                🔗 URL ekle
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KVKK */}
                <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#26496b] flex-shrink-0"
                    checked={form.kvkk} onChange={e => setForm(f => ({ ...f, kvkk: e.target.checked }))} />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">Kişisel verilerin işlenmesi: </span>
                    Paylaştığım bilgilerin Haritailesi Vakfı tarafından destek talebi kapsamında işlenmesine onay veriyorum.{' '}
                    <span className="text-red-400">*</span>
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>
                )}

                <button type="submit" disabled={busy || !form.kvkk || !otpVerified}
                  className="w-full bg-[#26496b] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm">
                  {busy ? 'Gönderiliyor...' : 'Destek Talebi Oluştur'}
                </button>
              </form>
            </div>
          )}

          {/* ── Adım 4: Başarı ── */}
          {step === 'success' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">Talebiniz İletildi</h2>
              <p className="text-sm text-gray-500 mb-7">
                Haritailesi ekibi talebinizi inceleyerek sizi en uygun destek kanalına yönlendirecek.
              </p>

              <div className="inline-flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#26496b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Talep Numarası</p>
                  <p className="text-xl font-bold text-[#26496b] font-mono tracking-widest">
                    HDM-{new Date().getFullYear()}-{String(ticketNo).padStart(4, '0')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-6">Bu numarayı kaydederek talebinizin durumunu sorabilirsiniz.</p>

              {ECOSYSTEM_HINTS[confirmedCat.id] && (
                <div className="mb-7 text-left">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Bu konuyla ilgili kaynaklar</p>
                  <div className="grid gap-2">
                    {ECOSYSTEM_HINTS[confirmedCat.id]!.map(hint => (
                      <a key={hint.href} href={hint.href}
                        className="flex items-center gap-3 bg-[#26496b]/5 hover:bg-[#26496b]/10 rounded-xl px-4 py-3 transition-colors group">
                        <span className="text-xl flex-shrink-0">{hint.icon}</span>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-[#26496b] leading-tight">{hint.label}</p>
                          <p className="text-xs text-gray-400 truncate">{hint.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-[#26496b]/30 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={reset} className="text-sm font-semibold text-[#26496b] hover:underline">
                Yeni talep gönder
              </button>
            </div>
          )}

          </div>
        </div>
      </main>
    </>
  );
}

export default function GoruslerinizPage() {
  return (
    <Suspense>
      <GoruslerinizInner />
    </Suspense>
  );
}
