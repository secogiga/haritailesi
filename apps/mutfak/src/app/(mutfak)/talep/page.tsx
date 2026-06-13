'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';

type FeedbackType = 'talep' | 'gorus';
type Step = 'intro' | 'confirm' | 'form' | 'success';

interface Category {
  id: string;
  icon: string;
  label: string;
  desc: string;
  type: FeedbackType;
  bodyHint: string;
  subCategories: string[];
  warning?: string;
}

const USER_TYPES = [
  { value: 'ogrenci', label: 'Öğrenci' },
  { value: 'yeni_mezun', label: 'Yeni Mezun' },
  { value: 'calisan', label: 'Çalışan' },
  { value: 'yonetici', label: 'Yönetici' },
  { value: 'firma_sahibi', label: 'Firma Sahibi' },
  { value: 'kurumsal', label: 'Kurumsal Temsilci' },
];

const CATEGORIES: Category[] = [
  {
    id: 'indirim', icon: '🏷️', label: 'İndirim & Avantaj', desc: 'Eğitim, yazılım, cihaz veya danışmanlık indirimi', type: 'talep',
    bodyHint: 'Hangi ürün, hizmet veya eğitim için indirimli teklif istiyorsunuz? Bağlamı yazın.',
    subCategories: ['Eğitim indirimi', 'Yazılım indirimi', 'Cihaz / ekipman indirimi', 'Danışmanlık hizmeti', 'Kurumsal çözüm talebi', 'Partner fırsatı'],
  },
  {
    id: 'teknik', icon: '🔧', label: 'Teknik Sorun', desc: 'Platform, araç veya erişim problemi', type: 'talep',
    bodyHint: 'Hangi sayfada veya işlemde sorun yaşıyorsunuz? Ne zaman başladı?',
    subCategories: ['Platform kullanım sorunu', 'Panel erişim problemi', 'Veri veya içerik hatası', 'Ödeme & abonelik sorunu', 'Diğer teknik sorun'],
  },
  {
    id: 'egitim', icon: '🎓', label: 'Eğitim & Kariyer', desc: 'Eğitim, sertifika veya kariyer rehberliği', type: 'talep',
    bodyHint: 'Hangi konuda destek arıyorsunuz? Mevcut durumunuzu ve hedefinizi paylaşın.',
    subCategories: ['Eğitim programları', 'Sertifika & belge süreci', 'Kariyer rehberliği', 'Yurt dışı kariyer', 'Mesleki gelişim'],
  },
  {
    id: 'uyelik', icon: '📋', label: 'Üyelik & Başvuru', desc: 'Üyelik işlemleri veya başvuru süreci', type: 'talep',
    bodyHint: 'Başvurunuz veya üyeliğinizle ilgili konuyu açıklayın.',
    subCategories: ['Bireysel üyelik', 'Kurumsal üyelik', 'Başvuru takibi', 'Üyelik iptali', 'Belge güncelleme'],
  },
  {
    id: 'mevzuat', icon: '⚖️', label: 'Mevzuat & Hukuk', desc: 'Mesleki mevzuat veya hukuki soru', type: 'talep',
    bodyHint: 'Hangi mevzuat veya konu hakkında bilgi almak istiyorsunuz? Bağlamı açıklayın.',
    subCategories: ['Harita mevzuatı', 'Lisans & ruhsat', 'Yönetmelik sorgusu', 'Hukuki bilgi talebi'],
    warning: 'Bu sistem hukuki danışmanlık hizmeti vermez. Bilgiler genel nitelikte olup mesleki mevzuata ilişkin bilgilendirme amaçlıdır.',
  },
  {
    id: 'oneri', icon: '💡', label: 'Öneri & Görüş', desc: 'Platform iyileştirme fikri veya geri bildirim', type: 'gorus',
    bodyHint: 'Önerinizi veya görüşünüzü detaylıca paylaşın. Ne değişmeli, neden?',
    subCategories: ['Platform iyileştirme', 'Yeni özellik önerisi', 'İçerik geri bildirimi', 'Genel görüş'],
  },
  {
    id: 'sektor', icon: '🗺️', label: 'Sektörel Soru', desc: 'Harita, CBS veya geomatik teknik sorular', type: 'talep',
    bodyHint: 'Sektörel teknik sorunuzu ve bağlamını yazın.',
    subCategories: ['CBS & analiz', 'Geodezik hesaplar', 'Kadastro & tapu', 'Uzaktan algılama', 'Genel teknik soru'],
  },
  {
    id: 'mentorluk', icon: '🤝', label: 'Mentörlük & Rehberlik', desc: 'Deneyimli bir uzmanla birebir çalışmak ister misiniz?', type: 'talep',
    bodyHint: 'Ne konuda rehberlik arıyorsunuz? Kısa özgeçmişinizi ve hedefinizi paylaşın.',
    subCategories: ['Mentör eşleşmesi', 'Bire bir rehberlik', 'Kariyer koçluğu', 'Proje danışmanlığı'],
  },
  {
    id: 'is-staj', icon: '💼', label: 'İş & Staj Fırsatları', desc: 'İş ilanları, staj imkânları ve proje ortaklığı', type: 'talep',
    bodyHint: 'Hangi tür fırsatlar arıyorsunuz? Deneyim seviyenizi ve tercih ettiğiniz alanları belirtin.',
    subCategories: ['Staj imkânları', 'İş ilanları', 'Proje ortaklığı', 'Serbest çalışma fırsatları'],
  },
  {
    id: 'kurumsal', icon: '🏢', label: 'Kurumsal Destek', desc: 'Kurumunuz için eğitim ortaklığı veya işbirliği', type: 'talep',
    bodyHint: 'Kurumunuzu ve talep ettiğiniz işbirliği türünü kısaca açıklayın.',
    subCategories: ['Eğitim ortaklığı', 'Proje işbirliği', 'Kurumsal üyelik', 'Medya & iletişim'],
  },
];

