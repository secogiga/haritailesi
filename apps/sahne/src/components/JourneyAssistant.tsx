'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import { ALL_ACTIONS, loadLevelActions, calculateLevel, type RehberAction } from '@/lib/rehber';

// ─── Veri ─────────────────────────────────────────────────────────────────────

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const LEVELS = [
  {
    id: 'izleyici', no: 1, label: 'Keşif', actionCount: 4,
    color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', bar: 'bg-slate-400',
    glow: 'shadow-slate-200 dark:shadow-slate-900',
    items: [
      { id: 'v-vakif',       label: 'Vakıf Sayfası' },
      { id: 'v-tv',          label: 'Haritailesi TV' },
      { id: 'v-bagis',       label: 'Bağış Sayfası' },
      { id: 'v-talepler',    label: 'Haritailesi Pusula' },
      { id: 'v-sosyaliz',    label: 'Sosyaliz!' },
      { id: 'v-kariyer',     label: 'Haritakariyer' },
      { id: 'v-haberita',    label: 'Haberita' },
      { id: 'v-egitim',      label: 'Eğitimler' },
      { id: 'v-etkinlikler', label: 'Etkinlikler' },
      { id: 'v-ilanlar',     label: 'İlanlar' },
      { id: 'v-magaza',      label: 'Mağaza' },
      { id: 'v-hgenc',       label: 'Haritailesi Genç Alanı' },
      { id: 'v-mentorluk',   label: 'Haritailesi Mentörlük Sistemi' },
      { id: 'v-idoller',     label: 'Bir Mesleğin İdolünden İlham Al' },
      { id: 'v-akademi',     label: 'Haritakademi' },
      { id: 'v-sinavlar',    label: 'Sınavlar' },
      { id: 'v-yarisma',     label: 'Yarışmalar' },
      { id: 'v-anketler',    label: 'Anketler' },
      { id: 'v-sc',          label: 'Soru & Cevap' },
      { id: 'v-forum',       label: 'Mutfak Kütüphanesi' },
    ],
  },
  {
    id: 'katilimci', no: 2, label: 'Katılımcı', actionCount: 3,
    color: 'text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', bar: 'bg-blue-400',
    glow: 'shadow-blue-200 dark:shadow-blue-900',
    items: [
      { id: 'p-mentor',   label: 'Mentör Ol' },
      { id: 'p-proje',    label: 'Projelere Destek Ver' },
      { id: 'p-yetenek',  label: 'Yeteneklere Destek Ver' },
      { id: 'p-hgenc',    label: "Haritailesi Genç'e Katıl" },
      { id: 'p-mezun',    label: 'Mesleğin Gelecekleri Programına Katıl' },
      { id: 'p-mentee',   label: 'Mentee Ol' },
      { id: 'p-bagis',    label: 'Bağış Yap' },
      { id: 'p-satin',    label: 'Satın Alma Yap' },
      { id: 'p-etkinlik', label: 'Etkinliğe Katıl' },
      { id: 'p-egitim',   label: 'Eğitime Katıl' },
      { id: 'p-anket',    label: 'Ankete Katıl' },
      { id: 'p-yarisma',  label: 'Yarışmaya Katıl' },
    ],
  },
  {
    id: 'katki_sunan', no: 3, label: 'Katkı Sunan', actionCount: 2,
    color: 'text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', bar: 'bg-emerald-400',
    glow: 'shadow-emerald-200 dark:shadow-emerald-900',
    items: [
      { id: 'c-gonderi',     label: 'Mutfakta Gönderi Paylaş' },
      { id: 'c-sc-cevap',    label: 'S&C Cevabı Ver' },
      { id: 'c-forum-cevap', label: 'Forum Cevabı Yaz' },
      { id: 'c-gorus',       label: 'Görüşlerinizi Gönderin' },
      { id: 'c-haberita',    label: "Haberita'ya İçerik Gönder" },
      { id: 'c-ilan',        label: 'İlan Oluştur' },
      { id: 'c-urun',        label: 'Mağazada Ürün Oluştur' },
      { id: 'c-talep',       label: 'Talebinizi İletin' },
      { id: 'c-sc-soru',     label: 'S&C Sorusu Sor' },
      { id: 'c-forum-soru',  label: 'Forum Sorusu Aç' },
    ],
  },
  {
    id: 'etki_yaratan', no: 4, label: 'Etki Yaratan', actionCount: 1,
    color: 'text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', bar: 'bg-amber-400',
    glow: 'shadow-amber-200 dark:shadow-amber-900',
    items: [
      { id: 'd-mentor-seans', label: 'Mentor Seansı Gerçekleştir' },
      { id: 'd-proje',        label: 'Projeni Gönder' },
      { id: 'd-egitim',       label: 'Eğitim Oluştur' },
      { id: 'd-etkinlik',     label: 'Etkinlik Oluştur' },
      { id: 'd-editor',       label: 'Haberita Editörü Ol' },
      { id: 'd-tanitim',      label: 'Tanıtım Yap' },
      { id: 'd-kariyer',      label: 'Kariyer Hikayeni Paylaş' },
      { id: 'd-isbirligi',    label: 'İşbirliği Yap' },
      { id: 'd-kose',         label: 'Haberita Köşe Yazarı Ol' },
      { id: 'd-yetenek',      label: 'Yeteneğini Paylaş' },
    ],
  },
] as const;

