import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <section className="section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="heading text-6xl font-extrabold text-gradient">404</span>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-4">Back to home</Link>
    </section>
  );
}