const EXPECTATIONS = [
  'Bilgi almak', 'Yönlendirme', 'Mentörlük', 'Teknik destek',
  'İndirimli teklif', 'İş fırsatı',
  'Hukuki/mevzuat yönlendirmesi', 'Kurumsal iş birliği', 'Sadece görüş bildirmek istiyorum',
  'Diğer',
];

const QUICK_CHIPS: { label: string; hint: string; icon: string }[] = [
  { label: 'Teknik sorun', icon: '🔧', hint: 'Platformda ya da araçlarda bir sorun yaşıyorum.' },
  { label: 'Kariyer & mentörlük', icon: '🎓', hint: 'Kariyer, eğitim veya mentörlük konusunda destek arıyorum.' },
  { label: 'Mevzuat & sektörel', icon: '⚖️', hint: 'Mesleki mevzuat ya da sektörel bir sorum var.' },
  { label: 'Öneri & görüş', icon: '💡', hint: 'Bir önerim ya da görüşüm var.' },
];

type Ticket = {
  id: string; ticketNo: number; subject: string; type: string;
  status: string; adminReply: string | null; createdAt: string; resolvedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Yeni', reviewing: 'İncelemede', awaiting_info: 'Bilgi Bekleniyor',
  in_progress: 'Ekibimizde', mentoring: 'Mentöre Yönlendirildi',
  suggested: 'Öneri Verildi', resolved: 'Çözüldü', archived: 'Arşivlendi',
};
const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-50 text-red-600 border-red-200',
  reviewing: 'bg-blue-50 text-blue-600 border-blue-200',
  awaiting_info: 'bg-orange-50 text-orange-700 border-orange-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  mentoring: 'bg-purple-50 text-purple-700 border-purple-200',
  suggested: 'bg-teal-50 text-teal-700 border-teal-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};
const STATUS_DOT: Record<string, string> = {
  open: 'bg-red-400', reviewing: 'bg-blue-400', awaiting_info: 'bg-orange-400',
  in_progress: 'bg-amber-400', mentoring: 'bg-purple-400',
  suggested: 'bg-teal-400', resolved: 'bg-green-400', archived: 'bg-gray-400',
};

