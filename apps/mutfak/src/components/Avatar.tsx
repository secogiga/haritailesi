import Image from 'next/image';

const COLORS = [
  'bg-[#26496b]', 'bg-[#66aca9]', 'bg-violet-600', 'bg-emerald-600',
  'bg-amber-600', 'bg-rose-600', 'bg-indigo-600', 'bg-teal-600',
];

function colorForId(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

interface AvatarProps {
  name: string;
  src?: string | null | undefined;
  size?: number;
  id?: string;
  className?: string;
}

export function Avatar({ name, src, size = 40, id, className = '' }: AvatarProps) {
  const px = `${size}px`;
  const text = size < 32 ? 'text-[10px]' : size < 48 ? 'text-sm' : 'text-xl';
  const color = id ? colorForId(id) : 'bg-[#26496b]';

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full ${color} text-white flex items-center justify-center font-semibold shrink-0 ${text} ${className}`}
      style={{ width: px, height: px, minWidth: px }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
