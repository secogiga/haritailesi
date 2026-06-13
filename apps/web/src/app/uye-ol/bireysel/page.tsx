'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitApplication } from '@/lib/api';
import { ILLER, UNIVERSITELER } from '@/lib/turkiye';

const schema = z.object({
  // 1. SİZİ TANIYALIM
  tcKimlikNo: z.string().regex(/^\d{11}$/, 'TC kimlik no 11 haneli olmalıdır.'),
  adSoyad: z.string().min(2, 'Ad soyad zorunludur.'),
  eposta: z.string().email('Geçerli bir e-posta girin.'),
  telefon: z.string().min(10, 'Telefon numarası zorunludur.'),
  sehir: z.string().min(2, 'Şehir zorunludur.'),
  dogumTarihi: z.string().min(1, 'Doğum tarihi zorunludur.'),
  kisaTanitim: z.string().max(200, 'En fazla 200 karakter.').optional().or(z.literal('')),
  katilimMotivasyonu: z.string().min(100, 'En az 100 karakter giriniz.').optional().or(z.literal('')),

  // 2. MESLEKİ YÖNELİM
  meslekiYonelim: z.array(z.string()).min(1, 'En az bir alan seçin.'),
  meslekiYonelimAciklama: z.string().optional().or(z.literal('')),

  // 3. KATKI ALANLARI
  katkiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),
  katkiAciklama: z.string().optional().or(z.literal('')),

  // 4. ÇALIŞMA DURUMU
  calismaDurumu: z.enum([
    'calismıyor',
    'kamu',
    'ozel',
    'serbest',
    'kendi_ofis',
    'stk',
  ], { required_error: 'Çalışma durumu zorunludur.' }),
  kurumAdi: z.string().optional().or(z.literal('')),
  unvan: z.string().optional().or(z.literal('')),
  meslekiDeneyim: z.enum(['0-1', '1-3', '3-5', '5-10', '10+']).optional(),

  // 5. EĞİTİM
  enYuksekEgitim: z.enum(['lise', 'onlisans', 'lisans', 'yuksek_lisans', 'doktora']).optional(),
  lisansUniversite: z.string().optional().or(z.literal('')),
  lisansBolum: z.string().optional().or(z.literal('')),
  lisansMezuniyetYili: z.string().optional().or(z.literal('')),
  yuksekLisansUniversite: z.string().optional().or(z.literal('')),
  yuksekLisansBolum: z.string().optional().or(z.literal('')),
  yuksekLisansMezuniyetYili: z.string().optional().or(z.literal('')),
  doktoraUniversite: z.string().optional().or(z.literal('')),
  doktoraBolum: z.string().optional().or(z.literal('')),
  doktoraMezuniyetYili: z.string().optional().or(z.literal('')),

  // 6. İLGİ ALANLARI
  ilgiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),

  // 7. EK DENEYİMLER
  toplulukDeneyimi: z.enum(['hayir', 'evet']),
  toplulukAciklama: z.string().optional().or(z.literal('')),
  arastirmaDeneyimi: z.enum(['hayir', 'evet']),
  arastimaAciklama: z.string().optional().or(z.literal('')),

  // 8. KATILIM
  zamanAyirma: z.enum(['ayda_bir', 'ayda_birkac', 'haftada_1_2'], {
    required_error: 'Zaman taahhüdü zorunludur.',
  }),

  // 9. TANIŞMA
  tanismaKanali: z.array(z.string()).min(1, 'En az bir seçenek işaretleyin.'),

  // 10. REFERANS
  referans: z.string().optional().or(z.literal('')),

  // 11. ONAYLAR
  kvkk: z.boolean().refine((v) => v === true, 'KVKK onayı zorunludur.'),
  iletisimOnay: z.boolean().refine((v) => v === true, 'İletişim onayı zorunludur.'),
}).superRefine((data, ctx) => {
  if (!data.meslekiDeneyim) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['meslekiDeneyim'], message: 'Mesleki deneyim zorunludur.' });
  }
  if (data.enYuksekEgitim) {
    if (!data.lisansMezuniyetYili?.trim()) {
      const label = data.enYuksekEgitim === 'onlisans' ? 'Ön lisans' : 'Lisans';
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lisansMezuniyetYili'], message: `${label} mezuniyet yılı zorunludur.` });
    }
  }
});

type FormValues = z.infer<typeof schema>;

const MESLEKI_YONELIM = [
  { value: 'klasik_haritacilik', label: 'Klasik Haritacılık' },
  { value: 'insaat', label: 'İnşaat' },
  { value: 'cbs', label: 'CBS' },
  { value: 'gayrimenkul', label: 'Gayrimenkul Değerleme' },
  { value: 'fotogrametri', label: 'Fotogrametri & Uzaktan Algılama' },
  { value: 'diger', label: 'Diğer' },
];

const KATKI_ALANLARI = [
  { value: 'icerik', label: 'İçerik Üretimi (Mesleki Haber, Sosyal Medya İçerikleri, Video İçerik, Blog Yazısı, Araştırma-Analiz Yazısı, Köşe Yazısı vb.)' },
  { value: 'egitim', label: 'Eğitim / workshop vermek' },
  { value: 'mentorluk', label: 'Mentörlük yapmak' },
  { value: 'proje', label: 'Proje geliştirmek' },
  { value: 'etkinlik', label: 'Etkinlik düzenlemek' },
  { value: 'atolye', label: 'Atölye çalışması düzenlemek' },
  { value: 'moderatorluk', label: 'Moderatörlük Yapmak (Etkinlikte, Webinarda, Panellerde, Yayınlarda)' },
];