function detectCategory(text: string): Category {
  const t = text.toLowerCase();
  const score: Record<string, number> = {};

  const rules: Array<[RegExp, string]> = [
    [/indirim|avantaj|yazılım fiyat|cihaz fiyat|paket fiyat/i, 'indirim'],
    [/teknik|sorun|hata|erişim|platform|panel|giriş yapamı|şifre|çalışmıyor|bozuk/i, 'teknik'],
    [/mevzuat|yönetmelik|hukuk|lisans|ruhsat|yasal|kanun|tüzük|dava/i, 'mevzuat'],
    [/eğitim|sertifika|kariyer|mezun|diploma|kurs|öğren|gelişim|yurt dışı/i, 'egitim'],
    [/mentör|mentorluk|koçluk|rehber|bire bir|tecrübe/i, 'mentorluk'],
    [/staj|iş ilanı|iş arıyorum|istihdam|proje ortaklığı|iş fırsatı/i, 'is-staj'],
    [/kurumsal|işbirliği|medya|reklam|sponsorluk|kurum adına/i, 'kurumsal'],
    [/öneri|fikir|iyileştir|özellik|geliştir|şikayet|geri bildirim|görüşüm/i, 'oneri'],
    [/cbs|harita|geodezi|kadastro|uzaktan algılama|koordinat|gis|gnss|arazi/i, 'sektor'],
    [/üyelik|başvuru|abone|abonelik|kayıt|üye olmak/i, 'uyelik'],
  ];

  for (const [pattern, cat] of rules) {
    if (pattern.test(t)) score[cat] = (score[cat] ?? 0) + 1;
  }

  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
  return CATEGORIES.find(c => c.id === best) ?? CATEGORIES[5]!;
}

function extractSubject(text: string): string {
  const first = text.split(/[.\n!?]/)[0]?.trim() ?? '';
  return first.length > 4 ? first.slice(0, 90) : text.slice(0, 90);
}

