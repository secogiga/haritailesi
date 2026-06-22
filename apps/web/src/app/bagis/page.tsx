'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';
const IBAN = process.env['NEXT_PUBLIC_IBAN'] ?? 'TR12 0006 2000 0000 0000 0000 00';
const BANK_NAME = process.env['NEXT_PUBLIC_BANK_NAME'] ?? 'Haritailesi Vakfı – İş Bankası';

type Step = 'form' | 'bank' | 'done';
type Siklik = 'tek' | 'aylik' | 'yillik';

const BIREYSEL_PRESETS = [150, 300, 500, 750];

const SIKLIKLAR: { id: Siklik; label: string }[] = [
  { id: 'tek', label: 'Tek Seferlik' },
  { id: 'aylik', label: 'Aylık' },
  { id: 'yillik', label: 'Yıllık' },
];

// 2. Hedef / doluluk sayacı
const HEDEF = 250000;
const TOPLANAN = 158000;

// 4. Sosyal kanıt — son bağışçılar (örnek)
const SON_BAGISCILAR = [
  { ad: 'Ahmet K.', tutar: 300, zaman: '2 saat önce' },
  { ad: 'Zeynep T.', tutar: 500, zaman: '5 saat önce' },
  { ad: 'Mehmet A.', tutar: 150, zaman: 'Dün' },
  { ad: 'Elif S.', tutar: 750, zaman: 'Dün' },
  { ad: 'Burak D.', tutar: 300, zaman: '2 gün önce' },
];

// 6. Mini SSS
const SSS = [
  { s: 'Bağışım nereye gidiyor?', c: 'Bağışlarınız Mesleğin Gelecekleri öğrenci programı, mentorluk ağı ve dijital platformun sürdürülmesinde kullanılır.' },
  { s: 'Makbuz alır mıyım?', c: 'Evet. Bağışınız onaylandığında resmi makbuzunuz e-posta adresinize iletilir.' },
  { s: 'Aylık bağışı nasıl iptal ederim?', c: 'Dilediğiniz zaman bagis@haritailesi.org üzerinden tek bir e-posta ile iptal edebilirsiniz.' },
  { s: 'Vergiden düşebilir miyim?', c: 'Haritailesi Vakfı kamu yararına çalışan bir vakıftır; bağışlarınız yasal sınırlar dahilinde vergi matrahınızdan düşülebilir.' },
];

// 1. Etki görselleştirme
function etkiMetni(amount: number): string {
  if (amount >= 750) return 'Bir öğrencinin yıllık gelişim yolculuğuna destek 🎓';
  if (amount >= 500) return 'Bir etkinlik katılım bursu 🎟️';
  if (amount >= 300) return 'Bir mentorluk eşleşmesi 🤝';
  if (amount >= 150) return 'Bir öğrenciye webinar erişimi 📡';
  if (amount >= 10)  return 'Topluluğun büyümesine değerli bir katkı 🌱';
  return 'Bir miktar seçin, etkisini görün';
}

