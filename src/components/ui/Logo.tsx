import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  const mark = (
    <svg
      viewBox="0 0 64 64"
      className="h-9 w-9 shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ac-grad-red" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e23a3a" />
          <stop offset="1" stopColor="#a01717" />
        </linearGradient>
        <linearGradient id="ac-grad-green" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#138e57" />
          <stop offset="1" stopColor="#0a3f27" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ac-grad-green)" />
      <path
        d="M19 46 L31 18 L43 46 H35.5 L33.7 41 H28.3 L26.5 46 Z M30 33 L31 30 L32 33 Z"
        fill="url(#ac-grad-red)"
      />
      <path
        d="M14 38 Q32 28 50 38"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="48" cy="20" r="3" fill="#fff" opacity="0.9" />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <Link to="/" className={`inline-flex items-center ${className}`} aria-label="Ahmad Collection home">
        {mark}
      </Link>
    );
  }

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group ${className}`} aria-label="Ahmad Collection home">
      {mark}
      <div className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-extrabold tracking-tight text-brand-700 dark:text-brand-300">
          Ahmad
        </span>
        <span className="font-display text-[0.7rem] font-bold tracking-[0.18em] text-accent-500 -mt-0.5">
          COLLECTION
        </span>
      </div>
    </Link>
  );
}
