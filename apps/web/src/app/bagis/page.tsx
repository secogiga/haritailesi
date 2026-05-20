'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';
const IBAN = process.env['NEXT_PUBLIC_IBAN'] ?? 'TR12 0006 2000 0000 0000 0000 00';
const BANK_NAME = process.env['NEXT_PUBLIC_BANK_NAME'] ?? 'Haritailesi Vakfı – İş Bankası';

type Tab = 'bireysel' | 'kurumsal';
type Step = 'form' | 'bank' | 'done';

const BIREYSEL_PRESETS = [150, 300, 500, 750];

const PAKETLER = [
  {
    tier: 'bronz' as const,
    label: 'Bronz',
    price: 2500,
    gradient: 'from-amber-600 to-amber-400',
    ring: 'ring-amber-300',
    perks: ['Sahne\'de logo', 'Etkinlik duyurularında anma', 'Yıllık bültende sponsor'],
  },
  {
    tier: 'gumus' as const,
    label: 'Gümüş',
    price: 5000,
    gradient: 'from-slate-500 to-slate-300',
    ring: 'ring-slate-300',
    featured: true,
    perks: ['Bronz hakları +', 'İçerik desteği (1/çeyrek)', 'Mentorluk ağına erişim', 'Web sitesinde logo'],
  },
  {
    tier: 'altin' as const,
    label: 'Altın',
    price: 10000,
    gradient: 'from-yellow-500 to-amber-300',
    ring: 'ring-yellow-300',
    perks: ['Gümüş hakları +', 'Kongre sponsorluğu', 'Yönetim toplantısına davet', 'VIP etkinlik erişimi'],
  },
] as const;

