export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-bg p-6 text-text animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="h-8 w-64 bg-muted/20 rounded mb-2"></div>
                    <div className="h-4 w-96 bg-muted/20 rounded"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-8 w-32 bg-muted/20 rounded"></div>
                    <div className="h-8 w-24 bg-muted/20 rounded"></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl bg-card p-6 border border-borderc">
                        <div className="h-10 w-10 bg-muted/20 rounded-full mb-4"></div>
                        <div className="h-4 w-24 bg-muted/20 rounded mb-2"></div>
                        <div className="h-8 w-32 bg-muted/20 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-borderc">
                    <div className="h-6 w-48 bg-muted/20 rounded mb-6"></div>
                    <div className="h-64 bg-muted/20 rounded"></div>
                </div>
                <div className="rounded-2xl bg-card p-6 border border-borderc">
                    <div className="h-6 w-48 bg-muted/20 rounded mb-6"></div>
                    <div className="h-48 w-48 bg-muted/20 rounded-full mx-auto"></div>
                </div>
            </div>

            {/* Orders Table Skeleton */}
            <div className="rounded-2xl bg-card border border-borderc">
                <div className="p-6 border-b border-borderc">
                    <div className="h-6 w-48 bg-muted/20 rounded"></div>
                </div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-muted/20 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}
