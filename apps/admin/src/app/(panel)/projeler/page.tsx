'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { adminApi, type CmsProject, type ContentRequestItem } from '@/lib/api';
import { STATUS_CLS, SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

type Tab = 'talepler' | 'projeler' | 'yillik';

const AY_LABELS: Record<number, string> = {
  1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan', 5: 'Mayıs',
  6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos', 9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık',
};

const REQ_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi',
};
const PROJ_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', completed: 'Tamamlandı', archived: 'Arşivlendi',
};

const GRAD_MAP: Record<string, string> = {
  'from-[#26496b] to-[#1a3350]': 'linear-gradient(135deg,#26496b,#1a3350)',
  'from-emerald-400 to-emerald-600': 'linear-gradient(135deg,#34d399,#059669)',
  'from-amber-400 to-amber-600': 'linear-gradient(135deg,#fbbf24,#d97706)',
  'from-orange-400 to-orange-600': 'linear-gradient(135deg,#fb923c,#ea580c)',
  'from-blue-400 to-blue-600': 'linear-gradient(135deg,#60a5fa,#2563eb)',
  'from-purple-400 to-purple-600': 'linear-gradient(135deg,#c084fc,#9333ea)',
  'from-pink-400 to-pink-600': 'linear-gradient(135deg,#f472b6,#db2777)',
  'from-teal-400 to-teal-600': 'linear-gradient(135deg,#2dd4bf,#0d9488)',
};
const TYPE_GRAD: Record<string, string> = {
  linkedin: 'linear-gradient(135deg,#0077b5,#005a8e)',
  sahne: 'linear-gradient(135deg,#26496b,#1a3350)',
};

function gradCss(p: CmsProject): string {
  if (p.accentGradient && GRAD_MAP[p.accentGradient]) return GRAD_MAP[p.accentGradient]!;
  return TYPE_GRAD[p.type] ?? TYPE_GRAD.sahne!;
}

function IcoTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IcoEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg className="w-4 h-4 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : '' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ProjelerPage() {
  const [tab, setTab] = useState<Tab>('talepler');

  // ── Talepler ──
  const [requests, setRequests] = useState<ContentRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sourceFilter, setSourceFilter] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [deletingReq, setDeletingReq] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // ── Projeler ──
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [projLoading, setProjLoading] = useState(false);
  const [projLoaded, setProjLoaded] = useState(false);
  const [expandedProj, setExpandedProj] = useState<string | null>(null);
  const [deletingProj, setDeletingProj] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'' | 'sahne' | 'linkedin'>('');
  const [uniFilter, setUniFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [awardFilter, setAwardFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'views'>('views');
  const [liPostUrlDraft, setLiPostUrlDraft] = useState<Record<string, string>>({});
  const [liPostUrlSaving, setLiPostUrlSaving] = useState<string | null>(null);

  // ── LinkedIn Bulk Update ──
  const [liUploadOpen, setLiUploadOpen] = useState(false);
  const [liMatches, setLiMatches] = useState<Array<{ id: string; title: string; newViews: number; oldViews: number; newLikes: number; newComments: number; newClicks: number }> | null>(null);
  const [liUploadMsg, setLiUploadMsg] = useState('');
  const [liUploading, setLiUploading] = useState(false);
  const liFileRef = useRef<HTMLInputElement>(null);

  // ── Yıllık Ödül ──
  const [awardSaving, setAwardSaving] = useState<string | null>(null);
  const [communityVotes, setCommunityVotes] = useState<Record<string, string>>({});


  async function handleLinkedinFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLiMatches(null);
    setLiUploadMsg('Dosya okunuyor…');
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      const urlMap: Record<string, { views: number; likes: number; comments: number; clicks: number }> = {};
      for (const row of rows) {
        const url = String(row['Gönderi linki'] ?? '').trim();
        if (!url) continue;
        urlMap[url] = {
          views: Number(row['Görüntülenme'] ?? 0),
          likes: Number(row['Beğenmeler'] ?? 0),
          comments: Number(row['Yorumlar'] ?? 0),
          clicks: Number(row['Tıklama'] ?? 0),
        };
      }
      const matched = projects
        .filter(p => p.linkedinPostUrl && urlMap[p.linkedinPostUrl])
        .map(p => ({
          id: p.id,
          title: p.title,
          newViews: urlMap[p.linkedinPostUrl!]!.views,
          oldViews: p.linkedinViewCount ?? 0,
          newLikes: urlMap[p.linkedinPostUrl!]!.likes,
          newComments: urlMap[p.linkedinPostUrl!]!.comments,
          newClicks: urlMap[p.linkedinPostUrl!]!.clicks,
        }));
      setLiMatches(matched);
      setLiUploadMsg(matched.length > 0 ? `${matched.length} proje eşleşti` : 'Eşleşen proje bulunamadı. LinkedIn URL\'leri kontrol edin.');
    } catch (err) {
      setLiUploadMsg(`Hata: ${(err as Error).message}`);
    }
  }

  async function confirmLinkedinUpdate() {
    if (!liMatches || liMatches.length === 0) return;
    setLiUploading(true);
    try {
      const items = liMatches.map(m => ({
        id: m.id,
        linkedinViewCount: m.newViews,
        linkedinLikeCount: m.newLikes,
        linkedinCommentCount: m.newComments,
        linkedinClickCount: m.newClicks,
      }));
      const res = await adminApi.bulkUpdateLinkedinViews(items);
      setLiUploadMsg(`✓ ${res.updated} proje güncellendi`);
      setLiMatches(null);
      loadProjects();
    } catch (err) {
      setLiUploadMsg(`Hata: ${(err as Error).message}`);
    } finally {
      setLiUploading(false);
      if (liFileRef.current) liFileRef.current.value = '';
    }
  }

  async function toggleAward(project: CmsProject, field: 'finalist' | 'winner') {
    setAwardSaving(project.id + field);
    try {
      const newVal = !project[field];
      await adminApi.updateProject(project.id, { [field]: newVal } as never);
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, [field]: newVal } : p));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAwardSaving(null);
    }
  }

  async function saveCommunityVotes(project: CmsProject) {
    const raw = communityVotes[project.id];
    if (raw === undefined) return;
    const votes = parseInt(raw, 10);
    if (isNaN(votes)) return;
    setAwardSaving(project.id + 'votes');
    try {
      await adminApi.updateProject(project.id, { awardCommunityVotes: votes } as never);
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, awardCommunityVotes: votes } : p));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAwardSaving(null);
    }
  }

  function loadRequests() {
    setReqLoading(true);
    const qs: Record<string, string> = { type: 'proje' };
    if (statusFilter) qs.status = statusFilter;
    if (sourceFilter) qs.source = sourceFilter;
    adminApi.listContentRequests(qs)
      .then(r => setRequests(r.data))
      .catch(() => {})
      .finally(() => setReqLoading(false));
  }

  function loadProjects() {
    setProjLoading(true);
    adminApi.listProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => { setProjLoading(false); setProjLoaded(true); });
  }

  useEffect(() => { loadRequests(); }, [statusFilter, sourceFilter]); // eslint-disable-line
  useEffect(() => { if ((tab === 'projeler' || tab === 'yillik') && !projLoaded) loadProjects(); }, [tab]); // eslint-disable-line

  async function review(id: string, status: 'approved' | 'rejected') {
    setReviewing(id);
    try { await adminApi.reviewContentRequest(id, status, notes[id]); loadRequests(); }
    finally { setReviewing(null); }
  }

  async function deleteReq(id: string) {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    setDeletingReq(id);
    try { await adminApi.deleteContentRequest(id); loadRequests(); }
    finally { setDeletingReq(null); }
  }

  async function deleteProject(id: string, title: string) {
    if (!confirm(`"${title}" projesini silmek istediğinize emin misiniz?`)) return;
    setDeletingProj(id);
    try { await adminApi.deleteProject(id); setProjects(p => p.filter(x => x.id !== id)); }
    catch (e) { alert((e as Error).message); }
    finally { setDeletingProj(null); }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  // Üniversite ve kategori listelerini projelerden türet
  const universities = Array.from(new Set(projects.map(p => p.university).filter(Boolean))).sort() as string[];
  const categories = Array.from(new Set(projects.map(p => p.projectCategory).filter(Boolean))).sort() as string[];

  const visibleProjects = projects
    .filter(p => !typeFilter || p.type === typeFilter)
    .filter(p => !uniFilter || p.university === uniFilter)
    .filter(p => !catFilter || p.projectCategory === catFilter)
    .filter(p => !awardFilter || (awardFilter === 'odullu' ? p.awardCohortMonth != null : p.awardCohortMonth == null))
    .sort((a, b) => sortBy === 'views'
      ? ((b.linkedinViewCount ?? 0) + (b.viewCount ?? 0)) - ((a.linkedinViewCount ?? 0) + (a.viewCount ?? 0))
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white';

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projeler</h1>
        <p className="text-sm text-gray-500 mt-1">Gelen proje talepleri ve yayındaki projeler</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('talepler')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${tab === 'talepler' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Gelen Talepler
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{pendingCount}</span>
          )}
        </button>
        <button onClick={() => setTab('projeler')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'projeler' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Yayındaki Projeler
        </button>
        <button onClick={() => setTab('yillik')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${tab === 'yillik' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          🏆 Yıllık Ödül
        </button>
      </div>

      {/* ── Tab 1: Gelen Talepler ── */}
      {tab === 'talepler' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              {(['', 'sahne', 'mutfak'] as const).map(s => (
                <button key={s} onClick={() => setSourceFilter(s)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${sourceFilter === s ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b] hover:text-[#26496b]'}`}>
                  {s === '' ? 'Tümü' : s === 'sahne' ? 'Sahne' : 'Mutfak'}
                </button>
              ))}
            </div>
            <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              {Object.entries(REQ_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {reqLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
            ))}</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              Proje talebi bulunamadı.
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(item => {
                const isOpen = expandedReq === item.id;
                const grad = item.source === 'sahne'
                  ? 'linear-gradient(135deg,#26496b,#1e3a56)'
                  : 'linear-gradient(135deg,#66aca9,#4d8f8c)';
                const initials = (item.displayName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ background: grad }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_CLS[item.status] ?? ''}`}>
                            {REQ_STATUS_LABELS[item.status] ?? item.status}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'}`}>
                            {SOURCE_LABELS[item.source] ?? item.source}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {item.displayName} · {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug truncate">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Sil" disabled={deletingReq === item.id} onClick={() => void deleteReq(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detay'} onClick={() => setExpandedReq(isOpen ? null : item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                          <IcoChevron open={isOpen} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                        {item.description && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Açıklama</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                          </div>
                        )}
                        {item.contactInfo && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
                            <p className="text-sm text-gray-700">{item.contactInfo}</p>
                          </div>
                        )}
                        {item.adminNotes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                            <span className="font-semibold">Admin Notu: </span>{item.adminNotes}
                          </div>
                        )}
                        {item.status === 'pending' && (
                          <div className="space-y-2 pt-1">
                            <textarea rows={2}
                              value={notes[item.id] ?? ''}
                              onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white"
                              placeholder="Onay/red gerekçesi (opsiyonel)…" />
                            <div className="flex gap-2">
                              <button disabled={reviewing === item.id} onClick={() => void review(item.id, 'approved')}
                                className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                ✓ Onayla
                              </button>
                              <button disabled={reviewing === item.id} onClick={() => void review(item.id, 'rejected')}
                                className="px-4 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                                ✕ Reddet
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Yıllık Ödül ── */}
      {tab === 'yillik' && (
        <div>
          {/* Formül bilgisi */}
          <div className="mb-5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-amber-800">Puan Formülü:</span>
            <span className="text-amber-700">%50 İstatistik</span>
            <span className="text-amber-400">+</span>
            <span className="text-amber-700">%30 Topluluk Oyu</span>
            <span className="text-amber-400">+</span>
            <span className="text-amber-700">%20 Vakıf Ekibi</span>
          </div>

          {projLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
            ))}</div>
          ) : (() => {
            const awardProjects = projects.filter(p => p.awardCohortMonth != null);
            if (awardProjects.length === 0) return (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                Ödüllü proje bulunamadı.
              </div>
            );
            const months = Array.from(new Set(awardProjects.map(p => p.awardCohortMonth!))).sort((a, b) => a - b);
            return (
              <div className="space-y-6">
                {months.map(month => {
                  const monthProjects = awardProjects
                    .filter(p => p.awardCohortMonth === month)
                    .sort((a, b) => (a.awardRank ?? 99) - (b.awardRank ?? 99));
                  return (
                    <div key={month}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{AY_LABELS[month] ?? `Ay ${month}`}</h3>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400">{monthProjects.length} proje</span>
                      </div>
                      <div className="space-y-2">
                        {monthProjects.map(p => {
                          const totalViews = (p.linkedinViewCount ?? 0) + (p.viewCount ?? 0);
                          const isSavingF = awardSaving === p.id + 'finalist';
                          const isSavingW = awardSaving === p.id + 'winner';
                          const isSavingV = awardSaving === p.id + 'votes';
                          return (
                            <div key={p.id}
                              className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-wrap items-start gap-4 ${p.winner ? 'border-amber-300 bg-amber-50/30' : p.finalist ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100'}`}>
                              {/* Sıra + Ay */}
                              <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                                <span className={`text-xl font-black ${p.awardRank === 1 ? 'text-amber-500' : p.awardRank === 2 ? 'text-gray-400' : 'text-orange-400'}`}>
                                  #{p.awardRank}
                                </span>
                                <span className="text-[9px] font-semibold text-gray-400 uppercase">{AY_LABELS[month]}</span>
                              </div>

                              {/* Proje bilgileri */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 leading-snug">{p.authorName ?? '—'}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.title}</p>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                                  {p.university && <span>{p.university.replace(' Üniversitesi', ' Ü.').replace(' Teknik', ' T.')}</span>}
                                  {p.projectCategory && <span>· {p.projectCategory}</span>}
                                  <span className="text-blue-500 font-semibold">· {totalViews.toLocaleString('tr-TR')} görüntülenme</span>
                                </p>
                              </div>

                              {/* Topluluk oyu */}
                              <div className="flex flex-col gap-1 shrink-0">
                                <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Topluluk Oyu</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={communityVotes[p.id] ?? (p.awardCommunityVotes?.toString() ?? '')}
                                    onChange={e => setCommunityVotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    onBlur={() => void saveCommunityVotes(p)}
                                    className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-amber-400 bg-white"
                                  />
                                  {isSavingV && <span className="text-[9px] text-gray-400">...</span>}
                                </div>
                              </div>

                              {/* Finalist / Kazanan */}
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  disabled={isSavingF}
                                  onClick={() => void toggleAward(p, 'finalist')}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${p.finalist ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'}`}>
                                  {isSavingF ? '…' : p.finalist ? '✓ Finalist' : 'Finalist'}
                                </button>
                                <button
                                  disabled={isSavingW}
                                  onClick={() => void toggleAward(p, 'winner')}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${p.winner ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'}`}>
                                  {isSavingW ? '…' : p.winner ? '🏆 Kazanan' : 'Kazanan'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab 2: Yayındaki Projeler ── */}
      {tab === 'projeler' && (
        <div>
          {/* Filtreler + Yeni Proje */}
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tür filtreleri */}
              {([['', 'Tümü'], ['sahne', 'Sahne'], ['linkedin', 'LinkedIn']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setTypeFilter(v as '' | 'sahne' | 'linkedin')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${typeFilter === v ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b] hover:text-[#26496b]'}`}>
                  {l}
                  {v === '' && <span className="ml-1 opacity-60">({visibleProjects.length}/{projects.length})</span>}
                </button>
              ))}

              {/* Üniversite */}
              {universities.length > 0 && (
                <select value={uniFilter} onChange={e => setUniFilter(e.target.value)}
                  className={`${sel} text-xs max-w-[180px]`}>
                  <option value="">Tüm Üniversiteler</option>
                  {universities.map(u => (
                    <option key={u} value={u}>{u.replace(' Üniversitesi', ' Ü.').replace(' Teknik', ' T.')}</option>
                  ))}
                </select>
              )}

              {/* Kategori */}
              {categories.length > 0 && (
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className={`${sel} text-xs`}>
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Ödül filtresi */}
              <select value={awardFilter} onChange={e => setAwardFilter(e.target.value)}
                className={`${sel} text-xs`}>
                <option value="">Ödül Durumu</option>
                <option value="odullu">Ödüllü</option>
                <option value="odul-yok">Ödülsüz</option>
              </select>

              {/* Sıralama */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'createdAt' | 'views')}
                className={`${sel} text-xs`}>
                <option value="views">Görüntülenme ↓</option>
                <option value="createdAt">Tarih ↓</option>
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => { setLiUploadOpen(o => !o); setLiMatches(null); setLiUploadMsg(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a66c2] text-white text-sm font-semibold rounded-xl hover:bg-[#005a9e] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn Güncelle
              </button>
              <Link href="/projeler/yeni"
                className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Proje
              </Link>
            </div>
          </div>

          {/* LinkedIn Bulk Update Panel */}
          {liUploadOpen && (
            <div className="mb-4 bg-[#0a66c2]/5 border border-[#0a66c2]/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">LinkedIn Analitik Güncelle</p>
                  <p className="text-xs text-gray-500 mt-0.5">allcontents.xls dosyasını yükle — &quot;Gönderi linki&quot;, &quot;Görüntülenme&quot;, &quot;Beğenmeler&quot;, &quot;Yorumlar&quot;, &quot;Tıklama&quot; sütunları bekleniyor</p>
                </div>
                <button onClick={() => { setLiUploadOpen(false); setLiMatches(null); setLiUploadMsg(''); }}
                  className="text-gray-400 hover:text-gray-600 p-1">✕</button>
              </div>

              <input
                ref={liFileRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={e => void handleLinkedinFile(e)}
                className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0a66c2] file:text-white hover:file:bg-[#005a9e] cursor-pointer"
              />

              {liUploadMsg && (
                <p className={`text-sm font-medium ${liUploadMsg.startsWith('✓') ? 'text-green-700' : liUploadMsg.startsWith('Hata') ? 'text-red-600' : 'text-gray-600'}`}>
                  {liUploadMsg}
                </p>
              )}

              {liMatches && liMatches.length > 0 && (
                <div className="space-y-2">
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {liMatches.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2 text-xs">
                        <span className="text-gray-700 truncate max-w-[60%]">{m.title}</span>
                        <span className="text-gray-400 shrink-0">
                          <span className="text-gray-400 line-through mr-1">{m.oldViews.toLocaleString('tr-TR')}</span>
                          <span className="text-emerald-600 font-semibold">→ {m.newViews.toLocaleString('tr-TR')}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={liUploading}
                    onClick={() => void confirmLinkedinUpdate()}
                    className="px-4 py-2 bg-[#0a66c2] text-white text-sm font-semibold rounded-xl hover:bg-[#005a9e] disabled:opacity-50 transition-colors">
                    {liUploading ? 'Güncelleniyor…' : `${liMatches.length} Projeyi Güncelle`}
                  </button>
                </div>
              )}
            </div>
          )}

          {projLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
            ))}</div>
          ) : visibleProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <p>Henüz proje yok.</p>
              <Link href="/projeler/yeni" className="mt-3 inline-block text-sm text-[#26496b] hover:underline font-medium">
                İlk projeyi ekle →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleProjects.map(item => {
                const isOpen = expandedProj === item.id;
                const grad = gradCss(item);
                const initials = item.authorInitials
                  ?? (item.authorName ? item.authorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : item.title[0]?.toUpperCase() ?? '?');

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm select-none"
                        style={{ background: grad }}>
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.type === 'linkedin' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.type === 'linkedin' ? 'LinkedIn' : 'Sahne'}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                          {item.projectCategory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#26496b]/8 text-[#26496b]">
                              {item.projectCategory}
                            </span>
                          )}
                          {item.awardCohortMonth != null && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                              {item.awardCohortMonth}. Ay #{item.awardRank}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          {item.university && <span>{item.university.replace(' Üniversitesi', ' Ü.').replace(' Teknik', ' T.')}</span>}
                          {item.graduationYear && <span className="opacity-60">· {item.graduationType ?? ''} {item.graduationYear}</span>}
                          {(item.linkedinViewCount ?? 0) > 0 && (
                            <span className="opacity-60">· {((item.linkedinViewCount ?? 0) + (item.viewCount ?? 0)).toLocaleString('tr-TR')} görüntülenme</span>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Link href={`/projeler/${item.id}`} title="Düzenle"
                          className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                          <IcoEdit />
                        </Link>
                        <button title="Sil" disabled={deletingProj === item.id}
                          onClick={() => void deleteProject(item.id, item.title)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detaylar'}
                          onClick={() => setExpandedProj(isOpen ? null : item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                          <IcoChevron open={isOpen} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                        {item.summary && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Özet</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.summary}</p>
                          </div>
                        )}
                        {item.body && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">İçerik</p>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{item.body}</p>
                          </div>
                        )}
                        {item.linkedinUrl && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">LinkedIn Profil</p>
                            <a href={item.linkedinUrl} target="_blank" rel="noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate block">{item.linkedinUrl}</a>
                          </div>
                        )}

                        {/* LinkedIn Analitik Post URL */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                            LinkedIn Analitik URL
                            {item.linkedinPostUrl && (
                              <a href={item.linkedinPostUrl} target="_blank" rel="noreferrer"
                                className="ml-2 normal-case font-normal text-blue-500 hover:underline">↗ görüntüle</a>
                            )}
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                              value={liPostUrlDraft[item.id] ?? item.linkedinPostUrl ?? ''}
                              onChange={e => setLiPostUrlDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                              onBlur={async () => {
                                const val = (liPostUrlDraft[item.id] ?? item.linkedinPostUrl ?? '').trim();
                                if (val === (item.linkedinPostUrl ?? '')) return;
                                setLiPostUrlSaving(item.id);
                                try {
                                  await adminApi.updateProject(item.id, { linkedinPostUrl: val || null } as never);
                                  setProjects(prev => prev.map(p => p.id === item.id ? { ...p, linkedinPostUrl: val || null } : p));
                                } finally { setLiPostUrlSaving(null); }
                              }}
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]/20 font-mono"
                            />
                            {liPostUrlSaving === item.id && (
                              <span className="text-[10px] text-gray-400 shrink-0">Kaydediliyor…</span>
                            )}
                            {(item.linkedinPostUrl || liPostUrlDraft[item.id]) && liPostUrlSaving !== item.id && (
                              <span className="text-[10px] text-green-600 shrink-0">✓</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {item.hashtags && item.hashtags.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hashtag&apos;ler</p>
                              <div className="flex flex-wrap gap-1">
                                {item.hashtags.map(t => (
                                  <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.externalLinks && item.externalLinks.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Linkler</p>
                              <div className="flex flex-wrap gap-2">
                                {item.externalLinks.map(l => (
                                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
                                    className="text-xs text-[#26496b] hover:underline">{l.label}</a>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.imageKeys && item.imageKeys.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Görseller</p>
                              <p className="text-xs text-gray-600">{item.imageKeys.length} görsel</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Oluşturulma</p>
                            <p className="text-xs text-gray-600">{new Date(item.createdAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
