import { MemberCardSkeleton } from '@/components/Skeleton';

export default function UyelerLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => <MemberCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
