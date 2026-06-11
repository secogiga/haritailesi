'use client';

import { useRef, useState, KeyboardEvent } from 'react';

const API_URL    = process.env['NEXT_PUBLIC_API_URL']    ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const IAN_TYPES = [
  { value: 'isbirligi',         label: 'İşbirliği' },
  { value: 'proje',             label: 'Projeler' },
  { value: 'teknik_destek',     label: 'Teknik Destek' },
  { value: 'freelancer',        label: 'Freelancer' },
  { value: 'teknoloji_ekipman', label: 'Teknoloji & Ekipman' },
  { value: 'ikinci_el',         label: 'İkinci El & Satış' },
  { value: 'mesleki_arac',      label: 'Mesleki Araçlar' },
  { value: 'firsat',            label: 'Fırsatlar' },
  { value: 'duyuru',            label: 'Duyurular' },
];

// Özel isimler her zaman büyük harf başlasın
const PROPER_NOUNS = new Set([
  'İzmir', 'Ankara', 'İstanbul', 'Bursa', 'Konya', 'Antalya', 'Trabzon', 'Samsun', 'Adana',
  'Türkiye', 'Azerbaycan',
  'CBS', 'GIS', 'CAD', 'RTK', 'GNSS', 'GPS', 'LiDAR', 'BIM', 'CORS',
  'Netcad', 'AutoCAD', 'ArcGIS', 'QGIS',
  'React', 'Python', 'JavaScript', 'TypeScript',
  'DJI', 'Leica', 'Trimble', 'Topcon', 'Sokkia',
]);

