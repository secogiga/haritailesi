'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { MentorCardSkeleton } from '@/components/Skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  mutfakApi,
  type MentorListItem,
  type MentorshipRequest,
  type MyMentorProfile,
} from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { Avatar as AvatarImg } from '@/components/Avatar';
import {
  MENTORSHIP_STATUS_LABELS as STATUS_LABELS,
  MENTORSHIP_STATUS_COLORS as STATUS_COLORS,
  SESSION_FORMAT_LABELS as FORMAT_LABELS,
  EXPERTISE_LABELS,
} from '@/lib/constants';

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'sm' ? 32 : size === 'lg' ? 56 : 40;
  return <AvatarImg name={name} src={avatarUrl} size={px} />;
}

// ── Mentor Card (Directory) ───────────────────────────────────────────────────

function MentorCard({ mentor, onRequest, hasPendingRequest }: { mentor: MentorListItem; onRequest: (m: MentorListItem) => void; hasPendingRequest?: boolean }) {
  return (
    <div data-card-hover className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-shadow">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#26496b] to-[#66aca9]" />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Avatar name={mentor.displayName} avatarUrl={mentor.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-sm">{mentor.displayName}</div>
            {mentor.profession && <div className="text-xs text-gray-500 mt-0.5">{mentor.profession}</div>}
            {mentor.city && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {mentor.city}
            </div>}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
          {mentor.averageRating !== null && mentor.ratingCount > 0 ? (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">{mentor.averageRating}</span>
              <span className="text-xs text-gray-400">({mentor.ratingCount})</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Değerlendirme yok</span>
          )}
          <span className="text-gray-200 text-sm">·</span>
          <span className="text-xs text-gray-600 font-medium">{mentor.completedSessionCount} seans</span>
          <span className="ml-auto text-xs text-[#26496b] font-medium bg-[#26496b]/8 px-2 py-0.5 rounded-full">
            {FORMAT_LABELS[mentor.sessionFormat]}
          </span>
        </div>

        {mentor.bio && (
          <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">{mentor.bio}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {mentor.expertiseAreas.slice(0, 4).map((area) => (
            <span key={area} className="px-2 py-0.5 bg-[#66aca9]/12 text-[#2d6b68] text-xs rounded-full font-medium border border-[#66aca9]/20">
              {EXPERTISE_LABELS[area] ?? area}
            </span>
          ))}
          {mentor.expertiseAreas.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{mentor.expertiseAreas.length - 4}
            </span>
          )}
        </div>

        {hasPendingRequest ? (
          <div className="mt-4 w-full py-2 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-xl">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            İstek Bekliyor
          </div>
        ) : (
          <button
            onClick={() => onRequest(mentor)}
            className="mt-4 w-full py-2 bg-[#26496b] text-white text-xs font-medium rounded-xl hover:bg-[#1d3a57] transition-colors"
          >
            İstek Gönder
          </button>
        )}
      </div>
    </div>
  );
}

// ── Request Dialog ────────────────────────────────────────────────────────────

