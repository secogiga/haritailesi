'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';
const IBAN = process.env['NEXT_PUBLIC_IBAN'] ?? 'TR12 0006 2000 0000 0000 0000 00';
const BANK_NAME = process.env['NEXT_PUBLIC_BANK_NAME'] ?? 'Haritailesi Vakfı – İş Bankası';

type MainTab = 'uyelik' | 'genel' | 'kurumsal';
type PayMethod = 'iyzico' | 'havale';
type Step = 'form' | 'bank' | 'done';

const UYELIK_TIERS = [
  {
    id: 'haritailesi_genc',
    label: 'Haritailesi Genç',
    sublabel: 'Öğrenci Üyeliği',
    price: 0,
    free: true,
    donCat: 'genc',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-200 hover:border-emerald-300',
    activeBorder: 'border-emerald-500 bg-emerald-50/50',
    description: 'Lisans ve lisansüstü öğrencilere ücretsiz. Mesleğin gençleriyle ağ kur.',
  },
  {
    id: 'new_graduate_member',
    label: 'Mesleğin Geleceği',
    sublabel: 'İlk 2 Yıl Ücretsiz',
    price: 0,
    free: true,
    donCat: 'mezun',
    badgeColor: 'bg-sky-100 text-sky-800',
    borderColor: 'border-sky-200 hover:border-sky-300',
    activeBorder: 'border-sky-500 bg-sky-50/50',
    description: 'Mezuniyetin üzerinden 2 yıl geçmemiş meslektaşlar için ücretsiz üyelik.',
  },
  {
    id: 'individual_member',
    label: 'Mesleğin Değer Ortağı',
    sublabel: 'Mesleğin Değer Ortağı Bağışı',
    price: 1750,
    free: false,
    donCat: 'bireysel',
    badgeColor: 'bg-[#26496b]/10 text-[#26496b]',
    borderColor: 'border-[#26496b]/20 hover:border-[#26496b]/40',
    activeBorder: 'border-[#26496b] bg-[#26496b]/5',
    description: 'Yıllık 1.750 ₺ bağışla mesleğin değerine katkı sağlayın.',
  },
  {
    id: 'corporate_member',
    label: 'Kurumsal Üye',
    sublabel: 'Mesleğe Değer Katan Marka Bağışı',
    price: 7000,
    free: false,
    donCat: 'kurumsal',
    badgeColor: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-200 hover:border-purple-300',
    activeBorder: 'border-purple-600 bg-purple-50/50',
    description: 'Kurumsal kimliğinizle sektöre liderlik edin, üyelere ayrıcalıklar kazanın.',
  },
] as const;

const BIREYSEL_PRESETS = [150, 300, 500, 750];

const PAKETLER = [
  {
    tier: 'bronz' as const,
    label: 'Bronz',
    price: 2500,
    color: 'from-amber-700 to-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    perks: ["Sahne'de logo yerleştirme", 'Etkinlik duyurularında anma', 'Yıllık bülten sponsorluğu'],
  },
  {
    tier: 'gumus' as const,
    label: 'Gümüş',
    price: 5000,
    color: 'from-slate-500 to-slate-400',
    badge: 'bg-slate-100 text-slate-700',
    perks: ['Bronz haklarına ek olarak', 'Özel içerik desteği (1 yazı/çeyrek)', 'Mentorluk ağına erişim', 'Web sitesinde logo'],
    featured: true,
  },
  {
    tier: 'altin' as const,
    label: 'Altın',
    price: 10000,
    color: 'from-yellow-600 to-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    perks: ['Gümüş haklarına ek olarak', 'Kongre & etkinlik sponsorluğu', 'Yönetim kurulu toplantısına davet', 'VIP erken erişim — tüm etkinlikler'],
  },
];

function TopoPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden="true">
      <defs>
        <pattern id="topo-bagis" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
          <ellipse cx="80" cy="80" rx="72" ry="52" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="80" cy="80" rx="55" ry="38" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="80" cy="80" rx="38" ry="25" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="80" cy="80" rx="22" ry="14" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="80" cy="80" rx="9" ry="6" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topo-bagis)" />
    </svg>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </div>
  );
}

