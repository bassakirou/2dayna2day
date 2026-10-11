import { Skeleton } from "../Skeleton";

export function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 w-full">
          {/* Avatar Skeleton */}
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          
          <div className="w-full max-w-[200px] space-y-2">
            {/* Author Name Skeleton */}
            <Skeleton className="h-4 w-full" />
            {/* Date/Location Skeleton */}
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        
        {/* Stars Skeleton */}
        <div className="flex gap-1 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded-full" />
          ))}
        </div>
      </div>

      {/* Title Skeleton */}
      <Skeleton className="h-6 w-3/4 mb-4" />

      {/* Content Skeleton */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Images Skeleton */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-20 h-20 rounded-xl" />
        ))}
      </div>

      {/* Criteria Skeleton */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 border-t border-gray-50 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="w-3 h-3 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer (Useful / Reply) Skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
