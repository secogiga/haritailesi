'use client';

import type { LevelStats } from '@/lib/api';

const ACTION_LABELS: Record<string, string> = {
  'v-vakif': 'Vakıfı Keşfet',
  'v-tv': 'Haritailesi TV',
  'v-bagis': 'Bağış Yap',
  'v-talepler': 'Görüşleriniz',
  'v-sosyaliz': 'Sosyaliz',
  'v-kariyer': 'Kariyer',
  'v-haberita': 'Haberita',
  'v-egitim': 'Eğitim',
  'v-etkinlikler': 'Etkinlikler',
  'v-ilanlar': 'İlanlar',
  'v-magaza': 'Mağaza',
  'v-hgenc': 'HG Genç',
  'v-mentorluk': 'Mentorluk',
  'v-idoller': 'İdoller',
  'v-akademi': 'Akademi',
  'v-sinavlar': 'Sınavlar',
  'v-yarisma': 'Yarışmalar',
  'v-anketler': 'Anketler',
  'v-yetenekler': 'Yetenekler',
  'v-projeler': 'Projeler',
  'v-forum': 'Forum',
  'p-mentor': 'Mentor Ol',
  'p-proje': 'Proje Katıl',
  'p-yetenek': 'Yetenek Paylaş',
  'p-hgenc': 'HG Genç Katıl',
  'p-mezun': 'Mezun Katıl',
  'p-mentee': 'Mentee Ol',
  'p-bagis': 'Bağış Yap',
  'p-satin': 'Satın Al',
  'p-etkinlik': 'Etkinliğe Katıl',
  'p-anket': 'Anket Doldur',
  'p-yarisma': 'Yarışmaya Katıl',
  'c-gonderi': 'Gönderi Paylaş',
  'c-sc-cevap': 'S&C Cevap',
  'c-forum-cevap': 'Forum Cevap',
  'c-gorus': 'Görüş Yaz',
  'c-haberita': 'Haberita Yaz',
  'c-ilan': 'İlan Ver',
  'c-urun': 'Ürün Ekle',
  'c-talep': 'Talep Gönder',
  'c-sc-soru': 'S&C Soru',
  'c-forum-soru': 'Forum Soru',
  'd-mentor-seans': 'Mentor Seansı',
  'd-proje': 'Proje Yürüt',
  'd-egitim': 'Eğitim Ver',
  'd-etkinlik': 'Etkinlik Düzenle',
  'd-editor': 'Editör Ol',
  'd-tanitim': 'Tanıtım Yap',
  'd-kariyer': 'Kariyer Rehberliği',
  'd-isbirligi': 'İşbirliği Kur',
  'd-kose': 'Köşe Yazısı',
  'd-yetenek': 'Yetenek Keşfet',
};

function actionPrefix(id: string) {
  const p = id.split('-')[0];
  if (p === 'v') return { label: 'Keşif', color: 'text-slate-500 bg-slate-100' };
  if (p === 'p') return { label: 'Katılım', color: 'text-blue-500 bg-blue-100' };
  if (p === 'c') return { label: 'Katkı', color: 'text-emerald-500 bg-emerald-100' };
  return { label: 'Etki', color: 'text-amber-500 bg-amber-100' };
}

interface Props {
  data: LevelStats | null;
  loading: boolean;
}

export default function KademelerPanel({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Kademe verisi yüklenemedi.
      </div>
    );
  }

  const { distribution, topActions, trackedUsers } = data;
  const total = distribution.total || 1;

  const levels = [
    {
      id: 'izleyici',
      label: 'Keşif',
      no: 1,
      count: distribution.izleyici,
      color: 'bg-slate-400',
      textColor: 'text-slate-600',
      lightBg: 'bg-slate-50',
      border: 'border-slate-200',
    },
    {
      id: 'katilimci',
      label: 'Katılımcı',
      no: 2,
      count: distribution.katilimci,
      color: 'bg-blue-400',
      textColor: 'text-blue-600',
      lightBg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      id: 'katki_sunan',
      label: 'Katkı Sunan',
      no: 3,
      count: distribution.katki_sunan,
      color: 'bg-emerald-400',
      textColor: 'text-emerald-600',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      id: 'etki_yaratan',
      label: 'Etki Yaratan',
      no: 4,
      count: distribution.etki_yaratan,
      color: 'bg-amber-400',
      textColor: 'text-amber-600',
      lightBg: 'bg-amber-50',
      border: 'border-amber-200',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Özet stat */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Takip Edilen Üye</p>
          <p className="text-2xl font-bold text-gray-900">{trackedUsers.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">En Yüksek Kademe</p>
          <p className="text-2xl font-bold text-amber-600">{distribution.etki_yaratan.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-0.5">Etki Yaratan</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tamamlanan Aksiyon</p>
          <p className="text-2xl font-bold text-gray-900">
            {topActions.reduce((s, a) => s + a.count, 0).toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      {/* Kademe dağılımı */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Kademe Dağılımı</h3>
        <div className="space-y-3">
          {levels.map((lvl) => {
            const pct = Math.round((lvl.count / total) * 100);
            return (
              <div key={lvl.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full ${lvl.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                      {lvl.no}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">{lvl.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className={`text-sm font-bold ${lvl.textColor}`}>{lvl.count.toLocaleString('tr-TR')}</span>
                    <span className="text-xs text-gray-400 w-8">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${lvl.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* En çok tamamlanan aksiyonlar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">En Çok Tamamlanan 10 Aksiyon</h3>
        {topActions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Henüz aksiyon verisi yok.</p>
        ) : (
          <div className="space-y-2">
            {topActions.map((a, i) => {
              const prefix = actionPrefix(a.actionId);
              const label = ACTION_LABELS[a.actionId] ?? a.actionId;
              const maxCount = topActions[0]?.count ?? 1;
              const pct = Math.round((a.count / maxCount) * 100);
              return (
                <div key={a.actionId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${prefix.color} shrink-0`}>
                    {prefix.label}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{label}</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right shrink-0">
                    {a.count.toLocaleString('tr-TR')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
