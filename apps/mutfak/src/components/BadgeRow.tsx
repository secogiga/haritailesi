'use client';

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  founding_member: { label: 'Kurucu Üye', icon: '🏛️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  mentor_star: { label: 'Mentor Yıldızı', icon: '⭐', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  connector: { label: 'Bağlayıcı', icon: '🔗', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  contributor: { label: 'Katkıcı', icon: '✍️', color: 'bg-green-50 text-green-700 border-green-200' },
  verified: { label: 'Doğrulanmış', icon: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

interface Props {
  badges: string[];
  size?: 'sm' | 'md';
}

export function BadgeRow({ badges, size = 'md' }: Props) {
  if (!badges.length) return null;

  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';
  const paddingClass = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge];
        if (!config) return null;
        return (
          <span
            key={badge}
            title={config.label}
            className={`inline-flex items-center gap-1 border rounded-full font-medium ${textSize} ${paddingClass} ${config.color}`}
          >
            <span aria-hidden="true">{config.icon}</span>
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
