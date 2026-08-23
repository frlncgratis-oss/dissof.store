import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Layers,
  Wand2, 
  Calendar, 
  MessageSquareQuote, 
  Settings, 
  CreditCard,
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  ShieldCheck,
  KeyRound,
  Bell,
  Sparkles,
  ArrowRight,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatIDR, playNotificationChime } from '../../lib/utils';

interface AdminLayoutProps {
  currentAdminTab: string;
  setCurrentAdminTab: (tab: string) => void;
  onViewStore: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentAdminTab,
  setCurrentAdminTab,
  onViewStore,
  children,
}) => {
  const { user, logout } = useAuth();
  const { settings, pendingOrdersCount, orders } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null);

  const brandName = settings?.brand_name || 'DISSOF.ID';

  // Listen to incoming order events & cross-tab storage changes
  useEffect(() => {
    let timer: any = null;

    const handleNewOrder = (e: any) => {
      const order = e.detail as Order;
      if (order) {
        // Guarantee loud chime plays on in-app order arrival
        playNotificationChime(true);
        setNewOrderNotification(order);

        // Auto-dismiss after 25 seconds if not clicked
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setNewOrderNotification(null);
        }, 25000);
      }
    };

    const handleOpenOrdersTab = () => {
      setCurrentAdminTab('orders');
    };

    window.addEventListener('dissof_new_order', handleNewOrder);
    window.addEventListener('dissof_open_orders_tab', handleOpenOrdersTab);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('dissof_new_order', handleNewOrder);
      window.removeEventListener('dissof_open_orders_tab', handleOpenOrdersTab);
    };
  }, [setCurrentAdminTab]);

  const menuItems = [
    { id: 'dashboard', label: 'Ringkasan / Stats', icon: LayoutDashboard },
    { id: 'branding', label: 'Pengaturan Toko / Branding', icon: Palette },
    { id: 'categories', label: 'Kelola Kategori', icon: Layers },
    { id: 'products', label: 'Kelola Produk', icon: ShoppingBag },
    { 
      id: 'orders', 
      label: 'Daftar Pesanan', 
      icon: Package, 
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined 
    },
    { id: 'payment-settings', label: 'Pengaturan Pembayaran', icon: CreditCard },
    { id: 'custom-requests', label: 'Custom Requests', icon: Wand2 },
    { id: 'events', label: 'Event & Pop-Up', icon: Calendar },
    { id: 'testimonials', label: 'Testimoni Customer', icon: MessageSquareQuote },
    { id: 'settings', label: 'Pengaturan Website', icon: Settings },
    { id: 'change-password', label: 'Ganti Password', icon: KeyRound },
  ];

  const handleSelectTab = (id: string) => {
    setCurrentAdminTab(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col md:flex-row text-[#3D312A] relative">
      
      {/* Floating In-App New Order Banner Notification (Loud Chime + Real-Time Sync) */}
      {newOrderNotification && (
        <div className="fixed top-4 right-4 z-60 max-w-md w-[calc(100%-2rem)] bg-gradient-to-r from-[#24201D] via-[#2D2D2D] to-[#1E1B18] text-white p-4.5 rounded-3xl shadow-2xl border-2 border-pink-400 animate-in slide-in-from-top-4 duration-300 ring-4 ring-pink-400/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/40 animate-bounce">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-300 bg-pink-900/60 border border-pink-500/40 px-2 py-0.5 rounded-full">
                    Pesanan Baru Masuk! ♡
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h4 className="font-bold text-base text-white tracking-tight">
                  {newOrderNotification.customer_name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-pink-200 font-bold">
                  <span>{formatIDR(newOrderNotification.total)}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-gray-300 text-[11px] font-normal">
                    {newOrderNotification.items?.length || 1} Item
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/10 text-white">
                    {newOrderNotification.payment_method === 'qris' ? 'QRIS' : newOrderNotification.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'WhatsApp'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 line-clamp-1">
                  {newOrderNotification.items?.map(it => `${it.quantity}x ${it.product_name}`).join(', ') || `ID: #${newOrderNotification.id}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setNewOrderNotification(null)}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-pink-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Firestore &amp; Loud Audio Chime</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playNotificationChime(true)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-pink-300 hover:text-white transition-colors cursor-pointer"
                title="Bunyikan suara lonceng lagi"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setNewOrderNotification(null);
                  handleSelectTab('orders');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-pink-500/30 cursor-pointer"
              >
                <span>Periksa Pesanan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top bar */}
      <div className="md:hidden bg-white border-b border-pink-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-xl text-[#6B5E57] hover:bg-pink-50"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-sm text-pink-600">Admin {brandName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {pendingOrdersCount > 0 && (
            <button
              onClick={() => handleSelectTab('orders')}
              className="bg-pink-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs animate-pulse"
            >
              <Package className="w-3 h-3" />
              <span>{pendingOrdersCount} Baru</span>
            </button>
          )}
          <button
            onClick={onViewStore}
            className="text-xs font-bold text-pink-600 flex items-center gap-1 bg-pink-50 px-2.5 py-1 rounded-full"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Web</span>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 inset-y-0 left-0 w-64 bg-white border-r border-pink-100/90 flex flex-col justify-between transition-transform duration-300 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } shadow-lg md:shadow-none h-screen`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onViewStore}>
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold flex items-center justify-center shadow-xs">
                ♡
              </div>
              <div>
                <h2 className="font-playfair font-bold text-base text-[#2E241E]">{brandName}</h2>
                <p className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden text-gray-400 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = currentAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                      : 'text-[#63534B] hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs ${
                        active
                          ? 'bg-white text-pink-600'
                          : 'bg-pink-500 text-white animate-pulse'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Logout */}
        <div className="p-4 border-t border-pink-100 space-y-3 bg-[#FAF7F2]/60 shrink-0">
          <button
            onClick={onViewStore}
            className="w-full py-2 px-3 rounded-xl bg-white border border-pink-200 text-xs font-bold text-pink-700 hover:bg-pink-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Website Customer</span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-[10px] font-bold text-pink-800">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-[#2E241E] truncate max-w-[90px]">{user?.name || 'Admin DISSOF'}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Cloud Firestore</p>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

    </div>
  );
};
