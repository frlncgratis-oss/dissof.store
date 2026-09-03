import React from 'react';

interface ProductSkeletonLoaderProps {
  count?: number;
}

export const ProductSkeletonLoader: React.FC<ProductSkeletonLoaderProps> = ({ count = 4 }) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100/80 p-3 sm:p-3.5 space-y-3 shadow-xs overflow-hidden relative"
        >
          {/* Product Image Skeleton */}
          <div className="w-full aspect-square rounded-xl sm:rounded-2xl skeleton-shimmer-pink relative overflow-hidden">
            <div className="absolute top-2 left-2 w-12 h-5 rounded-full bg-white/70 animate-pulse" />
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/70 animate-pulse" />
          </div>

          {/* Category & Title Skeleton */}
          <div className="space-y-2 pt-1">
            <div className="h-2.5 w-1/3 bg-pink-100/70 rounded-full animate-pulse" />
            <div className="h-4 w-4/5 bg-[#F5EFEB] rounded-full animate-pulse" />
            <div className="h-4 w-3/5 bg-[#F5EFEB] rounded-full animate-pulse" />
          </div>

          {/* Price & Action Skeleton */}
          <div className="pt-2 flex items-center justify-between">
            <div className="h-5 w-20 bg-rose-100/80 rounded-full animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-pink-100/80 animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
};
