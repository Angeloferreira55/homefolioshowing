import { Skeleton } from '@/components/ui/skeleton';

export function PublicSessionSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="bg-primary py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 rounded bg-primary-foreground/20" />
            <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
          </div>
          <Skeleton className="h-9 w-64 bg-primary-foreground/20 mb-2" />
          <Skeleton className="h-5 w-40 bg-primary-foreground/20 mb-2" />
          <Skeleton className="h-5 w-48 bg-primary-foreground/20" />
        </div>
      </header>

      {/* Agent card skeleton */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-card rounded-xl p-6 card-elevated">
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties skeleton */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-7 w-36 mb-6" />
        
        <div className="max-w-3xl mx-auto space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden card-elevated">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-10 rounded-md" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
                <Skeleton className="h-5 w-64" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="bg-muted py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </footer>
    </div>
  );
}

export default PublicSessionSkeleton;
