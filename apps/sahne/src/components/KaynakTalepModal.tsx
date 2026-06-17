'use client';

import { useEffect, useRef, useState } from 'react';

type Step = 'form' | 'verify' | 'success';
type Channel = 'email' | 'tel';

interface Props {
  open: boolean;
  sinav: string;
  kaynak: string;
  onClose: () => void;
}

export default function KaynakTalepModal({ open, sinav, kaynak, onClose }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ ad: '', email: '', telefon: '' });
  const [channel, setChannel] = useState<Channel>('email');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [codeError, setCodeError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('form');
      setForm({ ad: '', email: '', telefon: '' });
      setDigits(['', '', '', '', '', '']);
      setCodeError(false);
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; });
    }, 1000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChannel(form.email ? 'email' : 'tel');
    setStep('verify');
    startCountdown();
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  };

  const handleDigitChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    setCodeError(false);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = () => {
    if (digits.join('').length < 6) { setCodeError(true); return; }
    setStep('success');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resend = () => {
    setDigits(['', '', '', '', '', '']);
    setCodeError(false);
    startCountdown();
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  };

  const maskedTarget = channel === 'email'
    ? form.email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : form.telefon.replace(/(\d{4})\d+(\d{2})/, '$1***$2');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md relative"
        style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(160deg,#064e3b 0%,#065f46 100%)', padding: '24px 28px 20px' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            ✕
          </button>
          <div className="text-2xl mb-2">📬</div>
          <div className="text-white font-black text-lg leading-snug mb-1">
            {step === 'verify' ? 'Kimliğinizi Doğrulayın' : step === 'success' ? 'Talebiniz Alındı!' : 'Kaynak Talebi'}
          </div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {step === 'verify'
              ? `${channel === 'email' ? 'E-posta' : 'Telefon'} adresinize 6 haneli bir doğrulama kodu gönderdik.`
              : step === 'success'
              ? 'Talebinizi aldık, en kısa sürede dönüş yapacağız.'
              : 'Bilgilerinizi bırakın, talebinizi iletip size dönelim.'}
          </div>
        </div>

        {/* Talep özeti şeridi */}
        {step !== 'success' && (
          <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg flex-shrink-0">{sinav}</div>
            <div className="text-xs text-gray-500 truncate">"{kaynak}"</div>
          </div>
        )}

        {/* Body */}
        <div className="p-7">

          {/* ── FORM ── */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Ad Soyad</label>
                <input
                  required type="text" placeholder="Adınız Soyadınız"
                  value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-gray-800 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">E-posta</label>
                  <input
                    type="email" placeholder="ornek@mail.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-gray-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Telefon</label>
                  <input
                    type="tel" placeholder="05XX XXX XX XX"
                    value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-gray-800 transition-colors"
                  />
                </div>
              </div>
              {!form.email && !form.telefon && (
                <p className="text-xs text-amber-600 -mt-2">E-posta veya telefon numarasından en az birini girin.</p>
              )}

              <button
                type="submit"
                disabled={!form.ad || (!form.email && !form.telefon)}
                className="w-full rounded-xl font-black text-sm py-3 transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                style={{ background: '#10b981', color: '#fff' }}
              >
                Devam Et →
              </button>
            </form>
          )}

          {/* ── VERIFY ── */}
          {step === 'verify' && (
            <div className="flex flex-col gap-5">
              {form.email && form.telefon && (
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Kodu nereye gönderelim?</div>
                  <div className="flex gap-2">
                    {(['email', 'tel'] as Channel[]).map(ch => (
                      <button key={ch} type="button" onClick={() => setChannel(ch)}
                        className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all"
                        style={{ background: channel === ch ? '#065f46' : '#fff', color: channel === ch ? '#fff' : '#6b7280', borderColor: channel === ch ? '#065f46' : '#e5e7eb' }}
                      >
                        <span>{ch === 'email' ? '✉️' : '📱'}</span>
                        <span>{ch === 'email' ? 'E-posta' : 'SMS'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-xl">{channel === 'email' ? '✉️' : '📱'}</span>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Kod gönderildi</div>
                  <div className="text-sm font-bold text-[#0b1829]">{maskedTarget}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Doğrulama Kodu</div>
                <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all"
                      style={{
                        borderColor: codeError ? '#ef4444' : d ? '#065f46' : '#e5e7eb',
                        background: d ? '#f0fdf4' : '#fff',
                        color: '#0b1829',
                      }}
                    />
                  ))}
                </div>
                {codeError && <p className="text-xs text-red-500 mt-2">Lütfen 6 haneli kodu eksiksiz girin.</p>}
              </div>

              <div className="text-center text-xs text-gray-400">
                {countdown > 0
                  ? <span>Kodu tekrar gönder — <span className="font-bold text-gray-600">{countdown}s</span></span>
                  : <button onClick={resend} className="font-bold text-emerald-600 hover:text-emerald-800 transition-colors">Kodu Tekrar Gönder</button>
                }
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('form')}
                  className="flex-1 rounded-xl font-bold text-sm py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                  ← Geri
                </button>
                <button onClick={handleVerify}
                  className="flex-1 rounded-xl font-black text-sm py-3 transition-all hover:-translate-y-px"
                  style={{ background: '#10b981', color: '#fff' }}>
                  Doğrula →
                </button>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <div className="text-base font-black text-[#0b1829] mb-2">Talebiniz Alındı!</div>
              <div className="text-sm text-gray-500 leading-relaxed mb-1">
                <span className="font-bold text-[#0b1829]">{form.ad}</span>, talebinizi aldık.
              </div>
              <div className="text-sm text-gray-500 leading-relaxed mb-6">
                En kısa sürede {channel === 'email' ? form.email : form.telefon} üzerinden dönüş yapacağız.
              </div>
              <button onClick={onClose}
                className="px-8 py-3 rounded-xl text-sm font-bold bg-[#0b1829] text-white hover:bg-[#1e3a5f] transition-colors">
                Tamam
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
