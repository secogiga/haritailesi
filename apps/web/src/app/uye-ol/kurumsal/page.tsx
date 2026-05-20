'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { submitApplication } from '@/lib/api';
import { ILLER } from '@/lib/turkiye';

const schema = z
  .object({
    // 1. KURULUŞ BİLGİLERİ
    kurulusTipi: z.enum(['shkm', 'sirket', 'diger'], {
      required_error: 'Kuruluş tipi zorunludur.',
    }),
    shkmAdi: z.string().optional().or(z.literal('')),
    likhab: z.enum(['evet', 'hayir']).optional(),
    likhabAdi: z.string().optional().or(z.literal('')),
    sirketAdi: z.string().optional().or(z.literal('')),
    kurumAdi: z.string().optional().or(z.literal('')),
    faaliyetAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),
    toplamCalisan: z.enum(['1-3', '3-10', '10-25', '25-50', '50+'], {
      required_error: 'Çalışan sayısı zorunludur.',
    }),
    sehir: z.string().min(2, 'Şehir zorunludur.'),
    kurumTelefon: z.string().optional().or(z.literal('')),
    webSitesi: z.string().optional().or(z.literal('')),

    // 2. TEMSİLCİ BİLGİLERİ
    temsilciAdSoyad: z.string().min(2, 'Ad soyad zorunludur.'),
    temsilciRol: z.enum(['kurucu', 'yonetici', 'calisan', 'diger'], {
      required_error: 'Rol zorunludur.',
    }),
    temsilciEposta: z.string().email('Geçerli bir e-posta girin.'),
    temsilciTelefon: z.string().min(10, 'Telefon zorunludur.'),

    // 3. ÖNCELİKLİ BEKLENTİ
    oncelikliIhtiyac: z.enum(
      ['tanitim', 'is_agi', 'insan_kaynagi', 'sektorel', 'proje'],
      { required_error: 'Öncelikli beklenti zorunludur.' },
    ),

    // 4. TANIŞMA
    tanismaKanali: z.array(z.string()).min(1, 'En az bir seçenek işaretleyin.'),

    // 5. KATKI ALANLARI
    katkiAlanlari: z.array(z.string()).min(1, 'En az bir alan seçin.'),

    // 6. DESTEK SEVİYESİ
    destekSeviyesi: z.enum(['kesfetmek', 'destek_olmak', 'aktif_isbirligi'], {
      required_error: 'Destek seviyesi zorunludur.',
    }),

    // 8. ONAYLAR
    kvkk: z.boolean().refine((v) => v === true, 'KVKK onayı zorunludur.'),
    iletisimOnay: z.boolean().refine((v) => v === true, 'İletişim onayı zorunludur.'),
  })
  .superRefine((data, ctx) => {
    if (data.kurulusTipi === 'shkm' && !data.shkmAdi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shkmAdi'], message: 'SHKM adı zorunludur.' });
    }
    if (data.kurulusTipi === 'shkm' && !data.likhab) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['likhab'], message: 'Bu alan zorunludur.' });
    }
    if (data.kurulusTipi === 'shkm' && data.likhab === 'evet' && !data.likhabAdi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['likhabAdi'], message: 'LİHKAB adı zorunludur.' });
    }
    if (data.kurulusTipi === 'sirket' && !data.sirketAdi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sirketAdi'], message: 'Şirket adı zorunludur.' });
    }
    if (data.kurulusTipi === 'diger' && !data.kurumAdi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['kurumAdi'], message: 'Kurum adı zorunludur.' });
    }
  });

type FormValues = z.infer<typeof schema>;

const FAALIYET_ALANLARI = [
  { value: 'shkmmb', label: 'SHKMMB' },
  { value: 'likhab', label: 'LİHKAB' },
  { value: 'insaat', label: 'İnşaat' },
  { value: 'cbs', label: 'CBS' },
  { value: 'yazilim', label: 'Yazılım ve Bilişim' },
  { value: 'olcme', label: 'Ölçme ve Donanım' },
  { value: 'gayrimenkul', label: 'Gayrimenkul' },
  { value: 'fotogrametri', label: 'Fotogrametri' },
  { value: 'diger', label: 'Diğer' },
];

