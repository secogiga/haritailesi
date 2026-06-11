'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface RegQuestion {
  id: string;
  question: string;
  questionType: string;
  options: string[] | null;
  isRequired: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'cancelled' | 'error';

const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/40 focus:border-[var(--color-mavi)] transition';

// ── Üye RSVP (giriş yapılmış) ────────────────────────────────────────────────

function MemberRsvp({
  eventId, eventTitle, questions, onClose,
}: {
  eventId: string;
  eventTitle: string;
  questions: RegQuestion[];
  onClose: () => void;
}) {
  const { user } = useSahneAuth();
  const [rsvpd, setRsvpd] = useState<boolean | null>(null); // null = yükleniyor
  const [status, setStatus] = useState<Status>('idle');
  const [ticketCode, setTicketCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showQuestions, setShowQuestions] = useState(false);

  const hasRequiredQuestions = questions.some(q => q.isRequired);

  useEffect(() => {
    // Üye bu etkinliğe daha önce kayıt oldu mu?
    fetch(`${API_URL}/api/v1/cms/events-rsvp/mine`, {
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() as Promise<string[]> : [])
      .then(ids => setRsvpd(ids.includes(eventId)))
      .catch(() => setRsvpd(false));
  }, [eventId]);

  async function doRsvp() {
    setStatus('loading'); setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/events/${eventId}/rsvp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'RSVP başarısız.');
      }
      const data = await res.json() as { rsvp: boolean; waitlisted?: boolean; attendanceId?: string };
      if (data.waitlisted) {
        setStatus('error');
        setErrorMsg('Kapasite dolu — bekleme listesine eklendiniz. Yer açılırsa bildirim gönderilecek.');
        return;
      }
      setRsvpd(true);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setStatus('error');
    }
  }

  async function cancelRsvp() {
    if (!confirm('Katılımı iptal etmek istediğinize emin misiniz?')) return;
    setStatus('loading');
    try {
      await fetch(`${API_URL}/api/v1/cms/events/${eventId}/rsvp`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setRsvpd(false);
      setStatus('cancelled');
    } catch {
      setStatus('idle');
    }
  }

  function setAns(id: string, v: string) { setAnswers(a => ({ ...a, [id]: v })); }

  const displayName = user?.profile?.displayName ?? user?.email ?? 'Üye';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-slate-100">Etkinliğe Katıl</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-1">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 flex-1 overflow-y-auto">

          {/* Yükleniyor */}
          {rsvpd === null && (
            <div className="flex items-center justify-center py-8">
              <svg className="w-6 h-6 animate-spin text-[var(--color-mavi)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}

          {/* İptal edildi */}
          {status === 'cancelled' && (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">👋</p>
              <p className="font-bold text-gray-900 dark:text-slate-100">Katılım iptal edildi.</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">İstediğiniz zaman tekrar kayıt olabilirsiniz.</p>
              <button onClick={onClose} className="mt-5 px-5 py-2 text-sm text-gray-500 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">Kapat</button>
            </div>
          )}

          {/* Zaten kayıtlı */}
          {rsvpd && status !== 'cancelled' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 dark:text-slate-100">Katılıyorsunuz!</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                E-biletiniz <strong>{user?.email}</strong> adresine gönderildi.
              </p>
              <div className="flex gap-2 justify-center mt-5">
                <button onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors">
                  Tamam
                </button>
                <button onClick={() => void cancelRsvp()} disabled={status === 'loading'}
                  className="px-4 py-2.5 text-sm text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50">
                  {status === 'loading' ? 'İptal ediliyor…' : 'Katılımı iptal et'}
                </button>
              </div>
            </div>
          )}

          {/* Yeni RSVP */}
          {rsvpd === false && status !== 'success' && status !== 'cancelled' && (
            <>
              {/* Üye bilgi özeti */}
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {displayName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] shrink-0">Üye</span>
              </div>

              {/* Özel sorular */}
              {questions.length > 0 && (
                showQuestions ? (
                  <div className="space-y-4 mb-5">
                    {questions.map(q => (
                      <div key={q.id}>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                          {q.question}{q.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {q.questionType === 'select' && q.options ? (
                          <select className={inp} value={answers[q.id] ?? ''} onChange={e => setAns(q.id, e.target.value)}>
                            <option value="">Seçin…</option>
                            {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : q.questionType === 'checkbox' ? (
                          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                            <input type="checkbox" checked={answers[q.id] === 'evet'}
                              onChange={e => setAns(q.id, e.target.checked ? 'evet' : 'hayır')} className="rounded" />
                            Evet
                          </label>
                        ) : (
                          <input type="text" className={inp} value={answers[q.id] ?? ''}
                            onChange={e => setAns(q.id, e.target.value)} placeholder="Yanıtınız…" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => setShowQuestions(true)}
                    className="w-full text-left text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 mb-4 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {questions.length} ek soru var — cevaplamak ister misiniz?
                  </button>
                )
              )}

              {status === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl mb-4">{errorMsg}</p>
              )}

              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                Biletiniz <strong>{user?.email}</strong> adresine gönderilecek.
              </p>

              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 transition-colors">
                  İptal
                </button>
                <button
                  onClick={() => void doRsvp()}
                  disabled={status === 'loading' || (hasRequiredQuestions && showQuestions && questions.some(q => q.isRequired && !answers[q.id]?.trim()))}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors disabled:opacity-60"
                >
                  {status === 'loading'
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Kaydediliyor…</>
                    : '🎫 Hemen Kayıt Ol'}
                </button>
              </div>
            </>
          )}

          {/* Başarılı yeni kayıt */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Kaydınız Alındı!</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                E-biletiniz <strong>{user?.email}</strong> adresine gönderildi.
              </p>
              <button onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors">
                Tamam
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Anonim kayıt modal (giriş yapılmamış) ────────────────────────────────────

function AnonModal({
  eventId, eventTitle, questions, onClose,
}: {
  eventId: string;
  eventTitle: string;
  questions: RegQuestion[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', whatsappConsent: false });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [ticketCode, setTicketCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function setAns(id: string, v: string) { setAnswers(a => ({ ...a, [id]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading'); setErrorMsg('');
    const missing = questions.filter(q => q.isRequired && !answers[q.id]?.trim());
    if (missing.length) { setErrorMsg('Zorunlu alanları doldurun.'); setStatus('error'); return; }
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, displayName: form.displayName,
          phone: form.phone || undefined,
          whatsappConsent: form.whatsappConsent,
          answers: Object.keys(answers).length ? answers : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Kayıt başarısız.');
      }
      const data = await res.json() as { ticketCode: string };
      setTicketCode(data.ticketCode);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-slate-100">Etkinliğe Kayıt Ol</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-1">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Kaydınız Alındı!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed mb-1">
              E-biletiniz <strong>{form.email}</strong> adresine gönderildi.
            </p>
            {form.whatsappConsent && form.phone && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">WhatsApp&apos;a da iletildi.</p>
            )}
            <div className="mt-4 flex gap-3">
              <Link href={`/etkinlikler/bilet/${ticketCode}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors">
                🎫 Biletimi Gör
              </Link>
              <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
                Kapat
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={e => void submit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Ad Soyad *</label>
                <input required type="text" className={inp} value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Adınız Soyadınız" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">E-posta *</label>
                <input required type="email" className={inp} value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@mail.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                Telefon <span className="text-gray-400 font-normal">(WhatsApp bildirimi için)</span>
              </label>
              <input type="tel" className={inp} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05XX XXX XX XX" />
              {form.phone && (
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 mt-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.whatsappConsent}
                    onChange={e => setForm(f => ({ ...f, whatsappConsent: e.target.checked }))} className="rounded border-gray-300" />
                  WhatsApp bildirimi al (bilet + hatırlatıcı)
                </label>
              )}
            </div>
            {questions.map(q => (
              <div key={q.id}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                  {q.question}{q.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {q.questionType === 'select' && q.options ? (
                  <select className={inp} value={answers[q.id] ?? ''} onChange={e => setAns(q.id, e.target.value)}>
                    <option value="">Seçin…</option>
                    {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : q.questionType === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                    <input type="checkbox" checked={answers[q.id] === 'evet'}
                      onChange={e => setAns(q.id, e.target.checked ? 'evet' : 'hayır')} className="rounded" />
                    Evet
                  </label>
                ) : (
                  <input type="text" className={inp} value={answers[q.id] ?? ''}
                    onChange={e => setAns(q.id, e.target.value)} placeholder="Yanıtınız…" />
                )}
              </div>
            ))}
            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{errorMsg}</p>
            )}
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-400 dark:text-slate-500">Biletiniz e-postanıza gönderilecek.</p>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 transition-colors">İptal</button>
                <button type="submit" disabled={status === 'loading'}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
                  {status === 'loading' && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {status === 'loading' ? 'Kaydediliyor…' : 'Kayıt Ol & Bilet Al'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export function EtkinlikKayitFormu({
  eventId, eventTitle, questions = [],
  label = 'Kayıt Ol',
}: {
  eventId: string;
  eventTitle: string;
  questions?: RegQuestion[];
  label?: string;
}) {
  const { user, isLoading } = useSahneAuth();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full h-11 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
      >
        🎫 {user ? 'Hemen Katıl' : label}
      </button>
      {open && user ? (
        <MemberRsvp
          eventId={eventId}
          eventTitle={eventTitle}
          questions={questions}
          onClose={() => setOpen(false)}
        />
      ) : open ? (
        <AnonModal
          eventId={eventId}
          eventTitle={eventTitle}
          questions={questions}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
