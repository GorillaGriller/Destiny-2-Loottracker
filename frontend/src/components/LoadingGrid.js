import { Skeleton } from "@/components/ui/skeleton";

export const LoadingGrid = ({ count = 10, square = true }) => (
  <div data-testid="loading-skeleton" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-2">
        <Skeleton className={`w-full ${square ? "aspect-square" : "h-32"} rounded-lg bg-white/5`} />
        <Skeleton className="mt-2 h-4 w-3/4 bg-white/5" />
        <Skeleton className="mt-1.5 h-3 w-1/2 bg-white/5" />
      </div>
    ))}
  </div>
);
