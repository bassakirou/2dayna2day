import { Skeleton } from "../Skeleton";

export function OrderSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
        <div className="space-y-2">
          {/* Order ID & Status */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          {/* Date */}
          <Skeleton className="h-4 w-40" />
        </div>
        {/* Price & Action */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            {/* Product Image */}
            <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
            
            {/* Product Details */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 max-w-[300px]" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Product Price */}
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
