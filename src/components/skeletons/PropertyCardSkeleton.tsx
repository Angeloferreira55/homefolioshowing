import { Skeleton } from '@/components/ui/skeleton';

interface PropertyCardSkeletonProps {
  count?: number;
  variant?: 'admin' | 'public';
}

export function PropertyCardSkeleton({ count = 3, variant = 'admin' }: PropertyCardSkeletonProps) {
  if (variant === 'public') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl overflow-hidden card-elevated">
            {/* Image skeleton */}
            <Skeleton className="aspect-[16/10] w-full" />
            
            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-10 rounded-md" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
              
              {/* Address */}
              <div className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 mt-0.5" />
                <Skeleton className="h-5 w-64" />
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
              
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Admin variant
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl p-4 card-elevated"
        >
          <div className="flex gap-4">
            {/* Image placeholder */}
            <Skeleton className="w-20 h-20 sm:w-28 sm:h-20 rounded-lg flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PropertyCardSkeleton;
