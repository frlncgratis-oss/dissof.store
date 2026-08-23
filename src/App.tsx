import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CustomOrderPage } from './pages/CustomOrderPage';
import { EventsPage } from './pages/EventsPage';
import { AboutPage } from './pages/AboutPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminBrandingPage } from './pages/admin/AdminBrandingPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCustomRequestsPage } from './pages/admin/AdminCustomRequestsPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminTestimonialsPage } from './pages/admin/AdminTestimonialsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminPaymentSettingsPage } from './pages/admin/AdminPaymentSettingsPage';
import { AdminChangePasswordPage } from './pages/admin/AdminChangePasswordPage';
import { Product } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isCartOpen, setIsCartOpen, settings, storeBackground } = useStore();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [shopCategoryFilter, setShopCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Admin sub-tab
  const [currentAdminTab, setCurrentAdminTab] = useState<string>('dashboard');

  // Dynamic Favicon & Title update
  React.useEffect(() => {
    if (settings?.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.favicon_url;
    }
    if (settings?.brand_name) {
      document.title = `${settings.brand_name} - ${settings.tagline || 'everything is heartmade♡'}`;
    }
  }, [settings?.favicon_url, settings?.brand_name, settings?.tagline]);

  // Dynamic Background styling applied to body & website container
  React.useEffect(() => {
    if (!storeBackground || !storeBackground.value) {
      document.body.style.backgroundColor = '#F9F7F2';
      document.body.style.backgroundImage = 'none';
      return;
    }

    if (storeBackground.type === 'image' || (!storeBackground.value.startsWith('#') && !storeBackground.value.startsWith('rgb') && !storeBackground.value.startsWith('hsl'))) {
      document.body.style.backgroundImage = `url("${storeBackground.value}")`;
      document.body.style.backgroundSize = storeBackground.mode === 'repeat' ? 'auto' : 'cover';
      document.body.style.backgroundRepeat = storeBackground.mode === 'repeat' ? 'repeat' : 'no-repeat';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = storeBackground.mode === 'fixed' ? 'fixed' : 'scroll';
      document.body.style.backgroundColor = '#FAF8F5';
    } else {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = storeBackground.value;
    }
  }, [storeBackground]);

  const customBgStyle: React.CSSProperties = React.useMemo(() => {
    if (!storeBackground || !storeBackground.value) {
      return { backgroundColor: '#F9F7F2' };
    }
    if (storeBackground.type === 'image' || (!storeBackground.value.startsWith('#') && !storeBackground.value.startsWith('rgb') && !storeBackground.value.startsWith('hsl'))) {
      return {
        backgroundImage: `url("${storeBackground.value}")`,
        backgroundSize: storeBackground.mode === 'repeat' ? 'auto' : 'cover',
        backgroundRepeat: storeBackground.mode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: storeBackground.mode === 'fixed' ? 'fixed' : 'scroll',
      };
    }
    return { backgroundColor: storeBackground.value };
  }, [storeBackground]);

  const handleNavigate = (tab: string, filterCategory?: string) => {
    if (tab === 'shop' && filterCategory) {
      setShopCategoryFilter(filterCategory);
    } else if (tab === 'shop') {
      setShopCategoryFilter('all');
    }

    if (tab !== 'product-detail') {
      setSelectedProduct(null);
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is in Admin mode
  if (currentTab === 'admin') {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-[#F9F7F2]">
          <AdminLoginPage
            onSuccess={() => {
              setCurrentAdminTab('dashboard');
            }}
            onBackToStore={() => handleNavigate('home')}
          />
        </div>
      );
    }

    return (
      <AdminLayout
        currentAdminTab={currentAdminTab}
        setCurrentAdminTab={setCurrentAdminTab}
        onViewStore={() => handleNavigate('home')}
      >
        {currentAdminTab === 'dashboard' && (
          <AdminDashboardPage onNavigateTab={(tab) => setCurrentAdminTab(tab)} />
        )}
        {currentAdminTab === 'branding' && <AdminBrandingPage />}
        {currentAdminTab === 'categories' && (
          <AdminCategoriesPage onNavigateToProducts={(catId) => setCurrentAdminTab('products')} />
        )}
        {currentAdminTab === 'products' && <AdminProductsPage />}
        {currentAdminTab === 'orders' && <AdminOrdersPage />}
        {currentAdminTab === 'payment-settings' && <AdminPaymentSettingsPage />}
        {currentAdminTab === 'custom-requests' && <AdminCustomRequestsPage />}
        {currentAdminTab === 'events' && <AdminEventsPage />}
        {currentAdminTab === 'testimonials' && <AdminTestimonialsPage />}
        {currentAdminTab === 'settings' && <AdminSettingsPage />}
        {currentAdminTab === 'change-password' && <AdminChangePasswordPage />}
      </AdminLayout>
    );
  }

  // Customer Facing Store
  return (
    <div 
      className="min-h-screen flex flex-col text-[#2D2D2D] selection:bg-[#FFEFF1] selection:text-[#2D2D2D] transition-colors duration-300"
      style={customBgStyle}
    >
      
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentTab === 'shop' && (
          <ShopPage
            initialCategory={shopCategoryFilter}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => handleNavigate('shop')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentTab === 'custom' && <CustomOrderPage />}

        {currentTab === 'events' && <EventsPage />}

        {currentTab === 'about' && <AboutPage onNavigate={handleNavigate} />}

        {currentTab === 'wishlist' && (
          <WishlistPage
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onNavigateToShop={() => handleNavigate('shop')}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <MainApp />
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
