'use client';

import { useEffect, useRef, useState } from 'react';
import { RowMenu } from '@/components/RowMenu';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function token() {
  return typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? 'Hata');
  return res.json() as Promise<T>;
}

interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  posterKey: string | null;
  deadline: string | null;
  prizes: string | null;
  category: string | null;
  status: string;
  applicationCount: string;
  winnersText: string | null;
  createdAt: string;
}

interface Application {
  id: string;
  displayName: string;
  email: string;
  notes: string | null;
  source: string;
  status: string;
  createdAt: string;
  fileName: string | null;
  fileUrl: string | null;
  juryScore: number | null;
  juryNotes: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  active: 'Aktif',
  closed: 'Kapalı',
  archived: 'Arşiv',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-amber-100 text-amber-700',
  archived: 'bg-red-100 text-red-700',
};

const APP_STATUS_LABELS: Record<string, string> = {
  received: 'Alındı',
  reviewing: 'İnceleniyor',
  shortlisted: 'Kısa Liste',
  rejected: 'Reddedildi',
  winner: 'Kazanan',
};

const APP_STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
  winner: 'bg-green-100 text-green-700',
};

const inp = 'w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b] focus:border-[#26496b]';

function CompetitionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Competition>;
  onSave: (data: Partial<Competition>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    deadline: initial?.deadline ? initial.deadline.slice(0, 16) : '',
    prizes: initial?.prizes ?? '',
    category: initial?.category ?? '',
    status: initial?.status ?? 'draft',
    winnersText: initial?.winnersText ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await onSave({
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        description: form.description || null,
        prizes: form.prizes || null,
        category: form.category || null,
        winnersText: form.winnersText || null,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
          <input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label>
          <input required className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="fotograf-yarismasi-2025" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Kategori</label>
          <input className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Fotoğraf, Proje, Makale…" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Son Başvuru</label>
          <input type="datetime-local" className={inp} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Ödüller</label>
          <input className={inp} value={form.prizes} onChange={e => setForm(f => ({ ...f, prizes: e.target.value }))} placeholder="1. ödül: 5.000 TL, 2. ödül: 2.000 TL" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Durum</label>
          <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
        <textarea rows={3} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Kazananlar Metni</label>
        <textarea rows={2} className={inp} value={form.winnersText} onChange={e => setForm(f => ({ ...f, winnersText: e.target.value }))} placeholder="Yarışma tamamlandığında kazananları buraya girin." />
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
        <button type="submit" disabled={busy} className="px-5 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3a56] disabled:opacity-60">
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}

function JuryCell({ app, onSave }: { app: Application; onSave: (score: number | null, notes: string | null) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(app.juryScore != null ? String(app.juryScore) : '');
  const [notes, setNotes] = useState(app.juryNotes ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await onSave(score !== '' ? Number(score) : null, notes || null);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#26496b]">
        {app.juryScore != null ? (
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">{app.juryScore}</span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Puan yok</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-lg p-3 space-y-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Puan (0–100)</label>
            <input
              type="number" min={0} max={100}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
              value={score} onChange={e => setScore(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Notlar</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Kısa not…"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">İptal</button>
            <button disabled={busy} onClick={() => void save()} className="flex-1 text-xs py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 font-semibold">
              {busy ? '…' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function YarismalarAdminPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [viewApps, setViewApps] = useState<Competition | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [posterUploading, setPosterUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [posterTargetId, setPosterTargetId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiFetch<Competition[]>('/competitions/admin/all')
      .then(setCompetitions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(data: Partial<Competition>) {
    await apiFetch('/competitions/admin/create', { method: 'POST', body: JSON.stringify(data) });
    setShowForm(false);
    load();
  }

  async function handleUpdate(data: Partial<Competition>) {
    if (!editing) return;
    await apiFetch(`/competitions/admin/${editing.id}`, { method: 'PATCH', body: JSON.stringify(data) });
    setEditing(null);
    load();
  }

  async function openApplications(comp: Competition) {
    setViewApps(comp);
    setAppsLoading(true);
    apiFetch<Application[]>(`/competitions/admin/${comp.id}/applications`)
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setAppsLoading(false));
  }

  async function updateAppStatus(appId: string, status: string) {
    if (status === 'winner' && !confirm('Bu kişiyi kazanan ilan edeceksiniz.\nKullanıcı hesabı "Bireysel Üye" seviyesine otomatik yükseltilecek.\n\nOnaylıyor musunuz?')) return;
    await apiFetch(`/competitions/admin/applications/${appId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (viewApps) void openApplications(viewApps);
  }

  async function updateJury(appId: string, juryScore: number | null, juryNotes: string | null) {
    await apiFetch(`/competitions/admin/applications/${appId}/jury`, { method: 'PATCH', body: JSON.stringify({ juryScore, juryNotes }) });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, juryScore, juryNotes } : a));
  }

  function triggerPosterUpload(compId: string) {
    setPosterTargetId(compId);
    fileRef.current?.click();
  }

  async function handlePosterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !posterTargetId) return;
    setPosterUploading(posterTargetId);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await fetch(`${API}/api/v1/competitions/admin/${posterTargetId}/poster`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      load();
    } finally {
      setPosterUploading(null);
      e.target.value = '';
    }
  }

  if (viewApps) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setViewApps(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Yarışmalar
          </button>
          <h1 className="text-xl font-bold text-gray-900">{viewApps.title} — Başvurular</h1>
        </div>

        {appsLoading ? (
          <p className="text-gray-400 text-sm">Yükleniyor…</p>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">Henüz başvuru yok.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Ad Soyad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">E-posta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Dosya</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Kaynak</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Jüri</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors group">
                    <td className="px-4 py-3.5 font-medium text-gray-900">{app.displayName}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{app.email}</td>
                    <td className="px-4 py-3.5">
                      {app.fileUrl ? (
                        <a href={app.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[#26496b] hover:underline font-medium">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {app.fileName ?? 'İndir'}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{app.source}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <select value={app.status} onChange={e => void updateAppStatus(app.id, e.target.value)}
                        className={`text-xs px-2.5 py-0.5 rounded-full border-0 font-semibold cursor-pointer ${APP_STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {Object.entries(APP_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <JuryCell app={app} onSave={(score, notes) => updateJury(app.id, score, notes)} />
                    </td>
                    <td className="px-4 py-3.5">
                      <RowMenu items={[
                        { label: 'Kazanan İlan Et 🏆', onClick: () => void updateAppStatus(app.id, 'winner') },
                        { label: 'Kısa Listeye Al', onClick: () => void updateAppStatus(app.id, 'shortlisted') },
                        { label: 'Reddet', onClick: () => void updateAppStatus(app.id, 'rejected'), danger: true },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handlePosterFile(e)} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yarışmalar</h1>
          <p className="text-sm text-gray-500 mt-1">Sahne yarışmalarını oluşturun ve yönetin.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Yarışma
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">{editing ? 'Yarışmayı Düzenle' : 'Yeni Yarışma'}</h2>
          <CompetitionForm
            {...(editing ? { initial: editing } : {})}
            onSave={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-20 animate-pulse" />)}
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">Henüz yarışma eklenmedi.</div>
      ) : (
        <div className="space-y-3">
          {competitions.map(comp => (
            <div key={comp.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              {/* Poster thumb */}
              <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {comp.posterKey ? (
                  <img src={`${API}/storage/${comp.posterKey}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{comp.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[comp.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[comp.status] ?? comp.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {comp.category && <span>{comp.category}</span>}
                  {comp.deadline && <span>Son: {new Date(comp.deadline).toLocaleDateString('tr-TR')}</span>}
                  <span>{comp.applicationCount} başvuru</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => void openApplications(comp)}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Başvurular
                </button>
                <button
                  onClick={() => triggerPosterUpload(comp.id)}
                  disabled={posterUploading === comp.id}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {posterUploading === comp.id ? '…' : 'Afiş'}
                </button>
                <button
                  onClick={() => { setEditing(comp); setShowForm(false); }}
                  className="px-3 py-1.5 text-xs bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56]"
                >
                  Düzenle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
