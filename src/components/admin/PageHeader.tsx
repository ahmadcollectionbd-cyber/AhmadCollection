import type { ReactNode } from 'react';

/**
 * Colorful gradient hero header used across the admin panel. Mirrors the
 * brand styling of the public storefront so admins get the same vibrant
 * feel — soft brand→accent gradient with a tinted icon tile and an
 * optional toolbar slot.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  accent = 'brand',
  actions,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /**
   * Color tone of the icon tile. Defaults to brand (green).
   *  - `brand`   → green
   *  - `accent`  → red
   *  - `amber`   → orders / alerts
   *  - `sky`     → analytics / customers
   *  - `violet`  → settings / admin tools
   */
  accent?: 'brand' | 'accent' | 'amber' | 'sky' | 'violet';
  actions?: ReactNode;
}) {
  const tile =
    accent === 'accent'
      ? 'from-accent-500 to-accent-600 shadow-glow-accent'
      : accent === 'amber'
        ? 'from-amber-500 to-amber-600 shadow-[0_8px_30px_-8px_rgba(217,119,6,0.45)]'
        : accent === 'sky'
          ? 'from-sky-500 to-sky-600 shadow-[0_8px_30px_-8px_rgba(2,132,199,0.45)]'
          : accent === 'violet'
            ? 'from-violet-500 to-violet-600 shadow-[0_8px_30px_-8px_rgba(124,58,237,0.45)]'
            : 'from-brand-500 to-brand-600 shadow-glow-brand';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 sm:p-6">
      {/* Soft brand→accent glow in the background — same palette as the
          home page hero so the admin feels like part of the same site. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tile} text-white sm:h-14 sm:w-14`}
          >
            <span className="text-xl sm:text-2xl">{icon}</span>
          </div>
          <div className="min-w-0">
            <h1 className="heading text-xl font-extrabold sm:text-2xl">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">{actions}</div>
        )}
      </div>
    </div>
  );
}
