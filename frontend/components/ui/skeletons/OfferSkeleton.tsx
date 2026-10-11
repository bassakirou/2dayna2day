import { Skeleton } from "../Skeleton";

export function OfferSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto border-2 border-primary/20">
      {/* Header text */}
      <div className="text-center mb-8 space-y-4">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-10 w-3/4 max-w-lg mx-auto" />
        <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50/50 rounded-2xl p-6">
        {/* Product Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <Skeleton className="w-[300px] h-[300px] rounded-2xl" />
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>

          <div className="space-y-3 pt-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
