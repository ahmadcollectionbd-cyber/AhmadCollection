import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingContact } from '../ui/FloatingContact';
import { MobileTabBar } from './MobileTabBar';

export function Layout() {
  const { pathname } = useLocation();
  // The bottom nav bar covers ~64px on mobile — pad the main column so
  // sticky CTAs / footer don't get hidden underneath it. Admin pages
  // don't show the tab bar so they don't need padding.
  const isAdmin = pathname.startsWith('/admin');
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main
        className={`min-h-[calc(100vh-4rem)] animate-fade-in ${
          isAdmin ? '' : 'pb-20 md:pb-0'
        }`}
      >
        <Outlet />
      </main>
      <Footer />
      <FloatingContact />
      <MobileTabBar />
    </div>
  );
}
