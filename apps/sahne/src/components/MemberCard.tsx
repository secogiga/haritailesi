'use client';

import { useEffect, useRef, useState } from 'react';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import { loadLevelActions } from '@/lib/rehber';
import { calculateLevel, levelProgress, LEVEL_ORDER, LEVEL_META, type LevelId } from '@/lib/level';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// ─── Görsel config ────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<LevelId, {
  color: string; bg: string; bar: string; ring: string; dot: string;
}> = {
  izleyici:     { color: 'text-slate-500',   bg: 'bg-slate-100',      bar: 'bg-slate-400',   ring: 'ring-slate-300',      dot: 'bg-slate-400'   },
  katilimci:    { color: 'text-blue-400',    bg: 'bg-blue-500/20',    bar: 'bg-blue-400',    ring: 'ring-blue-400/60',    dot: 'bg-blue-400'    },
  katki_sunan:  { color: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-400', ring: 'ring-emerald-400/60', dot: 'bg-emerald-400' },
  etki_yaratan: { color: 'text-amber-400',   bg: 'bg-amber-500/20',   bar: 'bg-amber-400',   ring: 'ring-amber-400/60',   dot: 'bg-amber-400'   },
};

const TIER_LABELS: Record<string, string> = {
  individual:  'Bireysel Üye',
  student:     'Öğrenci Üye',
  corporate:   'Kurumsal Üye',
  young:       'Haritailesi Genç',
  honorary:    'Onursal Üye',
};

// ─── Rozet tanımları ──────────────────────────────────────────────────────────

function getBadges(doneIds: string[]): { icon: string; label: string; color: string }[] {
  const badges: { icon: string; label: string; color: string }[] = [];
  if (doneIds.length >= 1)
    badges.push({ icon: '🌱', label: 'İlk Adım', color: 'bg-slate-700 text-slate-200' });
  if (doneIds.some(id => id.startsWith('p-')))
    badges.push({ icon: '🤝', label: 'Katılımcı', color: 'bg-blue-900/60 text-blue-300' });
  if (doneIds.some(id => id.startsWith('c-')))
    badges.push({ icon: '✍️', label: 'Katkı Sunan', color: 'bg-emerald-900/60 text-emerald-300' });
  if (doneIds.some(id => id.startsWith('d-')))
    badges.push({ icon: '⭐', label: 'Etki Yaratan', color: 'bg-amber-900/60 text-amber-300' });
  const vCount = doneIds.filter(id => id.startsWith('v-')).length;
  if (vCount >= 4)
    badges.push({ icon: '🏅', label: 'Keşif Tamamlandı', color: 'bg-slate-700 text-slate-200' });
  return badges;
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────

export function MemberCard() {
  const { user } = useSahneAuth();
  const [localIds, setLocalIds]         = useState<string[]>([]);
  const [mounted, setMounted]           = useState(false);
  const [levelUpLabel, setLevelUpLabel] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setLocalIds(loadLevelActions());
  }, []);

  // All hooks must be called before any early return (Rules of Hooks)
  const doneIds = user
    ? (user.completedActionIds.length > 0 ? user.completedActionIds : localIds)
    : localIds;
  const currentLevelId  = calculateLevel(doneIds);
  const prevLevelId     = usePrevious(currentLevelId);
  const currentLevelIdx = LEVEL_ORDER.indexOf(currentLevelId);

  useEffect(() => {
    if (!prevLevelId || prevLevelId === currentLevelId) return;
    const prevIdx = LEVEL_ORDER.indexOf(prevLevelId);
    if (currentLevelIdx > prevIdx) {
      const label = LEVEL_META[currentLevelId].label;
      setLevelUpLabel(label);
      const t = setTimeout(() => setLevelUpLabel(null), 4500);
      return () => clearTimeout(t);
    }
  }, [currentLevelId, prevLevelId, currentLevelIdx]);

  if (!mounted || !user) return null;

  const nextLevelId     = LEVEL_ORDER[currentLevelIdx + 1] as LevelId | undefined;
  const style           = LEVEL_STYLE[currentLevelId];
  const meta            = LEVEL_META[currentLevelId];
  const { done: doneCurrent, total: actionCount, pct } = levelProgress(doneIds, currentLevelId);
  const badges = getBadges(doneIds);

  const displayName = user?.profile?.displayName ?? 'Haritailesi Üyesi';
  const tierLabel   = TIER_LABELS[user?.membershipTier ?? ''] ?? 'Üye';
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl select-none"
      style={{ background: 'linear-gradient(135deg, #1a3550 0%, #26496b 50%, #1d3a57 100%)' }}>

      {/* Dekoratif daire */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative px-6 pt-5 pb-6">

        {/* Üst bar — logo + kademe */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#66aca9]">Haritailesi</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Sahne</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${style.bg} ring-1 ${style.ring}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${style.color}`}>
              {meta.no}. Kademe
            </span>
            <span className={`text-[10px] font-semibold ${style.color}`}>· {meta.label}</span>
          </div>
        </div>

        {/* Avatar + isim */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#66aca9]/30 ring-2 ring-[#66aca9]/40 flex items-center justify-center shrink-0">
            {user?.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-[#66aca9]">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">{displayName}</p>
            <p className="text-xs text-white/50 mt-0.5">{tierLabel}</p>
            {(user?.profile?.profession || user?.profile?.city) && (
              <p className="text-[11px] text-white/40 mt-0.5">
                {[user.profile.profession, user.profile.city].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* İlerleme çubuğu */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/40">{meta.label}</span>
            <span className="text-[10px] text-white/40">
              ({doneCurrent}/{actionCount})
              {nextLevelId && (
                <span className={`ml-1 font-medium ${LEVEL_STYLE[nextLevelId].color}`}>
                  {LEVEL_META[nextLevelId].label}
                </span>
              )}
            </span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-5">
          {LEVEL_ORDER.map((lvlId, idx) => {
            const lvlMeta  = LEVEL_META[lvlId];
            const lvlStyle = LEVEL_STYLE[lvlId];
            // Geçilmiş kademeler (idx < current) her zaman işaretli —
            // prefix sayısına değil, kanonik kademe sıralamasına bakıyoruz
            const complete = idx < currentLevelIdx;
            const active   = lvlId === currentLevelId;
            return (
              <div key={lvlId} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${
                  complete ? `${lvlStyle.dot} text-white` :
                  active   ? `ring-2 ${lvlStyle.ring} bg-white/10 ${lvlStyle.color}` :
                             'bg-white/10 text-white/25'
                }`}>
                  {complete ? '✓' : lvlMeta.no}
                </div>
                {idx < LEVEL_ORDER.length - 1 && (
                  <div className={`flex-1 h-px mx-1.5 ${complete ? style.bar : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Rozetler */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map(b => (
              <span key={b.label} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.color}`}>
                <span>{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
        )}

        {badges.length === 0 && (
          <p className="text-[11px] text-white/30 italic">Aksiyon tamamladıkça rozetler belirir.</p>
        )}
      </div>

      {/* Level-up bildirimi */}
      {levelUpLabel && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none"
          style={{ animation: 'mc-fadeout 4.5s ease forwards' }}
        >
          <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl text-center"
            style={{ background: 'rgba(30,55,82,0.92)', backdropFilter: 'blur(8px)' }}>
            <span className="text-2xl" style={{ animation: 'mc-bounce 0.6s cubic-bezier(0.34,1.6,0.64,1) both' }}>🎉</span>
            <p className="text-sm font-bold text-white leading-snug">Kademe Atladın!</p>
            <p className={`text-sm font-semibold ${style.color}`}>{levelUpLabel}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mc-fadeout {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes mc-bounce {
          0%   { transform: scale(0.3) rotate(-15deg); }
          60%  { transform: scale(1.15) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