// 6. Başarı konfetisi
function Confetti() {
  const renkler = ['#26496b', '#66aca9', '#c9a227', '#10b981', '#ef4444', '#8b5cf6'];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden" aria-hidden="true">
      <div className="relative w-full max-w-md">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 w-2 h-2.5 rounded-[2px]"
            style={{
              left: `${(i / 28) * 100}%`,
              backgroundColor: renkler[i % renkler.length],
              animation: `bagis-confetti-fall ${1.1 + (i % 5) * 0.22}s ease-in ${(i % 7) * 0.09}s forwards`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BagisPage() {
  const [step, setStep] = useState<Step>('form');
  const [siklik, setSiklik] = useState<Siklik>('yillik');
  const [preset, setPreset] = useState(300);
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [acikSss, setAcikSss] = useState<number | null>(0);

  const finalAmount = isCustom ? (parseFloat(custom) || 0) : preset;
  const toplamLabel = siklik === 'tek' ? 'Toplam' : siklik === 'aylik' ? 'Aylık Toplam' : 'Yıllık Toplam';
  const oran = Math.min(100, Math.round((TOPLANAN / HEDEF) * 100));

  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime < 2000) return;
    setError('');
    if (!form.fullName.trim() || !form.email.trim()) { setError('Ad soyad ve e-posta zorunludur.'); return; }
    if (finalAmount < 10) { setError('Minimum bağış 10 ₺.'); return; }

    setBusy(true);
    try {
      const siklikLabel = SIKLIKLAR.find((s) => s.id === siklik)?.label ?? '';
      const notlar = [siklikLabel, form.phone ? `Tel: ${form.phone}` : ''].filter(Boolean).join(' · ');
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email,
        amount: finalAmount,
        type: siklik === 'tek' ? 'one_time' : 'recurring',
        method: 'bank_transfer',
        donationCategory: 'bireysel',
        notes: notlar || undefined,
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
            Mesleğine Değer Katmaya Var Mısın?
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Desteğinizle mesleğimizin geleceğini birlikte şekillendiriyoruz.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Ana form ── */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'form' && (
              <>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-7">
                  {/* Honeypot — bot tuzağı */}
                  <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }} />

                  {/* 3. Bağış sıklığı */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
                    {SIKLIKLAR.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSiklik(s.id)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                          siklik === s.id ? 'bg-white text-[var(--color-mavi)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Tutar */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      Destek Miktarı
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

                    {/* 1. Etki satırı — tutara bağlı canlı */}
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[var(--color-teal)]/10 border border-[var(--color-teal)]/20 px-4 py-3">
                      <svg className="w-5 h-5 text-[var(--color-teal)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Bu destekle:</span> {etkiMetni(finalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* İletişim bilgileri */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      İletişim Bilgileri
                    </label>
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
                      <div className="text-xs text-gray-500">{toplamLabel}</div>
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

                  {/* 5. Güven şeridi */}
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
                    {['Kamu yararına vakıf', 'Makbuz e-postanıza gelir', 'KVKK uyumlu'].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[var(--color-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t}
                      </span>
                    ))}
                  </div>
                </form>
              </div>

              {/* 6. Mini SSS */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Sıkça Sorulanlar</h2>
                <div className="divide-y divide-gray-100">
                  {SSS.map((item, i) => (
                    <div key={item.s}>
                      <button
                        type="button"
                        onClick={() => setAcikSss(acikSss === i ? null : i)}
                        className="w-full flex items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-gray-800">{item.s}</span>
                        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${acikSss === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {acikSss === i && (
                        <p className="text-sm text-gray-500 leading-relaxed pb-4 -mt-1">{item.c}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </>
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
              <div className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <Confetti />
                <div className="relative w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="relative text-2xl font-bold text-gray-900 mb-3">Teşekkürler!</h2>
                <p className="relative text-gray-500 max-w-sm mx-auto mb-8">
                  Desteğiniz mesleğimizin geleceğine doğrudan katkı sağlayacak. Onay bilgisi e-postanıza iletilecektir.
                </p>
                <Link href="/" className="relative px-8 py-3.5 bg-[var(--color-mavi)] text-white font-bold rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors inline-block">
                  Ana Sayfaya Dön
                </Link>
              </div>
            )}
          </div>

          {/* ── Yan panel ── */}
          <div className="space-y-4">
            {/* 2. Hedef / doluluk sayacı */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-end justify-between mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">2026 Destek Hedefi</p>
                <span className="text-xs font-bold text-[var(--color-teal)]">%{oran}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-mavi)]" style={{ width: `${oran}%` }} />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-lg font-bold text-[var(--color-mavi)]">{TOPLANAN.toLocaleString('tr-TR')} ₺</span>
                <span className="text-xs text-gray-400">/ {HEDEF.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>

            {/* Neden destek */}
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

            {/* 4. Son bağışçılar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Son Bağışçılar</p>
              </div>
              <ul className="space-y-3">
                {SON_BAGISCILAR.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-teal)]/15 text-[var(--color-mavi)] flex items-center justify-center text-xs font-bold shrink-0">
                      {b.ad.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{b.ad}</div>
                      <div className="text-[11px] text-gray-400">{b.zaman}</div>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-mavi)] shrink-0">{b.tutar} ₺</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Bağışçı sözü */}
            <div className="bg-gradient-to-br from-[var(--color-teal)]/10 to-amber-50 rounded-2xl border border-[var(--color-teal)]/20 p-6">
              <svg className="w-7 h-7 text-[var(--color-teal)]/50 mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
              </svg>
              <p className="text-sm text-gray-700 italic leading-relaxed mb-3">
                Mesleğin Gelecekleri Programı sayesinde ilk mentörlük alma deneyimimi yaşadım. Şimdi ben de destek oluyorum.
              </p>
              <p className="text-xs font-semibold text-[var(--color-mavi)]">— Selin, Harita Mühendisi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