const ILGI_ALANLARI = [
  { value: 'topluluk', label: 'Topluluk ve networking' },
  { value: 'icerik', label: 'İçerik üretimi' },
  { value: 'egitimler', label: 'Eğitimler' },
  { value: 'mentorluk', label: 'Mentörlük' },
  { value: 'proje', label: 'Proje geliştirme' },
  { value: 'kariyer', label: 'Kariyer fırsatları' },
  { value: 'gorunurluk', label: 'Mesleki görünürlük' },
  { value: 'gonullu', label: 'Gönüllü katkı' },
];

const TANISMA_KANALLARI = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'haberita', label: 'Haberita' },
  { value: 'etkinlik', label: 'Etkinlik' },
  { value: 'referans', label: 'Referans' },
  { value: 'google', label: 'Google' },
  { value: 'diger', label: 'Diğer' },
];

const KAMU_KURUMLARI = [
  'Adalet Bakanlığı',
  'Afet ve Acil Durum Yönetimi Başkanlığı',
  'Aile ve Sosyal Hizmetler Bakanlığı',
  'Anayasa Mahkemesi',
  'Atatürk Araştırma Merkezi',
  'Atatürk Kültür Merkezi',
  'Atatürk Kültür, Dil ve Tarih Yüksek Kurumu',
  'Avrupa Birliği Başkanlığı',
  'Ceza ve İnfaz Kurumları ile Tutukevleri İşyurtları Kurumu',
  'Cumhurbaşkanlığı',
  'Çalışma ve Sosyal Güvenlik Bakanlığı',
  'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı',
  'Danıştay',
  'Devlet Arşivleri Başkanlığı',
  'Devlet Opera ve Balesi Genel Müdürlüğü',
  'Devlet Su İşleri Genel Müdürlüğü',
  'Devlet Tiyatroları Genel Müdürlüğü',
  'Dışişleri Bakanlığı',
  'Diyanet İşleri Başkanlığı',
  'Doğa Koruma ve Milli Parklar Genel Müdürlüğü',
  'Doğu Anadolu Projesi Bölge Kalkınma İdaresi Başkanlığı',
  'Doğu Karadeniz Projesi Bölge Kalkınma İdaresi Başkanlığı',
  'Emniyet Genel Müdürlüğü',
  'Enerji ve Tabii Kaynaklar Bakanlığı',
  'GAP Bölge Kalkınma İdaresi',
  'Gelir İdaresi Başkanlığı',
  'Gençlik ve Spor Bakanlığı',
  'Göç İdaresi Başkanlığı',
  'Hakimler ve Savcılar Kurulu',
  'Hazine ve Maliye Bakanlığı',
  'Helal Akreditasyon Kurumu',
  'İçişleri Bakanlığı',
  'İklim Değişikliği Başkanlığı',
  'İletişim Başkanlığı',
  'Jandarma Genel Komutanlığı',
  'Kamu Denetçiliği Kurumu',
  'Kapadokya Alan Başkanlığı',
  'Karayolları Genel Müdürlüğü',
  'Kentsel Dönüşüm Başkanlığı',
  'Konya Ovası Projesi Bölge Kalkınma İdaresi Başkanlığı',
  'Küçük ve Orta Ölçekli İşletmeleri Geliştirme ve Destekleme İdaresi Başkanlığı',
  'Kültür ve Turizm Bakanlığı',
  'Maden Tetkik ve Arama Genel Müdürlüğü (MTA)',
  'Maden ve Petrol İşleri Genel Müdürlüğü (MAPEG)',
  'Mesleki Yeterlilik Kurumu',
  'Meteoroloji Genel Müdürlüğü',
  'Milli Eğitim Bakanlığı',
  'Milli Saraylar İdaresi Başkanlığı',
  'Orman Genel Müdürlüğü',
  'Ölçme, Seçme ve Yerleştirme Merkezi Başkanlığı',
  'Özelleştirme İdaresi Başkanlığı',
  'Sağlık Bakanlığı',
  'Sahil Güvenlik Komutanlığı',
  'Sanayi ve Teknoloji Bakanlığı',
  'Savunma Sanayi Başkanlığı',
  'Sayıştay',
  'Siber Güvenlik Başkanlığı',
  'Sivil Havacılık Genel Müdürlüğü',
  'Sosyal Güvenlik Kurumu',
  'Strateji ve Bütçe Başkanlığı',
  'Tapu ve Kadastro Genel Müdürlüğü',
  'Tarım ve Orman Bakanlığı',
  'Ticaret Bakanlığı',
  'Türk Akreditasyon Kurumu',
  'Türk Dil Kurumu',
  'Türk İşbirliği ve Koordinasyon Ajansı Başkanlığı',
  'Türk Patent ve Marka Kurumu',
  'Türk Standartları Enstitüsü',
  'Türk Tarih Kurumu',
  'Türkiye Adalet Akademisi',
  'Türkiye Bilimler Akademisi',
  'Türkiye Bilimsel ve Teknolojik Araştırma Kurumu',
  'Türkiye Büyük Millet Meclisi',
  'Türkiye Enerji, Nükleer ve Maden Araştırma Kurumu (TENMAK)',
  'Türkiye Hudut ve Sahiller Sağlık Genel Müdürlüğü',
  'Türkiye İlaç ve Tıbbi Cihaz Kurumu',
  'Türkiye İnsan Hakları ve Eşitlik Kurumu',
  'Türkiye İstatistik Kurumu',
  'Türkiye İş Kurumu Genel Müdürlüğü',
  'Türkiye Sağlık Enstitüleri Başkanlığı',
  'Türkiye Su Enstitüsü',
  'Türkiye Uzay Ajansı',
  'Türkiye Yazma Eserler Kurumu Başkanlığı',
  'Ulaştırma ve Altyapı Bakanlığı',
  'Uludağ Alan Başkanlığı',
  'Vakıflar Genel Müdürlüğü',
  'Yargıtay',
  'Yurtdışı Türkler ve Akraba Topluluklar Başkanlığı',
  'Yükseköğretim Kalite Kurulu',
  'Yükseköğretim Kurulu',
];

