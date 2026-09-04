import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = 'relative overflow-hidden bg-zinc-100 rounded-lg border border-zinc-200/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
  const variantClasses = {
    rectangular: '',
    circular: 'rounded-full',
    text: 'h-4 w-full rounded',
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="relative rounded-[2rem] border border-zinc-100 bg-white/70 backdrop-blur-sm p-4 space-y-4 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="space-y-3">
        {/* Image Placeholder */}
        <div className="relative aspect-[3/4] w-full rounded-[1.5rem] bg-zinc-100 overflow-hidden border border-zinc-100">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="absolute top-3 left-3 w-16 h-5 rounded-full bg-zinc-200/70" />
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-200/70" />
        </div>

        {/* Brand / Tag */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-20 bg-zinc-200/80 rounded-md" />
          <div className="h-3 w-12 bg-zinc-200/60 rounded-md" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4 w-5/6 bg-zinc-200/90 rounded-md" />
          <div className="h-3.5 w-3/5 bg-zinc-200/70 rounded-md" />
        </div>
      </div>

      {/* Price & Action Row */}
      <div className="pt-3 border-t border-zinc-100/80 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="h-5 w-16 bg-zinc-200 rounded-md" />
          <div className="h-3 w-10 bg-zinc-200/50 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-zinc-200/80" />
          <div className="w-16 h-8 rounded-full bg-blue-600/20" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-24 h-24 rounded-2xl bg-zinc-100 p-3 flex flex-col items-center justify-center space-y-2 border border-zinc-200/50">
          <div className="w-10 h-10 rounded-full bg-zinc-200" />
          <div className="w-14 h-3 bg-zinc-200 rounded" />
        </div>
      ))}
    </div>
  );
};

export const NotificationSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 bg-zinc-200 rounded" />
            <div className="h-3 w-3/4 bg-zinc-200/70 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProductSkeleton = ProductCardSkeleton;

export const OrderSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white border border-zinc-100 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
      <div className="flex items-center gap-4 md:gap-6">
        <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" variant="text" />
          <Skeleton className="h-4 w-40" variant="text" />
          <Skeleton className="h-3 w-20" variant="text" />
        </div>
      </div>
      <div className="flex items-center gap-6 md:gap-10">
        <div className="space-y-2">
          <Skeleton className="h-2 w-12" variant="text" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-2 w-12" variant="text" />
          <Skeleton className="h-6 w-24" variant="text" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
