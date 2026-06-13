'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitApplication } from '@/lib/api';
import { ILLER, UNIVERSITELER } from '@/lib/turkiye';

const BOLUM_LISE = ['Harita Tapu Kadastro'];
const BOLUM_ONLISANS = ['Harita Kadastro', 'Tapu Kadastro'];
const BOLUM_LISANS = ['Geomatik Mühendisliği', 'Harita Mühendisliği', 'Jeodezi ve Fotogrametri Mühendisliği'];
const BOLUM_YENI_MEZUN = [
  'Geomatik Mühendisliği',
  'Harita Mühendisliği',
  'Jeodezi ve Fotogrametri Mühendisliği',
  'Harita Kadastro',
  'Tapu Kadastro',
];

const SINIF_LISE = ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'];
const SINIF_ONLISANS = ['Hazırlık', '1. Sınıf', '2. Sınıf'];
const SINIF_LISANS = ['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'];

const MESLEKI_YONELIM = [
  { value: 'klasik_haritacilik', label: 'Klasik Haritacılık' },
  { value: 'insaat', label: 'İnşaat' },
  { value: 'cbs', label: 'CBS' },
  { value: 'gayrimenkul', label: 'Gayrimenkul Değerleme' },
  { value: 'fotogrametri', label: 'Fotogrametri & Uzaktan Algılama' },
  { value: 'bilmiyorum', label: 'Bilmiyorum' },
  { value: 'diger', label: 'Diğer' },
];

const ILGI_ALANLARI = [
  { value: 'topluluk', label: 'Topluluk ve networking' },
  { value: 'egitimler', label: 'Eğitimler ve atölyeler' },
  { value: 'mentorluk', label: 'Mentörlük' },
  { value: 'proje', label: 'Proje geliştirme' },
  { value: 'kariyer', label: 'Kariyer fırsatları' },
  { value: 'icerik', label: 'İçerik üretimi' },
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

const currentYear = new Date().getFullYear();

const schema = z.object({
  membershipType: z.enum(['ogrenci', 'yeni_mezun'], { required_error: 'Üyelik tipi zorunludur.' }),
  tcKimlikNo: z.string().regex(/^\d{11}$/, 'TC kimlik no 11 haneli olmalıdır.'),
  adSoyad: z.string().min(2, 'Ad soyad zorunludur.'),
  eposta: z.string().email('Geçerli bir e-posta girin.'),
  telefon: z.string().min(10, 'Telefon numarası zorunludur.'),
  sehir: z.string().min(2, 'Şehir zorunludur.'),
  dogumTarihi: z.string().min(1, 'Doğum tarihi zorunludur.'),
  egitimTipi: z.enum(['lise', 'onlisans', 'lisans']).optional(),
  okul: z.string().optional().or(z.literal('')),
  universite: z.string().optional().or(z.literal('')),
  bolum: z.string().optional().or(z.literal('')),
  sinif: z.string().optional().or(z.literal('')),
  mezuniyetYili: z.string().optional().or(z.literal('')),
  calismaDurumu: z.enum(['calisiyor', 'calismıyor']).optional(),
  meslekiYonelim: z.array(z.string()).min(1, 'En az bir alan seçin.'),
  meslekiYonelimAciklama: z.string().optional().or(z.literal('')),
  ilgiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),
  toplulukDeneyimi: z.enum(['hayir', 'evet'], { required_error: 'Bu alan zorunludur.' }),
  toplulukAciklama: z.string().optional().or(z.literal('')),
  arastirmaDeneyimi: z.enum(['hayir', 'evet'], { required_error: 'Bu alan zorunludur.' }),
  arastimaAciklama: z.string().optional().or(z.literal('')),
  zamanAyirma: z.enum(['ayda_bir', 'ayda_birkac', 'haftada_1_2'], { required_error: 'Zaman taahhüdü zorunludur.' }),
  motivasyon: z.string().optional().or(z.literal('')),
  tanismaKanali: z.array(z.string()).min(1, 'En az bir seçenek işaretleyin.'),
  kvkk: z.boolean().refine((v) => v === true, 'KVKK onayı zorunludur.'),
  iletisimOnay: z.boolean().refine((v) => v === true, 'İletişim onayı zorunludur.'),
}).superRefine((data, ctx) => {
  if (data.membershipType === 'ogrenci') {
    if (!data.egitimTipi) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['egitimTipi'], message: 'Eğitim tipi zorunludur.' });
    }
    if (data.egitimTipi === 'lise') {
      if (!data.okul?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['okul'], message: 'Okul adı zorunludur.' });
      }
    } else if (data.egitimTipi) {
      if (!data.universite?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['universite'], message: 'Üniversite zorunludur.' });
      }
    }
    if (!data.bolum?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bolum'], message: 'Bölüm zorunludur.' });
    }
    if (!data.sinif?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sinif'], message: 'Sınıf zorunludur.' });
    }
  }
  if (data.membershipType === 'yeni_mezun') {
    if (!data.universite?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['universite'], message: 'Üniversite zorunludur.' });
    }
    if (!data.bolum?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bolum'], message: 'Bölüm zorunludur.' });
    }
    const yil = parseInt(data.mezuniyetYili ?? '', 10);
    if (isNaN(yil) || yil < currentYear - 1 || yil > currentYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mezuniyetYili'],
        message: `Mezuniyet yılı ${currentYear - 1} veya ${currentYear} olmalıdır.`,
      });
    }
    if (!data.calismaDurumu) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['calismaDurumu'], message: 'Çalışma durumu zorunludur.' });
    }
  }
});

