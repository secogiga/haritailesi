'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık',
  cbs: 'CBS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri & UA',
  insaat: 'İnşaat',
  gayrimenkul_degerleme: 'Gayrimenkul',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer: 'Kariyer',
  egitim: 'Eğitim',
  mentorluk: 'Mentorluk',
  gonullulik: 'Gönüllülük',
  proje_gelistirme: 'Proje Geliştirme',
  haritailesi_duyurulari: 'Haritailesi',
};

const CATEGORY_COLORS: Record<string, string> = {
  cbs: 'bg-green-100 text-green-700',
  fotogrametri_uzaktan_algilama: 'bg-purple-100 text-purple-700',
  kariyer: 'bg-orange-100 text-orange-700',
  egitim: 'bg-yellow-100 text-yellow-700',
  yazilim_teknoloji: 'bg-blue-100 text-blue-700',
  klasik_haritacilik: 'bg-teal-100 text-teal-700',
  mentorluk: 'bg-pink-100 text-pink-700',
};

interface QaAnswer {
  id: string;
  body: string;
  source: string;
  submitterName: string | null;
  tierLabel: string | null;
  updatedAt: string;
}

interface QaItem {
  id: string;
  displayName: string | null;
  questionText: string;
  category: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  answers: QaAnswer[];
}

// ─── AnswerSubmitForm ─────────────────────────────────────────────────────────