export default function TalepPage() {
  const { user } = useAuth();
  const token = useToken();

  const [mainTab, setMainTab] = useState<'yeni' | 'taleplerim'>('yeni');

  // ── New ticket state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('intro');
  const [freeText, setFreeText] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [detectedCat, setDetectedCat] = useState<Category>(CATEGORIES[5]!);
  const [confirmedCat, setConfirmedCat] = useState<Category>(CATEGORIES[5]!);
  const [form, setForm] = useState({ subject: '', body: '', expectation: '', urgency: 'normal', userType: '' });
  const [attachments, setAttachments] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ticketNo, setTicketNo] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── My tickets state ──────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  useEffect(() => {
    if (mainTab === 'taleplerim' && token) {
      setTicketsLoading(true);
      mutfakApi.getMyTickets(token)
        .then(setTickets)
        .catch(() => {})
        .finally(() => setTicketsLoading(false));
    }
  }, [mainTab, token]);

  function handleChip(hint: string) {
    setFreeText(prev => prev ? prev : hint);
    textareaRef.current?.focus();
  }

  function handleContinue() {
    if (!freeText.trim()) return;
    const cat = detectCategory(freeText);
    setDetectedCat(cat);
    setConfirmedCat(cat);
    setStep('confirm');
  }

  function handleSelectCategoryDirectly(cat: Category) {
    setDetectedCat(cat);
    setConfirmedCat(cat);
    setFreeText(prev => prev || cat.bodyHint);
    setStep('confirm');
  }

  function handleToForm() {
    setForm(f => ({
      ...f,
      subject: extractSubject(freeText),
      body: freeText,
    }));
    setStep('form');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const validUrls = attachments.filter(u => u.trim());
      const data = await mutfakApi.submitCommunityFeedback(
        {
          ...(user?.email ? { email: user.email } : {}),
          subject: `[${confirmedCat.label}] ${form.subject}`,
          body: form.body,
          type: confirmedCat.type,
          urgency: form.urgency,
          ...(form.expectation ? { expectation: form.expectation } : {}),
          ...(form.userType ? { userType: form.userType } : {}),
          ...(validUrls.length ? { attachmentUrls: validUrls } : {}),
        },
        token ?? undefined,
      );
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
    setShowCategories(false);
    setForm({ subject: '', body: '', expectation: '', urgency: 'normal', userType: '' });
    setAttachments(['']);
    setError('');
    setTicketNo(0);
    setDetectedCat(CATEGORIES[5]!);
    setConfirmedCat(CATEGORIES[5]!);
  }

  const inp =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 bg-white';

  const activeTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'archived');

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#26496b]/50 mb-1">Haritailesi Pusula</p>
        <h1 className="text-xl font-bold text-gray-900 font-display">Bize Anlatın, Birlikte Yönlendirelim</h1>
        <p className="text-sm text-gray-500 mt-1">İhtiyacınızı kendi cümlelerinizle anlatın, sizi doğru desteğe yönlendirelim.</p>
      </div>

      {/* Main tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setMainTab('yeni')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            mainTab === 'yeni'
              ? 'border-[#26496b] text-[#26496b]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          + Yeni Talep
        </button>
        <button
          type="button"
          onClick={() => setMainTab('taleplerim')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            mainTab === 'taleplerim'
              ? 'border-[#26496b] text-[#26496b]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Taleplerim
          {activeTickets.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {activeTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: Yeni Talep ── */}
      {mainTab === 'yeni' && (
        <div className="space-y-4">

          {/* ── Step 1: Serbest metin ── */}
          {step === 'intro' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Merhaba{user?.profile?.displayName ? ` ${user.profile.displayName}` : ''}, nasıl yardımcı olabiliriz?
                </label>
                <textarea
                  ref={textareaRef}
                  rows={4}
                  className={`${inp} resize-none`}
                  placeholder="Yaşadığınız sorunu, ihtiyacınızı veya almak istediğiniz desteği kendi cümlelerinizle anlatın…"
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleContinue(); }}
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{freeText.length} / 2000</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {QUICK_CHIPS.map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleChip(chip.hint)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#26496b]/40 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-all"
                    >
                      <span>{chip.icon}</span>
                      {chip.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!freeText.trim()}
                  onClick={handleContinue}
                  className="mt-4 w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-40 text-sm"
                >
                  Devam Et →
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowCategories(v => !v)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#26496b] transition-colors font-medium"
                >
                  {showCategories ? '↑ Kategorileri gizle' : 'Konu seçerek başlamak ister misiniz? →'}
                </button>
              </div>

              {showCategories && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Konu Seçin</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoryDirectly(cat)}
                        className="text-left p-3 rounded-xl border border-gray-100 hover:border-[#26496b]/30 hover:bg-[#26496b]/5 transition-all group"
                      >
                        <span className="text-lg mb-1 block">{cat.icon}</span>
                        <p className="text-xs font-bold text-gray-800 leading-tight group-hover:text-[#26496b]">{cat.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Kategori onayı ── */}
          {step === 'confirm' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <button type="button" onClick={() => setStep('intro')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#26496b] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Düzenle
              </button>

              <div className="bg-gray-50 rounded-xl border border-gray-100 px-3.5 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Anlattıklarınız</p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{freeText}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Bunu{' '}
                  <span className="text-[#26496b] font-bold">
                    {detectedCat.icon} {detectedCat.label}
                  </span>
                  {' '}olarak değerlendirdik — doğru mu?
                </p>

                {confirmedCat.warning && (
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800">
                    <span className="flex-shrink-0">⚠️</span>
                    <p>{confirmedCat.warning}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setConfirmedCat(cat)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        confirmedCat.id === cat.id
                          ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[#26496b]/30'
                      }`}
                    >
                      <span className="block text-base mb-0.5">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kim olduğunuz</label>
                  <select className={inp} value={form.userType} onChange={e => setForm(f => ({ ...f, userType: e.target.value }))}>
                    <option value="">Belirtmek istemiyorum</option>
                    {USER_TYPES.map(ut => <option key={ut.value} value={ut.value}>{ut.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Aciliyet</label>
                  <select className={inp} value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                    <option value="dusuk">Düşük — acele değil</option>
                    <option value="normal">Normal</option>
                    <option value="yuksek">Yüksek — bu hafta içinde</option>
                    <option value="kritik">Kritik — bugün ihtiyacım var</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToForm}
                className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors text-sm"
              >
                Bu bilgilerle devam et →
              </button>
            </div>
          )}

          {/* ── Step 3: Form ── */}
          {step === 'form' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <button type="button" onClick={() => setStep('confirm')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="inline-flex items-center gap-2 bg-[#26496b]/10 text-[#26496b] text-xs font-semibold px-2.5 py-1 rounded-lg">
                  <span>{confirmedCat.icon}</span>
                  {confirmedCat.label}
                </span>
                {user && (
                  <span className="ml-auto text-xs text-gray-400 hidden sm:block truncate max-w-[160px]">{user.email}</span>
                )}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Konu başlığı <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    className={inp}
                    placeholder="İhtiyacınızı kısaca özetleyin"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Detaylar <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    className={`${inp} resize-none`}
                    placeholder={confirmedCat.bodyHint}
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.body.length} / 2000</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Beklentiniz</label>
                  <select className={inp} value={form.expectation} onChange={e => setForm(f => ({ ...f, expectation: e.target.value }))}>
                    <option value="">Seçin (opsiyonel)</option>
                    {EXPECTATIONS.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Dosya Bağlantıları <span className="text-gray-400 normal-case font-normal">(opsiyonel)</span>
                  </label>
                  <div className="space-y-2">
                    {attachments.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="url"
                          className={`${inp} flex-1`}
                          placeholder="https://drive.google.com/… veya başka bağlantı"
                          value={url}
                          onChange={e => setAttachments(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                        />
                        {attachments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                            className="px-2 text-gray-400 hover:text-red-500 transition-colors text-xl leading-none flex-shrink-0"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {attachments.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => [...prev, ''])}
                        className="text-xs text-[#26496b] hover:underline font-medium"
                      >
                        + Bağlantı ekle
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Ekran görüntüsü veya belge için Google Drive, Dropbox vb. bağlantı ekleyebilirsiniz.</p>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm"
                >
                  {busy ? 'Gönderiliyor…' : 'Destek Talebi Oluştur'}
                </button>
              </form>
            </div>
          )}

          {/* ── Step 4: Başarı ── */}
          {step === 'success' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Talebiniz İletildi</h2>
              <p className="text-sm text-gray-500 mb-5">Ekibimiz en kısa sürede değerlendirip dönüş yapacak.</p>

              <div className="inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#26496b]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#26496b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Talep Numarası</p>
                  <p className="text-lg font-bold text-[#26496b] font-mono tracking-wide">
                    HDM-{new Date().getFullYear()}-{String(ticketNo).padStart(4, '0')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => { reset(); setMainTab('taleplerim'); }}
                  className="text-sm font-semibold text-[#26496b] hover:underline"
                >
                  Taleplerime Git →
                </button>
                <button onClick={reset} className="text-sm text-gray-400 hover:underline">
                  Yeni talep gönder
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Taleplerim ── */}
      {mainTab === 'taleplerim' && (
        <>
          {ticketsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400 font-medium text-sm">Henüz talep göndermediniz.</p>
              <button
                onClick={() => setMainTab('yeni')}
                className="mt-4 text-sm font-semibold text-[#26496b] hover:underline"
              >
                İlk talebinizi gönderin →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(ticket => {
                const isExpanded = expandedTicket === ticket.id;
                const subject = ticket.subject.replace(/^\[([^\]]+)\]\s*/, '');
                const categoryMatch = ticket.subject.match(/^\[([^\]]+)\]/);
                const categoryLabel = categoryMatch?.[1] ?? ticket.type;
                return (
                  <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    >
                      <span className="text-xs font-bold text-[#26496b] font-mono bg-[#26496b]/8 px-2 py-0.5 rounded flex-shrink-0">
                        HDM-{new Date(ticket.createdAt).getFullYear()}-{String(ticket.ticketNo).padStart(4, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${STATUS_BADGE[ticket.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOT[ticket.status] ?? 'bg-gray-400'}`} />
                            {STATUS_LABEL[ticket.status] ?? ticket.status}
                          </span>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{categoryLabel}</span>
                          {ticket.adminReply && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">💬 Yanıt var</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{subject}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
                        {ticket.resolvedAt && (
                          <p className="text-xs text-green-600 font-medium pt-3">
                            ✓ {new Date(ticket.resolvedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde çözüldü
                          </p>
                        )}
                        {ticket.adminReply ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 pt-3">
                            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Ekip Yanıtı</p>
                            <p className="text-sm text-blue-900 leading-relaxed">{ticket.adminReply}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                            <p className="text-xs text-gray-400">Ekibimiz henüz yanıt vermedi. En kısa sürede geri dönüş yapacağız.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
