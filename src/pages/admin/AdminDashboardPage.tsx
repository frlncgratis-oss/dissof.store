import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  ShoppingBag, 
  Layers, 
  Wand2, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  MessageCircle,
  ExternalLink,
  CreditCard,
  Eye,
  Palette,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  BarChart3,
  Filter,
  RefreshCw,
  Info,
  Check,
  ChevronDown,
  Bell,
  Volume2,
  Radio,
  ShieldCheck,
  X,
  Smartphone,
  Share2,
  PlusSquare,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { 
  formatIDR, 
  formatDate, 
  formatFullDateTime, 
  isSameDay, 
  isSameMonth, 
  getMonthName, 
  INDONESIAN_MONTHS, 
  createWhatsAppLink,
  playNotificationChime,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  isBrowserNotificationSupported,
  isIOS,
  isSafari,
  isStandalonePWA,
  unlockAudioOnUserInteraction
} from '../../lib/utils';
import { Order } from '../../types';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigateTab }) => {
  const { settings, products, categories, orders, updateOrderStatusLocal, isOnlineSynced } = useStore();

  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  // Platform detection
  const isIOSDevice = useMemo(() => isIOS(), []);
  const isPWAMode = useMemo(() => isStandalonePWA(), []);

  // Browser push notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string>('');

  // Clock state that refreshes every 30 seconds for live 24h reset & time tracking
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Check and update notification permission on focus
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // If permission is default, ask for permission so Admin gets notified
      if (Notification.permission === 'default') {
        requestBrowserNotificationPermission().then((perm) => {
          setNotificationPermission(perm);
        });
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    unlockAudioOnUserInteraction();
    playNotificationChime(true);
    
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendBrowserNotification('🎉 Notifikasi Pesanan DISSOF Aktif!', {
        body: 'HP / Laptop Admin akan berbunyi dan memunculkan pop-up setiap pembeli menyelesaikan checkout.',
      });
      setTestNotificationFeedback('Izin notifikasi sistem berhasil diaktifkan ♡');
      setTimeout(() => setTestNotificationFeedback(''), 4000);
    } else if (perm === 'denied') {
      setTestNotificationFeedback(
        isIOSDevice && !isPWAMode
          ? 'Di Safari iPhone, tambahkan web ke Layar Utama (Add to Home Screen) terlebih dahulu untuk mengizinkan push notification.'
          : 'Izin diblokir di browser. Mohon izinkan via pengaturan browser / ikon gembok di address bar.'
      );
      setTimeout(() => setTestNotificationFeedback(''), 5500);
    }
  };

  const handleTestNotification = () => {
    unlockAudioOnUserInteraction();
    playNotificationChime(true);

    const demoOrder: Order = {
      id: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: 'Nabila Putri Zahra (Uji Coba)',
      customer_whatsapp: '081234567890',
      customer_address: 'Jl. Jenderal Sudirman No. 12, Dumai',
      items: [
        {
          product_id: 'prod-demo-1',
          product_name: 'Strawberry Dream Bracelet',
          price: 45000,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=200&auto=format&fit=crop&q=80',
        },
      ],
      subtotal: 90000,
      shipping_fee: 0,
      total: 90000,
      source: 'online',
      payment_method: 'bank_transfer',
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Trigger in-app banner immediately
    window.dispatchEvent(new CustomEvent('dissof_new_order', { detail: demoOrder }));

    if (isBrowserNotificationSupported() && Notification.permission === 'granted') {
      sendBrowserNotification('🛍️ [Uji Coba] Pesanan Baru Masuk!', {
        body: 'Nabila Putri Zahra • Rp 90.000 (2x Strawberry Dream Bracelet)',
        onClick: () => {
          onNavigateTab('orders');
        }
      });
      setTestNotificationFeedback('Suara chime berbunyi & banner pop-up terkirim ♡');
    } else {
      setTestNotificationFeedback('Suara chime berbunyi keras & banner pop-up in-app muncul di layar!');
    }
    setTimeout(() => setTestNotificationFeedback(''), 4500);
  };

  // Selected Month & Year filter for Monthly Revenue Analytics
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());

  // Chart view mode: 'month' (Full calendar month) | 'last7' (7 Hari Terakhir) | 'last30' (30 Hari Terakhir)
  const [chartViewMode, setChartViewMode] = useState<'month' | 'last7' | 'last30'>('month');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Toggle to optionally preview gross revenue including Pending orders
  const [includePending, setIncludePending] = useState<boolean>(false);

  // Calculate base counts
  const totalProductsCount = products.length;
  const totalCategoriesCount = categories.length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= 3).length;

  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const processingOrders = orders.filter((o) => o.status === 'Processing').length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;

  // Filter helper: determines if an order contributes to revenue based on status
  const isValidRevenueOrder = (o: Order) => {
    if (includePending) {
      return o.status === 'Processing' || o.status === 'Completed' || o.status === 'Pending';
    }
    return o.status === 'Processing' || o.status === 'Completed';
  };

  // Lifetime Revenue
  const lifetimeRevenue = useMemo(() => {
    return orders
      .filter(isValidRevenueOrder)
      .reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [orders, includePending]);

  // ==========================================
  // 1. PERHITUNGAN OMSET HARIAN (RESET PER 24 JAM)
  // ==========================================
  const todayDate = currentTime;
  const yesterdayDate = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

  // Orders created today (00:00 - 23:59)
  const todayOrders = useMemo(() => {
    return orders.filter((o) => {
      try {
        const orderDate = new Date(o.created_at);
        return isSameDay(orderDate, todayDate);
      } catch {
        return false;
      }
    });
  }, [orders, todayDate]);

  const todayValidOrders = useMemo(() => {
    return todayOrders.filter(isValidRevenueOrder);
  }, [todayOrders, includePending]);

  const todayRevenue = useMemo(() => {
    return todayValidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [todayValidOrders]);

  // Orders created yesterday
  const yesterdayOrders = useMemo(() => {
    return orders.filter((o) => {
      try {
        const orderDate = new Date(o.created_at);
        return isSameDay(orderDate, yesterdayDate);
      } catch {
        return false;
      }
    });
  }, [orders, yesterdayDate]);

  const yesterdayValidOrders = useMemo(() => {
    return yesterdayOrders.filter(isValidRevenueOrder);
  }, [yesterdayOrders, includePending]);

  const yesterdayRevenue = useMemo(() => {
    return yesterdayValidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [yesterdayValidOrders]);

  // Comparison: Today vs Yesterday
  const dailyDiffAmount = todayRevenue - yesterdayRevenue;
  const dailyDiffPercentage = useMemo(() => {
    if (yesterdayRevenue === 0) {
      return todayRevenue > 0 ? 100 : 0;
    }
    return Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
  }, [todayRevenue, yesterdayRevenue]);

  // Time remaining until 24-hour midnight reset (00:00:00)
  const timeUntilReset = useMemo(() => {
    const hours = 23 - currentTime.getHours();
    const minutes = 59 - currentTime.getMinutes();
    return `${hours} jam ${minutes} mnt`;
  }, [currentTime]);

  // ==========================================
  // 2. PERHITUNGAN OMSET BULANAN
  // ==========================================
  // Generate list of available months from orders + past 6 months
  const availableMonthOptions = useMemo(() => {
    const optionsMap = new Map<string, { year: number; month: number; label: string }>();

    // Current month
    const curYear = currentTime.getFullYear();
    const curMonth = currentTime.getMonth();
    optionsMap.set(`${curYear}-${curMonth}`, {
      year: curYear,
      month: curMonth,
      label: `${getMonthName(curMonth)} ${curYear} (Bulan Ini)`,
    });

    // Past 11 months
    for (let i = 1; i <= 11; i++) {
      const d = new Date(curYear, curMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      optionsMap.set(`${y}-${m}`, {
        year: y,
        month: m,
        label: `${getMonthName(m)} ${y}`,
      });
    }

    // Include any months from stored orders
    orders.forEach((o) => {
      try {
        const d = new Date(o.created_at);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${m}`;
        if (!optionsMap.has(key)) {
          optionsMap.set(key, {
            year: y,
            month: m,
            label: `${getMonthName(m)} ${y}`,
          });
        }
      } catch {
        // ignore
      }
    });

    return Array.from(optionsMap.values());
  }, [orders, currentTime]);

  // Orders for selected month
  const monthlyOrders = useMemo(() => {
    return orders.filter((o) => {
      try {
        const d = new Date(o.created_at);
        return isSameMonth(d, selectedYear, selectedMonth);
      } catch {
        return false;
      }
    });
  }, [orders, selectedYear, selectedMonth]);

  const monthlyValidOrders = useMemo(() => {
    return monthlyOrders.filter(isValidRevenueOrder);
  }, [monthlyOrders, includePending]);

  const monthlyRevenue = useMemo(() => {
    return monthlyValidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [monthlyValidOrders]);

  const monthlyAverageOrderValue = useMemo(() => {
    return monthlyValidOrders.length > 0 ? Math.round(monthlyRevenue / monthlyValidOrders.length) : 0;
  }, [monthlyRevenue, monthlyValidOrders]);

  // ==========================================
  // 3. GRAFIK & BREAKDOWN HARIAN BULANAN
  // ==========================================
  const dailyChartData = useMemo(() => {
    if (chartViewMode === 'last7') {
      // 7 Days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(currentTime.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter((o) => {
          try {
            return isSameDay(new Date(o.created_at), d) && isValidRevenueOrder(o);
          } catch {
            return false;
          }
        });
        const rev = dayOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
        days.push({
          date: d,
          dayNumber: d.getDate(),
          label: `${d.getDate()} ${getMonthName(d.getMonth()).slice(0, 3)}`,
          revenue: rev,
          orderCount: dayOrders.length,
          isToday: isSameDay(d, currentTime),
        });
      }
      return days;
    }

    if (chartViewMode === 'last30') {
      // 30 Days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(currentTime.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter((o) => {
          try {
            return isSameDay(new Date(o.created_at), d) && isValidRevenueOrder(o);
          } catch {
            return false;
          }
        });
        const rev = dayOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
        days.push({
          date: d,
          dayNumber: d.getDate(),
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          revenue: rev,
          orderCount: dayOrders.length,
          isToday: isSameDay(d, currentTime),
        });
      }
      return days;
    }

    // Default: Selected Month Calendar days
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(selectedYear, selectedMonth, day);
      const dayOrders = monthlyValidOrders.filter((o) => {
        try {
          return new Date(o.created_at).getDate() === day;
        } catch {
          return false;
        }
      });
      const rev = dayOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      days.push({
        date: d,
        dayNumber: day,
        label: `${day}`,
        revenue: rev,
        orderCount: dayOrders.length,
        isToday: isSameDay(d, currentTime),
      });
    }

    return days;
  }, [chartViewMode, selectedYear, selectedMonth, monthlyValidOrders, orders, currentTime, includePending]);

  // Max revenue in chart for proportional bar heights
  const maxChartRevenue = useMemo(() => {
    const max = Math.max(...dailyChartData.map((d) => d.revenue), 0);
    return max > 0 ? max : 100000;
  }, [dailyChartData]);

  // Peak sales day in the selected month
  const peakSalesDay = useMemo(() => {
    const validWithRevenue = dailyChartData.filter((d) => d.revenue > 0);
    if (validWithRevenue.length === 0) return null;
    return validWithRevenue.reduce((prev, current) => (prev.revenue > current.revenue ? prev : current), validWithRevenue[0]);
  }, [dailyChartData]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const bankQris = orders.filter((o) => o.payment_method === 'bank_transfer' || o.payment_method === 'qris').length;
    const wa = orders.filter((o) => o.payment_method === 'whatsapp' || !o.payment_method).length;
    return { bankQris, wa };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-pink-500 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
              Editorial Analytics & Omset
            </span>
            <span className="text-[11px] font-medium text-[#8C7D75] flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-400" />
              <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
            </span>
          </div>

          <h1 className="font-playfair text-3xl font-bold text-[#2D2D2D] mt-1">
            Dashboard & Laporan Omset {settings?.brand_name || 'DISSOF.ID'} ♡
          </h1>
          <p className="text-xs text-[#7A6A61] mt-0.5 font-medium">
            Perhitungan omset harian (reset per 24 jam), rekap bulanan, status transaksi, dan performa aksesoris handmade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('branding')}
            className="px-4 py-2.5 rounded-full bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-pink-500" />
            <span>Branding & Tampilan</span>
          </button>

          <button
            onClick={() => onNavigateTab('categories')}
            className="px-4 py-2.5 rounded-full bg-white border border-pink-200 hover:bg-pink-50 text-pink-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-pink-500" />
            <span>Kelola Kategori</span>
          </button>

          <button
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-pink-300" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Real-time Firestore Sync & Push Notification Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-200/40 via-rose-100/20 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-200">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#2D2D2D]">
                  Sinkronisasi Pesanan Real-Time (Cloud Firestore)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live onSnapshot Aktif</span>
                </span>
                {isPWAMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full">
                    <Smartphone className="w-3 h-3 text-pink-500" />
                    <span>Mode PWA / Home Screen Aktif</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6A61] leading-relaxed max-w-2xl">
                Pesanan baru yang dibuat oleh pembeli di HP manapun otomatis langsung masuk ke layar Admin secara instan tanpa perlu refresh.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-200 hover:shadow-lg hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Aktifkan Notifikasi Pop-up</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Notifikasi Pop-up Aktif</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-pink-200 hover:bg-pink-100/70 text-pink-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Uji coba suara lonceng chime keras dan banner pop-up real-time"
            >
              <Volume2 className="w-4 h-4 text-pink-500" />
              <span>Tes Suara &amp; Pop-up</span>
            </button>
          </div>
        </div>

        {/* 1. iOS Safari Special Guidance Card (Shows on iPhone/iPad in Safari browser) */}
        {isIOSDevice && !isPWAMode && (
          <div className="bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-pink-50/90 border-2 border-amber-200/90 rounded-2xl p-4 text-[#3D312A] shadow-xs relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Petunjuk Notifikasi iPhone (iOS Safari)
                    </span>
                    <span className="text-[10px] bg-amber-200/70 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                      iOS Safari Tips
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#3D312A] leading-relaxed">
                    Untuk mengaktifkan notifikasi di iPhone, tekan tombol Share (kotak panah ke atas) lalu pilih &apos;Tambahkan ke Layar Utama&apos;.
                  </p>
                  <p className="text-[11px] text-[#6E5A4E]">
                    Apple iOS Safari mewajibkan web dipasang ke Layar Utama (Home Screen) agar izin notifikasi sistem dapat diaktifkan tanpa diblokir oleh iOS.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowIOSModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Lihat Panduan Bergambar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Alternative Audio & In-App Alert Guarantee (Always Active for All Devices) */}
        <div className="bg-[#FAF7F2] border border-pink-200/70 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
                <span>Alternative Audio &amp; In-App Alert Selalu Aktif</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded-full">
                  100% Proteksi
                </span>
              </span>
              <p className="text-[11px] text-[#7A6A61] mt-0.5">
                Bahkan jika izin notifikasi sistem iPhone tidak diberikan atau dinonaktifkan, dashboard <strong>TETAP membunyikan bel chime 4-nada keras</strong> dan <strong>menampilkan banner pop-up interaktif langsung di layar web</strong> setiap ada pesanan masuk dari Firestore.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestNotification}
            className="text-[11px] font-bold text-pink-600 hover:text-pink-700 hover:underline shrink-0 flex items-center gap-1 self-end sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-pink-500" />
            <span>Coba Alert Sekarang</span>
          </button>
        </div>

        {testNotificationFeedback && (
          <div className="pt-2 border-t border-pink-100/70 flex items-center gap-2 text-xs font-bold text-pink-600 animate-in fade-in duration-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0" />
            <span>{testNotificationFeedback}</span>
          </div>
        )}
      </div>

      {/* Revenue Calculation Settings Bar / Notice */}
      <div className="bg-gradient-to-r from-pink-50/90 via-rose-50/70 to-pink-50/90 border border-pink-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
              <span>Sistem Perhitungan Omset Terverifikasi</span>
              <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-2 py-0.2 rounded-full border border-pink-200">
                Diproses & Selesai
              </span>
            </h3>
            <p className="text-[11px] text-[#7A6A61] mt-0.5">
              Omset dihitung akurat dari pesanan berstatus <strong className="text-[#2D2D2D]">Diproses</strong> &amp; <strong className="text-[#2D2D2D]">Selesai</strong>. Omset harian otomatis ter-reset setiap pukul <strong className="text-pink-600">00:00 (interval 24 jam)</strong>.
            </p>
          </div>
        </div>

        {/* Toggle include Pending */}
        <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-1.5 rounded-xl border border-pink-200 shadow-2xs self-start md:self-auto hover:bg-pink-50/50 transition-colors">
          <input
            type="checkbox"
            checked={includePending}
            onChange={(e) => setIncludePending(e.target.checked)}
            className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-400 cursor-pointer"
          />
          <span className="text-xs font-bold text-[#2D2D2D] select-none">
            Sertakan Pesanan Pending (Estimasi Kotor)
          </span>
        </label>
      </div>

      {/* ==========================================
          MAIN METRIC CARDS (HARIAN, BULANAN, ALL-TIME, PENDING)
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. OMSET HARI INI (RESET PER 24 JAM) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3 relative overflow-hidden group hover:border-pink-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-100/50 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block">
                24 Jam Terkini
              </span>
              <h3 className="text-xs font-bold text-[#7A6A61] uppercase tracking-wider">
                Omset Hari Ini
              </h3>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2D2D2D] font-playfair tracking-tight">
              {formatIDR(todayRevenue)}
            </p>
            <p className="text-[11px] text-[#7A6A61] mt-0.5">
              {todayValidOrders.length} transaksi valid hari ini
            </p>
          </div>

          {/* Comparison with Yesterday */}
          <div className="pt-2 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {dailyDiffAmount > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{dailyDiffPercentage}%</span>
                </span>
              ) : dailyDiffAmount < 0 ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>{dailyDiffPercentage}%</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Minus className="w-3 h-3" />
                  <span>Stabil</span>
                </span>
              )}
              <span className="text-[10px] text-[#8C7D75]">
                vs Kemarin ({formatIDR(yesterdayRevenue)})
              </span>
            </div>
          </div>

          {/* Auto Reset Timer Indicator */}
          <div className="bg-[#FAF8F5] p-2 rounded-xl border border-pink-100/60 flex items-center justify-between text-[10px] text-[#7A6A61]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-500" />
              <span>Reset 00:00:</span>
            </span>
            <span className="font-mono font-bold text-pink-700">
              {timeUntilReset}
            </span>
          </div>
        </div>

        {/* 2. OMSET BULAN INI / TERPILIH */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3 relative overflow-hidden group hover:border-pink-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block">
                Rekap Kalender
              </span>
              <h3 className="text-xs font-bold text-[#7A6A61] uppercase tracking-wider">
                Omset {getMonthName(selectedMonth)} {selectedYear}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2D2D2D] font-playfair tracking-tight">
              {formatIDR(monthlyRevenue)}
            </p>
            <p className="text-[11px] text-[#7A6A61] mt-0.5">
              {monthlyValidOrders.length} transaksi valid bulan ini
            </p>
          </div>

          {/* Monthly AOV (Average Order Value) */}
          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
            <span className="text-[#8C7D75]">Rata-rata / order (AOV):</span>
            <span className="font-bold text-[#2D2D2D] font-mono">
              {formatIDR(monthlyAverageOrderValue)}
            </span>
          </div>

          {/* Peak Day in Month */}
          <div className="bg-[#FAF8F5] p-2 rounded-xl border border-pink-100/60 flex items-center justify-between text-[10px] text-[#7A6A61]">
            <span>Penjualan Tertinggi:</span>
            <span className="font-bold text-[#2D2D2D]">
              {peakSalesDay ? `Tgl ${peakSalesDay.dayNumber} (${formatIDR(peakSalesDay.revenue)})` : 'Belum ada'}
            </span>
          </div>
        </div>

        {/* 3. TOTAL OMSET AKUMULASI (ALL-TIME) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3 relative overflow-hidden group hover:border-pink-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block">
                Total Akumulasi
              </span>
              <h3 className="text-xs font-bold text-[#7A6A61] uppercase tracking-wider">
                Omset Keseluruhan
              </h3>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2D2D2D] font-playfair tracking-tight">
              {formatIDR(lifetimeRevenue)}
            </p>
            <p className="text-[11px] text-[#7A6A61] mt-0.5">
              Dari {orders.length} total pesanan tercatat
            </p>
          </div>

          {/* Payment Method Distribution */}
          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
            <span className="text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full font-bold">
              {paymentBreakdown.bankQris} Bank/QRIS
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              {paymentBreakdown.wa} WhatsApp
            </span>
          </div>

          <div className="bg-[#FAF8F5] p-2 rounded-xl border border-pink-100/60 flex items-center justify-between text-[10px] text-[#7A6A61]">
            <span>Produk Terdaftar:</span>
            <span className="font-bold text-[#2D2D2D]">
              {totalProductsCount} Item ({totalCategoriesCount} Kategori)
            </span>
          </div>
        </div>

        {/* 4. PESANAN PENDING & STATUS CHECK */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3 relative overflow-hidden group hover:border-pink-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
                Perlu Verifikasi
              </span>
              <h3 className="text-xs font-bold text-[#7A6A61] uppercase tracking-wider">
                Pesanan Pending
              </h3>
            </div>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xs ${pendingOrders > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2D2D2D] font-playfair tracking-tight">
              {pendingOrders}
            </p>
            <p className="text-[11px] text-[#7A6A61] mt-0.5">
              {pendingOrders > 0 ? 'Menunggu konfirmasi admin' : 'Semua pesanan terproses'}
            </p>
          </div>

          {/* Quick status counters */}
          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
            <span className="text-blue-700 font-bold">
              {processingOrders} Diproses
            </span>
            <span className="text-emerald-700 font-bold">
              {completedOrders} Selesai
            </span>
            <span className="text-rose-700 font-bold">
              {cancelledOrders} Dibatalkan
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="w-full py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition-all border border-pink-200 cursor-pointer text-center block"
          >
            {pendingOrders > 0 ? 'Verifikasi Pesanan Sekarang →' : 'Buka Halaman Pesanan →'}
          </button>
        </div>

      </div>

      {/* ==========================================
          GRAFIK OMSET & FILTER PILIHAN BULAN
          ========================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs space-y-6">
        
        {/* Header Grafik & Month Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-pink-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="font-playfair text-xl font-bold text-[#2D2D2D]">
                Grafik & Laporan Penjualan Harian
              </h2>
            </div>
            <p className="text-xs text-[#7A6A61] mt-0.5">
              Visualisasi grafik batang omset penjualan per tanggal. Sorot batang grafik untuk melihat rincian detail.
            </p>
          </div>

          {/* Controls: Month Dropdown & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* Month Filter Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setSelectedYear(y);
                  setSelectedMonth(m);
                  setChartViewMode('month');
                }}
                className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-[#FAF8F5] border border-pink-200 text-xs font-bold text-[#2D2D2D] hover:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer shadow-2xs"
              >
                {availableMonthOptions.map((opt) => (
                  <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                    📅 {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-pink-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick View Mode Switcher */}
            <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-pink-100 shadow-2xs">
              <button
                type="button"
                onClick={() => setChartViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'month'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-[#7A6A61] hover:text-[#2D2D2D]'
                }`}
              >
                Bulan Terpilih
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('last7')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'last7'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-[#7A6A61] hover:text-[#2D2D2D]'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('last30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'last30'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-[#7A6A61] hover:text-[#2D2D2D]'
                }`}
              >
                30 Hari
              </button>
            </div>

          </div>
        </div>

        {/* Highlight Summary Stats for Current Chart View */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-4 rounded-2xl border border-pink-100">
          <div>
            <span className="text-[10px] font-bold text-[#8C7D75] uppercase block">Total Omset Periode:</span>
            <span className="text-base sm:text-lg font-bold text-pink-600 font-playfair">
              {formatIDR(dailyChartData.reduce((acc, curr) => acc + curr.revenue, 0))}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#8C7D75] uppercase block">Total Transaksi:</span>
            <span className="text-base sm:text-lg font-bold text-[#2D2D2D]">
              {dailyChartData.reduce((acc, curr) => acc + curr.orderCount, 0)} Pesanan
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#8C7D75] uppercase block">Hari Tertinggi:</span>
            <span className="text-base sm:text-lg font-bold text-[#2D2D2D]">
              {peakSalesDay ? `${peakSalesDay.label} (${formatIDR(peakSalesDay.revenue)})` : '-'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#8C7D75] uppercase block">Rata-rata / Hari:</span>
            <span className="text-base sm:text-lg font-bold text-[#2D2D2D] font-mono">
              {formatIDR(
                Math.round(
                  dailyChartData.reduce((acc, curr) => acc + curr.revenue, 0) / (dailyChartData.length || 1)
                )
              )}
            </span>
          </div>
        </div>

        {/* Visual Bar Chart Component */}
        <div className="space-y-4 pt-2">
          {/* Chart Y-Axis Scale Indicators */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8C7D75] border-b border-pink-100 pb-1">
            <span>Maks: {formatIDR(maxChartRevenue)}</span>
            <span>Tengah: {formatIDR(Math.round(maxChartRevenue / 2))}</span>
            <span>Rp 0</span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 sm:h-64 flex items-end gap-1 sm:gap-2 px-1 pt-6 pb-2 relative overflow-x-auto">
            {dailyChartData.map((item, idx) => {
              const heightPercent = maxChartRevenue > 0 ? Math.max((item.revenue / maxChartRevenue) * 100, 3) : 3;
              const isPeak = peakSalesDay && peakSalesDay.dayNumber === item.dayNumber && peakSalesDay.revenue > 0;
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  className="flex-1 min-w-[14px] sm:min-w-[20px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip Card on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-30 bg-[#2D2D2D] text-white p-3 rounded-2xl shadow-xl text-left pointer-events-none min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1.5">
                        <span className="text-[10px] text-pink-300 font-bold">
                          {formatDate(item.date.toISOString())}
                        </span>
                        {item.isToday && (
                          <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-white font-mono">
                        {formatIDR(item.revenue)}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {item.orderCount} transaksi valid
                      </p>
                      {isPeak && (
                        <span className="inline-block text-[9px] text-amber-300 font-bold mt-1">
                          ★ Hari Penjualan Tertinggi
                        </span>
                      )}
                    </div>
                  )}

                  {/* Top indicator tag for Today or Peak */}
                  {item.isToday && (
                    <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-1 py-0.2 rounded-full mb-1 scale-90 sm:scale-100">
                      Hari Ini
                    </span>
                  )}
                  {isPeak && !item.isToday && (
                    <span className="text-[9px] font-bold text-amber-600 mb-1">
                      ★
                    </span>
                  )}

                  {/* The Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      item.isToday
                        ? 'bg-gradient-to-t from-pink-500 to-rose-400 shadow-md shadow-pink-200'
                        : isPeak
                        ? 'bg-gradient-to-t from-amber-400 to-pink-500 shadow-xs'
                        : item.revenue > 0
                        ? 'bg-pink-300 hover:bg-pink-400'
                        : 'bg-black/5 hover:bg-pink-200'
                    } ${isHovered ? 'ring-2 ring-pink-500 ring-offset-1 scale-y-[1.02]' : ''}`}
                  />

                  {/* X-Axis Label */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono mt-2 transition-colors ${
                      item.isToday 
                        ? 'font-bold text-pink-600 underline' 
                        : isHovered 
                        ? 'text-pink-600 font-bold' 
                        : 'text-[#8C7D75]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#7A6A61] pt-3 border-t border-pink-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 shadow-2xs" />
              <span>Hari Ini (Aktif 24 Jam)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 shadow-2xs" />
              <span>Penjualan Tertinggi (Peak)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-300" />
              <span>Omset Terverifikasi (Diproses / Selesai)</span>
            </div>
          </div>
        </div>

      </div>

      {/* ==========================================
          RECENT ORDERS TABLE WITH LIVE STATUS CHANGER
          ========================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-pink-100 pb-4">
          <div>
            <h3 className="font-playfair text-lg font-bold text-[#2D2D2D]">Pesanan Masuk Terbaru</h3>
            <p className="text-xs text-[#7A6A61]">Daftar transaksi yang langsung tersimpan di LocalStorage</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Kelola Semua Pesanan ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Belum ada pesanan yang masuk di LocalStorage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-pink-100 text-[#8C7D75] uppercase tracking-wider font-bold">
                  <th className="pb-3 px-3">Order ID &amp; Tanggal</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Produk</th>
                  <th className="pb-3 px-3">Total Omset</th>
                  <th className="pb-3 px-3">Metode</th>
                  <th className="pb-3 px-3">Bukti Bayar</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {recentOrders.map((ord) => {
                  const proofSrc = ord.payment_proof || ord.payment_proof_url;
                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-3">
                        <p className="font-mono font-bold text-[#2D2D2D]">#{ord.id}</p>
                        <span className="text-[10px] text-[#8C7D75]">
                          {formatFullDateTime(ord.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-[#2D2D2D]">{ord.customer_name}</p>
                        <span className="text-[10px] text-gray-400 font-mono">{ord.customer_whatsapp}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-[#574941] line-clamp-1 max-w-[200px]">
                          {ord.items.map((it) => `${it.product_name} (${it.quantity}x)`).join(', ')}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-pink-600 font-mono text-sm">
                        {formatIDR(ord.total)}
                      </td>
                      <td className="py-3.5 px-3">
                        {ord.payment_method === 'bank_transfer' ? (
                          <span className="text-[10px] bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                            Transfer Bank
                          </span>
                        ) : ord.payment_method === 'qris' ? (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                            QRIS
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            WhatsApp
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {proofSrc ? (
                          <button
                            type="button"
                            onClick={() => setPreviewProof(proofSrc)}
                            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-emerald-50 border border-emerald-200 cursor-pointer group"
                            title="Klik untuk zoom bukti transfer"
                          >
                            <ImageWithFallback
                              src={proofSrc}
                              alt="Bukti"
                              className="w-8 h-8 rounded object-cover border border-emerald-300"
                            />
                            <span className="text-[10px] font-bold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Tanpa Foto</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatusLocal(ord.id, e.target.value as any)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            ord.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ord.status === 'Processing'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : ord.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing (Hitung Omset)</option>
                          <option value="Completed">Completed (Hitung Omset)</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* iOS Safari Step-by-Step Illustrated Guide Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="max-w-md w-full bg-white rounded-3xl overflow-hidden p-6 space-y-5 shadow-2xl border border-pink-100 cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2D2D2D]">Panduan Notifikasi di iPhone (iOS Safari)</h3>
                  <p className="text-[11px] text-[#7A6A61]">4 Langkah Cepat untuk Mengaktifkan Notifikasi Push</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#3D312A]">
              <div className="p-3.5 bg-pink-50/70 border border-pink-100 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="block text-[#2D2D2D] mb-0.5">Tekan Tombol Share di Safari</strong>
                  <p className="text-[#6E5A4E] text-[11px] leading-relaxed">
                    Di browser Safari iPhone Anda, ketuk tombol <strong>Share / Bagikan</strong> (ikon kotak dengan panah ke atas <span className="font-mono bg-white px-1 py-0.5 rounded border text-[10px]">⎋</span> di bilah navigasi bawah).
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="block text-[#2D2D2D] mb-0.5">Pilih &apos;Tambahkan ke Layar Utama&apos;</strong>
                  <p className="text-[#6E5A4E] text-[11px] leading-relaxed">
                    Gulir ke bawah pada menu pop-up Safari dan pilih <strong>&apos;Tambahkan ke Layar Utama&apos; (Add to Home Screen)</strong>, lalu ketuk tombol <strong>Tambah</strong> di pojok kanan atas.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="block text-[#2D2D2D] mb-0.5">Buka Aplikasi dari Home Screen iPhone</strong>
                  <p className="text-[#6E5A4E] text-[11px] leading-relaxed">
                    Tutup Safari dan ketuk ikon aplikasi <strong>DISSOF</strong> yang baru saja terpasang di Home Screen iPhone Anda.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <strong className="block text-[#2D2D2D] mb-0.5">Ketuk &apos;Aktifkan Notifikasi Pop-up&apos;</strong>
                  <p className="text-[#6E5A4E] text-[11px] leading-relaxed">
                    Tekan tombol aktifkan notifikasi di dashboard admin. iPhone akan memunculkan izin dan notifikasi push siap berbunyi setiap pesanan masuk!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#8C7D75]">
                Memerlukan iOS 16.4 atau lebih baru
              </span>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Mengerti ♡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal Zoom in Dashboard */}
      {previewProof && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewProof(null)}
        >
          <div className="max-w-xl w-full bg-white rounded-3xl overflow-hidden p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <span className="font-bold text-xs text-[#2D2D2D]">Foto Bukti Pembayaran / Transfer Customer</span>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-[#F9F7F2] rounded-2xl p-2 max-h-[70vh] overflow-auto">
              <ImageWithFallback
                src={previewProof}
                alt="Zoom Bukti Transfer"
                className="w-full h-auto max-h-[65vh] object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="px-4 py-2 rounded-xl bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
