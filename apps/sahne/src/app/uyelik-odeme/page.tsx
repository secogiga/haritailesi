'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API    = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';
const IBAN   = process.env['NEXT_PUBLIC_IBAN']      ?? 'TR00 0000 0000 0000 0000 0000 00';
const BANK   = process.env['NEXT_PUBLIC_BANK_NAME'] ?? 'Haritailesi Vakfı – İş Bankası';

// Üyelik tipine göre sabit bilgiler
const TIER_INFO: Record<string, { label: string; price: number; free: boolean; donCat: string }> = {
  individual:         { label: 'Bireysel Üyelik',   price: 1750, free: false, donCat: 'bireysel' },
  corporate:          { label: 'Kurumsal Üyelik',   price: 7000, free: false, donCat: 'kurumsal' },
  haritailesi_genc:   { label: 'Haritailesi Genç',  price: 0,    free: true,  donCat: 'genc'     },
  meslegin_gelecekleri:{ label: 'Mesleğin Gelecekleri', price: 0, free: true, donCat: 'genc'    },
};

type Step = 'form' | 'bank' | 'done';

function UyelikOdemeInner() {
  const params = useSearchParams();
  const appType = params.get('type') ?? 'individual';
  const appRef  = params.get('ref')  ?? '';

  const tier = TIER_INFO[appType] ?? TIER_INFO['individual']!;

  const [step, setStep]       = useState<Step>('form');
  const [payMethod, setPayMethod] = useState<'iyzico' | 'havale'>('iyzico');
  const [form, setForm]       = useState({ name: '', surname: '', email: '', phone: '', company: '' });
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [refCode, setRefCode] = useState('');

  const [showIyzico, setShowIyzico]     = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const iyzicoDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = iyzicoDivRef.current;
    if (!showIyzico || !div || !checkoutHtml) return;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) {
      setError('Ad, soyad ve e-posta zorunludur.');
      return;
    }
    if (tier.donCat === 'kurumsal' && !form.company.trim()) {
      setError('Firma adı zorunludur.');
      return;
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
          ...(tier.donCat === 'kurumsal' ? { companyName: form.company } : {}),
          notes: `Üyelik ödemesi — ref:${appRef}${form.phone ? ` Tel:${form.phone}` : ''}`,
        }),
      });
      if (!res.ok) throw new Error('İşlem başarısız oldu, lütfen tekrar deneyin.');
      const data = (await res.json()) as { id: string; referenceCode: string };

      if (tier.free) { setStep('done'); return; }

      setRefCode(data.referenceCode);

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none">
            <rect width="40" height="40" rx="8" fill="#26496b" />
            <path d="M8 28 L20 12 L32 28" stroke="#66aca9" strokeWidth="3" strokeLinejoin="round" fill="none" />
            <path d="M14 28 L20 18 L26 28" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-xl font-bold tracking-tight" style={{ color: '#26496b' }}>haritailesi</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-[#294f73] px-6 py-5">
            <h1 className="text-white font-bold text-lg">Üyeliği Tamamla</h1>
            <p className="text-white/70 text-sm mt-0.5">{tier.label}</p>
          </div>

          <div className="p-6">

            {/* Ücretsiz üyelik */}
            {tier.free && step === 'form' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Üyeliğiniz ücretsizdir!</p>
                <p className="text-sm text-gray-500">Hesabınız inceleme sonrası aktif edilecektir. Bildirim e-posta adresinize gönderilecek.</p>
                <a href="https://sahne.haritailesi.org" className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#294f73] text-white text-sm font-medium hover:bg-[#1e3a56] transition-colors">
                  Sahne&apos;yi Keşfet →
                </a>
              </div>
            )}

            {/* Ödeme formu */}
            {!tier.free && step === 'form' && !showIyzico && (
              <>
                {/* Tutar bilgisi */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-700">Yıllık üyelik bağışı</p>
                  <p className="text-2xl font-bold text-[#294f73] mt-1">
                    {tier.price.toLocaleString('tr-TR')} ₺
                  </p>
                </div>

                {/* Ödeme yöntemi */}
                <p className="text-sm font-semibold text-gray-700 mb-3">Ödeme yöntemi</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(['iyzico', 'havale'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        payMethod === m
                          ? 'border-[#294f73] bg-[#294f73]/5 text-[#294f73] ring-1 ring-[#294f73]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{m === 'iyzico' ? '💳' : '🏦'}</span>
                      {m === 'iyzico' ? 'Online Ödeme' : 'Havale / EFT'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ad *</label>
                      <input value={form.name} onChange={(e) => setField('name', e.target.value)}
                        placeholder="Adınız" required
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#294f73]/30 focus:border-[#294f73]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Soyad *</label>
                      <input value={form.surname} onChange={(e) => setField('surname', e.target.value)}
                        placeholder="Soyadınız" required
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#294f73]/30 focus:border-[#294f73]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
                    <input value={form.email} onChange={(e) => setField('email', e.target.value)}
                      type="email" placeholder="eposta@ornek.com" required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#294f73]/30 focus:border-[#294f73]" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                    <input value={form.phone} onChange={(e) => setField('phone', e.target.value)}
                      type="tel" placeholder="0530 000 00 00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#294f73]/30 focus:border-[#294f73]" />
                  </div>

                  {tier.donCat === 'kurumsal' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Firma Adı *</label>
                      <input value={form.company} onChange={(e) => setField('company', e.target.value)}
                        placeholder="Şirketinizin adı" required
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#294f73]/30 focus:border-[#294f73]" />
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <button type="submit" disabled={busy}
                    className="w-full py-3 rounded-xl bg-[#294f73] text-white font-semibold text-sm hover:bg-[#1e3a56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {busy ? 'İşleniyor…' : payMethod === 'havale' ? 'IBAN Bilgilerini Al →' : 'Online Ödemeye Geç →'}
                  </button>
                </form>
              </>
            )}

            {/* iyzico overlay */}
            {showIyzico && (
              <div>
                <button onClick={() => { setShowIyzico(false); setCheckoutHtml(''); }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors">
                  ← Geri dön
                </button>
                <div ref={iyzicoDivRef} />
              </div>
            )}

            {/* Havale bilgileri */}
            {step === 'bank' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Talebiniz alındı
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Banka</p>
                    <p className="font-semibold text-gray-800">{BANK}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">IBAN</p>
                    <p className="font-mono font-semibold text-gray-800 tracking-wide">{IBAN}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Tutar</p>
                    <p className="font-semibold text-gray-800">{tier.price.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  {refCode && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Açıklama (zorunlu)</p>
                      <p className="font-mono font-bold text-[#294f73]">{refCode}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Havale açıklamasına referans kodunu yazmayı unutmayın. Ödeme ekibimiz tarafından doğrulandıktan sonra hesabınız aktif edilecektir.
                </p>
              </div>
            )}

            {/* Tamamlandı */}
            {step === 'done' && (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-bold text-gray-900">Ödemeniz alındı!</h2>
                <p className="text-sm text-gray-500">Hesabınız en kısa sürede aktif edilecek ve e-posta ile bilgilendirileceksiniz.</p>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sorun yaşarsanız{' '}
          <a href="mailto:destek@haritailesi.org" className="underline">destek@haritailesi.org</a>
          {' '}adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
}

export default function UyelikOdemePage() {
  return (
    <Suspense>
      <UyelikOdemeInner />
    </Suspense>
  );
}