type Level = typeof LEVELS[number];

type GuidancePart = { text: string } | { badge: string; cls: string };
const LEVEL_GUIDANCE: Record<string, { title: string; parts: GuidancePart[] }> = {
  izleyici: { title: 'Şimdi ne yapmalısın?', parts: [
    { text: "Haritailesi'ni tanı, ilk 4 adımını tamamla ve " },
    { badge: 'Katılımcı', cls: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' },
    { text: ' seviyesine geç.' },
  ]},
  katilimci: { title: 'Nasıl ilerliyorsun?', parts: [
    { text: 'Etkinliğe katıl, ankete cevap ver ya da mentörle bağlan. 3 aksiyon → ' },
    { badge: 'Katkı Sunan', cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' },
    { text: ' kademesi.' },
  ]},
  katki_sunan: { title: 'Katkını nasıl sunarsın?', parts: [
    { text: 'Gönderi paylaş, soru sor ya da içerik gönder. 2 aksiyon → ' },
    { badge: 'Etki Yaratan', cls: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' },
    { text: ' açılır.' },
  ]},
  etki_yaratan: { title: 'Etkin nasıl yaratırsın?', parts: [
    { text: 'Mentor ol, eğitim ver ya da etkinlik düzenle. Topluluğa yön ver.' },
  ]},
};

const MOTIVATIONS: Record<string, string[]> = {
  izleyici:     ['Haritailesi ekosistemini keşfetmeye başla.', 'Her içerik seni bir adım ilerletiyor.', 'Merak etmek ilk ve en güçlü adım.'],
  katilimci:    ['Artık aktif bir katılımcısın!', 'Etkinlikler, mentörler, yarışmalar seni bekliyor.', 'Toplulukla birlikte büyü.'],
  katki_sunan:  ['Paylaştığın her şey topluluğu güçlendiriyor.', 'Bilgin değer, onu paylaşmak güç.', 'İçerik üretmek iz bırakmaktır.'],
  etki_yaratan: ['En yüksek kademede yol alıyorsun.', 'Liderlik etmek, yön göstermektir.', 'Topluluğun sana bakıyor.'],
};

function pickMotivation(levelId: string, seed: number): string {
  const arr = MOTIVATIONS[levelId] ?? ['Devam et!'];
  return arr[seed % arr.length]!;
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────

export function JourneyAssistant() {
  const { user, recordAction } = useSahneAuth();
  const [open, setOpen]       = useState(false);
  const [localIds, setLocalIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const toastTimer            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer            = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    setLocalIds(loadLevelActions());
    try {
      const saved = localStorage.getItem('journey_assistant_open');
      if (saved === '1') setOpen(true);
    } catch {}

    const openHandler = () => {
      setOpen(true);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => setOpen(false), 4000);
    };
    window.addEventListener('open-journey-assistant', openHandler);

    function onActionDone(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setLocalIds(prev => prev.includes(id) ? prev : [...prev, id]);
    }
    window.addEventListener('sahne-action-done', onActionDone);

    return () => {
      window.removeEventListener('open-journey-assistant', openHandler);
      window.removeEventListener('sahne-action-done', onActionDone);
    };
  }, []);

  useEffect(() => {
    document.body.toggleAttribute('data-journey-open', open);
  }, [open]);

  useEffect(() => {
    try { localStorage.setItem('journey_assistant_open', open ? '1' : '0'); } catch {}
  }, [open]);

  // Login olduktan sonra sunucudan gelen veriyi kullan, login öncesi localStorage
  const doneIds = user ? user.completedActionIds : localIds;

  const handleDone = useCallback((action: RehberAction) => {
    // Eğer login değilse localStorage'ı da güncelle (sync sonrası temizlenir)
    if (!user) {
      setLocalIds(prev => prev.includes(action.id) ? prev : [...prev, action.id]);
    }
    void recordAction(action.id);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(action.isAhaMoment ? '🎉 Farkındalık Anı!' : '✓ Tamamlandı!');
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, [user, recordAction]);

  if (!mounted) return null;

  // Kanonik kademe hesabı (rehber.ts calculateLevel — MemberCard ile aynı algoritma)
  const currentLevelId = calculateLevel(doneIds);
  const currentIdx     = LEVELS.findIndex(l => l.id === currentLevelId);
  const currentLevel   = LEVELS[Math.max(0, currentIdx)]!;
  const doneCurrent  = currentLevel.items.filter(it => doneIds.includes(it.id)).length;
  const pct          = Math.min((doneCurrent / currentLevel.actionCount) * 100, 100);
  const isComplete   = doneCurrent >= currentLevel.actionCount;

  // Mevcut seviye tamamlandıysa panelde bir sonraki seviyeyi göster
  const displayLevel = (isComplete && LEVELS[currentIdx + 1]) ? LEVELS[currentIdx + 1]! : currentLevel;
  const doneDisplay  = displayLevel.items.filter(it => doneIds.includes(it.id)).length;
  const displayPct   = Math.min((doneDisplay / displayLevel.actionCount) * 100, 100);
  const displayIdx   = LEVELS.findIndex(l => l.id === displayLevel.id);

  // Sıradaki aksiyon
  let nextItem:   { id: string; label: string } | null = null;
  let nextAction: RehberAction | undefined;
  for (const lvl of LEVELS) {
    const lvlDone = lvl.items.filter(it => doneIds.includes(it.id)).length;
    if (lvlDone < lvl.actionCount) {
      const item = lvl.items.find(it => !doneIds.includes(it.id));
      if (item) {
        nextItem   = item;
        nextAction = ALL_ACTIONS.find(a => a.id === item.id);
        break;
      }
    }
  }

  const totalActions = LEVELS.reduce((s, l) => s + l.actionCount, 0);
  const totalDone    = LEVELS.reduce((s, l) => s + Math.min(l.items.filter(it => doneIds.includes(it.id)).length, l.actionCount), 0);
  const overallPct   = Math.round((totalDone / totalActions) * 100);

  const displayName   = user?.profile?.displayName?.split(' ')[0] ?? null;
  const motivation    = pickMotivation(currentLevel.id, doneCurrent);
  const isFirstAction = nextItem?.id === 'v-vakif';
  const actionLabel   = isFirstAction ? "Haritailesi'ni keşfet!" : (nextItem?.label ?? '');
  const actionHref    = isFirstAction ? '#kesfet' : (nextAction?.href ?? '');
  const isExt         = !isFirstAction && !!nextAction && (nextAction.external || nextAction.href.startsWith('http'));

  return (
    <>
      {/* ── Panel ── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-40 w-64 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: 'min(380px, calc(100svh - 9rem))', animation: 'ja-in 0.28s cubic-bezier(0.34,1.4,0.64,1) both' }}
          onMouseEnter={() => { if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } }}
        >
          {/* Header — gradient */}
          <div className="relative px-4 pt-3.5 pb-3 overflow-hidden shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a3550 0%, #26496b 60%, #1d3a57 100%)' }}>
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
            <div className="relative flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-white leading-tight">Yolculuğa Başla</p>
                <p className="text-xs text-white/50 mt-0.5">Haritailesi ekosistemini keşfet</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors shrink-0 p-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${displayLevel.color}`}>
                {displayLevel.no}. Kademe · {displayLevel.label}
              </span>
              <span className="text-[10px] text-white/40">{Math.round(displayPct)}%</span>
            </div>
            <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${displayLevel.bar}`} style={{ width: `${displayPct}%` }} />
            </div>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-slate-900 divide-y divide-gray-50 dark:divide-slate-800 overflow-y-auto flex-1">

            {/* Kademe rehberi */}
            {LEVEL_GUIDANCE[displayLevel.id] && (
              <div className="px-3 pt-2.5 pb-2">
                <p className="text-xs font-bold text-[#26496b] dark:text-[#66aca9] mb-1">
                  {LEVEL_GUIDANCE[displayLevel.id]!.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  {LEVEL_GUIDANCE[displayLevel.id]!.parts.map((part, i) =>
                    'badge' in part
                      ? <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold mx-0.5 ${part.cls}`}>{part.badge}</span>
                      : <span key={i}>{part.text}</span>
                  )}
                </p>
              </div>
            )}

            {/* Sıradaki aksiyon */}
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1.5">
                Sıradaki Adımın
              </p>
              {nextItem && nextAction ? (
                <>
                  <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 mb-2">
                    <span className="text-xl shrink-0">{nextAction.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug truncate">{actionLabel}</p>
                      {nextAction.isAhaMoment && <p className="text-[10px] text-amber-500 font-medium">✨ Farkındalık Anı</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isFirstAction ? (
                      <button
                        onClick={() => {
                          handleDone(nextAction!);
                          window.dispatchEvent(new CustomEvent('open-startguide-group', {
                            detail: { levelId: 'izleyici', groupLabel: "Haritailesi'ni Keşfet" }
                          }));
                          setOpen(false);
                        }}
                        className="flex-1 text-center py-2 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-xs font-bold transition-colors">Git →</button>
                    ) : isExt ? (
                      <a href={actionHref} target="_blank" rel="noopener noreferrer"
                        onClick={() => handleDone(nextAction!)}
                        className="flex-1 text-center py-2 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-xs font-bold transition-colors">Git →</a>
                    ) : (
                      <Link href={actionHref}
                        onClick={() => handleDone(nextAction!)}
                        className="flex-1 text-center py-2 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-xs font-bold transition-colors">Git →</Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xl mb-1">🏆</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Tüm aksiyonlar tamamlandı!</p>
                </div>
              )}
            </div>

            {/* Kademelere genel bakış */}
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1.5">
                Kademelerin
              </p>
              <div className="space-y-1">
                {LEVELS.map((lvl, idx) => {
                  const prev       = LEVELS[idx - 1];
                  const prevDone   = prev ? prev.items.filter(it => doneIds.includes(it.id)).length : 0;
                  const isUnlocked = idx === 0 || prevDone >= (prev?.actionCount ?? 0);
                  const lvlDone    = lvl.items.filter(it => doneIds.includes(it.id)).length;
                  const lvlComplete= lvlDone >= lvl.actionCount;
                  const isActive   = idx === displayIdx;
                  const remaining  = prev ? (prev.actionCount - prevDone) : 0;

                  if (!isUnlocked) {
                    return (
                      <div key={lvl.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800/40">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-600">
                          {lvl.no}
                        </div>
                        <span className="flex-1 text-xs font-semibold text-gray-400 dark:text-slate-500 blur-[3px] select-none">{lvl.label}</span>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                          {remaining} aksiyon kaldı
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={lvl.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                      lvlComplete ? 'bg-emerald-50 dark:bg-emerald-950/30' : isActive ? lvl.bg : ''
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                        lvlComplete ? 'bg-emerald-500 text-white' :
                        isActive    ? `${lvl.bar} text-white` :
                                      'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                      }`}>
                        {lvlComplete ? '✓' : lvl.no}
                      </div>
                      <span className={`flex-1 text-xs font-semibold ${
                        lvlComplete ? 'text-emerald-600 dark:text-emerald-400' :
                        isActive    ? lvl.color : 'text-gray-400 dark:text-slate-500'
                      }`}>{lvl.label}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        {lvlDone}/{lvl.actionCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {isComplete && LEVELS[currentIdx + 1] && (
              <div className="px-4 py-2 bg-emerald-50/60 dark:bg-emerald-950/20">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold text-center">
                  🎉 {currentLevel.label} tamamlandı! {LEVELS[currentIdx + 1]?.label} açıldı.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => { if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } setOpen(v => !v); }}
        className={`fixed bottom-4 right-4 sm:right-6 z-50 w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          open
            ? 'bg-gray-700 dark:bg-slate-700 scale-95'
            : 'bg-[#26496b] hover:bg-[#1d3a57] hover:scale-110'
        }`}
        style={{ width: 52, height: 52 }}
        aria-label="Yolculuğa Başla"
      >
        {/* Pulse ring (sadece kapalıyken) */}
        {!open && totalDone < totalActions && (
          <span className="absolute w-full h-full rounded-full bg-[#26496b]/40 animate-ping" />
        )}

        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round">
            <path d="M12 3 L20 21 L12 16 L4 21 Z" />
          </svg>
        )}

      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#26496b] text-white text-sm font-semibold shadow-xl"
          style={{ animation: 'ja-in 0.2s ease both' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes ja-in {
          0%   { opacity: 0; transform: translateY(12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
