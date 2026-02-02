import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';

export function SessionDetailSkeleton() {
  return (
    <AdminLayout>
      <div className="py-4 sm:py-6">
        {/* Back button + Share actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Skeleton className="h-10 w-32 rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>

        {/* Session header */}
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-72" />
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list" disabled>
                <Skeleton className="h-4 w-12" />
              </TabsTrigger>
              <TabsTrigger value="map" disabled>
                <Skeleton className="h-4 w-10" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Skeleton className="h-12 flex-1 sm:flex-initial sm:w-44 rounded-md" />
          <Skeleton className="h-12 flex-1 sm:flex-initial sm:w-40 rounded-md" />
          <Skeleton className="h-12 flex-1 sm:flex-initial sm:w-44 rounded-md" />
        </div>

        {/* Properties list */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 card-elevated"
            >
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 sm:w-28 sm:h-20 rounded-lg flex-shrink-0" />
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
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default SessionDetailSkeleton;
