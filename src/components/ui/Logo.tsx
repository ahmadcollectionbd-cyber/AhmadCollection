import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  const img = (
    <img
      src="/logo.png"
      alt="Ahmad Collection"
      className={variant === 'mark' ? 'h-9 w-9 shrink-0 rounded-lg object-contain' : 'h-10 w-auto shrink-0 object-contain sm:h-11'}
      loading="eager"
      decoding="async"
    />
  );

  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="Ahmad Collection home">
      {img}
    </Link>
  );
}
