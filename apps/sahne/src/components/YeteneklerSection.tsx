import Link from 'next/link';
import type { CmsTalent } from '@/lib/api';
import { TalentVideoCard } from './TalentVideoCard';
import { YetenekGonderButton } from './YetenekGonder';

interface Props {
  talents: CmsTalent[];
  mutfakUrl: string;
}

export default function YeteneklerSection({ talents, mutfakUrl }: Props) {
  const preview = talents.slice(0, 8);

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-[#070c1a] border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Yetenekler</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              Mesleğin ötesinde yetenekler.
            </h2>
            <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-xl">
              Koordinat hesaplarken aynı zamanda müzik yapıyorlar, fotoğraf sergileri açıyorlar, albüm çıkarıyorlar.
              Biz de ne cevherler var bu toplulukta.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/yetenekler"
              className="text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline"
            >
              Tümünü gör →
            </Link>
            <YetenekGonderButton variant="solid" label="+ Yeteneğini Paylaş" />
          </div>
        </div>

        {preview.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🎸', label: 'Müzik', desc: 'Gitarını, piyano sesini paylaş.' },
              { emoji: '📷', label: 'Fotoğrafçılık', desc: 'Karenin arkasındaki gözü keşfet.' },
              { emoji: '🎨', label: 'Görsel Sanatlar', desc: 'Resim, dijital çizim ve daha fazlası.' },
              { emoji: '✍️', label: 'Yazarlık', desc: 'Kelimelerini topluluğunla paylaş.' },
            ].map((ex) => (
              <div
                key={ex.label}
                className="flex flex-col bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 border-dashed p-6 items-center text-center gap-3"
              >
                <span className="text-4xl">{ex.emoji}</span>
                <div className="font-semibold text-gray-700 dark:text-slate-300">{ex.label}</div>
                <p className="text-sm text-gray-400 dark:text-slate-500">{ex.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {preview.map((talent) => (
              <TalentVideoCard key={talent.id} talent={talent} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-slate-500">
          Yeteneğini topluluğunla paylaşmak istersen{' '}
          <YetenekGonderButton label="buradan gönder" />
          {'. '}
          Videonu gömebilir, sesini duyurabiliriz.
        </p>
      </div>
    </section>
  );
}
