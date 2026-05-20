'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitApplication } from '@/lib/api';
import { ILLER, MYOLAR, UNIVERSITELER } from '@/lib/turkiye';

function formatTelefon(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

const schema = z.object({
  // 1. SİZİ TANIYALIM
  adSoyad: z.string().min(2, 'Ad soyad zorunludur.'),
  eposta: z.string().email('Geçerli bir e-posta girin.'),
  telefon: z.string().min(10, 'Telefon zorunludur.'),
  sehir: z.string().min(2, 'Şehir zorunludur.'),
  dogumTarihi: z.string().min(1, 'Doğum tarihi zorunludur.'),
  linkedin: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),

  // 2. EĞİTİM
  egitimDurumu: z.enum(['lise', 'onlisans', 'lisans'], {
    required_error: 'Eğitim durumu zorunludur.',
  }),
  okul: z.string().min(2, 'Okul / üniversite zorunludur.'),
  bolum: z.string().optional(),
  sinif: z.string().optional(),

  // 3. MESLEKİ İLGİ ALANLARI
  meslekiIlgiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),
  meslekiAciklama: z.string().optional().or(z.literal('')),

  // 4. NEDEN MESLEĞİN GELECEKLERİ?
  niyeKatilmak: z.string().min(150, 'En az 150 karakter giriniz.'),
  gucluYon: z.string().min(100, 'En az 100 karakter giriniz.'),
  gelisimAlani: z.string().min(100, 'En az 100 karakter giriniz.'),

  // 5. KATKI & ÜRETİM
  katkiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),
  katkiAciklama: z.string().optional().or(z.literal('')),

  // 6. DENEYİMLER
  toplulukDeneyimi: z.enum(['hayir', 'evet'], {
    required_error: 'Bu alan zorunludur.',
  }),
  toplulukAciklama: z.string().optional().or(z.literal('')),
  projeDeneyimi: z.enum(['hayir', 'evet'], {
    required_error: 'Bu alan zorunludur.',
  }),
  projeAciklama: z.string().optional().or(z.literal('')),

  // 7. KATILIM & SORUMLULUK
  zamanAyirma: z.enum(['ayda_birkac', 'haftada_1_2', 'haftada_3_5'], {
    required_error: 'Zaman taahhüdü zorunludur.',
  }),
  ekipRol: z.enum(['destek', 'duzenli', 'sorumluluk'], {
    required_error: 'Bu alan zorunludur.',
  }),

  // 8. İLGİ ALANLARI
  ilgiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),

  // 9. TANIŞMA
  tanismaKanali: z.array(z.string()).min(1, 'En az bir seçenek işaretleyin.'),

  // 10. REFERANS
  referans: z.string().optional().or(z.literal('')),

  // 11. ONAYLAR
  kvkk: z.boolean().refine((v) => v === true, 'KVKK onayı zorunludur.'),
  iletisimOnay: z.boolean().refine((v) => v === true, 'İletişim onayı zorunludur.'),
}).superRefine((data, ctx) => {
  if (data.egitimDurumu !== 'lise') {
    if (!data.bolum) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bölüm zorunludur.', path: ['bolum'] });
    }
    if (!data.sinif) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sınıf zorunludur.', path: ['sinif'] });
    }
  }
});

type FormValues = z.infer<typeof schema>;

const MESLEKI_ILGI = [
  { value: 'klasik_haritacilik', label: 'Klasik Haritacılık' },
  { value: 'cbs', label: 'CBS' },
  { value: 'fotogrametri', label: 'Fotogrametri & Uzaktan Algılama' },
  { value: 'insaat', label: 'İnşaat' },
  { value: 'gayrimenkul', label: 'Gayrimenkul Değerleme' },
  { value: 'yazilim', label: 'Yazılım & Teknoloji' },
  { value: 'icerik_uretimi', label: 'İçerik Üretimi' },
  { value: 'girisimcilik', label: 'Girişimcilik' },
  { value: 'diger', label: 'Diğer' },
];

const KATKI_ALANLARI = [
  { value: 'icerik', label: 'İçerik üretimi' },
  { value: 'sosyal_medya', label: 'Sosyal medya katkısı' },
  { value: 'video', label: 'Video içerik üretimi' },
  { value: 'etkinlik', label: 'Etkinlik desteği' },
  { value: 'topluluk', label: 'Topluluk organizasyonu' },
  { value: 'arastirma', label: 'Araştırma / analiz içerikleri' },
  { value: 'proje', label: 'Proje geliştirme' },
  { value: 'mentorluk_destek', label: 'Mentörlük organizasyon desteği' },
  { value: 'tasarim', label: 'Tasarım / görsel üretim' },
  { value: 'yazilim', label: 'Yazılım / teknik geliştirme' },
  { value: 'diger', label: 'Diğer' },
];

