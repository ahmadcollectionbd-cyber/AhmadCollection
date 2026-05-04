import { useLangStore } from '../../stores/langStore';

export function LangToggle() {
  const { lang, setLang } = useLangStore();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200/70 bg-white/70 px-3 text-xs font-semibold text-slate-700 backdrop-blur transition hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-brand-300"
      aria-label="Toggle language"
    >
      <span className={lang === 'en' ? 'text-brand-600 dark:text-brand-300' : ''}>EN</span>
      <span className="text-slate-300">/</span>
      <span className={lang === 'bn' ? 'text-brand-600 dark:text-brand-300 font-bn' : 'font-bn'}>বাং</span>
    </button>
  );
}
