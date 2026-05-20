import { FeedPostSkeleton } from '@/components/Skeleton';

export default function AkisLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-5" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <FeedPostSkeleton key={i} />)}
      </div>
    </div>
  );
}
