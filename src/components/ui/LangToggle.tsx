import { useLangStore } from '../../stores/langStore';

export function LangToggle() {
  const { lang, setLang } = useLangStore();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      className="inline-flex h-9 items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
      aria-label="Toggle language"
    >
      <span className={lang === 'en' ? 'text-white' : ''}>EN</span>
      <span className="text-white/40">/</span>
      <span className={lang === 'bn' ? 'text-white font-bn' : 'font-bn'}>বাং</span>
    </button>
  );
}
