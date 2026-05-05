import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingContact } from '../ui/FloatingContact';

export function Layout() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] animate-fade-in">
        <Outlet />
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}
