'use client';

import { useState, useRef, useEffect } from 'react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Props {
  email: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}

export function EmailOtpVerifier({ email, onVerified, onBack }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Send OTP on mount
  useEffect(() => {
    void sendCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json() as { message?: string };
      if (!res.ok) throw new Error(body.message ?? 'Kod gönderilemedi.');
      setSent(true);
      setCountdown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kod gönderilemedi.');
    }
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleDigit(idx: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) refs[idx + 1]?.current?.focus();
    // Auto-submit when all filled
    if (char && idx === 5 && next.every(d => d)) {
      void verify(next.join(''));
    }
    if (!char && idx > 0) refs[idx - 1]?.current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      void verify(text);
    }
  }

  async function verify(code: string) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const body = await res.json() as { token?: string; message?: string };
      if (!res.ok) throw new Error(body.message ?? 'Hatalı kod.');
      onVerified(body.token!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Doğrulama başarısız.');
      setDigits(['', '', '', '', '', '']);
      refs[0]?.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const code = digits.join('');

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-12 h-12 bg-[#26496b]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900">E-postanızı doğrulayın</h3>
        {sent ? (
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">{email}</span> adresine 6 haneli kod gönderildi.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Kod gönderiliyor…</p>
        )}
      </div>

      {/* 6-digit input */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={busy}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Backspace' && !d && i > 0) refs[i - 1]?.current?.focus();
            }}
            className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
              ${d ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b]' : 'border-gray-200 bg-gray-50 text-gray-900'}
              ${busy ? 'opacity-50 cursor-not-allowed' : 'focus:border-[#26496b] focus:bg-white'}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center font-medium">{error}</p>
      )}

      {/* Verify button (in case auto-submit didn't fire) */}
      {code.length === 6 && !busy && (
        <button
          onClick={() => void verify(code)}
          className="w-full py-3 bg-[#26496b] text-white font-bold rounded-xl text-sm hover:bg-[#1e3a56] transition-colors"
        >
          Doğrula
        </button>
      )}

      {/* Resend */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
        <button onClick={onBack} className="hover:text-gray-600 transition-colors">
          ← Geri dön
        </button>
        {countdown > 0 ? (
          <span>{countdown}s sonra yeniden gönder</span>
        ) : (
          <button
            onClick={() => void sendCode()}
            className="text-[#26496b] font-semibold hover:underline"
          >
            Yeniden gönder
          </button>
        )}
      </div>
    </div>
  );
}
