'use client';

interface SkeletonProps {
    className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-white/10 rounded ${className}`}
        />
    );
}

// Wine card skeleton
export function WineCardSkeleton() {
    return (
        <div className="glass-card rounded-xl p-4 flex gap-4">
            {/* Image placeholder */}
            <Skeleton className="w-20 h-28 rounded-lg flex-shrink-0" />

            <div className="flex-1 space-y-3">
                {/* Title */}
                <Skeleton className="h-5 w-3/4" />
                {/* Subtitle */}
                <Skeleton className="h-4 w-1/2" />
                {/* Rating */}
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="w-4 h-4 rounded-full" />
                    ))}
                </div>
                {/* Date/location */}
                <Skeleton className="h-3 w-2/5" />
            </div>
        </div>
    );
}

// Wine list skeleton (multiple cards)
export function WineListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <WineCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Stats skeleton
export function StatsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>

            {/* Chart placeholder */}
            <div className="glass-card rounded-xl p-4 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
}

// Full page loading skeleton
export function PageSkeleton() {
    return (
        <div className="min-h-screen pb-24">
            {/* Header skeleton */}
            <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-4 py-4">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Scan button skeleton */}
                <Skeleton className="h-16 w-full rounded-2xl" />

                {/* Tab navigation skeleton */}
                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="flex-1 h-12 rounded-xl" />
                    ))}
                </div>

                {/* Content skeleton */}
                <WineListSkeleton count={4} />
            </div>
        </div>
    );
}