const KATKI_ALANLARI = [
  { value: 'egitim', label: 'Eğitim / Workshop Desteği' },
  { value: 'sponsorluk', label: 'Sponsorluk / Etkinlik Desteği' },
  { value: 'icerik', label: 'İçerik Üretimi' },
  { value: 'proje', label: 'Proje İş Birlikleri' },
  { value: 'mentorluk', label: 'Mentorluk / Kariyer Desteği' },
  { value: 'staj', label: 'Staj / İstihdam Katkısı' },
  { value: 'teknik', label: 'Teknik Destek / Yazılım Katkısı' },
  { value: 'diger', label: 'Diğer' },
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

export default function KurumsalBasvuruPage() {
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
      faaliyetAlanlari: [],
      tanismaKanali: [],
      katkiAlanlari: [],
    },
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [tanitimFile, setTanitimFile] = useState<File | null>(null);

  const kurulusTipi = watch('kurulusTipi');
  const likhab = watch('likhab');
  const faaliyetAlanlari = watch('faaliyetAlanlari');
  const tanismaKanali = watch('tanismaKanali');
  const katkiAlanlari = watch('katkiAlanlari');

  function toggleArray(
    field: 'faaliyetAlanlari' | 'tanismaKanali' | 'katkiAlanlari',
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
      const { kvkk, iletisimOnay, temsilciEposta, ...rest } = values;
      await submitApplication({
        type: 'corporate',
        applicantEmail: temsilciEposta,
        formData: {
          temsilciEposta,
          kvkk,
          iletisimOnay,
          ...rest,
          ...(logoFile ? { logoFileName: logoFile.name } : {}),
          ...(tanitimFile ? { tanitimFileName: tanitimFile.name } : {}),
        },
      });
      router.push('/uye-ol/tesekkurler?tip=kurumsal');
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
    <main className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-mavi)]">Kurumsal Üyelik Başvurusu</h1>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            Mesleğe Değer Katan Markalar; Haritailesi&apos;nin kurumsal üyelerini kapsayan üyelik modelimizdir.<br />
            Bu yapı; mesleğimizin gelişimine kaynak, bağlantı ve destek katkısı sunmayı sahiplenen kurum ve şirketlerden oluşur.<br />
            Bu form, bu sürecin ilk adımıdır. Başvurunuz 2–3 dakika içinde tamamlanır.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">

          {/* 1. KURULUŞ BİLGİLERİ */}
          <section>
            <h2 className={sectionTitle}>1. Kuruluş Bilgileri</h2>

            <div className="mb-4">
              <label className={lbl}>Kuruluş Tipi *</label>
              <div className="space-y-2 mt-1">
                {[
                  { value: 'shkm', label: 'SHKM' },
                  { value: 'sirket', label: 'Şirket' },
                  { value: 'diger', label: 'Diğer' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input
                      {...register('kurulusTipi')}
                      type="radio"
                      value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.kurulusTipi && <p className={fieldErr}>{errors.kurulusTipi.message}</p>}
            </div>

            {/* Koşullu: SHKM */}
            {kurulusTipi === 'shkm' && (
              <div className="space-y-4 pl-4 border-l-2 border-[var(--color-mavi)] mb-4">
                <div>
                  <label className={lbl}>SHKM Adı *</label>
                  <input {...register('shkmAdi')} type="text" className={inp} />
                  {errors.shkmAdi && <p className={fieldErr}>{errors.shkmAdi.message}</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Aynı zamanda LİHKAB mısınız? *</p>
                  <div className="flex gap-6">
                    {[{ value: 'hayir', label: 'Hayır' }, { value: 'evet', label: 'Evet' }].map((opt) => (
                      <label key={opt.value} className={radioRow}>
                        <input
                          {...register('likhab')}
                          type="radio"
                          value={opt.value}
                          className="border-gray-300 accent-[var(--color-mavi)]"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.likhab && <p className={fieldErr}>{errors.likhab.message}</p>}
                </div>
                {likhab === 'evet' && (
                  <div>
                    <label className={lbl}>LİHKAB Adı *</label>
                    <input {...register('likhabAdi')} type="text" className={inp} />
                    {errors.likhabAdi && <p className={fieldErr}>{errors.likhabAdi.message}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Koşullu: Şirket */}
            {kurulusTipi === 'sirket' && (
              <div className="pl-4 border-l-2 border-[var(--color-mavi)] mb-4">
                <label className={lbl}>Şirket Adı *</label>
                <input {...register('sirketAdi')} type="text" className={inp} />
                {errors.sirketAdi && <p className={fieldErr}>{errors.sirketAdi.message}</p>}
              </div>
            )}

            {/* Koşullu: Diğer */}
            {kurulusTipi === 'diger' && (
              <div className="pl-4 border-l-2 border-[var(--color-mavi)] mb-4">
                <label className={lbl}>Kurum Adı *</label>
                <input {...register('kurumAdi')} type="text" className={inp} />
                {errors.kurumAdi && <p className={fieldErr}>{errors.kurumAdi.message}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className={lbl}>Faaliyet Alanı * <span className="text-gray-400 font-normal">(çoklu seçim)</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {FAALIYET_ALANLARI.map((alan) => (
                  <label key={alan.value} className={checkRow}>
                    <input
                      type="checkbox"
                      checked={faaliyetAlanlari.includes(alan.value)}
                      onChange={() => toggleArray('faaliyetAlanlari', alan.value, faaliyetAlanlari)}
                      className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
                    />
                    <span className="text-sm text-gray-700">{alan.label}</span>
                  </label>
                ))}
              </div>
              {errors.faaliyetAlanlari && <p className={fieldErr}>{errors.faaliyetAlanlari.message}</p>}
            </div>

            <div className="mb-4">
              <label className={lbl}>Toplam Çalışan Sayısı *</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {[
                  { value: '1-3', label: '1–3' },
                  { value: '3-10', label: '3–10' },
                  { value: '10-25', label: '10–25' },
                  { value: '25-50', label: '25–50' },
                  { value: '50+', label: '50+' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input
                      {...register('toplamCalisan')}
                      type="radio"
                      value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.toplamCalisan && <p className={fieldErr}>{errors.toplamCalisan.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Şehir *</label>
                <select {...register('sehir')} className={inp}>
                  <option value="">Seçin…</option>
                  {ILLER.map((il) => <option key={il} value={il}>{il}</option>)}
                </select>
                {errors.sehir && <p className={fieldErr}>{errors.sehir.message}</p>}
              </div>
              <div>
                <label className={lbl}>Şirket Telefonu <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                <input {...register('kurumTelefon')} type="tel" className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Web Sitesi <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                <input {...register('webSitesi')} type="url" placeholder="https://..." className={inp} />
              </div>
            </div>
          </section>

          {/* 2. TEMSİLCİ BİLGİLERİ */}
          <section>
            <h2 className={sectionTitle}>2. Temsilci Bilgileri</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Ad Soyad *</label>
                <input {...register('temsilciAdSoyad')} type="text" className={inp} />
                {errors.temsilciAdSoyad && <p className={fieldErr}>{errors.temsilciAdSoyad.message}</p>}
              </div>
              <div>
                <label className={lbl}>E-Posta *</label>
                <input {...register('temsilciEposta')} type="email" className={inp} />
                {errors.temsilciEposta && <p className={fieldErr}>{errors.temsilciEposta.message}</p>}
              </div>
              <div>
                <label className={lbl}>Telefon *</label>
                <input {...register('temsilciTelefon')} type="tel" className={inp} />
                {errors.temsilciTelefon && <p className={fieldErr}>{errors.temsilciTelefon.message}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>Rol *</label>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                {[
                  { value: 'kurucu', label: 'Kurucu / Ortak' },
                  { value: 'yonetici', label: 'Yönetici' },
                  { value: 'calisan', label: 'Çalışan' },
                  { value: 'diger', label: 'Diğer' },
                ].map((opt) => (
                  <label key={opt.value} className={radioRow}>
                    <input
                      {...register('temsilciRol')}
                      type="radio"
                      value={opt.value}
                      className="border-gray-300 accent-[var(--color-mavi)]"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.temsilciRol && <p className={fieldErr}>{errors.temsilciRol.message}</p>}
            </div>
          </section>

          {/* 3. ÖNCELİKLİ BEKLENTİ */}
          <section>
            <h2 className={sectionTitle}>3. Öncelikli Beklenti *</h2>
            <div className="space-y-2">
              {[
                { value: 'tanitim', label: 'Tanıtım / Görünürlük' },
                { value: 'is_agi', label: 'İş Ağı / Bağlantı' },
                { value: 'insan_kaynagi', label: 'İnsan Kaynağı' },
                { value: 'sektorel', label: 'Sektörel İş Birlikleri' },
                { value: 'proje', label: 'Proje Geliştirme' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input
                    {...register('oncelikliIhtiyac')}
                    type="radio"
                    value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.oncelikliIhtiyac && <p className={fieldErr}>{errors.oncelikliIhtiyac.message}</p>}
          </section>

          {/* 4. TANIŞMA */}
          <section>
            <h2 className={sectionTitle}>4. Tanışma</h2>
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

          {/* 5. KATKI ALANLARI */}
          <section>
            <h2 className={sectionTitle}>5. Katkı Alanları</h2>
            <p className="text-sm text-gray-500 mb-3">Nasıl katkı sağlamak istersiniz? (çoklu seçim)</p>
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
          </section>

          {/* 6. DESTEK SEVİYESİ */}
          <section>
            <h2 className={sectionTitle}>6. Destek Seviyesi *</h2>
            <div className="space-y-2">
              {[
                { value: 'kesfetmek', label: 'Keşfetmek istiyoruz' },
                { value: 'destek_olmak', label: 'Destek olmak istiyoruz' },
                { value: 'aktif_isbirligi', label: 'Aktif iş birliği yapmak istiyoruz' },
              ].map((opt) => (
                <label key={opt.value} className={radioRow}>
                  <input
                    {...register('destekSeviyesi')}
                    type="radio"
                    value={opt.value}
                    className="border-gray-300 accent-[var(--color-mavi)]"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.destekSeviyesi && <p className={fieldErr}>{errors.destekSeviyesi.message}</p>}
          </section>

          {/* 7. DOSYA YÜKLEME */}
          <section>
            <h2 className={sectionTitle}>7. Dosya Yükleme <span className="font-normal text-gray-400 text-sm">(opsiyonel)</span></h2>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-mavi)] file:text-white hover:file:bg-[var(--color-mavi-acik)] cursor-pointer"
                />
                {logoFile && (
                  <p className="mt-1 text-xs text-gray-500">{logoFile.name}</p>
                )}
              </div>
              <div>
                <label className={lbl}>Tanıtım Dosyası</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setTanitimFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-mavi)] file:text-white hover:file:bg-[var(--color-mavi-acik)] cursor-pointer"
                />
                {tanitimFile && (
                  <p className="mt-1 text-xs text-gray-500">{tanitimFile.name}</p>
                )}
              </div>
            </div>
          </section>

          {/* 8. ONAYLAR */}
          <section className="space-y-3">
            <label className={checkRow}>
              <input
                {...register('kvkk')}
                type="checkbox"
                className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
              />
              <span className="text-sm text-gray-700">KVKK metnini okudum *</span>
            </label>
            {errors.kvkk && <p className={fieldErr}>{errors.kvkk.message}</p>}
            <label className={checkRow}>
              <input
                {...register('iletisimOnay')}
                type="checkbox"
                className="mt-0.5 rounded border-gray-300 accent-[var(--color-mavi)]"
              />
              <span className="text-sm text-gray-700">İletişim kurulmasını kabul ediyorum *</span>
            </label>
            {errors.iletisimOnay && <p className={fieldErr}>{errors.iletisimOnay.message}</p>}
          </section>

          {/* 9. SUBMIT */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 text-white font-semibold rounded-xl bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Gönderiliyor…' : '📋 Başvuruyu Gönder'}
            </button>
            <p className="mt-3 text-xs text-gray-400 text-center leading-relaxed">
              Kurumsal başvurular değerlendirme sürecinden geçmektedir.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 space-y-1">
              <p>Başvurular değerlendirme sürecinden geçmektedir.</p>
              <p>Bu süreçte, kurumunuzu daha yakından tanımak için kısa bir görüşme yapılır.</p>
              <p>Süreç sonunda, ilgili üyelik yapısına ait katkı/bağlış süreci tarafınıza ayrıca iletilecektir.</p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
