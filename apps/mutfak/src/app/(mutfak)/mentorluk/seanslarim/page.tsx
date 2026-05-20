'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  mutfakApi,
  type UpcomingSession,
  type MentorshipRequest,
  type MentorshipSession,
  type EngagementHistoryItem,
} from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateTimePicker } from '@/components/DateTimePicker';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short',
  });
}

function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function groupByDay(sessions: UpcomingSession[]): Map<string, UpcomingSession[]> {
  const map = new Map<string, UpcomingSession[]>();
  for (const s of sessions) {
    if (!s.scheduledAt) continue;
    const day = startOfDay(new Date(s.scheduledAt)).toISOString().slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(s);
  }
  return map;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const SESSION_DOT: Record<string, string> = {
  pending: 'bg-gray-300 border-gray-300',
  scheduled: 'bg-blue-400 border-blue-400',
  completed: 'bg-green-500 border-green-500',
  cancelled: 'bg-red-300 border-red-300',
};
const SESSION_LABEL: Record<string, string> = {
  pending: 'Tarih bekleniyor',
  scheduled: 'Planlandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal edildi',
};
const SESSION_LABEL_COLOR: Record<string, string> = {
  pending: 'text-orange-600 bg-orange-50',
  scheduled: 'text-blue-700 bg-blue-50',
  completed: 'text-green-700 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="text-amber-400 tracking-tight">
      {'★'.repeat(rating)}{'☆'.repeat(max - rating)}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onMouseEnter={() => setHovered(star)} onClick={() => onChange(star)}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} yıldız`}>
          {star <= (hovered || value) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

// ─── Engagement Timeline Component ───────────────────────────────────────────

function EngagementTimeline({
  engagement,
  role,
  compact = false,
}: {
  engagement: MentorshipRequest | EngagementHistoryItem;
  role: 'mentee' | 'mentor';
  compact?: boolean;
}) {
  const isPeriodic = engagement.engagementType === 'periodic';
  const counterpartObj = role === 'mentee' ? engagement.mentor : engagement.mentee;
  const counterpartName =
    counterpartObj?.profile?.displayName ?? counterpartObj?.email ?? '—';
  const counterpartProfession = counterpartObj?.profile?.profession ?? null;

  const completedSessions = engagement.sessions.filter(s => s.status === 'completed').length;
  const totalSessions = engagement.sessions.length;

  return (
    <div className={compact ? '' : 'bg-white rounded-xl border border-gray-100 shadow-sm p-5'}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isPeriodic ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'
            }`}>
              {isPeriodic ? 'Dönemlik · 4 Ay' : '1 Seans'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              role === 'mentor' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {role === 'mentor' ? 'Mentor' : 'Mentee'}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{engagement.topic}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {role === 'mentee' ? 'Mentör:' : 'Mentee:'}{' '}
            <span className="font-medium text-gray-700">{counterpartName}</span>
            {counterpartProfession && <span className="text-gray-400"> · {counterpartProfession}</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-gray-400">{fmtDateShort(engagement.createdAt)}</p>
          {isPeriodic && totalSessions > 0 && (
            <p className="text-[10px] font-semibold text-gray-600 mt-0.5">
              {completedSessions}/{totalSessions} tamamlandı
            </p>
          )}
        </div>
      </div>

      {/* Progress bar for periodic */}
      {isPeriodic && totalSessions > 0 && (
        <div className="mb-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${(completedSessions / totalSessions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical spine */}
        {engagement.sessions.length > 1 && (
          <div className="absolute left-[5px] top-3 bottom-3 w-px bg-gray-200" />
        )}

        <div className="space-y-4">
          {engagement.sessions.map((s: MentorshipSession, idx: number) => {
            const isLast = idx === engagement.sessions.length - 1;
            const dot = SESSION_DOT[s.status] ?? 'bg-gray-200 border-gray-200';

            return (
              <div key={s.id} className="relative flex gap-3">
                {/* Dot */}
                <div className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${dot}`} />

                {/* Content */}
                <div className={`flex-1 min-w-0 pb-1 ${!isLast ? 'pb-2' : ''}`}>
                  {/* Session title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-800">
                      {isPeriodic ? `${s.sessionNumber}. Oturum` : 'Seans'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SESSION_LABEL_COLOR[s.status] ?? 'text-gray-500 bg-gray-50'}`}>
                      {SESSION_LABEL[s.status] ?? s.status}
                    </span>
                  </div>

                  {/* Date */}
                  {s.scheduledAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.status === 'completed' && s.completedAt
                        ? fmtDate(s.completedAt)
                        : fmtDateTime(s.scheduledAt)}
                    </p>
                  )}

                  {/* Completed: notes + rating */}
                  {s.status === 'completed' && (
                    <div className="mt-2 space-y-1.5">
                      {s.menteeRating !== null && (
                        <div className="flex items-center gap-1.5">
                          <Stars rating={s.menteeRating} />
                          {s.menteeNote && (
                            <span className="text-xs text-gray-500 italic truncate max-w-[260px]">
                              &ldquo;{s.menteeNote}&rdquo;
                            </span>
                          )}
                        </div>
                      )}
                      {!s.menteeNote && !s.menteeRating && role === 'mentee' && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          Notunuz bekleniyor
                        </span>
                      )}
                      {s.mentorNote && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 leading-relaxed">
                          <span className="font-medium">Mentor: </span>
                          &ldquo;{s.mentorNote}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Periodic: final evaluation node */}
          {isPeriodic && (
            <div className="relative flex gap-3">
              <div className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${
                engagement.status === 'completed'
                  ? 'bg-purple-500 border-purple-500'
                  : 'bg-gray-100 border-gray-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">Dönem Değerlendirmesi</p>
                {engagement.menteeFinalComment ? (
                  <div className="mt-1.5 space-y-1">
                    {engagement.menteeFinalRating !== null && (
                      <div className="flex items-center gap-1.5">
                        <Stars rating={engagement.menteeFinalRating} />
                        <span className="text-xs text-gray-500 italic truncate max-w-[240px]">
                          &ldquo;{engagement.menteeFinalComment}&rdquo;
                        </span>
                      </div>
                    )}
                    {engagement.mentorFinalComment && (
                      <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                        <span className="font-medium">Mentor: </span>
                        &ldquo;{engagement.mentorFinalComment}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {engagement.status === 'completed'
                      ? 'Değerlendirme tamamlandı'
                      : 'Tüm seanslar tamamlandığında yapılacak'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────────────────────────────

function ScheduleModal({ session, token, onDone, onClose }: {
  session: UpcomingSession; token: string; onDone: () => void; onClose: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) { setError('Lütfen bir tarih seçin.'); return; }
    if (!session.sessionRowId) { setError('Oturum bilgisi bulunamadı.'); return; }
    setBusy(true); setError('');
    try {
      await mutfakApi.scheduleSession(session.sessionRowId, new Date(scheduledAt).toISOString(), token);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu.');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Oturum Tarihini Belirle</h2>
        <p className="text-sm text-gray-500 mb-5">
          {session.engagementType === 'periodic'
            ? `${session.sessionNumber ?? ''}. oturum — tarih belirlediğinizde mentee'ye bildirim gider.`
            : 'Tarih belirlediğinizde mentee\'ye bildirim ve takvim daveti gider.'}
        </p>
        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Tarih & Saat</label>
            <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy || !scheduledAt}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl disabled:opacity-60 transition-colors">
              {busy ? 'Kaydediliyor…' : 'Tarihi Onayla'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionNoteModal({ session, token, onDone, onClose }: {
  session: UpcomingSession; token: string; onDone: () => void; onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isMentee = session.role === 'mentee';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) { setError('Not boş bırakılamaz.'); return; }
    if (isMentee && rating === 0) { setError('Puan zorunludur.'); return; }
    if (!session.sessionRowId) { setError('Oturum bilgisi bulunamadı.'); return; }
    setBusy(true); setError('');
    try {
      await mutfakApi.submitSessionNote(session.sessionRowId, {
        note, ...(isMentee && rating > 0 ? { rating } : {}),
      }, token);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu.');
    } finally { setBusy(false); }
  }

  const counterpartName = session.counterpart.displayName ?? session.counterpart.email;

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Oturum Notu</h2>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-700">{counterpartName}</span> ile{' '}
          <span className="font-medium">{session.topic}</span>
        </p>
        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          {isMentee && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Puan</label>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'][rating]}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isMentee ? 'Genel notunuz' : 'Oturum özeti / notunuz'}
            </label>
            <textarea rows={4} maxLength={1000} value={note} onChange={e => setNote(e.target.value)}
              placeholder={isMentee
                ? 'Bu oturumda ne öğrendiniz? Mentörünüz hakkındaki görüşleriniz…'
                : 'Mentee\'nin gelişimi, tartışılan konular, bir sonraki oturum için notlar…'}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy || !note.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl disabled:opacity-60 transition-colors">
              {busy ? 'Gönderiliyor…' : 'Notu Kaydet'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Daha Sonra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Unrated Card ─────────────────────────────────────────────────────────────

function UnratedSessionCard({ session, token, onRated }: {
  session: UpcomingSession; token: string; onRated: () => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const mentorName = session.counterpart.displayName ?? session.counterpart.email;
  return (
    <>
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-amber-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {session.engagementType === 'periodic' && session.sessionNumber && (
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  {session.sessionNumber}. Oturum
                </span>
              )}
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                Not bekleniyor
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{session.topic}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Mentör: <span className="font-medium text-gray-700">{mentorName}</span>
              {session.counterpart.profession && (
                <span className="text-gray-400"> · {session.counterpart.profession}</span>
              )}
            </p>
            {session.completedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Tamamlandı: {fmtDate(session.completedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 pl-5">
          <button onClick={() => setShowNote(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#26496b] border border-[#26496b] rounded-xl hover:bg-[#26496b]/5 transition-colors">
            <span className="text-base leading-none">📝</span>
            Notu & Puanı Gir
          </button>
        </div>
      </div>
      {showNote && (
        <SessionNoteModal session={session} token={token}
          onDone={() => { setShowNote(false); onRated(); }}
          onClose={() => setShowNote(false)} />
      )}
    </>
  );
}

// ─── Join Button ───────────────────────────────────────────────────────────────

function JoinButton({ session, token }: { session: UpcomingSession; token: string }) {
  const [joining, setJoining] = useState(false);
  async function handleJoin() {
    setJoining(true);
    try {
      let roomName = session.roomName;
      if (!roomName) {
        const result = await mutfakApi.startSession(
          { referenceType: 'mentorship', referenceId: session.sessionRowId ?? session.id }, token,
        );
        roomName = result.roomName;
      }
      window.open(`https://meet.jit.si/${roomName}`, '_blank', 'noopener');
    } catch { /* silently ignore */ } finally { setJoining(false); }
  }
  return (
    <button disabled={joining} onClick={() => void handleJoin()}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {joining ? 'Bağlanıyor…' : 'Görüntülü Görüş'}
    </button>
  );
}

// ─── Session Card (action card) ────────────────────────────────────────────────

function SessionCard({ session, token, onUpdate }: {
  session: UpcomingSession; token: string; onUpdate: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const isMentor = session.role === 'mentor';
  const isPeriodic = session.engagementType === 'periodic';

  async function doComplete() {
    if (!session.sessionRowId) return;
    setBusy(true); setError('');
    try {
      await mutfakApi.completeSessionById(session.sessionRowId, token);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tamamlanamadı.');
    } finally { setBusy(false); }
  }

  const counterpartName = session.counterpart.displayName ?? session.counterpart.email;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-blue-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {isPeriodic && session.sessionNumber && (
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  {session.sessionNumber}. Oturum
                </span>
              )}
              {isPeriodic && (
                <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">Dönemlik</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{session.topic}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isMentor ? 'Mentee:' : 'Mentör:'}{' '}
              <span className="font-medium text-gray-700">{counterpartName}</span>
              {session.counterpart.profession && (
                <span className="text-gray-400"> · {session.counterpart.profession}</span>
              )}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            isMentor ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {isMentor ? 'Mentor' : 'Mentee'}
          </span>
        </div>

        <div className="mt-3 pl-5">
          {session.scheduledAt && (
            <p className="text-sm font-medium text-gray-700">{fmtDateTime(session.scheduledAt)}</p>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-600 pl-5">{error}</p>}

        <div className="mt-4 pl-5 flex flex-wrap gap-2">
          <JoinButton session={session} token={token} />
          {isMentor && (
            <button disabled={busy} onClick={() => setShowSchedule(true)}
              className="px-4 py-2 text-sm font-medium text-[#26496b] border border-[#26496b] rounded-xl hover:bg-[#26496b]/5 transition-colors">
              Tarihi Güncelle
            </button>
          )}
          {isMentor && (
            <button disabled={busy} onClick={() => setShowCompleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-60">
              Tamamlandı
            </button>
          )}
        </div>
      </div>

      {showSchedule && (
        <ScheduleModal session={session} token={token}
          onDone={() => { setShowSchedule(false); onUpdate(); }}
          onClose={() => setShowSchedule(false)} />
      )}
      {showNote && (
        <SessionNoteModal session={session} token={token}
          onDone={() => { setShowNote(false); onUpdate(); }}
          onClose={() => setShowNote(false)} />
      )}
      {showCompleteConfirm && (
        <ConfirmDialog
          title="Oturumu tamamlandı olarak işaretle"
          message="Bu oturum tamamlandı mı? Hem siz hem mentee not girebilecek."
          confirmLabel="Tamamlandı"
          onConfirm={() => { setShowCompleteConfirm(false); void doComplete(); }}
          onCancel={() => setShowCompleteConfirm(false)} />
      )}
    </>
  );
}

// ─── Pending Schedule Card (mentor) ───────────────────────────────────────────

function PendingScheduleCard({ session, token, onUpdate }: {
  session: UpcomingSession; token: string; onUpdate: () => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const counterpartName = session.counterpart.displayName ?? session.counterpart.email;

  return (
    <>
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {session.engagementType === 'periodic' && session.sessionNumber && (
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  {session.sessionNumber}. Oturum
                </span>
              )}
              <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                Tarih bekleniyor
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{session.topic}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Mentee: <span className="font-medium text-gray-700">{counterpartName}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 pl-5">
          <button onClick={() => setShowSchedule(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl transition-colors">
            Tarihi Belirle
          </button>
        </div>
      </div>
      {showSchedule && (
        <ScheduleModal session={session} token={token}
          onDone={() => { setShowSchedule(false); onUpdate(); }}
          onClose={() => setShowSchedule(false)} />
      )}
    </>
  );
}

// ─── History Engagement Card ───────────────────────────────────────────────────

function HistoryCard({ item }: { item: EngagementHistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const completedSessions = item.sessions.filter(s => s.status === 'completed').length;
  const isPeriodic = item.engagementType === 'periodic';

  const statusColor: Record<string, string> = {
    completed: 'text-green-700 bg-green-50',
    cancelled: 'text-gray-500 bg-gray-100',
    rejected: 'text-red-600 bg-red-50',
  };
  const statusLabel: Record<string, string> = {
    completed: 'Tamamlandı',
    cancelled: 'İptal edildi',
    rejected: 'Reddedildi',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isPeriodic ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'
            }`}>
              {isPeriodic ? 'Dönemlik' : '1 Seans'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor[item.status] ?? 'text-gray-500 bg-gray-100'}`}>
              {statusLabel[item.status] ?? item.status}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              item.role === 'mentor' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {item.role === 'mentor' ? 'Mentor olarak' : 'Mentee olarak'}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{item.topic}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
            <span>{item.counterpart.displayName ?? item.counterpart.email}</span>
            {item.completedAt && (
              <>
                <span>·</span>
                <span>{fmtDate(item.completedAt)}</span>
              </>
            )}
            {isPeriodic && (
              <>
                <span>·</span>
                <span>{completedSessions}/{item.sessions.length} oturum</span>
              </>
            )}
            {item.menteeFinalRating !== null && (
              <>
                <span>·</span>
                <Stars rating={item.menteeFinalRating} />
              </>
            )}
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded timeline */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4">
            <EngagementTimeline engagement={item} role={item.role} compact />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function SeanslarimPage() {
  const { user } = useAuth();
  const token = useToken();

  const [tab, setTab] = useState<'aktif' | 'gecmis'>('aktif');

  // Aktif seanslar
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [pendingSchedule, setPendingSchedule] = useState<UpcomingSession[]>([]);
  const [unrated, setUnrated] = useState<UpcomingSession[]>([]);
  const [activeEngagements, setActiveEngagements] = useState<Array<MentorshipRequest & { role: 'mentee' | 'mentor' }>>([]);

  // Geçmiş
  const [history, setHistory] = useState<EngagementHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');

  const loadActive = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const [upcoming, toRate, incomingReqs, myReqs] = await Promise.all([
        mutfakApi.getMyUpcomingSessions(token),
        mutfakApi.getMyUnratedSessions(token),
        mutfakApi.getIncomingRequests(token),
        mutfakApi.getMyRequests(token),
      ]);

      setSessions(upcoming);
      setUnrated(toRate);

      // Mentor: tarih bekleyen session'lar
      const pendingSessions: UpcomingSession[] = [];
      for (const req of incomingReqs) {
        if (req.status !== 'accepted') continue;
        for (const sess of req.sessions ?? []) {
          if (sess.status === 'pending') {
            pendingSessions.push({
              id: req.id,
              sessionRowId: sess.id,
              sessionNumber: sess.sessionNumber,
              engagementType: req.engagementType,
              topic: req.topic,
              status: sess.status,
              scheduledAt: null,
              proposedScheduledAt: null,
              rescheduleNote: null,
              menteeId: req.menteeId,
              mentorId: req.mentorId,
              mentorNote: null,
              preferredFormat: req.preferredFormat,
              role: 'mentor' as const,
              counterpart: {
                email: req.mentee?.email ?? '',
                displayName: req.mentee?.profile?.displayName ?? null,
                avatarUrl: req.mentee?.profile?.avatarUrl ?? null,
                profession: req.mentee?.profile?.profession ?? null,
              },
              roomName: null,
              sessionId: null,
            });
          }
        }
      }
      setPendingSchedule(pendingSessions);

      // Aktif eşleşmeler (timeline view)
      const mentorActives = incomingReqs
        .filter(r => r.status === 'accepted')
        .map(r => ({ ...r, role: 'mentor' as const }));
      const menteeActives = myReqs
        .filter(r => r.status === 'accepted')
        .map(r => ({ ...r, role: 'mentee' as const }));

      // Tekrarları önle
      const seen = new Set(mentorActives.map(r => r.id));
      const combined = [
        ...mentorActives,
        ...menteeActives.filter(r => !seen.has(r.id)),
      ];
      setActiveEngagements(combined);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi.');
    } finally { setLoading(false); }
  }, [token]);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const h = await mutfakApi.getMyHistory(token);
      setHistory(h);
    } catch {
      // silent
    } finally { setHistoryLoading(false); }
  }, [token]);

  useEffect(() => { void loadActive(); }, [loadActive]);
  useEffect(() => {
    if (tab === 'gecmis') void loadHistory();
  }, [tab, loadHistory]);

  if (!user) return null;

  const grouped = groupByDay(sessions);
  const days = Array.from(grouped.keys()).sort();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Seanslarım</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mentorluk oturumları & geçmiş</p>
        </div>
        <a href="/mentorluk" className="text-sm text-[#26496b] hover:underline">← Mentorluk</a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {(['aktif', 'gecmis'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'aktif' ? 'Aktif' : 'Geçmiş'}
            {t === 'gecmis' && history.length > 0 && (
              <span className="ml-1.5 text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* ═══ AKTİF TAB ═══ */}
      {tab === 'aktif' && (
        <>
          {/* Tarih bekleniyor (mentor) */}
          {!loading && pendingSchedule.length > 0 && (
            <section className="mb-8">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2 pl-1">
                Tarih Belirlenmesi Bekleniyor
              </p>
              <div className="space-y-3">
                {pendingSchedule.map((s, i) => (
                  <PendingScheduleCard key={`${s.id}-${i}`} session={s} token={token} onUpdate={() => void loadActive()} />
                ))}
              </div>
            </section>
          )}

          {/* Not bekleniyor */}
          {!loading && unrated.length > 0 && (
            <section className="mb-8">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 pl-1">
                Not & Değerlendirme Bekliyor
              </p>
              <div className="space-y-3">
                {unrated.map((s, i) => (
                  <UnratedSessionCard key={`${s.id}-${i}`} session={s} token={token} onRated={() => void loadActive()} />
                ))}
              </div>
            </section>
          )}

          {/* Eşleşme Takibi (timeline) */}
          {!loading && activeEngagements.length > 0 && (
            <section className="mb-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pl-1">
                Eşleşme Takibi
              </p>
              <div className="space-y-4">
                {activeEngagements.map(eng => (
                  <EngagementTimeline key={eng.id} engagement={eng} role={eng.role} />
                ))}
              </div>
            </section>
          )}

          {/* Yaklaşan seanslar */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : days.length === 0 && pendingSchedule.length === 0 && unrated.length === 0 && activeEngagements.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Aktif seans yok</p>
              <a href="/mentorluk" className="mt-1 inline-block text-sm text-[#26496b] hover:underline">
                Mentor bul →
              </a>
            </div>
          ) : days.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 pl-1">
                Yaklaşan Seanslar
              </p>
              <div className="space-y-6">
                {days.map(day => (
                  <div key={day}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pl-1">
                      {fmtDate(day + 'T00:00:00')}
                    </p>
                    <div className="space-y-3">
                      {grouped.get(day)!.map((s, i) => (
                        <SessionCard key={`${s.id}-${i}`} session={s} token={token} onUpdate={() => void loadActive()} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Legend */}
          {!loading && (
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300" /> Tarih bekleniyor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Planlandı
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Tamamlandı
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Not bekleniyor
              </span>
            </div>
          )}
        </>
      )}

      {/* ═══ GEÇMİŞ TAB ═══ */}
      {tab === 'gecmis' && (
        <>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <p className="text-sm font-medium text-gray-500">Henüz tamamlanmış seans yok</p>
              <p className="text-xs text-gray-400 mt-1">
                Tamamlanan eşleşmeler ve oturum detayları burada görünecek.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
