import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { useDataStore } from '../../stores/dataStore';
import { formatBDT, truncate } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const products = useDataStore((s) => s.products);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.nameBn?.toLowerCase().includes(needle) ||
          p.tags?.some((tg) => tg.toLowerCase().includes(needle)),
      )
      .slice(0, 6);
  }, [q, products]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} className={`relative ${compact ? 'w-full' : 'w-full max-w-md'}`}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && q.trim()) {
            navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
            setOpen(false);
          }
        }}
        placeholder={t('common.search')}
        className="input pl-9 pr-9"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Clear"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
          <ul className="max-h-80 overflow-auto py-1">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{truncate(p.name, 50)}</div>
                    <div className="text-xs text-slate-500">{formatBDT(p.price)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