function AnswerSubmitForm({ questionId, onSubmitted }: { questionId: string; onSubmitted: () => void }) {
  const [form, setForm] = useState({ email: '', submitterName: '', body: '', showFullName: true });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.body.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/qa/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          submitterName: form.submitterName || undefined,
          body: form.body,
          showFullName: form.showFullName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Gönderim başarısız oldu.');
      }
      setDone(true);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 bg-white';

  if (done) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-green-700">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Cevabınız alındı, inceleme sonrası yayınlanacak.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">E-posta *</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@mail.com" required className={inp} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Adınız <span className="font-normal">(isteğe bağlı)</span></label>
          <input value={form.submitterName} onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))} placeholder="Anonim" maxLength={80} className={inp} />
        </div>
      </div>
      {form.submitterName.trim() && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.showFullName}
            onChange={e => setForm(f => ({ ...f, showFullName: e.target.checked }))}
            className="w-3.5 h-3.5 rounded accent-[#26496b]"
          />
          <span className="text-xs text-gray-500">
            Adım tam görünsün
            <span className="text-gray-400 ml-1">
              ({form.showFullName ? form.submitterName.trim() : (() => {
                const parts = form.submitterName.trim().split(/\s+/);
                return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : parts[0];
              })()})
            </span>
          </span>
        </label>
      )}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Cevabınız *</label>
        <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} maxLength={3000} placeholder="Bildiğinizi paylaşın…" required className={inp + ' resize-none'} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Admin onayından sonra yayınlanır.</p>
        <button type="submit" disabled={busy || !form.email || !form.body.trim()} className="px-4 py-1.5 text-sm font-medium bg-[#66aca9] text-white rounded-lg hover:bg-[#4d8f8c] disabled:opacity-50">
          {busy ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>
    </form>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

function QuestionCard({ item }: { item: QaItem }) {
  const [open, setOpen] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const catColor = CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-600';

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        open ? 'border-[#26496b]/30 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
      } ${item.isFeatured ? 'ring-1 ring-[#66aca9]/40' : ''}`}
    >
      {item.isFeatured && (
        <div className="bg-gradient-to-r from-[#66aca9]/10 to-[#26496b]/5 px-5 py-1.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#66aca9]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs font-medium text-[#66aca9]">Öne çıkan soru</span>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div className="w-8 h-8 bg-[#26496b] text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          S
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-relaxed">{item.questionText}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${catColor}`}>
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            {item.displayName && (
              <span className="text-xs text-gray-400">{item.displayName} sordu</span>
            )}
            {item.answers.length > 0 && (
              <span className="text-xs text-[#66aca9] font-medium">{item.answers.length} cevap</span>
            )}
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Answers */}
          {item.answers.map((ans, idx) => (
            <div key={ans.id} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#66aca9] text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                C
              </div>
              <div className="flex-1">
                <div className="bg-gradient-to-br from-[#f4f9f9] to-[#eef6f5] rounded-xl border border-[#66aca9]/20 px-4 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ans.body}</p>
                </div>
                <p className="text-xs text-gray-400 mt-2 pl-1">
                  {ans.source === 'admin'
                    ? 'Haritailesi Uzman Ekibi'
                    : ans.submitterName
                      ? `${ans.submitterName} · ${ans.tierLabel ?? 'Sahne Üyesi'}`
                      : (ans.tierLabel ?? 'Sahne Üyesi')
                  } •{' '}
                  {new Date(ans.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}

          {item.answers.length === 0 && (
            <p className="text-sm text-gray-400 pl-12">Bu soru henüz cevaplanmadı. Siz cevap yazabilirsiniz!</p>
          )}

          {/* Answer submission */}
          <div className="pl-12">
            {showAnswerForm ? (
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600">Cevap Yaz</p>
                  <button onClick={() => setShowAnswerForm(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <AnswerSubmitForm questionId={item.id} onSubmitted={() => setShowAnswerForm(false)} />
              </div>
            ) : (
              <button
                onClick={() => setShowAnswerForm(true)}
                className="flex items-center gap-1.5 text-sm text-[#26496b] hover:text-[#1d3a57] font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Cevap yaz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SubmitForm ───────────────────────────────────────────────────────────────

function SubmitForm({ onDone }: { onDone?: () => void } = {}) {
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    questionText: '',
    category: 'haritailesi_duyurulari',
    showFullName: true,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.questionText.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          displayName: form.displayName || undefined,
          questionText: form.questionText,
          category: form.category,
          showFullName: form.showFullName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Gönderim başarısız oldu.');
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 bg-white';

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Sorunuz alındı!</h3>
        <p className="text-sm text-gray-500">Ekibimiz inceleyip onayladıktan sonra yayınlayacak.</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => { setDone(false); setForm(f => ({ ...f, questionText: '', displayName: '' })); }}
            className="text-sm text-[#26496b] underline"
          >
            Başka bir soru sor
          </button>
          {onDone && (
            <button
              onClick={onDone}
              className="text-sm text-gray-500 underline"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">E-posta *</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="ornek@mail.com"
          required
          className={inp}
        />
        <p className="text-xs text-gray-400 mt-1">Sadece admin tarafından görülür, yayınlanmaz.</p>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Adınız <span className="font-normal">(isteğe bağlı)</span></label>
        <input
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
          placeholder="Anonim bırakmak ister misiniz?"
          maxLength={80}
          className={inp}
        />
        {form.displayName.trim() && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.showFullName}
              onChange={e => setForm(f => ({ ...f, showFullName: e.target.checked }))}
              className="w-3.5 h-3.5 rounded accent-[#26496b]"
            />
            <span className="text-xs text-gray-500">
              Adım tam görünsün
              <span className="text-gray-400 ml-1">
                ({form.showFullName ? form.displayName.trim() : (() => {
                  const parts = form.displayName.trim().split(/\s+/);
                  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : parts[0];
                })()})
              </span>
            </span>
          </label>
        )}
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Konu</label>
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className={inp}
        >
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Sorunuz *</label>
        <textarea
          value={form.questionText}
          onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
          rows={4}
          maxLength={500}
          placeholder="Merak ettiğiniz konuyu açıkça yazın..."
          required
          className={inp + ' resize-none'}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{form.questionText.length}/500</p>
      </div>
      <button
        type="submit"
        disabled={busy || !form.email || !form.questionText.trim()}
        className="w-full py-3 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 transition-colors"
      >
        {busy ? 'Gönderiliyor…' : 'Soruyu Gönder'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Sorular yayına girmeden önce ekibimiz tarafından incelenir.
      </p>
    </form>
  );
}

// ─── SubmitModal ──────────────────────────────────────────────────────────────

function SubmitModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#26496b] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[#26496b]">Soru Sor</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <SubmitForm onDone={onClose} />
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export default function SoruCevapClient({ initialItems }: { initialItems: QaItem[] }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const featured = initialItems.filter(i => i.isFeatured);

  const filtered = useMemo(() => {
    let list = initialItems;
    if (categoryFilter) list = list.filter(i => i.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.questionText.toLowerCase().includes(q) ||
        i.answers.some(a => a.body.toLowerCase().includes(q))
      );
    }
    return list;
  }, [initialItems, categoryFilter, search]);

  const categories = [...new Set(initialItems.map(i => i.category))];

  return (
    <>
      <Navbar />
      {showForm && <SubmitModal onClose={() => setShowForm(false)} />}
      <main className="min-h-screen bg-[#f4f7fa]">

        {/* Hero */}
        <section className="bg-gradient-to-br from-[#26496b] to-[#1d3a57] py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Soru & Cevap
            </h1>
            <p className="text-[#a8d4d1] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Haritacılık, CBS, fotogrametri ve geomatik alanlarında aklınıza takılan soruları sorun.
              Uzman kadromuz inceler ve onaylı cevaplarla burada yayınlar.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#66aca9] text-white font-medium rounded-xl hover:bg-[#4d8f8c] transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Soru Sor
            </button>
          </div>
        </section>

        {/* Stats bar */}
        {initialItems.length > 0 && (
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span>
                <strong className="text-[#26496b] font-semibold">{initialItems.length}</strong> soru
              </span>
              <span>
                <strong className="text-[#26496b] font-semibold">{categories.length}</strong> konu alanı
              </span>
              <span>
                <strong className="text-[#26496b] font-semibold">{featured.length}</strong> öne çıkan
              </span>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Q&A list */}
            <div className="lg:col-span-2 space-y-5">

              {/* Search + category filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                  </svg>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Soru veya cevap içinde ara…"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none"
                >
                  <option value="">Tüm konular</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                  ))}
                </select>
              </div>

              {/* Featured section */}
              {!categoryFilter && !search && featured.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Öne çıkan sorular</p>
                  <div className="space-y-3">
                    {featured.map(item => <QuestionCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}

              {/* All Q&As */}
              {(categoryFilter || search || featured.length === 0) && (
                <div>
                  {(categoryFilter || search) && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      {filtered.length} sonuç
                    </p>
                  )}
                  {(!categoryFilter && !search && featured.length === 0) && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tüm sorular</p>
                  )}
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                      <p className="text-gray-400 text-sm">Arama kriterinize uygun soru bulunamadı.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filtered.map(item => <QuestionCard key={item.id} item={item} />)}
                    </div>
                  )}
                </div>
              )}

              {!categoryFilter && !search && featured.length === 0 && filtered.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Henüz yayında soru yok</p>
                  <p className="text-gray-400 text-sm mt-1">İlk soruyu siz sorun!</p>
                </div>
              )}

              {/* Non-featured questions when featured exist */}
              {!categoryFilter && !search && featured.length > 0 && (
                (() => {
                  const rest = initialItems.filter(i => !i.isFeatured);
                  if (rest.length === 0) return null;
                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Diğer sorular</p>
                      <div className="space-y-3">
                        {rest.map(item => <QuestionCard key={item.id} item={item} />)}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Right: sidebar */}
            <div className="space-y-6">

              {/* CTA card */}
              <div className="bg-gradient-to-br from-[#26496b] to-[#1d3a57] rounded-2xl p-5 text-white">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Sorunuz mu var?</h3>
                <p className="text-[#a8d4d1] text-sm leading-relaxed mb-4">
                  Haritacılık, CBS ve geomatik alanlarında aklınıza takılan her şeyi sorun. Uzman ekibimiz cevaplar.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-2.5 bg-[#66aca9] text-white text-sm font-medium rounded-xl hover:bg-[#4d8f8c] transition-colors"
                >
                  Soru Sor
                </button>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-[#26496b] text-sm mb-4">Konu Alanları</h3>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setCategoryFilter('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryFilter ? 'bg-[#26496b] text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      Tümü
                      <span className="float-right text-xs opacity-70">{initialItems.length}</span>
                    </button>
                    {categories.map(c => {
                      const count = initialItems.filter(i => i.category === c).length;
                      return (
                        <button
                          key={c}
                          onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${categoryFilter === c ? 'bg-[#26496b] text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                          {CATEGORY_LABELS[c] ?? c}
                          <span className="float-right text-xs opacity-70">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-[#26496b] text-sm mb-4">Nasıl Çalışır?</h3>
                <ol className="space-y-3">
                  {[
                    { n: '1', t: 'Soruyu gönderin', d: 'E-posta ve sorunuzu yazın.' },
                    { n: '2', t: 'İnceleme', d: 'Uzman ekibimiz soruyu değerlendirir.' },
                    { n: '3', t: 'Cevap paylaşın', d: 'Bildiğiniz varsa siz de cevap yazabilirsiniz.' },
                    { n: '4', t: 'Yayına alınır', d: 'Admin onaylı cevaplar burada görünür.' },
                  ].map(s => (
                    <li key={s.n} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-[#26496b]/10 text-[#26496b] rounded-lg text-xs font-bold flex items-center justify-center shrink-0">{s.n}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{s.t}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