type FormValues = z.infer<typeof schema>;

function formatTelefon(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

export default function GencBasvuruPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ilgiAlanlari: [], tanismaKanali: [], meslekiYonelim: [] },
  });

  const membershipType = watch('membershipType');
  const egitimTipi = watch('egitimTipi');
  const meslekiYonelim = watch('meslekiYonelim');
  const ilgiAlanlari = watch('ilgiAlanlari');
  const tanismaKanali = watch('tanismaKanali');
  const epostaValue = watch('eposta') ?? '';
  const motivasyon = watch('motivasyon') ?? '';

  // Lise autocomplete
  const [liseler, setLiseler] = useState<string[]>([]);
  const [liseQuery, setLiseQuery] = useState('');
  const [liseOpen, setLiseOpen] = useState(false);
  const liseRef = useRef<HTMLDivElement>(null);
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const filteredLiseler = liseQuery.length >= 2
    ? liseler.filter(l => l.toLocaleLowerCase('tr').includes(liseQuery.toLocaleLowerCase('tr'))).slice(0, 10)
    : [];

  useEffect(() => {
    if (egitimTipi === 'lise' && liseler.length === 0) {
      fetch('/data/liseler.json').then(r => r.json()).then(setLiseler).catch(() => {});
    }
    if (egitimTipi === 'lise') {
      setValue('bolum', 'Harita Tapu Kadastro', { shouldValidate: false });
    } else {
      setValue('bolum', '', { shouldValidate: false });
    }
    setValue('sinif', '', { shouldValidate: false });
    setValue('okul', '', { shouldValidate: false });
    setValue('universite', '', { shouldValidate: false });
    setLiseQuery('');
  }, [egitimTipi, setValue, liseler.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (liseRef.current && !liseRef.current.contains(e.target as Node)) setLiseOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setValue('universite', '', { shouldValidate: false });
    setValue('bolum', '', { shouldValidate: false });
    setValue('sinif', '', { shouldValidate: false });
    setValue('okul', '', { shouldValidate: false });
    setValue('egitimTipi', undefined, { shouldValidate: false });
    setValue('mezuniyetYili', '', { shouldValidate: false });
    setValue('calismaDurumu', undefined, { shouldValidate: false });
    setLiseQuery('');
  }, [membershipType, setValue]);

  const bolumler =
    membershipType === 'yeni_mezun' ? BOLUM_YENI_MEZUN :
    egitimTipi === 'onlisans' ? BOLUM_ONLISANS :
    egitimTipi === 'lisans' ? BOLUM_LISANS : [];

  const siniflar =
    egitimTipi === 'lise' ? SINIF_LISE :
    egitimTipi === 'onlisans' ? SINIF_ONLISANS :
    egitimTipi === 'lisans' ? SINIF_LISANS : [];

  const emailSuggestions = !epostaValue.includes('@') && epostaValue.length > 0
    ? ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'].map((d) => epostaValue + d)
    : [];

  function toggleArray(field: 'ilgiAlanlari' | 'tanismaKanali' | 'meslekiYonelim', value: string, current: string[]) {
    setValue(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value], { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    if (honeypot || Date.now() - loadTime < 2000) return;
    try {
      const { kvkk, iletisimOnay, eposta, ...rest } = values;
      await submitApplication({
        type: 'haritailesi_genc',
        applicantEmail: eposta,
        formData: { eposta, kvkk, iletisimOnay, ...rest },
      });
      router.push(`/uye-ol/tesekkurler?tip=${values.membershipType}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu.');
    }
  }

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] focus:border-[var(--color-teal)]';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const fieldErr = 'mt-1 text-xs text-red-600';
  const sectionTitle = 'text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100';
  const radioRow = 'flex items-center gap-2.5 cursor-pointer';
  const checkRow = 'flex items-start gap-2.5 cursor-pointer';

  return (
    <main className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-[var(--color-teal)] uppercase tracking-widest mb-2">Haritailesi Genç</p>
          <h1 className="text-3xl font-bold text-gray-900">Üyelik Başvurusu</h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            Öğrenci ve yeni mezun üyeliği ücretsizdir. Başvurunuz 2–3 dakika içinde tamamlanır.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          {/* Honeypot — bot tuzağı */}
          <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }} />

          {/* ÜYELİK TİPİ */}
          <section>
            <h2 className={sectionTitle}>Üyelik Tipi</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { value: 'ogrenci', label: 'Öğrenciyim', desc: 'Hâlâ okuyorum' },
                { value: 'yeni_mezun', label: 'Yeni Mezunum', desc: `${currentYear - 1}–${currentYear} mezunu` },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    membershipType === opt.value
                      ? 'border-[var(--color-teal)] bg-[var(--color-teal)]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    {...register('membershipType')}
                    type="radio"
                    value={opt.value}
                    className="mt-0.5 accent-[var(--color-teal)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.membershipType && <p className={fieldErr}>{errors.membershipType.message}</p>}
          </section>

          {/* KİŞİSEL BİLGİLER */}
          <section>
            <h2 className={sectionTitle}>Kişisel Bilgiler</h2>
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
          </section>

          {/* EĞİTİM */}
          {membershipType && (
            <section>
              <h2 className={sectionTitle}>Eğitim Bilgileri</h2>

              {membershipType === 'ogrenci' && (
                <div className="mb-4">
                  <label className={lbl}>Eğitim Tipi *</label>
                  <div className="flex flex-wrap gap-5 mt-1">
                    {[
                      { value: 'lise', label: 'Lise' },
                      { value: 'onlisans', label: 'Ön Lisans' },
                      { value: 'lisans', label: 'Lisans' },
                    ].map((opt) => (
                      <label key={opt.value} className={radioRow}>
                        <input {...register('egitimTipi')} type="radio" value={opt.value}
                          className="accent-[var(--color-teal)]" />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.egitimTipi && <p className={fieldErr}>{errors.egitimTipi.message}</p>}
                </div>
              )}

              {/* Lise: okul adı autocomplete */}
              {membershipType === 'ogrenci' && egitimTipi === 'lise' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={lbl}>Okul Adı *</label>
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
                              className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-gray-700"
                            >
                              {l}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.okul && <p className={fieldErr}>{errors.okul.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Bölüm / Alan</label>
                    <select {...register('bolum')} className={inp}>
                      {BOLUM_LISE.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Sınıf *</label>
                    <select {...register('sinif')} className={inp}>
                      <option value="">Seçin…</option>
                      {SINIF_LISE.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.sinif && <p className={fieldErr}>{errors.sinif.message}</p>}
                  </div>
                </div>
              )}

              {/* Ön lisans / Lisans */}
              {membershipType === 'ogrenci' && (egitimTipi === 'onlisans' || egitimTipi === 'lisans') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={lbl}>Üniversite *</label>
                    <select {...register('universite')} className={inp}>
                      <option value="">Seçin…</option>
                      {UNIVERSITELER.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {errors.universite && <p className={fieldErr}>{errors.universite.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Bölüm *</label>
                    <select {...register('bolum')} className={inp}>
                      <option value="">Seçin…</option>
                      {bolumler.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {errors.bolum && <p className={fieldErr}>{errors.bolum.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Sınıf *</label>
                    <select {...register('sinif')} className={inp}>
                      <option value="">Seçin…</option>
                      {siniflar.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.sinif && <p className={fieldErr}>{errors.sinif.message}</p>}
                  </div>
                </div>
              )}

              {/* Yeni mezun */}
              {membershipType === 'yeni_mezun' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={lbl}>Mezun Olduğun Üniversite *</label>
                    <select {...register('universite')} className={inp}>
                      <option value="">Seçin…</option>
                      {UNIVERSITELER.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {errors.universite && <p className={fieldErr}>{errors.universite.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Bölüm *</label>
                    <select {...register('bolum')} className={inp}>
                      <option value="">Seçin…</option>
                      {BOLUM_YENI_MEZUN.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {errors.bolum && <p className={fieldErr}>{errors.bolum.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Mezuniyet Yılı *</label>
                    <input
                      {...register('mezuniyetYili')}
                      type="text"
                      placeholder={`${currentYear - 1} veya ${currentYear}`}
                      maxLength={4}
                      className={inp}
                    />
                    {errors.mezuniyetYili && <p className={fieldErr}>{errors.mezuniyetYili.message}</p>}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ÇALIŞMA DURUMU — sadece yeni mezun */}
          {membershipType === 'yeni_mezun' && (
            <section>
              <h2 className={sectionTitle}>Çalışma Durumu</h2>
              <div className="space-y-2">
                {[
                  { value: 'calisiyor', label: 'Çalışıyorum' },
                  { value: 'calismıyor', label: 'Şu an çalışmıyorum / iş arıyorum' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input {...register('calismaDurumu')} type="radio" value={opt.value}
                      className="accent-[var(--color-teal)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.calismaDurumu && <p className={fieldErr}>{errors.calismaDurumu.message}</p>}
            </section>
          )}

          {/* MESLEKİ YÖNELİM */}
          <section>
            <h2 className={sectionTitle}>Mesleki Yönelim</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MESLEKI_YONELIM.map((alan) => (
                <label key={alan.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={meslekiYonelim.includes(alan.value)}
                    onChange={() => toggleArray('meslekiYonelim', alan.value, meslekiYonelim)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-teal)]"
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

          {/* İLGİ ALANLARI */}
          <section>
            <h2 className={sectionTitle}>İlgi Alanları</h2>
            <p className="text-sm text-gray-500 mb-3">Topluluğumuzda seni en çok hangi konular ilgilendiriyor? (çoklu seçim)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ILGI_ALANLARI.map((alan) => (
                <label key={alan.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={ilgiAlanlari.includes(alan.value)}
                    onChange={() => toggleArray('ilgiAlanlari', alan.value, ilgiAlanlari)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-teal)]"
                  />
                  <span className="text-sm text-gray-700">{alan.label}</span>
                </label>
              ))}
            </div>
            {errors.ilgiAlanlari && <p className={fieldErr}>{errors.ilgiAlanlari.message}</p>}
          </section>

          {/* EK DENEYİMLER */}
          <section>
            <h2 className={sectionTitle}>Ek Deneyimler</h2>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Daha önce bir gönüllülük faaliyetinde yer aldın mı? (Öğrenci kulübü, topluluk, STK vb.)</p>
                <div className="flex gap-6">
                  {[{ value: 'hayir', label: 'Hayır' }, { value: 'evet', label: 'Evet' }].map((opt) => (
                    <label key={opt.value} className={radioRow}>
                      <input {...register('toplulukDeneyimi')} type="radio" value={opt.value}
                        className="accent-[var(--color-teal)]" />
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
                <p className="text-sm font-medium text-gray-700 mb-2">Daha önce bir araştırma veya projede yer aldın mı?</p>
                <div className="flex gap-6">
                  {[
                    { value: 'hayir', label: 'Hayır' },
                    { value: 'evet', label: 'Evet (TÜBİTAK, AR-GE vb.)' },
                  ].map((opt) => (
                    <label key={opt.value} className={radioRow}>
                      <input {...register('arastirmaDeneyimi')} type="radio" value={opt.value}
                        className="accent-[var(--color-teal)]" />
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

          {/* KATILIM */}
          <section>
            <h2 className={sectionTitle}>Katılım</h2>
            <p className="text-sm font-medium text-gray-700 mb-2">Haritailesi Genç&apos;te aktif olarak ne kadar zaman ayırmayı düşünüyorsun? *</p>
            <div className="space-y-2">
              {[
                { value: 'ayda_bir', label: 'Ayda bir' },
                { value: 'ayda_birkac', label: 'Ayda birkaç kez' },
                { value: 'haftada_1_2', label: 'Haftada 1–2 kez' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input {...register('zamanAyirma')} type="radio" value={opt.value}
                    className="accent-[var(--color-teal)]" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.zamanAyirma && <p className={fieldErr}>{errors.zamanAyirma.message}</p>}
          </section>

          {/* MOTİVASYON */}
          <section>
            <h2 className={sectionTitle}>Motivasyon</h2>
            <div>
              <label className={lbl}>
                Neden Haritailesi Genç&apos;e katılmak istiyorsun?{' '}
                <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <textarea {...register('motivasyon')} rows={3} className={inp} />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{motivasyon.length} karakter</p>
            </div>
          </section>

          {/* TANIŞMA — -mt-5 ile 20px yukarı */}
          <section className="-mt-5">
            <h2 className={sectionTitle}>Bizi Nereden Duydun?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TANISMA_KANALLARI.map((k) => (
                <label key={k.value} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={tanismaKanali.includes(k.value)}
                    onChange={() => toggleArray('tanismaKanali', k.value, tanismaKanali)}
                    className="mt-0.5 rounded border-gray-300 accent-[var(--color-teal)]"
                  />
                  <span className="text-sm text-gray-700">{k.label}</span>
                </label>
              ))}
            </div>
            {errors.tanismaKanali && <p className={fieldErr}>{errors.tanismaKanali.message}</p>}
          </section>

          {/* ONAYLAR */}
          <section>
            <h2 className={sectionTitle}>Onaylar</h2>
            <div className="space-y-3">
              <label className={checkRow}>
                <input {...register('kvkk')} type="checkbox" className="mt-0.5 rounded border-gray-300 accent-[var(--color-teal)]" />
                <span className="text-sm text-gray-700">
                  <a href="/kvkk" target="_blank" className="text-[var(--color-teal)] hover:underline">KVKK Aydınlatma Metni</a>&apos;ni
                  okudum ve kişisel verilerimin işlenmesine onay veriyorum. *
                </span>
              </label>
              {errors.kvkk && <p className={fieldErr}>{errors.kvkk.message}</p>}
              <label className={checkRow}>
                <input {...register('iletisimOnay')} type="checkbox" className="mt-0.5 rounded border-gray-300 accent-[var(--color-teal)]" />
                <span className="text-sm text-gray-700">
                  Haritailesi&apos;nin bana etkinlik, duyuru ve topluluğa özel içerikler hakkında iletişim kurmasına onay veriyorum. *
                </span>
              </label>
              {errors.iletisimOnay && <p className={fieldErr}>{errors.iletisimOnay.message}</p>}
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-sm font-semibold text-white bg-[var(--color-teal)] hover:bg-[#5a9a97] rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
          </button>
        </form>
      </div>
    </main>
  );
}