function formatTelefon(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

const BOLUMLER = [
  'Geomatik Mühendisliği',
  'Harita Mühendisliği',
  'Jeodezi ve Fotogrametri Mühendisliği',
  'Harita ve Kadastro',
  'Tapu ve Kadastro',
];

const BOLUM_LISE = ['Harita Tapu Kadastro'];
const BOLUM_ONLISANS = ['Harita Kadastro', 'Tapu Kadastro'];
const BOLUM_LISANS_3 = ['Geomatik Mühendisliği', 'Harita Mühendisliği', 'Jeodezi ve Fotogrametri Mühendisliği'];
const BOLUM_YL_DOKTORA = [
  'Acil Yardım ve Afet Yönetimi (Fakülte)', 'Acil Yardım ve Afet Yönetimi (Yüksekokul)', 'Adli Bilimler', 'Adli Bilişim Mühendisliği',
  'Ağaç İşleri Endüstri Mühendisliği', 'Aile ve Tüketici Bilimleri', 'Aktüerya Bilimleri (Fakülte)', 'Antropoloji',
  'Arkeoloji', 'Arkeoloji ve Sanat Tarihi', 'Astronomi ve Uzay Bilimleri', 'Bahçe Bitkileri',
  'Balıkçılık Teknolojisi Mühendisliği', 'Bankacılık', 'Bankacılık ve Finans', 'Bankacılık ve Sigortacılık (Fakülte)',
  'Bilgi Güvenliği Teknolojisi (Fakülte)', 'Bilgi ve Belge Yönetimi', 'Bilgisayar Bilimleri', 'Bilgisayar Mühendisliği',
  'Bilgisayar Teknolojisi ve Bilişim Sistemleri', 'Bilişim Sistemleri Mühendisliği', 'Bilişim Sistemleri ve Teknolojileri (Fakülte)', 'Bitki Koruma',
  'Biyokimya', 'Biyoloji', 'Biyomedikal Mühendisliği', 'Biyomühendislik',
  'Biyosistem Mühendisliği', 'Biyoteknoloji', 'Çalışma Ekonomisi ve Endüstri İlişkileri', 'Cevher Hazırlama Mühendisliği',
  'Çevre Mühendisliği', 'Coğrafya', 'Coğrafya Öğretmenliği', 'Deniz Ulaştırma İşletme Mühendisliği (Fakülte)',
  'Denizcilik İşletmeleri Yönetimi', 'Deri Mühendisliği', 'Dilbilimi', 'Diş Hekimliği',
  'Eczacılık', 'Ekonometri', 'Ekonomi', 'Ekonomi ve Finans',
  'Elektrik Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Elektronik Mühendisliği', 'Elektronik ve Haberleşme Mühendisliği',
  'Emlak ve Emlak Yönetimi', 'Endüstri Mühendisliği', 'Endüstriyel Tasarım Mühendisliği', 'Endüstriyel Tasarım (Fakülte)',
  'Enerji Bilimi ve Teknolojileri', 'Enerji Sistemleri Mühendisliği', 'Fen Bilgisi Öğretmenliği', 'Finans ve Bankacılık (Fakülte)',
  'Fizik', 'Fizik Mühendisliği', 'Gayrimenkul Geliştirme ve Yönetimi (Fakülte)', 'Gazetecilik',
  'Gemi İnşaatı ve Gemi Makineleri Mühendisliği', 'Genetik ve Biyomühendislik', 'Geomatik Mühendisliği', 'Gıda Mühendisliği',
  'Girişimcilik', 'Görsel İletişim Tasarımı', 'Grafik Tasarımı', 'Harita Mühendisliği',
  'Havacılık ve Uzay Mühendisliği', 'Hidrojeoloji Mühendisliği', 'Hukuk', 'İç Mimarlık',
  'İç Mimarlık ve Çevre Tasarımı', 'İktisat', 'İlahiyat', 'İletişim',
  'İletişim Bilimleri', 'İmalat Mühendisliği', 'İnşaat Mühendisliği', 'İnsan Kaynakları Yönetimi (Fakülte)',
  'İşletme', 'İşletme Mühendisliği', 'İstatistik', 'Jeofizik Mühendisliği',
  'Jeoloji Mühendisliği', 'Kamu Yönetimi', 'Kentsel Tasarım ve Peyzaj Mimarlığı', 'Kimya',
  'Kimya Mühendisliği', 'Kontrol ve Otomasyon Mühendisliği', 'Lojistik Yönetimi (Fakülte)', 'Maden Mühendisliği',
  'Makine Mühendisliği', 'Maliye', 'Malzeme Bilimi ve Mühendisliği', 'Matematik',
  'Matematik Mühendisliği', 'Mekatronik Mühendisliği', 'Metalurji ve Malzeme Mühendisliği', 'Meteoroloji Mühendisliği',
  'Mimarlık', 'Moleküler Biyoloji ve Genetik', 'Nanoteknoloji Mühendisliği', 'Nükleer Enerji Mühendisliği',
  'Optik ve Akustik Mühendisliği', 'Orman Endüstrisi Mühendisliği', 'Orman Mühendisliği', 'Otomotiv Mühendisliği',
  'Pazarlama (Fakülte)', 'Petrol ve Doğalgaz Mühendisliği', 'Peyzaj Mimarlığı', 'Polimer Malzeme Mühendisliği',
  'Psikoloji', 'Raylı Sistemler Mühendisliği', 'Sağlık Yönetimi (Fakülte)', 'Sanat Tarihi',
  'Şehir ve Bölge Planlama', 'Sigortacılık ve Aktüerya Bilimleri', 'Siyaset Bilimi', 'Siyaset Bilimi ve Kamu Yönetimi',
  'Siyaset Bilimi ve Uluslararası İlişkiler', 'Sosyal Hizmet (Fakülte)', 'Sosyoloji', 'Su Bilimleri ve Mühendisliği',
  'Su Ürünleri Mühendisliği', 'Tapu Kadastro', 'Tarih', 'Tarım Ekonomisi',
  'Tarım Makineleri ve Teknolojileri Mühendisliği', 'Tarımsal Biyoteknoloji', 'Tarımsal Genetik Mühendisliği', 'Teknoloji ve Bilgi Yönetimi',
  'Tekstil Mühendisliği', 'Tıp', 'Tıp Mühendisliği', 'Toprak Bilimi ve Bitki Besleme',
  'Turizm İşletmeciliği (Fakülte)', 'Türk Dili ve Edebiyatı', 'Uçak Mühendisliği', 'Uluslararası Finans',
  'Uluslararası İlişkiler', 'Uluslararası Ticaret ve Finans', 'Uluslararası Ticaret ve Lojistik (Fakülte)', 'Uzay Bilimleri ve Teknolojileri',
  'Uzay Mühendisliği', 'Veterinerlik', 'Yaban Hayatı Ekolojisi ve Yönetimi', 'Yapay Zeka Mühendisliği',
  'Yapay Zeka ve Veri Mühendisliği', 'Yazılım Mühendisliği', 'Yeni Medya ve İletişim', 'Yerel Yönetimler',
  'Yönetim Bilişim Sistemleri (Fakülte)', 'Ziraat Mühendisliği Programları', 'Zootekni',
];

function EgitimBlok({
  label, required, isLise,
  uniProps, bolumProps, yilProps, yilError,
  universiteler, bolumler,
  inp, lbl, fieldErr,
}: {
  label: string;
  required: boolean;
  isLise?: boolean | undefined;
  uniProps: UseFormRegisterReturn;
  bolumProps: UseFormRegisterReturn;
  yilProps: UseFormRegisterReturn;
  yilError?: string | undefined;
  universiteler: string[];
  bolumler: string[];
  inp: string;
  lbl: string;
  fieldErr: string;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {label}{required ? ' *' : ' (opsiyonel)'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>{isLise ? 'Okul Adı' : 'Üniversite'}</label>
          {isLise ? (
            <input {...uniProps} type="text" placeholder="Meslek lisesi adı" className={inp} />
          ) : (
            <select {...uniProps} className={inp}>
              <option value="">Seçin…</option>
              {universiteler.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className={lbl}>Bölüm / Alan</label>
          <select {...bolumProps} className={inp}>
            <option value="">Seçin…</option>
            {bolumler.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Mezuniyet Yılı{required ? ' *' : ''}</label>
          <input {...yilProps} type="text" placeholder="örn: 2022" className={inp} />
          {yilError && <p className={fieldErr}>{yilError}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BireyselBasvuruPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meslekiYonelim: [],
      katkiAlanlari: [],
      ilgiAlanlari: [],
      tanismaKanali: [],
    },
  });

  const meslekiYonelim = watch('meslekiYonelim');
  const katkiAlanlari = watch('katkiAlanlari');
  const ilgiAlanlari = watch('ilgiAlanlari');
  const tanismaKanali = watch('tanismaKanali');
  const kisaTanitim = watch('kisaTanitim') ?? '';
  const katilimMotivasyonu = watch('katilimMotivasyonu') ?? '';
  const calismaDurumu = watch('calismaDurumu');
  const epostaValue = watch('eposta') ?? '';
  const enYuksekEgitim = watch('enYuksekEgitim');

  const kurumAdiValue = watch('kurumAdi') ?? '';
  const [kamuKurumDiger, setKamuKurumDiger] = useState(false);

  useEffect(() => {
    if (calismaDurumu !== 'kamu') setKamuKurumDiger(false);
  }, [calismaDurumu]);

  // Lise autocomplete
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [liseler, setLiseler] = useState<string[]>([]);
  const [liseQuery, setLiseQuery] = useState('');
  const [liseOpen, setLiseOpen] = useState(false);
  const liseRef = useRef<HTMLDivElement>(null);
  const filteredLiseler = liseQuery.length >= 2
    ? liseler.filter(l => l.toLocaleLowerCase('tr').includes(liseQuery.toLocaleLowerCase('tr'))).slice(0, 10)
    : [];

  const kurumLabel =
    calismaDurumu === 'kamu' ? 'Kurum / Kuruluş Adı' :
    calismaDurumu === 'ozel' ? 'Şirket / SHKM / LİHKAB Adı' :
    calismaDurumu === 'serbest' ? 'SHKM Adı' :
    calismaDurumu === 'kendi_ofis' ? 'Şirket Adı' :
    calismaDurumu === 'stk' ? 'STK Adı' : null;
  const showKurum   = kurumLabel !== null;
  const showUnvan   = calismaDurumu === 'stk';
  const showDeneyim = !!calismaDurumu;

  useEffect(() => {
    if (enYuksekEgitim === 'lise' && liseler.length === 0) {
      fetch('/data/liseler.json').then(r => r.json()).then(setLiseler).catch(() => {});
    }
  }, [enYuksekEgitim, liseler.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (liseRef.current && !liseRef.current.contains(e.target as Node)) {
        setLiseOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const emailSuggestions = !epostaValue.includes('@') && epostaValue.length > 0
    ? ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'].map((d) => epostaValue + d)
    : [];

  function toggleArray(
    field: 'meslekiYonelim' | 'katkiAlanlari' | 'ilgiAlanlari' | 'tanismaKanali',
    value: string,
    current: string[],
  ) {
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, updated, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    if (honeypot || Date.now() - loadTime < 2000) return;
    try {
      const { kvkk, iletisimOnay, eposta, ...rest } = values;
      await submitApplication({
        type: 'individual',
        applicantEmail: eposta,
        formData: { eposta, kvkk, iletisimOnay, ...rest },
      });
      router.push('/uye-ol/tesekkurler?tip=bireysel');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)] focus:border-[var(--color-mavi)]';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const fieldErr = 'mt-1 text-xs text-red-600';
  const sectionTitle = 'text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100';
  const radioRow = 'flex items-center gap-2.5 cursor-pointer';
  const checkRow = 'flex items-start gap-2.5 cursor-pointer';

  return (
    <main className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-mavi)]">Bireysel Üyelik Başvurusu</h1>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            Mesleğin Değer Ortakları; meslek profesyonellerinden oluşan bireysel üyelik modelimizdir.<br />
            Bu yapı; mesleğimizin gelişimine bilgi, deneyim, fikir ve emek katkısı sunmayı sahiplenen meslektaşlardan oluşur.<br />
            Bu form, bu sürecin ilk adımıdır. Başvurunuz 2–3 dakika içinde tamamlanır.
          </p>
        </div>

        {submitError && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="mt-0.5 w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          {/* Honeypot — bot tuzağı */}
          <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }} />

          {/* 1. SİZİ TANIYALIM */}
          <section>
            <h2 className={sectionTitle}>1. Sizi Tanıyalım</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>TC Kimlik No *</label>
                <input {...register('tcKimlikNo')} type="text" inputMode="numeric" maxLength={11} placeholder="___________" className={inp} />
                {errors.tcKimlikNo && <p className={fieldErr}>{errors.tcKimlikNo.message}</p>}
              </div>
              <div>
                <label className={lbl}>Ad Soyad *</label>
                <input {...register('adSoyad')} type="text" className={inp} />
                {errors.adSoyad && <p className={fieldErr}>{errors.adSoyad.message}</p>}
              </div>
              <div>
                <label className={lbl}>E-posta *</label>
                <input {...register('eposta')} type="email" list="eposta-list" autoComplete="email" className={inp} />
                <datalist id="eposta-list">
                  {emailSuggestions.map((s) => <option key={s} value={s} />)}
                </datalist>
                {errors.eposta && <p className={fieldErr}>{errors.eposta.message}</p>}
              </div>
              <div>
                <label className={lbl}>Telefon *</label>
                <input
                  {...register('telefon')}
                  type="tel"
                  placeholder="(5__) ___ __ __"
                  onChange={(e) => setValue('telefon', formatTelefon(e.target.value), { shouldValidate: true })}
                  className={inp}
                />
                {errors.telefon && <p className={fieldErr}>{errors.telefon.message}</p>}
              </div>
              <div>
                <label className={lbl}>Şehir *</label>
                <select {...register('sehir')} className={inp}>
                  <option value="">Seçin…</option>
                  {ILLER.map((il) => <option key={il} value={il}>{il}</option>)}
                </select>
                {errors.sehir && <p className={fieldErr}>{errors.sehir.message}</p>}
              </div>
              <div>
                <label className={lbl}>Doğum Tarihi *</label>
                <input {...register('dogumTarihi')} type="date" className={inp} />
                {errors.dogumTarihi && <p className={fieldErr}>{errors.dogumTarihi.message}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>
                Kısa Tanıtım <span className="text-gray-400 font-normal">(opsiyonel — maks. 200 karakter)</span>
              </label>
              <textarea {...register('kisaTanitim')} rows={2} maxLength={200} className={inp} />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{kisaTanitim.length}/200</p>
            </div>
            <div className="mt-4">
              <label className={lbl}>
                Katılım Motivasyonu <span className="text-gray-400 font-normal">(opsiyonel — en az 100 karakter)</span>
              </label>
              <textarea {...register('katilimMotivasyonu')} rows={3} className={inp} />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{katilimMotivasyonu.length} karakter</p>
              {errors.katilimMotivasyonu && <p className={fieldErr}>{errors.katilimMotivasyonu.message}</p>}
            </div>
          </section>

          {/* 2. MESLEKİ YÖNELİM */}
          <section>
            <h2 className={sectionTitle}>2. Mesleki Yönelim</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MESLEKI_YONELIM.map((alan) => (
                <label key={alan.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={meslekiYonelim.includes(alan.value)}
                    onChange={() => toggleArray('meslekiYonelim', alan.value, meslekiYonelim)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
                  />
                  <span className="text-sm text-gray-700">{alan.label}</span>
                </label>
              ))}
            </div>
            {errors.meslekiYonelim && <p className={fieldErr}>{errors.meslekiYonelim.message}</p>}
            <div className="mt-3">
              <label className={lbl}>Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <textarea {...register('meslekiYonelimAciklama')} rows={2} className={inp} />
            </div>
          </section>

          {/* 3. KATKI ALANLARI */}
          <section>
            <h2 className={sectionTitle}>3. Katkı Alanları</h2>
            <p className="text-sm text-gray-500 mb-3">Nasıl katkı sağlamak istersin? (çoklu seçim)</p>
            <div className="space-y-2">
              {KATKI_ALANLARI.map((alan) => (
                <label key={alan.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={katkiAlanlari.includes(alan.value)}
                    onChange={() => toggleArray('katkiAlanlari', alan.value, katkiAlanlari)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
                  />
                  <span className="text-sm text-gray-700">{alan.label}</span>
                </label>
              ))}
            </div>
            {errors.katkiAlanlari && <p className={fieldErr}>{errors.katkiAlanlari.message}</p>}
            <div className="mt-3">
              <label className={lbl}>Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <textarea {...register('katkiAciklama')} rows={2} className={inp} />
            </div>
          </section>

          {/* 4. ÇALIŞMA DURUMU */}
          <section>
            <h2 className={sectionTitle}>4. Çalışma Durumu</h2>
            <div className="space-y-2">
              {[
                { value: 'calismıyor', label: 'Şu an çalışmıyorum' },
                { value: 'kamu', label: 'Kamu sektöründe çalışıyorum' },
                { value: 'ozel', label: 'Özel sektörde çalışıyorum' },
                { value: 'serbest', label: 'Serbest mühendis olarak çalışıyorum' },
                { value: 'kendi_ofis', label: 'Kendi ofisim / şirketim var' },
                { value: 'stk', label: "STK'da çalışıyorum" },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input {...register('calismaDurumu')} type="radio" value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.calismaDurumu && <p className={fieldErr}>{errors.calismaDurumu.message}</p>}

            {showKurum && (
              <div className={`grid grid-cols-1 ${showUnvan ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 mt-4`}>
                <div>
                  <label className={lbl}>{kurumLabel}</label>
                  {calismaDurumu === 'kamu' ? (
                    <>
                      <select
                        value={kamuKurumDiger ? 'diger' : kurumAdiValue}
                        onChange={(e) => {
                          if (e.target.value === 'diger') {
                            setKamuKurumDiger(true);
                            setValue('kurumAdi', '', { shouldValidate: false });
                          } else {
                            setKamuKurumDiger(false);
                            setValue('kurumAdi', e.target.value, { shouldValidate: true });
                          }
                        }}
                        className={inp}
                      >
                        <option value="">Seçin…</option>
                        {KAMU_KURUMLARI.map((k) => <option key={k} value={k}>{k}</option>)}
                        <option value="diger">Diğer</option>
                      </select>
                      {kamuKurumDiger && (
                        <input
                          {...register('kurumAdi')}
                          type="text"
                          placeholder="Kurum / kuruluş adını girin"
                          className={`${inp} mt-2`}
                        />
                      )}
                    </>
                  ) : (
                    <input {...register('kurumAdi')} type="text" className={inp} />
                  )}
                </div>
                {showUnvan && (
                  <div>
                    <label className={lbl}>Ünvan</label>
                    <input {...register('unvan')} type="text" className={inp} />
                  </div>
                )}
              </div>
            )}

            {showDeneyim && (
              <div className="mt-4">
                <label className={lbl}>Mesleki Deneyim *</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {[
                    { value: '0-1', label: '0–1 yıl' },
                    { value: '1-3', label: '1–3 yıl' },
                    { value: '3-5', label: '3–5 yıl' },
                    { value: '5-10', label: '5–10 yıl' },
                    { value: '10+', label: '10+ yıl' },
                  ].map((opt) => (
                    <label key={opt.value} className={radioRow}>
                      <input {...register('meslekiDeneyim')} type="radio" value={opt.value}
                        className="border-gray-300 accent-[var(--color-mavi)]" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {errors.meslekiDeneyim && <p className={fieldErr}>{errors.meslekiDeneyim.message}</p>}
              </div>
            )}
          </section>

          {/* 5. EĞİTİM */}
          <section>
            <h2 className={sectionTitle}>5. Eğitim</h2>
            <div className="mb-4">
              <label className={lbl}>En Yüksek Tamamlanan Eğitim Seviyesi</label>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                {[
                  { value: 'lise', label: 'Lise' },
                  { value: 'onlisans', label: 'Ön Lisans' },
                  { value: 'lisans', label: 'Lisans' },
                  { value: 'yuksek_lisans', label: 'Yüksek Lisans' },
                  { value: 'doktora', label: 'Doktora' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input {...register('enYuksekEgitim')} type="radio" value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Eğitim detay blokları — seçilen seviyeye göre dinamik */}
            {enYuksekEgitim && (
              <div className="space-y-5 mt-2">
                {/* LİSE — autocomplete */}
                {enYuksekEgitim === 'lise' && (
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Lise *</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Okul Adı</label>
                        <div ref={liseRef} className="relative">
                          <input
                            type="text"
                            value={liseQuery}
                            onChange={(e) => {
                              setLiseQuery(e.target.value);
                              setValue('lisansUniversite', e.target.value, { shouldValidate: false });
                              setLiseOpen(true);
                            }}
                            onFocus={() => setLiseOpen(true)}
                            placeholder="Lise adı arayın…"
                            autoComplete="off"
                            className={inp}
                          />
                          {liseOpen && filteredLiseler.length > 0 && (
                            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
                              {filteredLiseler.map((l) => (
                                <li
                                  key={l}
                                  onMouseDown={() => {
                                    setLiseQuery(l);
                                    setValue('lisansUniversite', l, { shouldValidate: true });
                                    setLiseOpen(false);
                                  }}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                                >
                                  {l}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Bölüm/Alan</label>
                        <select {...register('lisansBolum')} className={inp}>
                          <option value="">Seçin…</option>
                          {BOLUM_LISE.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Mezuniyet Yılı *</label>
                        <input {...register('lisansMezuniyetYili')} type="text" placeholder="örn: 2022" className={inp} />
                        {errors.lisansMezuniyetYili && <p className={fieldErr}>{errors.lisansMezuniyetYili.message}</p>}
                      </div>
                    </div>
                  </div>
                )}
                {/* ÖN LİSANS */}
                {enYuksekEgitim === 'onlisans' && (
                  <EgitimBlok
                    label="Ön Lisans" required
                    uniProps={register('lisansUniversite')}
                    bolumProps={register('lisansBolum')}
                    yilProps={register('lisansMezuniyetYili')}
                    yilError={errors.lisansMezuniyetYili?.message}
                    universiteler={UNIVERSITELER}
                    bolumler={BOLUM_ONLISANS}
                    inp={inp} lbl={lbl} fieldErr={fieldErr}
                  />
                )}
                {/* LİSANS — bölüm listesi öğrenci/mezun durumuna göre değişir */}
                {enYuksekEgitim === 'lisans' && (
                  <EgitimBlok
                    label="Lisans" required
                    uniProps={register('lisansUniversite')}
                    bolumProps={register('lisansBolum')}
                    yilProps={register('lisansMezuniyetYili')}
                    yilError={errors.lisansMezuniyetYili?.message}
                    universiteler={UNIVERSITELER}
                    bolumler={BOLUM_LISANS_3}
                    inp={inp} lbl={lbl} fieldErr={fieldErr}
                  />
                )}
                {/* YÜKSEK LİSANS veya DOKTORA — önce Lisans bloğu zorunlu */}
                {(enYuksekEgitim === 'yuksek_lisans' || enYuksekEgitim === 'doktora') && (
                  <EgitimBlok
                    label="Lisans" required
                    uniProps={register('lisansUniversite')}
                    bolumProps={register('lisansBolum')}
                    yilProps={register('lisansMezuniyetYili')}
                    yilError={errors.lisansMezuniyetYili?.message}
                    universiteler={UNIVERSITELER}
                    bolumler={BOLUM_LISANS_3}
                    inp={inp} lbl={lbl} fieldErr={fieldErr}
                  />
                )}
                {(enYuksekEgitim === 'yuksek_lisans' || enYuksekEgitim === 'doktora') && (
                  <EgitimBlok
                    label="Yüksek Lisans" required={false}
                    uniProps={register('yuksekLisansUniversite')}
                    bolumProps={register('yuksekLisansBolum')}
                    yilProps={register('yuksekLisansMezuniyetYili')}
                    universiteler={UNIVERSITELER}
                    bolumler={BOLUM_YL_DOKTORA}
                    inp={inp} lbl={lbl} fieldErr={fieldErr}
                  />
                )}
                {enYuksekEgitim === 'doktora' && (
                  <EgitimBlok
                    label="Doktora" required={false}
                    uniProps={register('doktoraUniversite')}
                    bolumProps={register('doktoraBolum')}
                    yilProps={register('doktoraMezuniyetYili')}
                    universiteler={UNIVERSITELER}
                    bolumler={BOLUM_YL_DOKTORA}
                    inp={inp} lbl={lbl} fieldErr={fieldErr}
                  />
                )}
              </div>
            )}
          </section>

          {/* 6. İLGİ ALANLARI */}
          <section>
            <h2 className={sectionTitle}>6. İlgi Alanları</h2>
            <p className="text-sm text-gray-500 mb-3">Haritailesi&apos;nde en çok hangi alanlarla ilgileniyorsunuz?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ILGI_ALANLARI.map((alan) => (
                <label key={alan.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={ilgiAlanlari.includes(alan.value)}
                    onChange={() => toggleArray('ilgiAlanlari', alan.value, ilgiAlanlari)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
                  />
                  <span className="text-sm text-gray-700">{alan.label}</span>
                </label>
              ))}
            </div>
            {errors.ilgiAlanlari && <p className={fieldErr}>{errors.ilgiAlanlari.message}</p>}
          </section>

          {/* 7. EK DENEYİMLER */}
          <section>
            <h2 className={sectionTitle}>7. Ek Deneyimler</h2>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Daha önce bir gönüllülük faaliyetinde yer aldınız mı? (Öğrenci kulübü, topluluk, STK vb.)</p>
                <div className="flex gap-6">
                  {[{ value: 'hayir', label: 'Hayır' }, { value: 'evet', label: 'Evet' }].map((opt) => (
                    <label key={opt.value} className={radioRow}>
                      <input {...register('toplulukDeneyimi')} type="radio" value={opt.value}
                        className="border-gray-300 accent-[var(--color-mavi)]" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {errors.toplulukDeneyimi && <p className={fieldErr}>{errors.toplulukDeneyimi.message}</p>}
                <div className="mt-2">
                  <label className={lbl}>Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                  <textarea {...register('toplulukAciklama')} rows={2} className={inp} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Daha önce bir araştırma veya projede yer aldınız mı?</p>
                <div className="flex gap-6">
                  {[
                    { value: 'hayir', label: 'Hayır' },
                    { value: 'evet', label: 'Evet (TÜBİTAK, AR-GE vb.)' },
                  ].map((opt) => (
                    <label key={opt.value} className={radioRow}>
                      <input {...register('arastirmaDeneyimi')} type="radio" value={opt.value}
                        className="border-gray-300 accent-[var(--color-mavi)]" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {errors.arastirmaDeneyimi && <p className={fieldErr}>{errors.arastirmaDeneyimi.message}</p>}
                <div className="mt-2">
                  <label className={lbl}>Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                  <textarea {...register('arastimaAciklama')} rows={2} className={inp} />
                </div>
              </div>
            </div>
          </section>

          {/* 8. KATILIM */}
          <section>
            <h2 className={sectionTitle}>8. Katılım</h2>
            <p className="text-sm font-medium text-gray-700 mb-2">Haritailesi&apos;nde aktif olarak ne kadar zaman ayırmayı düşünüyorsunuz? *</p>
            <div className="space-y-2">
              {[
                { value: 'ayda_bir', label: 'Ayda bir saat' },
                { value: 'ayda_birkac', label: 'Ayda birkaç saat' },
                { value: 'haftada_1_2', label: 'Haftada 1–2 saat' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input {...register('zamanAyirma')} type="radio" value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.zamanAyirma && <p className={fieldErr}>{errors.zamanAyirma.message}</p>}
          </section>

          {/* 9. TANIŞMA */}
          <section>
            <h2 className={sectionTitle}>9. Tanışma</h2>
            <p className="text-sm text-gray-500 mb-3">Haritailesi ile daha önce nasıl tanıştınız?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TANISMA_KANALLARI.map((kanal) => (
                <label key={kanal.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={tanismaKanali.includes(kanal.value)}
                    onChange={() => toggleArray('tanismaKanali', kanal.value, tanismaKanali)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
                  />
                  <span className="text-sm text-gray-700">{kanal.label}</span>
                </label>
              ))}
            </div>
            {errors.tanismaKanali && <p className={fieldErr}>{errors.tanismaKanali.message}</p>}
          </section>

          {/* 10. REFERANS */}
          <section>
            <h2 className={sectionTitle}>10. Referans <span className="font-normal text-gray-400 text-sm">(opsiyonel)</span></h2>
            <label className={lbl}>
              Sizi önerebilecek bir kişi veya topluluk bağlantısı paylaşabilirsiniz.
            </label>
            <textarea {...register('referans')} rows={2} className={inp} />
          </section>

          {/* 11. ONAYLAR */}
          <section className="space-y-3">
            <label className={checkRow}>
              <input {...register('kvkk')} type="checkbox"
                className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]" />
              <span className="text-sm text-gray-700">KVKK metnini okudum *</span>
            </label>
            {errors.kvkk && <p className={fieldErr}>{errors.kvkk.message}</p>}
            <label className={checkRow}>
              <input {...register('iletisimOnay')} type="checkbox"
                className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]" />
              <span className="text-sm text-gray-700">İletişim kurulmasını kabul ediyorum *</span>
            </label>
            {errors.iletisimOnay && <p className={fieldErr}>{errors.iletisimOnay.message}</p>}
          </section>

          {/* 12. SUBMIT */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 text-white font-semibold rounded-xl bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Gönderiliyor…' : '📋 Başvuruyu Gönder'}
            </button>
            <p className="mt-3 text-xs text-gray-400 text-center leading-relaxed">
              Bazı üyelik türlerinde doğrulama süreci kapsamında öğrenci belgesi, mezuniyet belgesi veya ek bilgiler talep edilebilir.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 space-y-1">
              <p>Başvurular değerlendirme sürecinden geçmektedir.</p>
              <p>Bu süreçte, sizi daha yakından tanımak için kısa bir görüşme yapılır.</p>
              <p>Süreç sonunda, ilgili üyelik yapısına ait katkı/bağlış süreci tarafınıza ayrıca iletilecektir.</p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
