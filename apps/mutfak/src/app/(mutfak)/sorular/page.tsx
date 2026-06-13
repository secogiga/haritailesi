'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mutfakApi, type QaItem } from '@/lib/api';

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

// ─── AnswerSubmitForm ─────────────────────────────────────────────────────────

function AnswerSubmitForm({
  questionId,
  token,
  userName,
  onSubmitted,
  onCancel,
}: {
  questionId: string;
  token: string;
  userName: string | null;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState('');
  const [showFullName, setShowFullName] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const previewName = (() => {
    if (!userName) return null;
    if (showFullName) return userName;
    const parts = userName.trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : parts[0];
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      await mutfakApi.submitQaAnswer(token, questionId, { body, showFullName });
      setDone(true);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-green-600 dark:text-green-400">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Cevabınız alındı, admin onayından sonra yayınlanacak.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        maxLength={3000}
        required
        placeholder="Bildiğinizi paylaşın…"
        className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
      />
      {userName && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showFullName}
            onChange={e => setShowFullName(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-[#26496b]"
          />
          <span className="text-xs text-[var(--text-muted)]">
            Adım görünsün
            <span className="opacity-60 ml-1">({previewName})</span>
          </span>
        </label>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">Admin onayından sonra yayınlanır.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg)]">
            İptal
          </button>
          <button type="submit" disabled={busy || !body.trim()} className="px-3 py-1.5 text-xs font-medium bg-[#66aca9] text-white rounded-lg hover:bg-[#4d8f8c] disabled:opacity-50">
            {busy ? 'Gönderiliyor…' : 'Gönder'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

function QuestionCard({ item, token, userName }: { item: QaItem; token: string | null; userName: string | null }) {
  const [open, setOpen] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  return (
    <div
      className={`bg-[var(--card)] border rounded-2xl overflow-hidden transition-all duration-200 ${
        open ? 'border-[#26496b]/30 shadow-sm' : 'border-[var(--border)] hover:border-[#66aca9]/40'
      } ${item.isFeatured ? 'ring-1 ring-[#66aca9]/30' : ''}`}
    >
      {item.isFeatured && (
        <div className="bg-gradient-to-r from-[#66aca9]/10 to-transparent px-4 py-1.5 flex items-center gap-1.5 border-b border-[#66aca9]/10">
          <span className="text-xs text-[#66aca9] font-medium">⭐ Öne çıkan soru</span>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-4 flex items-start gap-3"
      >
        <div className="w-8 h-8 bg-[#26496b] text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">S</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{item.questionText}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#26496b]/10 text-[#26496b] font-medium">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            {item.displayName && <span className="text-xs text-[var(--text-muted)]">{item.displayName}</span>}
            {item.answers.length > 0 && (
              <span className="text-xs text-[#66aca9] font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                {item.answers.length} cevap
              </span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Answers */}
          {item.answers.map(ans => (
            <div key={ans.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${ans.source === 'admin' ? 'bg-[#26496b]' : 'bg-[#66aca9]'}`}>
                {ans.source === 'admin' ? '★' : 'C'}
              </div>
              <div className="flex-1">
                <div className={`bg-gradient-to-br rounded-xl border px-4 py-3 ${ans.source === 'admin' ? 'from-[#26496b]/5 to-[var(--card)] border-[#26496b]/20 dark:from-[#26496b]/20' : 'from-[#f4f9f9] to-[var(--card)] border-[#66aca9]/20 dark:from-[#1a3a3a]/20'}`}>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{ans.body}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 pl-1 flex-wrap">
                  {ans.source === 'admin' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#26496b] text-white">
                      Uzman Ekibi
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-[var(--text-muted)]">
                        {ans.submitterName ?? 'Haritailesi Üyesi'}
                      </span>
                      {ans.tierLabel && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#66aca9]/15 text-[#66aca9]">
                          {ans.tierLabel}
                        </span>
                      )}
                    </>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)]">
                    • {new Date(ans.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {item.answers.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] pl-11">Henüz cevap yok. Bilen var mı?</p>
          )}

          {/* Answer submission for authenticated users */}
          {token && (
            <div className="pl-11">
              {showAnswerForm ? (
                <div className="border border-[var(--border)] rounded-xl p-3 bg-[var(--bg)]">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Cevap Yaz</p>
                  <AnswerSubmitForm
                    questionId={item.id}
                    token={token}
                    userName={userName}
                    onSubmitted={() => setShowAnswerForm(false)}
                    onCancel={() => setShowAnswerForm(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswerForm(true)}
                  className="flex items-center gap-1.5 text-sm text-[#26496b] dark:text-[#66aca9] hover:underline font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Cevap yaz
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SubmitModal ──────────────────────────────────────────────────────────────

function SubmitModal({
  token,
  userName,
  onClose,
  onSubmitted,
}: {
  token: string;
  userName: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [form, setForm] = useState({ questionText: '', category: 'haritailesi_duyurulari', showFullName: true });

  const previewName = (() => {
    if (!userName) return null;
    if (form.showFullName) return userName;
    const parts = userName.trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : parts[0];
  })();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.questionText.trim()) return;
    setBusy(true);
    setError('');
    try {
      await mutfakApi.submitQaQuestion(token, {
        questionText: form.questionText,
        category: form.category,
        showFullName: form.showFullName,
      });
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[#26496b] dark:text-white">Soru Sor</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Uzman ekibimiz inceleyip cevaplar</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Konu</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Sorunuz *</label>
            <textarea
              value={form.questionText}
              onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
              rows={4}
              maxLength={500}
              required
              placeholder="Merak ettiğiniz konuyu açık ve net yazın…"
              className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm bg-[var(--card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
            />
            <p className="text-xs text-[var(--text-muted)] text-right mt-1">{form.questionText.length}/500</p>
          </div>
          {userName && (
            <label className="flex items-center gap-2 cursor-pointer select-none px-1">
              <input
                type="checkbox"
                checked={form.showFullName}
                onChange={e => setForm(f => ({ ...f, showFullName: e.target.checked }))}
                className="w-3.5 h-3.5 rounded accent-[#26496b]"
              />
              <span className="text-xs text-[var(--text-muted)]">
                Adım soru yanında görünsün
                <span className="opacity-60 ml-1">({previewName})</span>
              </span>
            </label>
          )}
          <div className="bg-[#26496b]/5 dark:bg-white/5 rounded-xl px-4 py-3 text-xs text-[var(--text-muted)]">
            Soru ve cevap admin onayıyla yayına girer. {userName ? 'Adınız profil bilgilerinizden alınır.' : ''}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--bg)]"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={busy || !form.questionText.trim()}
              className="flex-1 py-2.5 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50"
            >
              {busy ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SorularPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<QaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function load() {
    setLoading(true);
    mutfakApi.listQa()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter) list = list.filter(i => i.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.questionText.toLowerCase().includes(q) ||
        i.answers.some(a => a.body.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, categoryFilter, search]);

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#26496b] dark:text-white">Soru & Cevap</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Uzman ekibin onayladığı resmi cevaplar</p>
        </div>
        {user && (
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Soru Sor
          </button>
        )}
      </div>

      {/* Submitted banner */}
      {submitted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-700 dark:text-green-400">
            Sorunuz alındı! Admin inceleyip onayladıktan sonra burada yayınlanacak.
          </p>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Soru veya cevap ara…"
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--card)] text-[var(--text-primary)] focus:outline-none"
        >
          <option value="">Tüm konular ({items.length})</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c] ?? c} ({items.filter(i => i.category === c).length})
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[var(--border)] rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--border)] rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-[var(--bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {items.length === 0 ? (
            <>
              <p className="font-medium text-[var(--text-primary)]">Henüz yayında soru yok</p>
              {user && (
                <button
                  onClick={() => setShowSubmit(true)}
                  className="mt-3 text-sm text-[#26496b] dark:text-[#66aca9] underline"
                >
                  İlk soruyu siz sorun
                </button>
              )}
            </>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">Aramanızla eşleşen soru bulunamadı.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => <QuestionCard key={item.id} item={item} token={token} userName={user?.profile?.displayName ?? null} />)}
        </div>
      )}

      {/* Info card for guests */}
      {!user && (
        <div className="bg-[#26496b]/5 dark:bg-white/5 rounded-2xl border border-[#26496b]/10 dark:border-white/10 p-5 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Soru sormak veya cevap yazmak için{' '}
            <a href="/giris" className="text-[#26496b] dark:text-[#66aca9] font-medium underline">
              giriş yapın
            </a>
          </p>
        </div>
      )}

      {showSubmit && token && (
        <SubmitModal
          token={token}
          userName={user?.profile?.displayName ?? null}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => { setSubmitted(true); setTimeout(() => setSubmitted(false), 6000); }}
        />
      )}
    </div>
  );
}
