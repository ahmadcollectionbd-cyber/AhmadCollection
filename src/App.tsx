import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderTrack } from './pages/OrderTrack';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Wishlist } from './pages/Wishlist';
import { Account } from './pages/Account';
import { NotFound } from './pages/NotFound';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { useAuthBoot } from './stores/authStore';
import { useDataBoot } from './stores/dataStore';
import { useOrderBoot } from './stores/orderStore';
import { useSettingsBoot, useSettingsStore } from './stores/settingsStore';
import { gaPageView, initGA, initPixel, pixelEvent } from './lib/pixel';
import './i18n';

// Heavy / rarely-used routes are lazy-loaded so the main customer-facing
// bundle stays small. Admin routes pull in chart libraries; checkout pulls
// in form/zod machinery — neither is needed for first paint.
const Checkout = lazy(() =>
  import('./pages/Checkout').then((m) => ({ default: m.Checkout })),
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const AdminProducts = lazy(() =>
  import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })),
);
const AdminCategories = lazy(() =>
  import('./pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })),
);
const AdminBanners = lazy(() =>
  import('./pages/admin/AdminBanners').then((m) => ({ default: m.AdminBanners })),
);
const AdminOrders = lazy(() =>
  import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })),
);
const AdminCustomers = lazy(() =>
  import('./pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })),
);
const AdminCoupons = lazy(() =>
  import('./pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })),
);
const AdminAnalytics = lazy(() =>
  import('./pages/admin/AdminAnalytics').then((m) => ({ default: m.AdminAnalytics })),
);
const AdminSettings = lazy(() =>
  import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })),
);

function RouteFallback() {
  return (
    <div className="section flex min-h-[40vh] items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}

function AppBoot() {
  useAuthBoot();
  useSettingsBoot();
  useDataBoot();
  useOrderBoot();

  const settings = useSettingsStore((s) => s.settings);
  const location = useLocation();

  useEffect(() => {
    initPixel(settings.metaPixelId);
    initGA(settings.gaMeasurementId);
  }, [settings.metaPixelId, settings.gaMeasurementId]);

  useEffect(() => {
    pixelEvent('PageView');
    gaPageView();
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppBoot />
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'glass-strong',
            style: { borderRadius: 12, padding: '8px 14px', fontSize: 14 },
          }}
        />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:shortId" element={<OrderConfirmation />} />
              <Route path="/track" element={<OrderTrack />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/account" element={<Account />} />
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/banners" element={<AdminBanners />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
