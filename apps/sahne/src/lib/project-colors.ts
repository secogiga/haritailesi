// Bu dosya, projeler modülünün dinamik DB değerlerinde kullanılan
// Tailwind sınıflarını Tailwind'in JIT taramasına dahil etmek için mevcuttur.

export const PROJECT_TAG_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-red-100 text-red-700',
  'bg-pink-100 text-pink-700',
  'bg-gray-100 text-gray-700',
] as const;

export const PROJECT_GRADIENTS = [
  'from-[#26496b] to-[#1a3350]',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-orange-400 to-orange-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
  'from-[#26496b] to-[#66aca9]',
] as const;

export type ProjectTagColor = typeof PROJECT_TAG_COLORS[number];
export type ProjectGradient = typeof PROJECT_GRADIENTS[number];
