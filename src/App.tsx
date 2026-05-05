import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderTrack } from './pages/OrderTrack';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Wishlist } from './pages/Wishlist';
import { Account } from './pages/Account';
import { NotFound } from './pages/NotFound';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { useAuthBoot } from './stores/authStore';
import { useDataBoot } from './stores/dataStore';
import { useOrderBoot } from './stores/orderStore';
import { useSettingsBoot, useSettingsStore } from './stores/settingsStore';
import { gaPageView, initGA, initPixel, pixelEvent } from './lib/pixel';
import './i18n';

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
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