// Türkçe yazım düzeltmesi: İngilizce karakterleri Türkçeye çevirmez,
// sadece apaçık tutarsızlıkları düzeltir.
function normalizeTag(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Özel isim listesinde (büyük/küçük fark gözetmeksizin) varsa orijinal formunu kullan
  const match = [...PROPER_NOUNS].find(p => p.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;

  // Aksi halde ilk harf küçük, geri kalanı olduğu gibi bırak
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function validateTag(tag: string): string | null {
  if (tag.length < 2)  return 'En az 2 karakter';
  if (tag.length > 24) return 'En fazla 24 karakter';
  return null;
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag) return;
    const err = validateTag(tag);
    if (err) { setError(err); return; }
    if (tags.includes(tag)) { setError('Bu etiket zaten eklendi'); return; }
    if (tags.length >= 8)   { setError('En fazla 8 etiket eklenebilir'); return; }
    onChange([...tags, tag]);
    setInput('');
    setError('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
      setError('');
    }
  }

  function removeTag(i: number) {
    onChange(tags.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div
        className="min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-text focus-within:ring-2 focus-within:ring-[#26496b]/40 focus-within:border-[#26496b] transition"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium bg-[#26496b]/10 dark:bg-blue-900/30 text-[#26496b] dark:text-blue-300 px-2 py-0.5 rounded-md">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-[#26496b]/50 hover:text-[#26496b] dark:text-blue-400/50 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={onKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? 'Etiket yazıp Enter veya virgül ile ekleyin…' : ''}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
          disabled={tags.length >= 8}
        />
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const EMPTY = {
  displayName: '',
  email: '',
  title: '',
  ilanType: '',
  company: '',
  location: '',
  description: '',
  price: '',
  phone: '',
};

type Status = 'idle' | 'loading' | 'success' | 'error';
type Mode   = 'choose' | 'form';

const inp = 'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] transition';

function Modal({ onClose }: { onClose: () => void }) {
  const [mode, setMode]       = useState<Mode>('choose');
  const [form, setForm]       = useState(EMPTY);
  const [tags, setTags]       = useState<string[]>([]);
  const [showPhone, setShowPhone] = useState(false);
  const [status, setStatus]   = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const typeLabel = IAN_TYPES.find(t => t.value === form.ilanType)?.label ?? form.ilanType;
    const descFull = [
      typeLabel     ? `Kategori: ${typeLabel}`                                      : '',
      form.company  ? `Firma / Kurum: ${form.company}`                             : '',
      form.location ? `Konum: ${form.location}`                                    : '',
      form.price    ? `Fiyat / Bütçe: ${form.price}`                               : '',
      tags.length   ? `Etiketler: ${tags.join(', ')}`                              : '',
      form.phone && showPhone  ? `Telefon (ilanda gösterilsin): ${form.phone}`     : '',
      form.phone && !showPhone ? `Telefon (sadece iç kullanım, gösterilmesin): ${form.phone}` : '',
      '',
      form.description,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(`${API_URL}/api/v1/marketplace/content-requests/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          email:       form.email,
          source:      'sahne',
          type:        'ilan',
          title:       form.title,
          description: descFull,
          contactInfo: form.phone || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Gönderim başarısız.');
      }
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setStatus('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-3xl shadow-2xl border-t sm:border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">İlan Yayınla</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Ekibimiz 48 saat içinde inceler ve ilanı panoya ekler.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4 shrink-0 mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Başarı */}
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">İlanınız Alındı!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Ekibimiz en kısa sürede inceleyip yayına alacak. Onay e-posta ile bildirilecek.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors"
            >
              Kapat
            </button>
          </div>

        ) : mode === 'choose' ? (
          <div className="px-6 py-6 space-y-3 flex-1">
            <a
              href={`${MUTFAK_URL}/ilanlar/gonder`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 w-full bg-gradient-to-br from-[#26496b] to-[#1a3350] hover:from-[#1d3a57] hover:to-[#162b40] rounded-2xl p-5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm mb-0.5">Üye Girişi ile Gönder</p>
                <p className="text-xs text-white/60 leading-snug">Mutfak hesabınla hızlıca gönder. Bilgilerin otomatik doldurulur.</p>
              </div>
              <svg className="w-5 h-5 text-white/50 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <button
              onClick={() => setMode('form')}
              className="group flex items-center gap-4 w-full bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-[#26496b]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm mb-0.5">Form ile Gönder</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug">Üye olmadan gönderebilirsin. İlan bilgilerini doldur.</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-[11px] text-center text-gray-400 dark:text-slate-500 pt-1">
              İlanlar moderatörler tarafından incelenir, uygunsa 48 saat içinde yayına alınır.
            </p>
          </div>

        ) : (
          <form onSubmit={e => void handleSubmit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors mb-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad Soyad *</label>
                <input required type="text" value={form.displayName} onChange={set('displayName')} placeholder="Adınız soyadınız" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="ornek@eposta.com" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">İlan Başlığı *</label>
              <input required type="text" value={form.title} onChange={set('title')} placeholder="İlanınızın kısa başlığı" className={inp} />
              <p className="text-[11px] text-gray-400 mt-1">Türkçe karakterleri doğru kullanın: İstanbul, ölçüm, büyük ölçekli…</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Kategori *</label>
                <select required value={form.ilanType} onChange={set('ilanType')} className={inp}>
                  <option value="">Seçin…</option>
                  {IAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Firma / Kurum *</label>
                <input required type="text" value={form.company} onChange={set('company')} placeholder="Firma adı" className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Konum <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input type="text" value={form.location} onChange={set('location')} placeholder="İstanbul, Uzaktan…" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Fiyat / Bütçe <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input type="text" value={form.price} onChange={set('price')} placeholder="₺5.000 veya Pazarlıklı" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama *</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="İlanınızı detaylı açıklayın: ne arıyorsunuz, koşullar, beklentiler…"
                className={`${inp} resize-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Etiketler <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Telefon <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                    {showPhone ? 'İlanda görünür' : 'İlanda gizli'}
                  </span>
                  <div
                    role="checkbox"
                    aria-checked={showPhone}
                    onClick={() => setShowPhone(v => !v)}
                    className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${showPhone ? 'bg-[#26496b]' : 'bg-gray-200 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showPhone ? 'translate-x-4' : ''}`} />
                  </div>
                </label>
              </div>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+90 500 000 00 00"
                className={inp}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{errorMsg}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
                Moderatörler inceler, uygunsa 48 saat içinde yayına alınır.
              </p>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 transition-colors">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {status === 'loading' && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {status === 'loading' ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function IlanGonderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 bg-white text-[#0d1b2a] font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-black/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        İlan Yayınla
        <span className="text-slate-400 font-normal text-xs ml-0.5">· Ücretsiz</span>
      </button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
