/**
 * Lightweight skeleton placeholders shown while the realtime catalog
 * watchers are still loading. They keep the layout stable (so the page
 * doesn't jump when data arrives) without ever rendering the bundled
 * sample products on the client — that flash was the main source of
 * "looks unprofessional on reload" feedback.
 */

const shimmer =
  'animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 ' +
  'dark:from-slate-800/60 dark:via-slate-700/60 dark:to-slate-800/60';

export function HeroSkeleton() {
  return (
    <section
      aria-hidden="true"
      className={`relative w-full aspect-square md:aspect-auto md:h-[440px] lg:h-[500px] overflow-hidden ${shimmer}`}
    />
  );
}

export function CategoryRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="section mt-10" aria-hidden="true">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className={`h-6 w-40 rounded-md ${shimmer}`} />
          <div className={`mt-2 h-3 w-32 rounded ${shimmer}`} />
        </div>
        <div className={`h-9 w-24 rounded-full ${shimmer}`} />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex w-32 flex-shrink-0 flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60 sm:w-36"
          >
            <div className={`h-16 w-16 rounded-2xl sm:h-20 sm:w-20 ${shimmer}`} />
            <div className={`mt-3 h-3 w-16 rounded ${shimmer}`} />
            <div className={`mt-2 h-2 w-10 rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/80"
    >
      <div className={`aspect-square w-full ${shimmer}`} />
      <div className="space-y-2 p-3.5 sm:p-4">
        <div className={`h-3 w-16 rounded ${shimmer}`} />
        <div className={`h-4 w-3/4 rounded ${shimmer}`} />
        <div className={`h-5 w-1/2 rounded ${shimmer}`} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={`h-9 rounded-xl ${shimmer}`} />
          <div className={`h-9 rounded-xl ${shimmer}`} />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  title,
  subtitle,
  count = 8,
  withHeader = true,
}: {
  title?: string;
  subtitle?: string;
  count?: number;
  withHeader?: boolean;
}) {
  return (
    <section className="section mt-14" aria-hidden="true">
      {withHeader && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            {title ? (
              <h2 className="heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                {title}
              </h2>
            ) : (
              <div className={`h-6 w-40 rounded-md ${shimmer}`} />
            )}
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : (
              <div className={`mt-2 h-3 w-32 rounded ${shimmer}`} />
            )}
          </div>
          <div className={`h-9 w-24 rounded-full ${shimmer}`} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