export default function BagisPage() {
  const [mainTab, setMainTab] = useState<MainTab>('uyelik');
  const [step, setStep] = useState<Step>('form');

  // Üyelik
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('iyzico');

  // Genel bağış
  const [preset, setPreset] = useState(300);
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Kurumsal sponsor
  const [packageTier, setPackageTier] = useState<'bronz' | 'gumus' | 'altin'>('gumus');

  // Shared form
  const [form, setForm] = useState({ name: '', surname: '', email: '', phone: '', company: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const [bankAmount, setBankAmount] = useState(0);

  // iyzico overlay
  const [showIyzico, setShowIyzico] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const iyzicoDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showIyzico || !checkoutHtml || !iyzicoDivRef.current) return;
    const div = iyzicoDivRef.current;
    div.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = checkoutHtml;
    Array.from(temp.querySelectorAll('script')).forEach((old) => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.textContent = old.textContent;
      div.appendChild(s);
    });
  }, [showIyzico, checkoutHtml]);

  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function resetFlow() {
    setStep('form');
    setError('');
    setRefCode('');
    setSelectedTierId(null);
    setShowIyzico(false);
    setCheckoutHtml('');
  }

  function switchTab(t: MainTab) {
    setMainTab(t);
    resetFlow();
  }

  const selectedTier = UYELIK_TIERS.find((t) => t.id === selectedTierId);
  const genelAmount = isCustom ? (parseFloat(custom) || 0) : preset;
  const kurumPaket = PAKETLER.find((p) => p.tier === packageTier)!;

  async function submitUyelik(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedTierId) { setError('Lütfen bir üyelik türü seçin.'); return; }
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) {
      setError('Ad, soyad ve e-posta zorunludur.'); return;
    }
    const tier = UYELIK_TIERS.find((t) => t.id === selectedTierId)!;
    if (tier.id === 'corporate_member' && !form.company.trim()) {
      setError('Firma adı zorunludur.'); return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `${form.name} ${form.surname}`,
          email: form.email,
          amount: tier.free ? 1 : tier.price,
          type: 'recurring',
          method: tier.free ? 'bank_transfer' : (payMethod === 'iyzico' ? 'iyzico' : 'bank_transfer'),
          donationCategory: tier.donCat,
          paymentAccount: 'vakif',
          ...(tier.id === 'corporate_member' ? { companyName: form.company } : {}),
          ...(form.phone ? { notes: `Tel: ${form.phone}` } : {}),
        }),
      });
      if (!res.ok) throw new Error('İşlem başarısız oldu.');
      const data = (await res.json()) as { id: string; referenceCode: string };

      if (tier.free) {
        setStep('done');
        return;
      }

      setRefCode(data.referenceCode);
      setBankAmount(tier.price);

      if (payMethod === 'havale') {
        setStep('bank');
        return;
      }

      // iyzico checkout
      const checkRes = await fetch(`${API}/donations/${data.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          email: form.email,
          callbackUrl: `${window.location.origin}/api/bagis-callback`,
        }),
      });
      if (!checkRes.ok) throw new Error('Ödeme formu oluşturulamadı.');
      const checkData = (await checkRes.json()) as { checkoutFormContent?: string };
      if (!checkData.checkoutFormContent) throw new Error('Ödeme sayfası alınamadı.');
      setCheckoutHtml(checkData.checkoutFormContent);
      setShowIyzico(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  async function submitGenel(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) {
      setError('Ad, soyad ve e-posta zorunludur.'); return;
    }
    if (genelAmount < 10) { setError('Bağış tutarı en az 10 ₺ olmalıdır.'); return; }

    setBusy(true);
    try {
      const res = await fetch(`${API}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `${form.name} ${form.surname}`,
          email: form.email,
          amount: genelAmount,
          type: 'one_time',
          method: 'bank_transfer',
          donationCategory: 'genel',
          paymentAccount: 'vakif',
          ...(form.phone ? { notes: `Tel: ${form.phone}` } : {}),
        }),
      });
      if (!res.ok) throw new Error('İşlem başarısız oldu.');
      const data = (await res.json()) as { referenceCode: string };
      setRefCode(data.referenceCode);
      setBankAmount(genelAmount);
      setStep('bank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  async function submitKurumsal(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim() || !form.company.trim()) {
      setError('Tüm alanlar zorunludur.'); return;
    }

    setBusy(true);
    try {
      const paket = PAKETLER.find((p) => p.tier === packageTier)!;
      const res = await fetch(`${API}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `${form.name} ${form.surname}`,
          email: form.email,
          amount: paket.price,
          type: 'recurring',
          method: 'bank_transfer',
          donationCategory: 'genel',
          paymentAccount: 'vakif',
          companyName: form.company,
          packageTier: packageTier,
          notes: `Kurumsal Sponsor — ${paket.label} Paket`,
        }),
      });
      if (!res.ok) throw new Error('İşlem başarısız oldu.');
      const data = (await res.json()) as { referenceCode: string };
      setRefCode(data.referenceCode);
      setBankAmount(paket.price);
      setStep('bank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66aca9] focus:border-transparent transition-all';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* iyzico overlay */}
      {showIyzico && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowIyzico(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-semibold text-gray-900 text-sm">Güvenli Ödeme — iyzico</span>
              </div>
              <button onClick={() => setShowIyzico(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div ref={iyzicoDivRef} className="min-h-[480px] p-4" />
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* ── Sol: Form paneli ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

              {step === 'form' && (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Haritailesi&apos;ne Destek Ol</h1>
                    <p className="text-gray-500 text-sm mt-1">Mesleğimizin geleceğine yatırım yapın.</p>
                  </div>

                  {/* Main tab bar */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8">
                    {([
                      { key: 'uyelik' as const, label: 'Üyelik' },
                      { key: 'genel' as const, label: 'Genel Bağış' },
                      { key: 'kurumsal' as const, label: 'Kurumsal Sponsor' },
                    ]).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => switchTab(t.key)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                          mainTab === t.key
                            ? 'bg-white text-[#26496b] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* ── ÜYELİK TAB ── */}
                  {mainTab === 'uyelik' && (
                    <form onSubmit={(e) => void submitUyelik(e)} className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Üyelik Türü Seçin</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {UYELIK_TIERS.map((tier) => (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setSelectedTierId(tier.id)}
                              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                                selectedTierId === tier.id
                                  ? tier.activeBorder
                                  : `border-gray-200 ${tier.borderColor} bg-gray-50/30`
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="font-semibold text-gray-900 text-sm leading-snug">{tier.label}</span>
                                <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${tier.badgeColor}`}>
                                  {tier.free ? 'Ücretsiz' : `${tier.price.toLocaleString('tr-TR')} ₺/yıl`}
                                </span>
                              </div>
                              <p className="text-xs text-[#66aca9] font-medium mb-1.5">{tier.sublabel}</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{tier.description}</p>
                              {tier.free && selectedTierId === tier.id && (
                                <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Başvurunuzu aldıktan sonra ekibimiz sizinle iletişime geçecektir.
                                  </p>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Form — sadece tier seçilince */}
                      {selectedTierId && (
                        <>
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">İletişim Bilgileri</p>
                            <div className="grid grid-cols-2 gap-3">
                              <input required type="text" placeholder="Ad *" value={form.name} onChange={(e) => setField('name', e.target.value)} className={inp} />
                              <input required type="text" placeholder="Soyad *" value={form.surname} onChange={(e) => setField('surname', e.target.value)} className={inp} />
                            </div>
                            <input required type="email" placeholder="E-posta Adresi *" value={form.email} onChange={(e) => setField('email', e.target.value)} className={inp} />
                            <input type="tel" placeholder="Telefon (opsiyonel)" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inp} />
                            {selectedTierId === 'corporate_member' && (
                              <input required type="text" placeholder="Firma / Kurum Adı *" value={form.company} onChange={(e) => setField('company', e.target.value)} className={inp} />
                            )}
                          </div>

                          {/* Ödeme yöntemi — sadece ücretli */}
                          {!selectedTier?.free && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Ödeme Yöntemi</p>
                              <div className="grid grid-cols-2 gap-3">
                                {([
                                  { key: 'iyzico' as const, label: 'Kredi / Banka Kartı', icon: '💳', desc: 'Anında, 256-bit SSL' },
                                  { key: 'havale' as const, label: 'Havale / EFT', icon: '🏦', desc: '1–2 iş günü onay' },
                                ]).map((m) => (
                                  <button
                                    key={m.key}
                                    type="button"
                                    onClick={() => setPayMethod(m.key)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                      payMethod === m.key
                                        ? 'border-[#26496b] bg-[#26496b]/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="text-2xl mb-2">{m.icon}</div>
                                    <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                                    <div className="text-xs text-gray-500">{m.desc}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {error && <ErrorBox msg={error} />}

                      <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Seçilen Üyelik</div>
                          {selectedTier ? (
                            <>
                              <div className="text-sm font-semibold text-gray-900">{selectedTier.label}</div>
                              <div className="text-xl font-bold text-[#26496b]">
                                {selectedTier.free ? 'Ücretsiz' : `${selectedTier.price.toLocaleString('tr-TR')} ₺/yıl`}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-400 italic">Seçim yapılmadı</div>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={busy || !selectedTierId}
                          className="px-6 py-3 bg-[#26496b] hover:bg-[#1d3a57] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
                        >
                          {busy
                            ? 'İşleniyor…'
                            : selectedTier?.free
                            ? 'Başvur →'
                            : payMethod === 'iyzico'
                            ? 'Kartla Öde →'
                            : 'Havale Bilgisi Al →'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── GENEL BAĞIŞ TAB ── */}
                  {mainTab === 'genel' && (
                    <form onSubmit={(e) => void submitGenel(e)} className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Bağış Miktarı</p>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {BIREYSEL_PRESETS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => { setPreset(p); setIsCustom(false); }}
                              className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                                !isCustom && preset === p
                                  ? 'border-[#26496b] bg-[#26496b] text-white'
                                  : 'border-gray-200 text-gray-700 hover:border-[#66aca9]'
                              }`}
                            >
                              {p} ₺
                            </button>
                          ))}
                        </div>
                        <input
                          type="number" min="10" step="1"
                          placeholder="Farklı bir miktar girin"
                          value={custom}
                          onChange={(e) => { setCustom(e.target.value); setIsCustom(true); }}
                          onFocus={() => setIsCustom(true)}
                          className={inp}
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">İletişim Bilgileri</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input required type="text" placeholder="Ad *" value={form.name} onChange={(e) => setField('name', e.target.value)} className={inp} />
                          <input required type="text" placeholder="Soyad *" value={form.surname} onChange={(e) => setField('surname', e.target.value)} className={inp} />
                        </div>
                        <input required type="email" placeholder="E-posta Adresi *" value={form.email} onChange={(e) => setField('email', e.target.value)} className={inp} />
                        <input type="tel" placeholder="Telefon (opsiyonel)" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inp} />
                      </div>

                      {error && <ErrorBox msg={error} />}

                      <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Bağış Tutarı</div>
                          <div className="text-2xl font-bold text-[#26496b]">
                            {genelAmount > 0 ? `${genelAmount.toLocaleString('tr-TR')} ₺` : '—'}
                          </div>
                          <div className="text-xs text-gray-400">Tek seferlik bağış</div>
                        </div>
                        <button
                          type="submit"
                          disabled={busy || genelAmount < 10}
                          className="px-6 py-3 bg-[#26496b] hover:bg-[#1d3a57] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
                        >
                          {busy ? 'İşleniyor…' : 'Havale Bilgisi Al →'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── KURUMSAL SPONSOR TAB ── */}
                  {mainTab === 'kurumsal' && (
                    <form onSubmit={(e) => void submitKurumsal(e)} className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Destek Paketi Seçin</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {PAKETLER.map((p) => (
                            <button
                              key={p.tier}
                              type="button"
                              onClick={() => setPackageTier(p.tier)}
                              className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                                packageTier === p.tier
                                  ? 'border-[#26496b] bg-[#26496b]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {p.featured && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#66aca9] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Popüler
                                </span>
                              )}
                              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold mb-3 ${p.badge}`}>
                                <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${p.color}`} />
                                {p.label}
                              </div>
                              <div className="text-xl font-bold text-gray-900">{p.price.toLocaleString('tr-TR')} ₺</div>
                              <div className="text-xs text-gray-400 mb-3">/ yıl</div>
                              <ul className="space-y-1">
                                {p.perks.map((perk) => (
                                  <li key={perk} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <svg className="w-3 h-3 text-[#66aca9] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {perk}
                                  </li>
                                ))}
                              </ul>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">İletişim Bilgileri</p>
                        <input required type="text" placeholder="Firma / Kurum Adı *" value={form.company} onChange={(e) => setField('company', e.target.value)} className={inp} />
                        <div className="grid grid-cols-2 gap-3">
                          <input required type="text" placeholder="Ad *" value={form.name} onChange={(e) => setField('name', e.target.value)} className={inp} />
                          <input required type="text" placeholder="Soyad *" value={form.surname} onChange={(e) => setField('surname', e.target.value)} className={inp} />
                        </div>
                        <input required type="email" placeholder="E-posta Adresi *" value={form.email} onChange={(e) => setField('email', e.target.value)} className={inp} />
                      </div>

                      {error && <ErrorBox msg={error} />}

                      <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Seçilen Paket</div>
                          <div className="text-sm font-semibold text-gray-900">{kurumPaket.label} Sponsor</div>
                          <div className="text-2xl font-bold text-[#26496b]">{kurumPaket.price.toLocaleString('tr-TR')} ₺/yıl</div>
                        </div>
                        <button
                          type="submit"
                          disabled={busy}
                          className="px-6 py-3 bg-[#26496b] hover:bg-[#1d3a57] disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
                        >
                          {busy ? 'İşleniyor…' : 'Havale Bilgisi Al →'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* ── Havale adımı ── */}
              {step === 'bank' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Başvurunuz alındı!</h2>
                      <p className="text-sm text-gray-500">Son adım: havale / EFT</p>
                    </div>
                  </div>

                  <div className="bg-[#26496b]/5 border border-[#26496b]/20 rounded-2xl p-6 mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Ödeme Bilgileri</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Hesap Adı</span>
                        <span className="font-semibold text-gray-900">{BANK_NAME}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">IBAN</span>
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(IBAN)}
                          className="font-mono font-semibold text-[#26496b] hover:text-[#66aca9] transition-colors flex items-center gap-1"
                          title="Kopyala"
                        >
                          {IBAN}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Tutar</span>
                        <span className="font-bold text-[#26496b]">{bankAmount.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Açıklama (zorunlu)</span>
                        <span className="font-mono font-semibold text-gray-900">{refCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
                    <strong>Önemli:</strong> Havale açıklamasına referans kodunuzu (<span className="font-mono font-bold">{refCode}</span>) mutlaka yazınız. Bağışınız 1–2 iş günü içinde onaylanacaktır.
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetFlow}
                      className="px-5 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                    >
                      ← Geri
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('done')}
                      className="flex-1 py-3 bg-[#26496b] text-white font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors text-sm"
                    >
                      Tamamlandı
                    </button>
                  </div>
                </>
              )}

              {/* ── Tamamlandı ── */}
              {step === 'done' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Teşekkürler!</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                    {mainTab === 'uyelik' && selectedTier?.free
                      ? 'Başvurunuz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.'
                      : 'Desteğiniz mesleğimizin geleceğine doğrudan katkı sağlayacak. Onay e-postanıza gönderilecektir.'}
                  </p>
                  <Link href="/" className="inline-flex px-6 py-3 bg-[#26496b] text-white font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors text-sm">
                    Ana Sayfaya Dön
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Sağ: Branding paneli ── */}
          <div className="lg:col-span-2">
            <div className="relative bg-[#26496b] rounded-3xl overflow-hidden p-8 text-white sticky top-8">
              <TopoPattern />
              <div className="relative">
                <p className="text-[#66aca9] text-xs font-bold uppercase tracking-widest mb-3">Haritailesi Vakfı</p>
                <h2 className="text-2xl font-bold leading-snug mb-4">
                  Mesleğimizin<br />
                  <span className="text-[#66aca9]">değerine değer</span><br />
                  katın.
                </h2>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Haritailesi Vakfı, harita, geomatik ve kadastro sektörünün sürdürülebilir gelişimi için üyelerinin ve destekçilerinin katkılarıyla büyümektedir.
                </p>

                {/* Üyelik ücret özeti — sadece üyelik tabında */}
                {mainTab === 'uyelik' && (
                  <div className="mb-6 bg-white/10 rounded-2xl p-4">
                    <p className="text-xs font-bold text-[#66aca9] uppercase tracking-widest mb-3">2026 Üyelik Ücretleri</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Haritailesi Genç', price: 'Ücretsiz', sub: 'Öğrenciler için' },
                        { label: 'Mesleğin Geleceği', price: 'Ücretsiz', sub: 'İlk 2 yıl' },
                        { label: 'Mesleğin Değer Ortağı', price: '1.750 ₺/yıl', sub: 'Değer Ortağı Bağışı' },
                        { label: 'Kurumsal Üye', price: '7.000 ₺/yıl', sub: 'Değer Katan Marka' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-white text-xs font-semibold">{item.label}</div>
                            <div className="text-white/50 text-[10px]">{item.sub}</div>
                          </div>
                          <span className="text-[#66aca9] text-xs font-bold shrink-0">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {[
                    { icon: '🎓', title: 'Mesleğin Gelecekleri', desc: 'Seçilmiş öğrenci programını finanse edersiniz.' },
                    { icon: '🤝', title: 'Mentorluk Ağı', desc: '200+ üye, birebir kariyer desteğine kavuşur.' },
                    { icon: '📡', title: 'Dijital Ekosistem', desc: 'Platform, eğitim ve etkinlik altyapısı sürer.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{item.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="text-xs text-white/60">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-white/10 rounded-2xl px-4 py-3 text-xs text-white/70 leading-relaxed">
                  Haritailesi Vakfı, kamu yararına çalışan vakıflar arasında yer almaktadır. Bağışlarınız yasal koşullar çerçevesinde vergi matrahından indirilebilir.
                </div>

                <p className="mt-6 text-[10px] text-white/20 font-mono tracking-wider">39°55′N 32°51′E · Ankara</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