function RequestDialog({
  mentor,
  onClose,
  onSubmit,
}: {
  mentor: MentorListItem;
  onClose: () => void;
  onSubmit: (data: { topic: string; goal: string; preferredFormat: 'online' | 'in_person' }) => Promise<void>;
}) {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [format, setFormat] = useState<'online' | 'in_person'>('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({ topic: topic.trim(), goal: goal.trim(), preferredFormat: format });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar name={mentor.displayName} avatarUrl={mentor.avatarUrl} size="sm" />
            <div>
              <div className="font-semibold text-gray-900 text-sm">{mentor.displayName}</div>
              <div className="text-xs text-gray-500">Mentorluk İsteği</div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          {error && <p className="text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Konu (maks. 200 karakter)</label>
            <input
              type="text"
              maxLength={200}
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Örn: Kariyer değişikliği danışmanlığı"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hedef / Beklenti (maks. 500 karakter)</label>
            <textarea
              maxLength={500}
              required
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Bu mentorluktan ne öğrenmek ya da kazanmak istiyorsunuz?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tercih Edilen Format</label>
            <div className="flex gap-2">
              {(['online', 'in_person'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    format === f
                      ? 'bg-[#26496b] text-white border-[#26496b]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40'
                  }`}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading || !topic.trim() || !goal.trim()}
              className="flex-1 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] transition-colors disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Feedback Dialog ───────────────────────────────────────────────────────────

function FeedbackDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { rating: number; feedbackComment?: string }) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setError('');
    setLoading(true);
    try {
      await onSubmit({ rating, ...(comment.trim() ? { feedbackComment: comment.trim() } : {}) });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Seans Değerlendirmesi</h3>
        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Puan</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-colors ${n <= rating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Yorum (isteğe bağlı)</label>
            <textarea
              rows={3}
              maxLength={400}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!rating || loading}
              className="flex-1 py-2 bg-[#26496b] text-white text-sm font-medium rounded-lg hover:bg-[#1d3a57] disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor…' : 'Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Respond Dialog ────────────────────────────────────────────────────────────

function RespondDialog({
  request,
  onClose,
  onSubmit,
}: {
  request: MentorshipRequest;
  onClose: () => void;
  onSubmit: (data: { action: 'accept' | 'reject'; mentorNote?: string }) => Promise<void>;
}) {
  const [action, setAction] = useState<'accept' | 'reject'>('accept');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        action,
        ...(note.trim() ? { mentorNote: note.trim() } : {}),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isEngagementPeriodic = request.engagementType === 'periodic';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-semibold text-gray-900 mb-1">İsteğe Yanıt Ver</h3>
        <p className="text-xs text-gray-500 mb-1">
          <span className="font-medium">{request.mentee?.profile?.displayName ?? request.mentee?.email}</span> —{' '}
          {request.topic}
        </p>
        <span className={`inline-block mb-4 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isEngagementPeriodic ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {isEngagementPeriodic ? 'Dönemlik (4 ay)' : '1 Seans'}
        </span>

        {action === 'accept' && (
          <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-800">
            Kabul ettikten sonra oturum tarihlerini <strong>Seanslarım</strong> sayfasından belirleyebilirsiniz.
          </div>
        )}

        {error && <p className="text-red-600 text-xs mb-3 bg-red-50 rounded px-3 py-2">{error}</p>}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="flex gap-2">
            {(['accept', 'reject'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAction(a)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  action === a
                    ? a === 'accept'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {a === 'accept' ? 'Kabul Et' : 'Reddet'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Not (isteğe bağlı, maks. 400 karakter)
            </label>
            <textarea
              rows={2}
              maxLength={400}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-[#26496b] text-white text-sm font-medium rounded-lg hover:bg-[#1d3a57] disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor…' : 'Onayla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Mentor Bul ───────────────────────────────────────────────────────────

function MentorDirectory({ token, onSuccess }: { token: string; onSuccess: (mentorName: string) => void }) {
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [requestTarget, setRequestTarget] = useState<MentorListItem | null>(null);
  const [sentMentorIds, setSentMentorIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    const filterParams: { expertise?: string; format?: string } = {};
    if (expertiseFilter) filterParams.expertise = expertiseFilter;
    if (formatFilter) filterParams.format = formatFilter;
    mutfakApi
      .listMentors(token, filterParams)
      .then(setMentors)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, expertiseFilter, formatFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRequest(data: { topic: string; goal: string; preferredFormat: 'online' | 'in_person' }) {
    if (!requestTarget) return;
    await mutfakApi.sendMentorshipRequest(
      { mentorId: requestTarget.userId, ...data },
      token,
    );
    setSentMentorIds((prev) => new Set([...prev, requestTarget.userId]));
    onSuccess(requestTarget.displayName);
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={expertiseFilter}
          onChange={(e) => setExpertiseFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white"
        >
          <option value="">Tüm Uzmanlıklar</option>
          {Object.entries(EXPERTISE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white"
        >
          <option value="">Tüm Formatlar</option>
          <option value="online">Online</option>
          <option value="in_person">Yüz Yüze</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && mentors.length === 0 && (
        <EmptyState
          illustration="compass"
          title="Henüz aktif mentor yok"
          description="Siz de mentor olabilirsiniz — Mentor Profilim sekmesine göz atın."
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <MentorCardSkeleton key={i} />)
          : mentors.map((m) => (
          <MentorCard key={m.id} mentor={m} onRequest={setRequestTarget} hasPendingRequest={sentMentorIds.has(m.userId)} />
        ))}
      </div>

      {requestTarget && (
        <RequestDialog
          mentor={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSubmit={handleRequest}
        />
      )}
    </div>
  );
}

// ── Tab: İsteklerim (Mentee) ──────────────────────────────────────────────────

const SESSION_DOT_MY: Record<string, string> = {
  pending: 'bg-gray-300',
  scheduled: 'bg-blue-400',
  completed: 'bg-green-500',
  cancelled: 'bg-red-300',
};

function MyRequests({ token }: { token: string }) {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    mutfakApi
      .getMyRequests(token)
      .then(setRequests)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function doCancel(id: string) {
    setCancelError(null);
    try {
      await mutfakApi.cancelRequest(id, token);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      setCancelError((err as Error).message);
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (requests.length === 0) return <p className="text-gray-400 text-sm">Henüz mentorluk isteğiniz yok.</p>;

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const mentorName = req.mentor?.profile?.displayName ?? req.mentor?.email ?? '—';
        const isPeriodic = req.engagementType === 'periodic';
        return (
          <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isPeriodic ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {isPeriodic ? 'Dönemlik (4 ay)' : '1 Seans'}
                  </span>
                </div>
                <div className="font-medium text-gray-900 text-sm">{req.topic}</div>
                <div className="text-xs text-gray-500 mt-0.5">Mentor: {mentorName}</div>
                {req.mentor?.profile?.profession && (
                  <div className="text-xs text-gray-400">{req.mentor.profile.profession}</div>
                )}
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[req.status] ?? req.status}
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{req.goal}</p>

            {req.mentorNote && (
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                <span className="font-medium">Mentor notu:</span> {req.mentorNote}
              </div>
            )}

            {req.sessions && req.sessions.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {req.sessions.map((s) => (
                  <span key={s.id} title={`${s.sessionNumber}. oturum — ${s.status}`}
                    className={`w-2.5 h-2.5 rounded-full ${SESSION_DOT_MY[s.status] ?? 'bg-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {req.sessions.filter(s => s.status === 'completed').length}/{req.sessions.length} tamamlandı
                </span>
              </div>
            )}

            {req.menteeFinalRating && (
              <div className="mt-2 text-xs text-yellow-600">
                Dönem değerlendirmesi: {'★'.repeat(req.menteeFinalRating)}{'☆'.repeat(5 - req.menteeFinalRating)}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">
                {new Date(req.createdAt).toLocaleDateString('tr-TR')}
              </span>
              <div className="flex gap-2 ml-auto">
                {['pending', 'accepted'].includes(req.status) && (
                  <button
                    onClick={() => setCancelTarget(req.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    İptal Et
                  </button>
                )}
                {req.status === 'accepted' && (
                  <a href="/mentorluk/seanslarim"
                    className="text-xs text-[#26496b] hover:underline font-medium">
                    Seanslarım →
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {cancelTarget && (
        <ConfirmDialog
          title="İsteği iptal et"
          message="Bu mentorluk isteğini iptal etmek istediğinize emin misiniz?"
          confirmLabel="İptal Et"
          danger
          onConfirm={() => { const id = cancelTarget; setCancelTarget(null); void doCancel(id); }}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {cancelError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{cancelError}</div>
      )}
    </div>
  );
}

// ── Tab: Gelen İstekler (Mentor) ──────────────────────────────────────────────

function IncomingRequests({ token }: { token: string }) {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondTarget, setRespondTarget] = useState<MentorshipRequest | null>(null);

  function load() {
    setLoading(true);
    mutfakApi
      .getIncomingRequests(token)
      .then(setRequests)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRespond(data: { action: 'accept' | 'reject'; mentorNote?: string }) {
    if (!respondTarget) return;
    const updated = await mutfakApi.respondToRequest(respondTarget.id, data, token);
    setRequests((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (requests.length === 0) return <p className="text-gray-400 text-sm">Henüz gelen istek yok.</p>;

  const SESSION_DOT: Record<string, string> = {
    pending: 'bg-gray-300',
    scheduled: 'bg-blue-400',
    completed: 'bg-green-500',
    cancelled: 'bg-red-300',
  };

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const menteeName = req.mentee?.profile?.displayName ?? req.mentee?.email ?? '—';
        const isPeriodic = req.engagementType === 'periodic';
        return (
          <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isPeriodic ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {isPeriodic ? 'Dönemlik (4 ay)' : '1 Seans'}
                  </span>
                </div>
                <div className="font-medium text-gray-900 text-sm">{req.topic}</div>
                <div className="text-xs text-gray-500 mt-0.5">{menteeName}</div>
                {req.mentee?.profile?.profession && (
                  <div className="text-xs text-gray-400">{req.mentee.profile.profession}</div>
                )}
                {req.mentee?.profile?.city && (
                  <div className="text-xs text-gray-400">{req.mentee.profile.city}</div>
                )}
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[req.status] ?? req.status}
              </span>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Hedef: </span>{req.goal}
            </div>

            <div className="text-xs text-gray-400 mt-1">
              Format: {FORMAT_LABELS[req.preferredFormat] ?? req.preferredFormat}
            </div>

            {req.sessions && req.sessions.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {req.sessions.map((s) => (
                  <span key={s.id} title={`${s.sessionNumber}. oturum — ${s.status}`}
                    className={`w-2.5 h-2.5 rounded-full ${SESSION_DOT[s.status] ?? 'bg-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {req.sessions.filter(s => s.status === 'completed').length}/{req.sessions.length} tamamlandı
                </span>
              </div>
            )}

            {req.status === 'accepted' && (
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                Oturum tarihlerini <strong>Seanslarım</strong> sayfasından belirleyebilirsiniz.
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">
                {new Date(req.createdAt).toLocaleDateString('tr-TR')}
              </span>
              <div className="flex gap-2 ml-auto">
                {req.status === 'pending' && (
                  <button
                    onClick={() => setRespondTarget(req)}
                    className="text-xs bg-[#26496b] text-white px-3 py-1 rounded-lg hover:bg-[#1d3a57] font-medium"
                  >
                    Yanıtla
                  </button>
                )}
                {req.status === 'accepted' && (
                  <a href="/mentorluk/seanslarim"
                    className="text-xs bg-[#66aca9] text-white px-3 py-1 rounded-lg hover:bg-[#4d8f8c] font-medium">
                    Seanslarım →
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {respondTarget && (
        <RespondDialog
          request={respondTarget}
          onClose={() => setRespondTarget(null)}
          onSubmit={handleRespond}
        />
      )}
    </div>
  );
}

// ── Tab: Mentor Profilim ──────────────────────────────────────────────────────

const EXPERTISE_KEYS = Object.keys(EXPERTISE_LABELS);

const CAPACITY_TYPE_LABELS: Record<string, string> = {
  monthly: 'Aylık',
  periodic: 'Dönemlik',
  both: 'Her İkisi',
};

const ADMIN_STATUS_LABELS: Record<string, string> = {
  pending: 'İncelemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
};

const ADMIN_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

function MentorProfileTab({ token }: { token: string }) {
  const [profile, setProfile] = useState<MyMentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [areas, setAreas] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [format, setFormat] = useState<'online' | 'in_person' | 'both'>('online');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [periodicCapacity, setPeriodicCapacity] = useState(1);
  const [capacityType, setCapacityType] = useState<'monthly' | 'periodic' | 'both'>('monthly');
  const [durationMin, setDurationMin] = useState(40);
  const [durationMax, setDurationMax] = useState(60);
  const [accepting, setAccepting] = useState(true);

  useEffect(() => {
    mutfakApi
      .getMyMentorProfile(token)
      .then((p) => {
        if (p) {
          setProfile(p);
          setAreas(p.expertiseAreas);
          setBio(p.bio ?? '');
          setFormat(p.sessionFormat as 'online' | 'in_person' | 'both');
          setCity(p.city ?? '');
          setCapacity(p.monthlyCapacity);
          setPeriodicCapacity(p.periodicCapacity ?? 1);
          setCapacityType((p.capacityType ?? 'monthly') as 'monthly' | 'periodic' | 'both');
          setDurationMin(p.sessionDurationMin ?? 40);
          setDurationMax(p.sessionDurationMax ?? 60);
          setAccepting(p.isAcceptingRequests);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function toggleArea(key: string) {
    setAreas((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (durationMin > durationMax) { setError('Minimum süre maksimum süreden büyük olamaz.'); return; }
    setError('');
    setSaving(true);
    try {
      const saved = await mutfakApi.upsertMentorProfile(
        {
          expertiseAreas: areas,
          ...(bio.trim() ? { bio: bio.trim() } : {}),
          sessionFormat: format,
          ...(city.trim() ? { city: city.trim() } : {}),
          monthlyCapacity: capacity,
          periodicCapacity,
          sessionDurationMin: durationMin,
          sessionDurationMax: durationMax,
          capacityType,
          isAcceptingRequests: accepting,
        },
        token,
      );
      setProfile(saved);
      setSuccess('Profil güncellendi.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;

  return (
    <form onSubmit={(e) => void handleSave(e)} className="max-w-lg space-y-5">
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2">{success}</p>}

      {!profile && (
        <div className="bg-[#26496b]/5 border border-[#26496b]/15 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#26496b]/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#26496b] mb-1">Mentor olmak ister misiniz?</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Alanınızdaki deneyiminizi toplulukla paylaşın. Profilinizi oluşturun, uzmanlık alanlarınızı seçin ve isteğe açık hale gelin. Üyeler sizi bulup seans talep edebilir.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-500">
            Tamamlanan seans: <span className="font-semibold text-gray-700">{profile.completedSessionCount}</span>
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ADMIN_STATUS_COLORS[profile.adminStatus] ?? 'bg-gray-100 text-gray-500'}`}>
            {ADMIN_STATUS_LABELS[profile.adminStatus] ?? profile.adminStatus}
          </span>
        </div>
      )}

      {/* Expertise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Uzmanlık Alanları</label>
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleArea(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                areas.includes(key)
                  ? 'bg-[#66aca9] text-white border-[#66aca9]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#66aca9]/50'
              }`}
            >
              {EXPERTISE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Biyografi (maks. 500 karakter)</label>
        <textarea
          rows={3}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
        />
      </div>

      {/* Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Seans Formatı</label>
        <div className="flex gap-2">
          {(['online', 'in_person', 'both'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                format === f
                  ? 'bg-[#26496b] text-white border-[#26496b]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* City & Monthly Capacity */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
          <input
            type="text"
            maxLength={100}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          />
        </div>
        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Kapasite</label>
          <input
            type="number"
            min={1}
            max={10}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          />
        </div>
      </div>

      {/* Capacity Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kapasite Türü</label>
        <div className="flex gap-2">
          {(['monthly', 'periodic', 'both'] as const).map((ct) => (
            <button key={ct} type="button" onClick={() => setCapacityType(ct)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                capacityType === ct
                  ? 'bg-[#26496b] text-white border-[#26496b]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {CAPACITY_TYPE_LABELS[ct]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {capacityType === 'monthly' ? 'Sadece tekil seans alıyorum.' : capacityType === 'periodic' ? 'Sadece 4 aylık dönemlik mentorluk alıyorum.' : 'Her iki tipte seans alabilirim.'}
        </p>
      </div>

      {/* Periodic Capacity */}
      {(capacityType === 'periodic' || capacityType === 'both') && (
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dönemlik Kapasite (eş zamanlı)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={periodicCapacity}
            onChange={(e) => setPeriodicCapacity(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          />
        </div>
      )}

      {/* Session Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seans Süresi: <span className="font-semibold text-[#26496b]">{durationMin}–{durationMax} dk</span>
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Minimum (dk)</label>
            <input
              type="number"
              min={30}
              max={durationMax}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Maksimum (dk)</label>
            <input
              type="number"
              min={durationMin}
              max={120}
              step={5}
              value={durationMax}
              onChange={(e) => setDurationMax(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
            />
          </div>
        </div>
      </div>

      {/* Accepting */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setAccepting((v) => !v)}
          className={`w-10 h-6 rounded-full transition-colors relative ${accepting ? 'bg-[#26496b]' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${accepting ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
        <span className="text-sm text-gray-700">Yeni istekleri kabul ediyorum</span>
      </label>

      <button
        type="submit"
        disabled={saving || areas.length === 0}
        className="w-full py-2.5 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] transition-colors disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </form>
  );
}

// ── Tab: Başvuru (Mentor / Mentee) ────────────────────────────────────────────

type ApplyType = 'mentee' | 'mentor';

function ApplicationTab({ token, userEmail, userDisplayName }: { token: string; userEmail?: string; userDisplayName?: string }) {
  const [applyType, setApplyType] = useState<ApplyType>('mentee');
  const [form, setForm] = useState({
    email: userEmail ?? '',
    displayName: userDisplayName ?? '',
    expertise: '',
    goals: '',
    preferredFormat: 'online',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutfakApi.submitMentorApplication(
        {
          email: form.email,
          displayName: form.displayName,
          type: applyType,
          ...(applyType === 'mentor' && form.expertise ? { expertise: form.expertise } : {}),
          ...(applyType === 'mentee' && form.goals ? { goals: form.goals } : {}),
          preferredFormat: form.preferredFormat,
        },
        token,
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400';

  if (done) {
    return (
      <div className="max-w-md">
        <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Başvurunuz Alındı!</h3>
          <p className="text-sm text-gray-500">Ekibimiz inceleyip size dönüş yapacak.</p>
          <button
            onClick={() => {
              setDone(false);
              setForm({ email: userEmail ?? '', displayName: userDisplayName ?? '', expertise: '', goals: '', preferredFormat: 'online' });
            }}
            className="mt-5 text-sm font-medium text-[#26496b] hover:underline"
          >
            Yeni başvuru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="bg-[#26496b]/5 border border-[#26496b]/15 rounded-xl p-4 mb-5">
        <p className="text-xs text-[#26496b] leading-relaxed">
          Mentorluk programı ekibimiz tarafından yönetilmektedir. Başvurunuz incelenir, uygun mentor ile eşleştirme yapılır ve size bilgi verilir.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['mentee', 'mentor'] as ApplyType[]).map((t) => (
            <button
              key={t}
              onClick={() => setApplyType(t)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                applyType === t
                  ? 'border-[#26496b] text-[#26496b] bg-[#26496b]/4'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'mentee' ? '🎓 Mentee Olmak İstiyorum' : '🤝 Mentor Olmak İstiyorum'}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
              <input
                type="text"
                required
                minLength={2}
                className={inp}
                placeholder="Adınız Soyadınız"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta *</label>
              <input
                type="email"
                required
                className={inp}
                placeholder="ornek@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          {applyType === 'mentor' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Uzmanlık Alanınız</label>
              <textarea
                rows={3}
                className={inp}
                placeholder="Hangi konularda rehberlik yapabilirsiniz? (CBS, kadastro, kariyer danışmanlığı…)"
                value={form.expertise}
                onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hedefleriniz</label>
              <textarea
                rows={3}
                className={inp}
                placeholder="Mentorluktan ne öğrenmek istiyorsunuz? Kariyer hedefiniz nedir?"
                value={form.goals}
                onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tercih Ettiğiniz Format</label>
            <select
              className={inp}
              value={form.preferredFormat}
              onChange={(e) => setForm((f) => ({ ...f, preferredFormat: e.target.value }))}
            >
              <option value="online">Online</option>
              <option value="in_person">Yüz Yüze</option>
              <option value="both">Her İkisi</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
          >
            {busy ? 'Gönderiliyor…' : applyType === 'mentor' ? 'Mentor Başvurusu Gönder' : 'Mentee Başvurusu Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'directory' | 'my-requests' | 'incoming' | 'my-profile' | 'apply';

export default function MentorlukPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('directory');
  const [toast, setToast] = useState('');

  const isMentor = user?.functionalRoles?.includes('mentor') ?? false;
  const token = useToken();

  function handleRequestSuccess(mentorName: string) {
    setToast(`İsteğiniz ${mentorName} adlı mentora iletildi.`);
    setTimeout(() => setToast(''), 4000);
    setTab('my-requests');
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'directory', label: 'Mentor Bul' },
    { id: 'my-requests', label: 'İsteklerim' },
    ...(isMentor ? [
      { id: 'incoming' as Tab, label: 'Gelen İstekler' },
      { id: 'my-profile' as Tab, label: 'Mentor Profilim' },
    ] : []),
    { id: 'apply', label: 'Başvuru' },
  ];

  return (
    <div className="px-4 md:px-8 py-6">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-xl shadow-lg max-w-sm w-[calc(100%-2rem)]">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 font-display">Mentorluk</h1>
          <a
            href="/mentorluk/seanslarim"
            className="text-sm font-medium text-[#26496b] border border-[#26496b] px-3 py-1.5 rounded-lg hover:bg-[#26496b]/5 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Seanslarım
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Alanında deneyimli üyelerle bağlantı kurun ve kariyerinizi geliştirin.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-[#26496b] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'directory' && <MentorDirectory token={token} onSuccess={handleRequestSuccess} />}
      {tab === 'my-requests' && <MyRequests token={token} />}
      {tab === 'incoming' && isMentor && <IncomingRequests token={token} />}
      {tab === 'my-profile' && isMentor && <MentorProfileTab token={token} />}
      {tab === 'apply' && (
        <ApplicationTab
          token={token}
          {...(user?.email ? { userEmail: user.email } : {})}
          {...(user?.profile?.displayName ? { userDisplayName: user.profile.displayName } : {})}
        />
      )}
    </div>
  );
}