export default function BagisPage() {
  const [tab, setTab] = useState<Tab>('bireysel');
  const [step, setStep] = useState<Step>('form');
  const [preset, setPreset] = useState(300);
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [tier, setTier] = useState<'bronz' | 'gumus' | 'altin'>('gumus');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', company: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');

  const bireyselAmount = isCustom ? (parseFloat(custom) || 0) : preset;
  const paket = PAKETLER.find((p) => p.tier === tier)!;
  const finalAmount = tab === 'bireysel' ? bireyselAmount : paket.price;

  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim() || !form.email.trim()) { setError('Ad soyad ve e-posta zorunludur.'); return; }
    if (tab === 'bireysel' && finalAmount < 10) { setError('Minimum bağış 10 ₺.'); return; }
    if (tab === 'kurumsal' && !form.company.trim()) { setError('Firma adı zorunludur.'); return; }

    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email,
        amount: finalAmount,
        type: 'recurring',
        method: 'bank_transfer',
        donationCategory: tab,
        notes: form.phone ? `Tel: ${form.phone}` : undefined,
        ...(tab === 'kurumsal' ? { packageTier: tier, companyName: form.company } : {}),
      };
      const res = await fetch(`${API}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('İşlem başarısız.');
      const data = (await res.json()) as { referenceCode: string };
      setRefCode(data.referenceCode);
      setStep('bank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-all';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero strip */}
      <div className="bg-[var(--color-mavi)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[var(--color-altin)] text-xs font-bold uppercase tracking-widest mb-2">Haritailesi Vakfı</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Mesleğimize Değer Katın
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Bireysel ya da kurumsal desteğinizle harita ve geomatik sektörünün geleceğini birlikte şekillendiriyoruz.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Ana form ── */}
          <div className="lg:col-span-2">
            {step === 'form' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                {/* Tab seçimi */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8 w-full max-w-sm">
                  {(['bireysel', 'kurumsal'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        tab === t ? 'bg-white text-[var(--color-mavi)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t === 'bireysel' ? '👤 Bireysel' : '🏢 Kurumsal'}
                    </button>
                  ))}
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-7">
                  {/* Bireysel: tutar */}
                  {tab === 'bireysel' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                        Yıllık Destek Miktarı
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {BIREYSEL_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => { setPreset(p); setIsCustom(false); }}
                            className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                              !isCustom && preset === p
                                ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)] text-white'
                                : 'border-gray-200 text-gray-700 hover:border-[var(--color-teal)]'
                            }`}
                          >
                            {p} ₺
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="10"
                        placeholder="Farklı bir miktar (₺)"
                        value={custom}
                        onChange={(e) => { setCustom(e.target.value); setIsCustom(true); }}
                        onFocus={() => setIsCustom(true)}
                        className={inp}
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Yıllık bağış · 1 yıl sonra yenileme hatırlatması gönderilir.
                      </p>
                    </div>
                  )}

                  {/* Kurumsal: paket seçimi */}
                  {tab === 'kurumsal' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                        Destek Paketi
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {PAKETLER.map((p) => (
                          <button
                            key={p.tier}
                            type="button"
                            onClick={() => setTier(p.tier)}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                              tier === p.tier
                                ? `border-[var(--color-mavi)] bg-[var(--color-mavi)]/5 ring-2 ${p.ring}`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {p.featured && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--color-teal)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                                Önerilen
                              </span>
                            )}
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p.gradient} mb-3`} />
                            <div className="font-bold text-gray-900">{p.label}</div>
                            <div className="text-2xl font-bold text-[var(--color-mavi)] mt-1">
                              {p.price.toLocaleString('tr-TR')} ₺
                            </div>
                            <div className="text-xs text-gray-400 mb-3">/ yıl</div>
                            <ul className="space-y-1.5">
                              {p.perks.map((perk) => (
                                <li key={perk} className="flex items-start gap-1.5 text-xs text-gray-600">
                                  <svg className="w-3.5 h-3.5 text-[var(--color-teal)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  )}

                  {/* İletişim bilgileri */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      İletişim Bilgileri
                    </label>
                    {tab === 'kurumsal' && (
                      <input required type="text" placeholder="Firma / Kurum Adı *" value={form.company}
                        onChange={(e) => setField('company', e.target.value)} className={inp} />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required type="text" placeholder="Ad Soyad *" value={form.fullName}
                        onChange={(e) => setField('fullName', e.target.value)} className={inp} />
                      <input required type="email" placeholder="E-posta *" value={form.email}
                        onChange={(e) => setField('email', e.target.value)} className={inp} />
                    </div>
                    <input type="tel" placeholder="Telefon (opsiyonel)" value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)} className={inp} />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
                  )}

                  <div className="flex items-center justify-between bg-[var(--color-mavi)]/5 rounded-2xl px-5 py-4">
                    <div>
                      <div className="text-xs text-gray-500">Yıllık Toplam</div>
                      <div className="text-3xl font-bold text-[var(--color-mavi)]">
                        {finalAmount > 0 ? `${finalAmount.toLocaleString('tr-TR')} ₺` : '—'}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={busy || finalAmount < 10}
                      className="px-8 py-3.5 bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
                    >
                      {busy ? 'Gönderiliyor…' : 'Devam →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 'bank' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Başvurunuz Alındı!</h2>
                    <p className="text-sm text-gray-500">Lütfen aşağıdaki hesaba havale/EFT yapın.</p>
                  </div>
                </div>

                <div className="bg-[var(--color-mavi)]/5 border border-[var(--color-mavi)]/20 rounded-2xl p-6 space-y-4 mb-6">
                  {[
                    { label: 'Hesap Adı', value: BANK_NAME },
                    { label: 'IBAN', value: IBAN },
                    { label: 'Tutar', value: `${finalAmount.toLocaleString('tr-TR')} ₺` },
                    { label: 'Açıklama / Referans', value: refCode },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <span className="text-gray-500">{label}</span>
                      <button
                        onClick={() => void navigator.clipboard.writeText(value)}
                        className="font-semibold text-[var(--color-mavi)] hover:text-[var(--color-teal)] transition-colors font-mono"
                        title="Kopyala"
                      >
                        {value}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
                  Havale açıklamasına <strong>{refCode}</strong> kodunu yazınız. 1–2 iş günü içinde onaylanacaktır.
                </div>
                <button onClick={() => setStep('done')}
                  className="w-full py-3.5 bg-[var(--color-mavi)] text-white font-bold rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors">
                  Tamamlandı
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Teşekkürler!</h2>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">
                  Desteğiniz mesleğimizin geleceğine doğrudan katkı sağlayacak. Onay bilgisi e-postanıza iletilecektir.
                </p>
                <Link href="/" className="px-8 py-3.5 bg-[var(--color-mavi)] text-white font-bold rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors inline-block">
                  Ana Sayfaya Dön
                </Link>
              </div>
            )}
          </div>

          {/* ── Yan panel ── */}
          <div className="space-y-4">
            <div className="bg-[var(--color-mavi)] rounded-2xl p-6 text-white">
              <p className="text-[var(--color-altin)] text-xs font-bold uppercase tracking-wider mb-3">Neden Destek Olmalısınız?</p>
              <ul className="space-y-4">
                {[
                  { icon: '🎓', t: 'Mesleğin Gelecekleri', d: 'Seçilmiş öğrenci programını destekleyin.' },
                  { icon: '🤝', t: 'Mentorluk Ağı', d: 'Binlerce profesyoneli bir araya getirin.' },
                  { icon: '📡', t: 'Dijital Altyapı', d: 'Platform, eğitim ve içerik üretimini sürdürün.' },
                  { icon: '🏆', t: 'Sektör Ödülleri', d: 'Kariyer başarılarını topluca kutlayın.' },
                ].map((item) => (
                  <li key={item.t} className="flex items-start gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-sm font-semibold">{item.t}</div>
                      <div className="text-xs text-white/60">{item.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Vergi Avantajı</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Haritailesi Vakfı kamu yararına çalışan vakıflar arasındadır. Bağışlarınız yasal sınırlar dahilinde vergi matrahınızdan düşülebilir.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-sm text-gray-500 mb-3">Sorularınız için</p>
              <a href="mailto:bagis@haritailesi.org" className="text-sm font-semibold text-[var(--color-mavi)] hover:text-[var(--color-teal)] transition-colors">
                bagis@haritailesi.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