const ILGI_ALANLARI = [
  { value: 'topluluk', label: 'Topluluk ve networking' },
  { value: 'mentorluk', label: 'Mentörlük' },
  { value: 'egitimler', label: 'Eğitimler' },
  { value: 'kariyer', label: 'Kariyer fırsatları' },
  { value: 'icerik', label: 'İçerik üretimi' },
  { value: 'proje', label: 'Proje geliştirme' },
  { value: 'girisimcilik', label: 'Girişimcilik' },
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

export default function BasvuruPage() {
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
      meslekiIlgiAlanlari: [],
      katkiAlanlari: [],
      ilgiAlanlari: [],
      tanismaKanali: [],
    },
  });

  const meslekiIlgiAlanlari = watch('meslekiIlgiAlanlari');
  const katkiAlanlari = watch('katkiAlanlari');
  const ilgiAlanlari = watch('ilgiAlanlari');
  const tanismaKanali = watch('tanismaKanali');
  const epostaValue = watch('eposta') ?? '';
  const niyeKatilmak = watch('niyeKatilmak') ?? '';
  const gucluYon = watch('gucluYon') ?? '';
  const gelisimAlani = watch('gelisimAlani') ?? '';
  const egitimDurumu = watch('egitimDurumu');

  useEffect(() => {
    setValue('bolum', undefined, { shouldValidate: false });
    setValue('sinif', undefined, { shouldValidate: false });
    setValue('okul', '', { shouldValidate: false });
    setLiseQuery('');
  }, [egitimDurumu, setValue]);

  const [liseler, setLiseler] = useState<string[]>([]);
  const [liseQuery, setLiseQuery] = useState('');
  const [liseOpen, setLiseOpen] = useState(false);
  const liseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (egitimDurumu === 'lise' && liseler.length === 0) {
      fetch('/data/liseler.json').then(r => r.json()).then(setLiseler).catch(() => {});
    }
  }, [egitimDurumu, liseler.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (liseRef.current && !liseRef.current.contains(e.target as Node)) {
        setLiseOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredLiseler = liseQuery.length >= 2
    ? liseler.filter(l => l.toLocaleLowerCase('tr').includes(liseQuery.toLocaleLowerCase('tr'))).slice(0, 10)
    : [];

  const emailSuggestions = !epostaValue.includes('@') && epostaValue.length > 0
    ? ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'].map((d) => epostaValue + d)
    : [];

  function toggleArray(
    field: 'meslekiIlgiAlanlari' | 'katkiAlanlari' | 'ilgiAlanlari' | 'tanismaKanali',
    value: string,
    current: string[],
  ) {
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, updated, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    try {
      const { kvkk, iletisimOnay, eposta, ...rest } = values;
      await submitApplication({
        type: 'meslegin_gelecekleri',
        applicantEmail: eposta,
        formData: { eposta, kvkk, iletisimOnay, ...rest },
      });
      router.push('/uye-ol/tesekkurler?tip=meslegin-gelecekleri');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu.');
    }
  }

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)] focus:border-[var(--color-mavi)]';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const fieldErr = 'mt-1 text-xs text-red-600';
  const sectionTitle = 'text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100';
  const radioRow = 'flex items-center gap-2.5 cursor-pointer';
  const checkRow = 'flex items-start gap-2.5 cursor-pointer';

  return (
    <div className="max-w-2xl">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 leading-relaxed space-y-2">
        <p>
          Mesleğin Gelecekleri; Haritailesi Vakfı tarafından oluşturulan, sınırlı kontenjanlı gelişim programıdır.
        </p>
        <p>
          Bu program; yalnızca başarılı öğrencileri değil; öğrenmeye açık, üretmek isteyen, sorumluluk alabilen
          ve topluluk kültürüne katkı sunabilecek gençleri desteklemeyi amaçlar.
        </p>
        <p>Başvurunuz yaklaşık 4–6 dakika içinde tamamlanır.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* 1. SİZİ TANIYALIM */}
        <section>
          <h2 className={sectionTitle}>1. Sizi Tanıyalım</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Ad Soyad *</label>
              <input {...register('adSoyad')} type="text" className={inp} />
              {errors.adSoyad && <p className={fieldErr}>{errors.adSoyad.message}</p>}
            </div>
            <div>
              <label className={lbl}>E-Posta *</label>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={lbl}>LinkedIn <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <input {...register('linkedin')} type="url" placeholder="https://linkedin.com/in/…" className={inp} />
            </div>
            <div>
              <label className={lbl}>Instagram <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <input {...register('instagram')} type="text" placeholder="@kullanici_adi" className={inp} />
            </div>
          </div>
        </section>

        {/* 2. EĞİTİM BİLGİLERİ */}
        <section>
          <h2 className={sectionTitle}>2. Eğitim Bilgileri</h2>
          <div className="mb-4">
            <label className={lbl}>Eğitim Durumu *</label>
            <div className="space-y-2 mt-1">
              {[
                { value: 'lise', label: 'Lise öğrencisiyim' },
                { value: 'onlisans', label: 'Ön lisans öğrencisiyim' },
                { value: 'lisans', label: 'Lisans öğrencisiyim' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input {...register('egitimDurumu')} type="radio" value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.egitimDurumu && <p className={fieldErr}>{errors.egitimDurumu.message}</p>}
          </div>

          <div className="mb-4">
            <label className={lbl}>
              {egitimDurumu === 'onlisans' ? 'Meslek Yüksekokulu *' : egitimDurumu === 'lisans' ? 'Üniversite *' : 'Okul Adı *'}
            </label>
            {egitimDurumu === 'onlisans' ? (
              <select {...register('okul')} className={inp}>
                <option value="">MYO seçin…</option>
                {MYOLAR.map((myo) => <option key={myo} value={myo}>{myo}</option>)}
              </select>
            ) : egitimDurumu === 'lisans' ? (
              <select {...register('okul')} className={inp}>
                <option value="">Üniversite seçin…</option>
                {UNIVERSITELER.map((uni) => <option key={uni} value={uni}>{uni}</option>)}
              </select>
            ) : (
              <div ref={liseRef} className="relative">
                <input
                  type="text"
                  value={liseQuery}
                  onChange={(e) => {
                    setLiseQuery(e.target.value);
                    setValue('okul', e.target.value, { shouldValidate: false });
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
                          setValue('okul', l, { shouldValidate: true });
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
            )}
            {errors.okul && <p className={fieldErr}>{errors.okul.message}</p>}
          </div>

          {egitimDurumu === 'onlisans' && (
            <div className="mb-4">
              <label className={lbl}>Bölüm *</label>
              <div className="space-y-2 mt-1">
                {[
                  { value: 'harita_kadastro', label: 'Harita ve Kadastro' },
                  { value: 'tapu_kadastro', label: 'Tapu ve Kadastro' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input {...register('bolum')} type="radio" value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.bolum && <p className={fieldErr}>{errors.bolum.message}</p>}
            </div>
          )}

          {egitimDurumu === 'lisans' && (
            <div className="mb-4">
              <label className={lbl}>Bölüm *</label>
              <div className="space-y-2 mt-1">
                {[
                  { value: 'harita', label: 'Harita Mühendisliği' },
                  { value: 'tapu_kadastro', label: 'Tapu ve Kadastro' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input {...register('bolum')} type="radio" value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.bolum && <p className={fieldErr}>{errors.bolum.message}</p>}
            </div>
          )}

          {egitimDurumu && egitimDurumu !== 'lise' && (
            <div>
              <label className={lbl}>Sınıf *</label>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                {(egitimDurumu === 'onlisans'
                  ? [
                      { value: '1', label: '1. sınıf' },
                      { value: '2', label: '2. sınıf' },
                    ]
                  : [
                      { value: 'hazirlik', label: 'Hazırlık' },
                      { value: '1', label: '1. sınıf' },
                      { value: '2', label: '2. sınıf' },
                      { value: '3', label: '3. sınıf' },
                      { value: '4', label: '4. sınıf' },
                    ]
                ).map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input {...register('sinif')} type="radio" value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.sinif && <p className={fieldErr}>{errors.sinif.message}</p>}
            </div>
          )}
        </section>

        {/* 3. MESLEKİ İLGİ ALANLARI */}
        <section>
          <h2 className={sectionTitle}>3. Mesleki İlgi Alanları</h2>
          <p className="text-sm text-gray-500 mb-3">Hangi alanlara daha yakın hissediyorsunuz? (çoklu seçim)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MESLEKI_ILGI.map((alan) => (
              <label key={alan.value} className={checkRow}>
                <input
                  type="checkbox"
                  checked={meslekiIlgiAlanlari.includes(alan.value)}
                  onChange={() => toggleArray('meslekiIlgiAlanlari', alan.value, meslekiIlgiAlanlari)}
                  className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
                />
                <span className="text-sm text-gray-700">{alan.label}</span>
              </label>
            ))}
          </div>
          {errors.meslekiIlgiAlanlari && <p className={fieldErr}>{errors.meslekiIlgiAlanlari.message}</p>}
          <div className="mt-3">
            <label className={lbl}>Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
            <textarea {...register('meslekiAciklama')} rows={2} className={inp} />
          </div>
        </section>

        {/* 4. NEDEN MESLEĞİN GELECEKLERİ? */}
        <section>
          <h2 className={sectionTitle}>4. Neden Mesleğin Gelecekleri?</h2>
          <div className="space-y-4">
            <div>
              <label className={lbl}>
                Programa neden katılmak istiyorsunuz? *
                <span className="ml-1 text-gray-400 font-normal">(min 150 karakter)</span>
              </label>
              <textarea {...register('niyeKatilmak')} rows={4} className={inp} />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{niyeKatilmak.length} karakter</p>
              {errors.niyeKatilmak && <p className={fieldErr}>{errors.niyeKatilmak.message}</p>}
            </div>
            <div>
              <label className={lbl}>
                Kendinizi en güçlü gördüğünüz yönünüz nedir? *
                <span className="ml-1 text-gray-400 font-normal">(min 100 karakter)</span>
              </label>
              <textarea {...register('gucluYon')} rows={3} className={inp} />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{gucluYon.length} karakter</p>
              {errors.gucluYon && <p className={fieldErr}>{errors.gucluYon.message}</p>}
            </div>
            <div>
              <label className={lbl}>
                Gelişmek istediğiniz alan nedir? *
                <span className="ml-1 text-gray-400 font-normal">(min 100 karakter)</span>
              </label>
              <textarea {...register('gelisimAlani')} rows={3} className={inp} />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{gelisimAlani.length} karakter</p>
              {errors.gelisimAlani && <p className={fieldErr}>{errors.gelisimAlani.message}</p>}
            </div>
          </div>
        </section>

        {/* 5. KATKI & ÜRETİM */}
        <section>
          <h2 className={sectionTitle}>5. Katkı & Üretim</h2>
          <p className="text-sm text-gray-500 mb-3">Hangi alanlarda katkı sunmak istersiniz? (çoklu seçim)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

        {/* 6. DENEYİMLER */}
        <section>
          <h2 className={sectionTitle}>6. Deneyimler</h2>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Daha önce bir toplulukta aktif rol aldınız mı? *</p>
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
              <p className="text-sm font-medium text-gray-700 mb-2">Daha önce bir proje, etkinlik veya gönüllü çalışmada yer aldınız mı? *</p>
              <div className="flex gap-6">
                {[{ value: 'hayir', label: 'Hayır' }, { value: 'evet', label: 'Evet' }].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input {...register('projeDeneyimi')} type="radio" value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.projeDeneyimi && <p className={fieldErr}>{errors.projeDeneyimi.message}</p>}
              <div className="mt-2">
                <label className={lbl}>Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                <textarea {...register('projeAciklama')} rows={2} className={inp} />
              </div>
            </div>
          </div>
        </section>

        {/* 7. KATILIM & SORUMLULUK */}
        <section>
          <h2 className={sectionTitle}>7. Katılım & Sorumluluk</h2>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Haritailesi&apos;nde aktif olarak ne kadar zaman ayırabileceğinizi düşünüyorsunuz? *</p>
            <div className="space-y-2">
              {[
                { value: 'ayda_birkac', label: 'Ayda birkaç saat' },
                { value: 'haftada_1_2', label: 'Haftada 1–2 saat' },
                { value: 'haftada_3_5', label: 'Haftada 3–5 saat' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input {...register('zamanAyirma')} type="radio" value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.zamanAyirma && <p className={fieldErr}>{errors.zamanAyirma.message}</p>}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ekip çalışmalarında aktif rol almaya nasıl bakıyorsunuz? *</p>
            <div className="space-y-2">
              {[
                { value: 'destek', label: 'Destek olmak isterim' },
                { value: 'duzenli', label: 'Düzenli katkı sunabilirim' },
                { value: 'sorumluluk', label: 'Sorumluluk almaya hazırım' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input {...register('ekipRol')} type="radio" value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.ekipRol && <p className={fieldErr}>{errors.ekipRol.message}</p>}
          </div>
        </section>

        {/* 8. İLGİ ALANLARI */}
        <section>
          <h2 className={sectionTitle}>8. İlgi Alanları</h2>
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
          <label className={lbl}>Sizi önerebilecek bir kişi veya topluluk bağlantısı paylaşabilirsiniz.</label>
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
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 space-y-1">
            <p>Mesleğin Gelecekleri; sınırlı kontenjanla ilerleyen seçilmiş bir gelişim programıdır.</p>
            <p>Başvurular değerlendirme sürecinden geçmektedir.</p>
            <p>Bu süreçte: başvuru incelemesi, kısa görüşmeler, topluluk uyumu, üretim potansiyeli ve motivasyon birlikte değerlendirilmektedir.</p>
            <p>Uygun bulunan adaylarla kısa bir görüşme planlanacaktır.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
