'use client';

import { useRef, useState } from 'react';

type FeedbackType = 'talep' | 'gorus';
type Step = 'intro' | 'confirm' | 'form' | 'success';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  type?: 'answer' | 'routing' | 'clarify';
  category?: string;
  subCategory?: string;
  suggestedSubject?: string;
}

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
    id: 'teknik', icon: '🔧', label: 'Teknik Destek',
    desc: 'Platform, araç, yazılım, sistem veya teknik süreçler',
    type: 'talep',
    bodyHint: 'Hangi sayfada veya işlemde sorun yaşıyorsunuz? Ne zaman başladı?',
    subCategories: ['Platform kullanım sorunu', 'Haritailesi panel erişimi', 'Veri / dosya / çıktı problemi', 'Harita, CBS, geomatik teknik sorusu', 'Yazılım / uygulama / otomasyon sorunu', 'Ölçme, kadastro, proje, saha süreçleri', 'Teknik danışman ihtiyacı'],
  },
  {
    id: 'egitim', icon: '🎓', label: 'Eğitim & Kariyer',
    desc: 'Eğitim, sertifika, kariyer yönü veya mesleki gelişim',
    type: 'talep',
    bodyHint: 'Hangi konuda destek arıyorsunuz? Mevcut durumunuzu ve hedefinizi paylaşın.',
    subCategories: ['Eğitim önerisi', 'Sertifika önerisi', 'Kariyer yönlendirme', 'Yeni mezun desteği', 'CV / portföy / LinkedIn desteği', 'Mülakat hazırlığı', 'Uzmanlaşma alanı seçimi', "Mesleğin Gelecekleri programına yönlendirme"],
  },
  {
    id: 'uyelik', icon: '📋', label: 'Üyelik & Başvuru',
    desc: 'Üyelik işlemleri, başvuru süreci, ödeme ve avantajlar',
    type: 'talep',
    bodyHint: 'Başvurunuz veya üyeliğinizle ilgili konuyu açıklayın.',
    subCategories: ['Bireysel üyelik başvurusu', 'Kurumsal üyelik başvurusu', 'Başvuru durumu', 'Üyelik yenileme', 'Katkı / bağış süreci', 'Üye paneli erişimi', 'Üyelik avantajları hakkında bilgi'],
  },
  {
    id: 'mevzuat', icon: '⚖️', label: 'Mevzuat & Hukuk',
    desc: 'Mesleki mevzuat, uygulama yorumu veya hukuki yönlendirme',
    type: 'talep',
    bodyHint: 'Hangi mevzuat veya konu hakkında bilgi almak istiyorsunuz? Bağlamı açıklayın.',
    subCategories: ['Mesleki mevzuat sorusu', 'Kadastro / imar / tapu / harita mevzuatı', 'Sözleşme ve hizmet süreci soruları', 'Kurumsal süreçlerde hukuki yönlendirme', 'Uyuşmazlık ön değerlendirme', 'Uzman hukukçuya yönlendirme ihtiyacı'],
    warning: 'Bu sistem hukuki danışmanlık hizmeti vermez. Paylaşılan bilgiler genel nitelikte olup mesleki mevzuata ilişkin bilgilendirme amaçlıdır.',
  },
  {
    id: 'sektor', icon: '🗺️', label: 'Sektörel Soru',
    desc: 'Harita, CBS, geomatik, sektör dinamikleri ve mesleki gelecek',
    type: 'talep',
    bodyHint: 'Sektörel teknik sorunuzu ve bağlamını yazın.',
    subCategories: ['Sektörde hangi alan gelişiyor?', 'Hangi yazılımlar öne çıkıyor?', 'İş ve uzmanlık alanları', 'Kamu / özel sektör farkları', 'Mesleki gelecek analizi', 'Sektörel rapor ihtiyacı'],
  },
  {
    id: 'oneri', icon: '💡', label: 'Öneri & Görüş',
    desc: 'Platform, vakıf veya sektörel çalışmalar için geri bildirim',
    type: 'gorus',
    bodyHint: 'Önerinizi veya görüşünüzü detaylıca paylaşın. Ne değişmeli, neden?',
    subCategories: ['Platform geliştirme önerisi', 'Eğitim önerisi', 'Etkinlik önerisi', 'Vakıf projesi önerisi', 'İş birliği önerisi', 'Geri bildirim', 'Şikayet / memnuniyet bildirimi'],
  },
  {
    id: 'mentorluk', icon: '🤝', label: 'Mentörlük & Rehberlik',
    desc: 'Deneyimli meslektaştan birebir destek veya kariyer rehberliği',
    type: 'talep',
    bodyHint: 'Ne konuda rehberlik arıyorsunuz? Kısa özgeçmişinizi ve hedefinizi paylaşın.',
    subCategories: ['Mentörlük almak istiyorum', 'Mentör olmak istiyorum', 'Proje fikrimi değerlendirmek istiyorum', 'Kariyerimde yön arıyorum', 'Mesleki motivasyon desteği', 'Öğrenci / yeni mezun rehberliği', 'Uzman eşleştirme talebi'],
  },
  {
    id: 'is-staj', icon: '💼', label: 'İş, Staj & Fırsatlar',
    desc: 'İş, staj, proje, freelance veya gönüllülük fırsatları',
    type: 'talep',
    bodyHint: 'Hangi tür fırsatlar arıyorsunuz? Deneyim seviyenizi ve tercih ettiğiniz alanları belirtin.',
    subCategories: ['İş arıyorum', 'Staj arıyorum', 'Gönüllü olmak istiyorum', 'Proje ekibine katılmak istiyorum', 'Firma ile eşleşmek istiyorum', 'İlan vermek istiyorum', 'Aday havuzuna dahil olmak istiyorum'],
  },
  {
    id: 'indirim', icon: '🏷️', label: 'İndirim & Avantaj',
    desc: 'Eğitim, yazılım, cihaz, hizmet veya danışmanlık indirimi',
    type: 'talep',
    bodyHint: 'Hangi ürün, hizmet veya eğitim için indirimli teklif istiyorsunuz? Bağlamı yazın.',
    subCategories: ['Eğitim indirimi', 'Yazılım indirimi', 'Cihaz / ekipman indirimi', 'Danışmanlık hizmeti', 'Firma hizmet teklifi', 'Kurumsal çözüm talebi', 'Partner fırsatı önerisi'],
  },
  {
    id: 'kurumsal', icon: '🏢', label: 'Kurumsal Destek',
    desc: 'Şirket, kurum veya STK için iş birliği, eğitim ve danışmanlık',
    type: 'talep',
    bodyHint: 'Kurumunuzu ve talep ettiğiniz işbirliği türünü kısaca açıklayın.',
    subCategories: ['Kurumsal üyelik', 'Firma tanıtımı', 'Eğitim talebi', 'Etkinlik sponsorluğu', 'Personel / stajyer ihtiyacı', 'Haritailesi Vitrin profili', 'İş birliği görüşmesi', 'Kurumsal danışmanlık'],
  },
];

