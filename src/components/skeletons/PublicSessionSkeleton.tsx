import { Skeleton } from '@/components/ui/skeleton';

export function PublicSessionSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background safe-area-top safe-area-bottom">
      {/* Header skeleton */}
      <header className="bg-primary py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Skeleton className="w-5 h-5 rounded bg-primary-foreground/20" />
            <Skeleton className="h-5 w-20 sm:w-24 bg-primary-foreground/20" />
          </div>
          <Skeleton className="h-7 sm:h-9 w-48 sm:w-64 bg-primary-foreground/20 mb-2" />
          <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 bg-primary-foreground/20 mb-2" />
          <Skeleton className="h-4 sm:h-5 w-36 sm:w-48 bg-primary-foreground/20" />
        </div>
      </header>

      {/* Agent card skeleton */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-10">
        <div className="bg-card rounded-xl p-4 sm:p-6 card-elevated">
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              <Skeleton className="h-4 w-48 sm:w-56" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-16 sm:w-20 rounded-md" />
                <Skeleton className="h-8 w-16 sm:w-20 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties skeleton */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skeleton className="h-6 sm:h-7 w-28 sm:w-36 mb-5 sm:mb-6" />
        
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl sm:rounded-2xl overflow-hidden card-elevated">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton className="h-6 sm:h-7 w-8 sm:w-10 rounded-md" />
                    <Skeleton className="h-4 w-20 sm:w-28" />
                  </div>
                  <Skeleton className="h-6 sm:h-8 w-24 sm:w-28" />
                </div>
                <Skeleton className="h-5 w-full sm:w-64" />
                <div className="flex items-center gap-3 sm:gap-4">
                  <Skeleton className="h-4 w-10 sm:w-12" />
                  <Skeleton className="h-4 w-10 sm:w-12" />
                  <Skeleton className="h-4 w-16 sm:w-20" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                  <Skeleton className="h-10 sm:h-10 w-full rounded-md" />
                  <Skeleton className="h-10 sm:h-10 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="bg-muted py-4 sm:py-6 mt-6 sm:mt-8">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="h-4 w-32 sm:w-40 mx-auto" />
        </div>
      </footer>
    </div>
  );
}

export default PublicSessionSkeleton;