// PDF bölüm 23: 6 ana kart + 4 ek kart
const PRIMARY_CAT_IDS = ['teknik', 'egitim', 'uyelik', 'mevzuat', 'sektor', 'oneri'];

const EXPECTATIONS = [
  'Bilgi almak', 'Yönlendirme', 'Mentörlük', 'Eğitim/etkinlik önerisi', 'Teknik destek',
  'Hukuki/mevzuat yönlendirmesi', 'İndirimli teklif', 'İş/staj fırsatı',
  'Kurumsal iş birliği', 'Sadece görüş bildirmek istiyorum',
];

const PREVIOUS_STEPS = [
  { value: '', label: 'Seçin (opsiyonel)' },
  { value: 'hayir', label: 'Hayır, ilk kez başvuruyorum' },
  { value: 'denedim', label: 'Evet, denedim ama sonuç alamadım' },
  { value: 'devam', label: 'Evet, süreç hâlâ devam ediyor' },
  { value: 'uzman', label: 'Daha önce bir uzmana danıştım' },
];

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

const ECOSYSTEM_HINTS: Record<string, Array<{ icon: string; label: string; desc: string; href: string }>> = {
  egitim: [
    { icon: '📚', label: 'Haritakademi', desc: 'Eğitim programları ve kursları', href: `${SAHNE_URL}/egitim` },
    { icon: '🌟', label: "Mesleğin Gelecekleri", desc: 'Burs ve kariyer destekleri', href: `${SAHNE_URL}/meslegin-gelecekleri` },
  ],
  'is-staj': [
    { icon: '💼', label: 'Haritakariyer İlanları', desc: 'İş ve staj ilanlarına göz atın', href: `${SAHNE_URL}/ilanlar` },
  ],
  mentorluk: [
    { icon: '🤝', label: 'Mentör Eşleşme', desc: 'Mentörlük başvurusu yapın', href: `${SAHNE_URL}/mentorlesme` },
    { icon: '📚', label: 'Haritakademi', desc: 'Mesleki gelişim eğitimleri', href: `${SAHNE_URL}/egitim` },
  ],
  kurumsal: [
    { icon: '🏢', label: 'Vitrin', desc: 'Kurumsal profil ve tanıtım sayfanız', href: `${SAHNE_URL}/magaza` },
  ],
  indirim: [
    { icon: '📚', label: 'Haritakademi', desc: 'İndirimli eğitim paketleri', href: `${SAHNE_URL}/egitim` },
    { icon: '🏢', label: 'Vitrin', desc: 'Partner firma katalog ve indirimleri', href: `${SAHNE_URL}/magaza` },
  ],
  sektor: [
    { icon: '📚', label: 'Haritakademi', desc: 'Teknik eğitim ve sektörel kurslar', href: `${SAHNE_URL}/egitim` },
  ],
  mevzuat: [
    { icon: '📚', label: 'Haritakademi', desc: 'Mevzuat ve hukuk eğitimleri', href: `${SAHNE_URL}/egitim` },
  ],
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

export default function DestekPage() {
  const [step, setStep] = useState<Step>('intro');
  const [freeText, setFreeText] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [showFreeText, setShowFreeText] = useState(false);
  const [detectedCat, setDetectedCat] = useState<Category>(CATEGORIES[5]!);
  const [confirmedCat, setConfirmedCat] = useState<Category>(CATEGORIES[5]!);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', body: '',
    expectation: '', urgency: 'normal', userType: '', previousStep: '',
    kvkk: false, isAnonymous: false,
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ticketNo, setTicketNo] = useState(0);
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');

  const [showGptChat, setShowGptChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

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
        // silently ignore — user can add URL manually
      } finally {
        setUploadingFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const primaryCats = CATEGORIES.filter(c => PRIMARY_CAT_IDS.includes(c.id));
  const extraCats = CATEGORIES.filter(c => !PRIMARY_CAT_IDS.includes(c.id));

  function handleContinue() {
    if (!freeText.trim()) return;
    if (honeypot || Date.now() - loadTime < 2000) return;
    const cat = detectCategory(freeText);
    setDetectedCat(cat);
    setConfirmedCat(cat);
    setSelectedSubCategory('');
    setStep('confirm');
  }

  function handleSelectCategory(cat: Category) {
    setDetectedCat(cat);
    setConfirmedCat(cat);
    setSelectedSubCategory('');
    setStep('confirm');
  }

  function handleCategoryChange(cat: Category) {
    setConfirmedCat(cat);
    setSelectedSubCategory('');
  }

  function handleToForm() {
    setForm(f => ({
      ...f,
      subject: freeText ? extractSubject(freeText) : confirmedCat.label,
      body: freeText,
    }));
    setStep('form');
  }

  async function handleGptSend() {
    const msg = chatInput.trim();
    if (!msg || chatBusy) return;
    const userMsg: ChatMsg = { role: 'user', content: msg };
    setChatHistory(h => [...h, userMsg]);
    setChatInput('');
    setChatBusy(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await fetch(`${API_URL}/api/v1/community/gpt-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: chatHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error('API hatası');
      const data = await res.json() as {
        type: 'answer' | 'routing' | 'clarify';
        content: string;
        category?: string;
        subCategory?: string;
        suggestedSubject?: string;
      };
      const assistantMsg: ChatMsg = { role: 'assistant', ...data };
      setChatHistory(h => [...h, assistantMsg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', content: 'Şu an bağlanamıyorum. Formu doğrudan doldurabilirsiniz.' }]);
    } finally {
      setChatBusy(false);
    }
  }

  function handleGptRouting(msg: ChatMsg) {
    const cat =
      CATEGORIES.find(c => c.id === msg.category) ??
      CATEGORIES.find(c => c.label.toLowerCase().includes((msg.category ?? '').toLowerCase())) ??
      CATEGORIES[5]!;
    setConfirmedCat(cat);
    setDetectedCat(cat);
    if (msg.subCategory) setSelectedSubCategory(msg.subCategory);
    const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user')?.content ?? '';
    setFreeText(lastUserMsg);
    if (msg.suggestedSubject) setForm(f => ({ ...f, subject: msg.suggestedSubject ?? '' }));
    setShowGptChat(false);
    setStep('confirm');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.kvkk) return;
    if (honeypot) return;
    setBusy(true);
    setError('');
    try {
      const validUrls = attachments.filter(u => u.trim());
      const bodyFinal = form.previousStep
        ? `${form.body}\n\n[Bu konuda daha önce: ${PREVIOUS_STEPS.find(p => p.value === form.previousStep)?.label ?? form.previousStep}]`
        : form.body;
      const res = await fetch(`${API_URL}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(form.isAnonymous ? { isAnonymous: true } : {
            ...(form.name ? { name: form.name } : {}),
            ...(form.email ? { email: form.email } : {}),
            ...(form.phone ? { phone: form.phone } : {}),
          }),
          subject: `[${confirmedCat.label}] ${form.subject}`,
          body: bodyFinal,
          type: confirmedCat.type,
          source: 'web',
          urgency: form.urgency,
          ...(selectedSubCategory ? { subCategory: selectedSubCategory } : {}),
          ...(form.expectation ? { expectation: form.expectation } : {}),
          ...(form.userType ? { userType: form.userType } : {}),
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
    setShowMore(false);
    setShowFreeText(false);
    setSelectedSubCategory('');
    setShowGptChat(false);
    setChatHistory([]);
    setChatInput('');
    setForm({ name: '', email: '', phone: '', subject: '', body: '', expectation: '', urgency: 'normal', userType: '', previousStep: '', kvkk: false, isAnonymous: false });
    setAttachments([]);
    setUploadingFiles({});
    setError('');
    setTicketNo(0);
    setDetectedCat(CATEGORIES[5]!);
    setConfirmedCat(CATEGORIES[5]!);
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 focus:border-[var(--color-mavi)] placeholder-gray-400 bg-white';

  return (
    <main>
      {/* ── Hero ── */}
      <section className="bg-[var(--color-mavi)] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Haritailesi Pusula</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ne Konuda Desteğe İhtiyacınız Var?</h1>
          <p className="text-white/70 max-w-xl">
            Konu başlığınızı seçin, ihtiyacınızı anlatın; size en uygun desteği birlikte bulalım.
          </p>
        </div>
      </section>

      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4">

          {/* ── Step 1: Giriş — Kategori Seçimi ── */}
          {step === 'intro' && (
            <div className="space-y-4">

              {/* HaritailesiGPT Chat Widget */}
              {showGptChat && (
                <div className="bg-white rounded-2xl border border-[var(--color-mavi)]/20 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-mavi)]/5 border-b border-[var(--color-mavi)]/10">
                    <div className="flex items-center gap-2">
                      <span>🤖</span>
                      <span className="text-sm font-bold text-[var(--color-mavi)]">HaritailesiGPT</span>
                      <span className="text-[10px] font-semibold bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] px-1.5 py-0.5 rounded-full">Beta</span>
                    </div>
                    <button onClick={() => setShowGptChat(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">×</button>
                  </div>
                  <div className="h-72 overflow-y-auto p-4 space-y-3">
                    {chatHistory.length === 0 && (
                      <p className="text-xs text-gray-400 text-center pt-10">İhtiyacınızı doğal dille anlatın, size en uygun desteğe yönlendireyim.</p>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[var(--color-mavi)] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.type === 'routing' && (
                            <button
                              onClick={() => handleGptRouting(msg)}
                              className="mt-2.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors w-full text-center"
                            >
                              Talep Oluştur →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatBusy && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t border-gray-100 p-3 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleGptSend(); } }}
                      placeholder="İhtiyacınızı yazın…"
                      disabled={chatBusy}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 focus:border-[var(--color-mavi)] disabled:opacity-60 bg-white"
                    />
                    <button
                      onClick={() => void handleGptSend()}
                      disabled={!chatInput.trim() || chatBusy}
                      className="px-4 py-2 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
                    >
                      Gönder
                    </button>
                  </div>
                </div>
              )}

              {/* Kategori Kartları — Birincil Giriş (PDF bölüm 23) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Konu Seçin</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {primaryCats.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className="text-left p-4 rounded-xl border border-gray-100 hover:border-[var(--color-mavi)]/40 hover:bg-[var(--color-mavi)]/5 transition-all group"
                    >
                      <span className="text-2xl mb-2 block">{cat.icon}</span>
                      <p className="text-xs font-bold text-gray-800 leading-tight group-hover:text-[var(--color-mavi)] mb-1">{cat.label}</p>
                      <p className="text-[11px] text-gray-400 leading-snug">{cat.desc}</p>
                    </button>
                  ))}
                </div>

                {/* 4 Ek Kart — genişletilebilir */}
                {!showMore ? (
                  <button
                    type="button"
                    onClick={() => setShowMore(true)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-[var(--color-mavi)] font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Daha fazla konu
                    <span className="text-gray-300 font-normal">· Mentörlük · İş & Staj · İndirim · Kurumsal</span>
                  </button>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {extraCats.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className="text-left p-3 rounded-xl border border-gray-100 hover:border-[var(--color-mavi)]/40 hover:bg-[var(--color-mavi)]/5 transition-all group"
                        >
                          <span className="text-xl mb-1.5 block">{cat.icon}</span>
                          <p className="text-[11px] font-bold text-gray-700 leading-tight group-hover:text-[var(--color-mavi)]">{cat.label}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMore(false)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      Gizle
                    </button>
                  </div>
                )}
              </div>

              {/* Ayraç */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">ya da</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Serbest metin + GPT */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {!showFreeText ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => { setShowFreeText(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
                      className="w-full text-left text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-xl px-4 py-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all flex items-center gap-2.5"
                    >
                      <span className="text-base">✏️</span>
                      Kendi cümlelerinizle anlatmak ister misiniz?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGptChat(v => !v)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--color-mavi)]/30 text-[var(--color-mavi)]/70 hover:border-[var(--color-mavi)]/60 hover:text-[var(--color-mavi)] hover:bg-[var(--color-mavi)]/3 transition-all text-xs font-semibold"
                    >
                      <span>🤖</span>
                      {showGptChat ? "HaritailesiGPT'yi kapat" : 'HaritailesiGPT ile önce konuşun (Beta)'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      İhtiyacınızı kendi cümlelerinizle anlatın
                    </label>
                    <textarea
                      ref={textareaRef}
                      rows={4}
                      className={`${inp} resize-none`}
                      placeholder="Yaşadığınız sorunu, ihtiyacınızı veya almak istediğiniz desteği anlatın…"
                      value={freeText}
                      onChange={e => setFreeText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleContinue(); }}
                    />
                    <p className="text-[11px] text-gray-400 mt-1 text-right">{freeText.length} / 2000</p>
                    {/* Honeypot — bot tuzağı */}
                    <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }} />
                    <button
                      type="button"
                      disabled={!freeText.trim()}
                      onClick={handleContinue}
                      className="mt-3 w-full bg-[var(--color-mavi)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
                    >
                      Devam Et →
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGptChat(v => !v)}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[var(--color-mavi)]/30 text-[var(--color-mavi)]/70 hover:text-[var(--color-mavi)] transition-all text-xs font-semibold"
                    >
                      <span>🤖</span>
                      {showGptChat ? "HaritailesiGPT'yi kapat" : 'HaritailesiGPT ile önce konuşun (Beta)'}
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center">
                <a href="/destek/takip" className="text-xs text-gray-400 hover:text-[var(--color-mavi)] transition-colors font-medium">
                  Mevcut talebimin durumunu sorgula →
                </a>
              </div>
            </div>
          )}

          {/* ── Step 2: Kategori Onayı ── */}
          {step === 'confirm' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <button type="button" onClick={() => setStep('intro')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[var(--color-mavi)] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </button>

              {freeText && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-3.5 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Anlattıklarınız</p>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{freeText}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {freeText
                    ? <>Bunu <span className="text-[var(--color-mavi)] font-bold">{detectedCat.icon} {detectedCat.label}</span> olarak değerlendirdik — doğru mu?</>
                    : 'Kategoriyi değiştirebilirsiniz:'}
                </p>

                {confirmedCat.warning && (
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800">
                    <span className="flex-shrink-0">⚠️</span>
                    <p>{confirmedCat.warning}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`text-left p-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                        confirmedCat.id === cat.id
                          ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)]/5 text-[var(--color-mavi)]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[var(--color-mavi)]/30'
                      }`}
                    >
                      <span className="block text-base mb-0.5">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alt kategori */}
              {confirmedCat.subCategories.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alt Konu</label>
                  <div className="flex flex-wrap gap-1.5">
                    {confirmedCat.subCategories.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubCategory(prev => prev === sub ? '' : sub)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          selectedSubCategory === sub
                            ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)]/5 text-[var(--color-mavi)]'
                            : 'border-gray-200 text-gray-600 hover:border-[var(--color-mavi)]/30'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ekosistem ipucu */}
              {ECOSYSTEM_HINTS[confirmedCat.id] && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                  <p className="text-[11px] font-bold text-blue-500/70 uppercase tracking-widest mb-2">Hemen bakabilirsiniz</p>
                  <div className="flex flex-col gap-1.5">
                    {ECOSYSTEM_HINTS[confirmedCat.id]!.map(hint => (
                      <a key={hint.href} href={hint.href} target="_blank" rel="noreferrer"
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
                className="w-full bg-[var(--color-mavi)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
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
                <span className="inline-flex items-center gap-2 bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] text-xs font-semibold px-2.5 py-1 rounded-lg">
                  <span>{confirmedCat.icon}</span>
                  {confirmedCat.label}
                  {selectedSubCategory && <span className="text-[var(--color-mavi)]/60">· {selectedSubCategory}</span>}
                </span>
              </div>

              <div className="px-5 pt-3 pb-1">
                <p className="text-xs text-gray-400">
                  İhtiyacınızı ne kadar açık anlatırsanız, sizi doğru kişi, içerik, eğitim, mentör veya çözümle o kadar hızlı eşleştirebiliriz.
                </p>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="p-5 pt-3 space-y-4">

                {/* Anonim */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <input
                    type="checkbox"
                    checked={form.isAnonymous}
                    onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[var(--color-mavi)] flex-shrink-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Anonim gönder</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Kişisel bilgileriniz kaydedilmez. Yanıt almak için e-posta girmeniz gerekir.</p>
                  </div>
                </label>

                {/* Ad Soyad + Telefon */}
                {!form.isAnonymous && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Ad Soyad</label>
                      <input type="text" className={inp} placeholder="Adınız Soyadınız" maxLength={100}
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Telefon</label>
                      <input type="tel" className={inp} placeholder="05xx xxx xx xx" maxLength={20}
                        value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    E-posta {!form.isAnonymous && <span className="text-red-400">*</span>}
                  </label>
                  <input type="email" required={!form.isAnonymous} className={inp} placeholder="yanit@gelsin.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <p className="text-[11px] text-gray-400 mt-1">Yanıtınızı bu adrese göndereceğiz.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Konu başlığı <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required minLength={3} maxLength={120} className={inp}
                    placeholder="İhtiyacınızı kısaca özetleyin"
                    value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Detaylar <span className="text-red-400">*</span>
                  </label>
                  <textarea required minLength={10} maxLength={2000} rows={5} className={`${inp} resize-none`}
                    placeholder={confirmedCat.bodyHint}
                    value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.body.length} / 2000</p>
                </div>

                {/* PDF bölüm 12: "Daha önce bu konuda bir adım attınız mı?" */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Bu konuda daha önce adım attınız mı?
                  </label>
                  <select className={inp} value={form.previousStep} onChange={e => setForm(f => ({ ...f, previousStep: e.target.value }))}>
                    {PREVIOUS_STEPS.map(ps => <option key={ps.value} value={ps.value}>{ps.label}</option>)}
                  </select>
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
                    Ek Dosya / Bağlantı <span className="text-gray-400 normal-case font-normal">(opsiyonel, maks. 3)</span>
                  </label>
                  <div className="space-y-2">
                    {/* Yüklenen dosyalar / URL'ler */}
                    {attachments.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600">
                        <span className="text-base flex-shrink-0">{url.startsWith('http://localhost') || url.includes('/uploads/') ? '📎' : '🔗'}</span>
                        <span className="flex-1 truncate">{url.split('/').pop() ?? url}</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0">×</button>
                      </div>
                    ))}

                    {/* Upload spinner */}
                    {Object.keys(uploadingFiles).length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse px-1">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Yükleniyor…
                      </div>
                    )}

                    {/* Dosya seç + URL ekle butonları */}
                    {attachments.length < 3 && (
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                          multiple
                          className="hidden"
                          onChange={e => void handleFileUpload(e.target.files)}
                        />
                        <button type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-[var(--color-mavi)]/50 hover:text-[var(--color-mavi)] transition-colors">
                          📂 Dosya seç
                        </button>
                        <button type="button"
                          onClick={() => {
                            const url = prompt('Bağlantı URL\'si:');
                            if (url?.trim()) setAttachments(prev => [...prev, url.trim()]);
                          }}
                          className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-[var(--color-mavi)]/50 hover:text-[var(--color-mavi)] transition-colors">
                          🔗 URL ekle
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400">JPG, PNG, PDF, Word, Excel — maks. 5 MB. Ya da Google Drive / Dropbox bağlantısı ekleyin.</p>
                  </div>
                </div>

                {/* KVKK onayı */}
                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" required checked={form.kvkk}
                      onChange={e => setForm(f => ({ ...f, kvkk: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[var(--color-mavi)] flex-shrink-0" />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Kişisel verilerin işlenmesi: </span>
                      Destek talebi kapsamında paylaştığım kişisel verilerin Haritailesi Vakfı tarafından işlenmesine onay veriyorum.
                      Verilerim yalnızca talebimin yanıtlanması amacıyla kullanılacak, üçüncü taraflarla (partner, mentör) ancak açık rızamla paylaşılacaktır.
                    </span>
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || !form.kvkk}
                  className="w-full bg-[var(--color-mavi)] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
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
              <p className="text-sm text-gray-500 mb-5">
                Haritailesi ekibi talebinizi inceleyerek sizi en uygun destek kanalına yönlendirecek.
                {form.email && <> Yanıt <span className="font-medium text-gray-700">{form.email}</span> adresine gidecek.</>}
              </p>

              <div className="inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-mavi)]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[var(--color-mavi)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Talep Numarası</p>
                  <p className="text-lg font-bold text-[var(--color-mavi)] font-mono tracking-wide">
                    HDM-{new Date().getFullYear()}-{String(ticketNo).padStart(4, '0')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-6">Bu numarayı kaydederek talebinizin durumunu sorgulayabilirsiniz.</p>

              {ECOSYSTEM_HINTS[confirmedCat.id] && (
                <div className="mb-6 text-left">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Bu konuyla ilgili kaynaklar</p>
                  <div className="grid gap-2">
                    {ECOSYSTEM_HINTS[confirmedCat.id]!.map(hint => (
                      <a key={hint.href} href={hint.href} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 bg-[var(--color-mavi)]/5 hover:bg-[var(--color-mavi)]/10 rounded-xl px-4 py-3 transition-colors group">
                        <span className="text-xl flex-shrink-0">{hint.icon}</span>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-mavi)] leading-tight">{hint.label}</p>
                          <p className="text-xs text-gray-400 truncate">{hint.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-[var(--color-mavi)]/30 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <a href="/destek/takip" className="text-sm font-semibold text-[var(--color-mavi)] hover:underline">
                  Talep durumunu sorgula →
                </a>
                <span className="text-gray-200">|</span>
                <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600">
                  Yeni talep gönder
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
