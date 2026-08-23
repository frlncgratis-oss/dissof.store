import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Product, 
  Category, 
  CartItem, 
  SiteSettings, 
  EventItem, 
  Testimonial, 
  PaymentSettings, 
  Order 
} from '../types';
import { 
  formatIDR, 
  createWhatsAppLink, 
  getStoredWhatsAppNumber, 
  setStoredWhatsAppNumber, 
  playNotificationChime,
  sendBrowserNotification,
  requestBrowserNotificationPermission,
  isBrowserNotificationSupported,
  getStoredLogo,
  setStoredLogo,
  removeStoredLogo,
  getStoredHeroBanner,
  setStoredHeroBanner,
  removeStoredHeroBanner,
  getStoredBackground,
  setStoredBackground,
  resetStoredBackground,
  StoreBackgroundData,
  STORE_LOGO_KEY,
  STORE_HERO_BANNER_KEY,
  STORE_BACKGROUND_KEY,
  hardCompressImage,
  safeLocalStorageSet,
  idbSaveAll,
  idbGetAll,
  idbDeleteItem,
  isQuotaExceededError,
  safeString,
  safeTrim,
  safeToLowerCase,
  DISSOF_BRANDING_BACKUP_KEY,
  saveBrandingBackupLocal,
  getBrandingBackupLocal,
  getBrandingBackupMetadata,
  markBrandingBackupSynced
} from '../lib/utils';
import confetti from 'canvas-confetti';

const PRODUCTS_STORAGE_KEY = 'products';
const CATEGORIES_STORAGE_KEY = 'categories';
const PAYMENT_SETTINGS_KEY = 'paymentSettings';
const ORDERS_STORAGE_KEY = 'orders';
const SETTINGS_STORAGE_KEY = 'site_settings';
const WHATSAPP_STORAGE_KEY = 'whatsapp_number';

export const DEFAULT_CATEGORIES: Category[] = [
  { 
    id: 'bracelets', 
    name: 'Charm Bracelets', 
    slug: 'bracelets', 
    description: 'Gelang manik-manik handmade dengan charm lucu & liontin custom',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'phone-charms', 
    name: 'Phone Charms', 
    slug: 'phone-charms', 
    description: 'Gantungan HP estetik dengan manik pastel & mutiara sintetis',
    icon: '📱',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'necklaces', 
    name: 'Beaded Necklaces', 
    slug: 'necklaces', 
    description: 'Kalung manik-manik manis dengan sentuhan daisy & butterfly charm',
    icon: '🌸',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'rings', 
    name: 'Beaded Rings', 
    slug: 'rings', 
    description: 'Cincin manik-manik pastel elastis yang nyaman dipakai',
    icon: '💍',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'keychains', 
    name: 'Keychains & Bag Charms', 
    slug: 'keychains', 
    description: 'Gantungan kunci & tas lucu perpaduan ribbon dan charm gemas',
    icon: '🎀',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'gift-sets', 
    name: 'Gift Sets & Bundles', 
    slug: 'gift-sets', 
    description: 'Paket kado spesial dengan greeting card & premium packaging',
    icon: '🎁',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80'
  },
];

export const DEFAULT_INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Strawberry Dream Charm Bracelet',
    slug: 'strawberry-dream-charm-bracelet',
    category_id: 'bracelets',
    category_name: 'Charm Bracelets',
    price: 35000,
    original_price: 45000,
    stock: 12,
    description: 'Gelang manik-manik pastel kombinasi buah strawberry, mutiara air tawar sintetis, dan charm hati pink manis.',
    details: ['Bahan: Glass beads, faux pearl, acrylic charm', 'Panjang: 16cm + 4cm rantai extender fleksibel', 'Tahan air & tidak mudah luntur'],
    variants: ['Pastel Pink', 'Soft Lilac', 'Strawberry Milk'],
    tags: ['Best Seller', 'Pastel', 'Handmade', 'Viral'],
    images: ['https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=700&auto=format&fit=crop&q=80'],
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    rating: 5,
    review_count: 48,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Custom Initial Daisy Beads Ring',
    slug: 'custom-initial-daisy-beads-ring',
    category_id: 'rings',
    category_name: 'Beaded Rings',
    price: 15000,
    original_price: 20000,
    stock: 25,
    description: 'Cincin manik motif bunga daisy cantik dengan inisial huruf nama kamu sendiri.',
    details: ['Bahan: Manik Jepang MGB & tali elastis jepang super kuat', 'Bisa request inisial A-Z', 'Ukuran all-size jari wanita'],
    variants: ['Letter A-Z (Custom)', 'Daisy Putih', 'Daisy Lavender'],
    tags: ['Custom Name', 'Gift Idea', 'Best Price'],
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&auto=format&fit=crop&q=80'],
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    rating: 5,
    review_count: 62,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Ocean Breeze Pearl Phone Strap',
    slug: 'ocean-breeze-pearl-phone-strap',
    category_id: 'phone-charms',
    category_name: 'Phone Charms',
    price: 45000,
    original_price: 55000,
    stock: 8,
    description: 'Gantungan handphone estetik bernuansa laut dengan mutiara, kerang mutiara, dan manik crystal biru pastel.',
    details: ['Tali strap nilon tebal ekstra kokoh', 'Mencegah HP jatuh saat selfie', 'Panjang total 22cm'],
    variants: ['Sky Blue', 'Aqua Pearl', 'Deep Sea'],
    tags: ['Phone Charm', 'Aesthetic', 'Strap HP'],
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=700&auto=format&fit=crop&q=80'],
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    rating: 5,
    review_count: 34,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Fairy Ribbon Pastel Necklace',
    slug: 'fairy-ribbon-pastel-necklace',
    category_id: 'necklaces',
    category_name: 'Beaded Necklaces',
    price: 55000,
    original_price: 68000,
    stock: 5,
    description: 'Kalung manik fairycore dengan charm pita ribbon logam silver dan gradasi manik lilac & soft pink.',
    details: ['Pengait stainless steel anti karat', 'Panjang 40cm + 5cm extender', 'Kemasan gift bag cantik'],
    variants: ['Silver Ribbon', 'Rose Gold Ribbon'],
    tags: ['Fairycore', 'Necklace', 'Trending'],
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80'],
    is_best_seller: false,
    is_sold_out: false,
    is_visible: true,
    rating: 5,
    review_count: 19,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Cherry Blossom Bag Charm',
    slug: 'cherry-blossom-bag-charm',
    category_id: 'keychains',
    category_name: 'Keychains & Bag Charms',
    price: 38000,
    stock: 14,
    description: 'Gantungan tas manik premium dengan gantungan lobster claw gold dan charm bunga sakura.',
    details: ['Ring gantungan kokoh untuk tas & kunci', 'Charm enamel bunga sakura Jepang'],
    variants: ['Sakura Pink', 'Matcha Mint'],
    tags: ['Bag Charm', 'Keychain', 'Cute'],
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80'],
    is_best_seller: false,
    is_sold_out: false,
    is_visible: true,
    rating: 5,
    review_count: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Sweet Heart DIY Gift Box Set',
    slug: 'sweet-heart-diy-gift-box-set',
    category_id: 'gift-sets',
    category_name: 'Gift Sets & Bundles',
    price: 95000,
    original_price: 120000,
    stock: 6,
    description: 'Set kado spesial berisi 1 gelang charm, 1 kalung mutiara, 1 cincin daisy, bonus greeting card & kotak kado pita estetik.',
    details: ['Free custom kartu ucapan', 'Hardbox pita premium', 'Bisa langsung dikirim ke orang tersayang'],
    variants: ['Pink Valentine Box', 'Lavender Sky Box', 'Pastel Blossom Box'],
    tags: ['Gift Box', 'Hampers', 'Birthday Gift'],
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700&auto=format&fit=crop&q=80'],
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    rating: 5,
    review_count: 57,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const DEFAULT_INITIAL_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Car Free Night Soebrantas Weekend',
    tagline: 'Pop-Up Market & Craft Bazaar',
    location: 'Jl. HR. Soebrantas, Dumai (Area Kuliner & Fashion)',
    date: '2026-08-29',
    time: '19.00 - 23.00 WIB',
    status: 'upcoming',
    poster_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
    gallery_images: [],
    description: 'Kunjungi booth Dissof.id! Dapatkan promo Beli 2 Gratis 1 charm, serta custom bracelet dan beaded ring langsung jadi di tempat ♡',
    booth_number: 'Booth #A12',
    google_maps_url: 'https://maps.google.com/?q=Dumai+Pop+Up+Market',
    created_at: new Date().toISOString(),
  }
];

const SAMPLE_DUMMY_ORDER_IDS = new Set([
  'ORD-89211',
  'ORD-89210',
  'ORD-89209',
  'ORD-89208',
  'ORD-89207',
  'ORD-89206',
  'ORD-89205'
]);

export const isSampleDummyOrderId = (id?: unknown): boolean => {
  const safeId = safeString(id);
  if (!safeId) return false;
  if (SAMPLE_DUMMY_ORDER_IDS.has(safeId)) return true;
  if (safeId.startsWith('ORD-892')) return true;
  return false;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bank_name: 'BCA (Bank Central Asia)',
  account_number: '8280-9912-3456',
  account_holder: 'DISSOF ACCESSORIES DUMAI',
  qris_label: 'QRIS DISSOF.ID (BCA, Mandiri, BRI, BNI, GoPay, DANA, OVO, ShopeePay)',
  qris_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  instructions: '1. Transfer sesuai nominal total belanja ke Rekening / scan QRIS di atas.\n2. Simpan struk / screenshot bukti transfer.\n3. Unggah foto bukti transfer di bawah ini lalu klik tombol "Konfirmasi & Selesaikan Pesanan".',
  is_enabled: true,
  notes: 'Pesanan kamu akan langsung terverifikasi dan diproses oleh pengrajin DISSOF Dumai ♡'
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: 'DISSOF.ID',
  tagline: 'everything is heartmade♡',
  sub_tagline: 'handmade accessories & little treasures',
  instagram: '@dissof.id',
  whatsapp_number: '6282284901234',
  location: 'Dumai, Riau',
  offline_spot: 'Dumai Pop-Up Store / Bazaars',
  offline_schedule: 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)',
  announcement_banner: '✨ FREE GIFT BOX & POUCH UNTUK SETIAP PEMBELIAN ♡ | BISA CUSTOM NAMA & INISIAL',
  about_story: 'DISSOF.ID adalah UMKM handmade accessories lokal dari Dumai yang merangkai manik-manik indah secara manual dengan cinta.',
  footer_text: 'everything is heartmade♡ Crafted with love in Dumai, Indonesia.',
};

interface StoreContextType {
  settings: SiteSettings | null;
  categories: Category[];
  products: Product[];
  orders: Order[];
  events: EventItem[];
  testimonials: Testimonial[];
  paymentSettings: PaymentSettings;
  cart: CartItem[];
  wishlist: string[];
  isCartOpen: boolean;
  isLoading: boolean;
  isOnlineSynced: boolean;
  storeLogo: string | null;
  storeHeroBanner: string | null;
  storeBackground: StoreBackgroundData;
  saveStoreLogo: (logoData: string) => Promise<void>;
  removeStoreLogo: () => Promise<void>;
  saveHeroBanner: (bannerData: string) => Promise<void>;
  removeHeroBanner: () => Promise<void>;
  saveStoreBackground: (bg: StoreBackgroundData) => Promise<void>;
  resetStoreBackground: () => Promise<void>;
  setIsCartOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedVariant?: string, customNote?: string) => void;
  removeFromCart: (productId: string, selectedVariant?: string, customNote?: string) => void;
  updateCartQty: (productId: string, quantity: number, selectedVariant?: string, customNote?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  refreshData: () => Promise<void>;
  saveProductLocal: (productData: Partial<Product>, editingId?: string) => Promise<Product>;
  deleteProductLocal: (productId: string) => Promise<void>;
  saveCategoryLocal: (categoryName: string, categoryData?: Partial<Category>) => Promise<Category>;
  saveFullCategoryLocal: (category: Category) => Promise<Category>;
  deleteCategoryLocal: (categoryId: string) => Promise<void>;
  resetCategoriesToDefault: () => void;
  savePaymentSettings: (newSettings: PaymentSettings) => void;
  saveSettingsLocal: (newSettings: Partial<SiteSettings>) => Promise<SiteSettings>;
  updateWhatsAppNumberLocal: (newNumber: string) => void;
  saveEventLocal: (eventData: Partial<EventItem>, editingId?: string) => Promise<EventItem>;
  deleteEventLocal: (eventId: string) => Promise<void>;
  createOrderLocal: (orderData: {
    customer_name: string;
    customer_whatsapp: string;
    customer_address?: string;
    order_notes?: string;
    payment_method: 'bank_transfer' | 'qris' | 'whatsapp';
    payment_proof?: string;
    payment_proof_url?: string;
  }) => Promise<Order>;
  updateOrderStatusLocal: (orderId: string, status: Order['status']) => Promise<void>;
  deleteOrderLocal: (orderId: string) => Promise<void>;
  cartSubtotal: number;
  cartCount: number;
  pendingOrdersCount: number;
  checkoutViaWhatsApp: (customer: { name: string; phone: string; address?: string; notes?: string }) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnlineSynced, setIsOnlineSynced] = useState<boolean>(true);

  // Settings State
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const backup = getBrandingBackupLocal();
      const storedWA = localStorage.getItem(WHATSAPP_STORAGE_KEY);
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      
      let parsedSettings: any = {};
      if (saved) {
        try {
          parsedSettings = JSON.parse(saved);
        } catch {}
      }

      const mergedData = {
        ...DEFAULT_SETTINGS,
        ...parsedSettings,
        ...(backup || {}),
        logo_url: backup?.logo_url ?? backup?.logoUrl ?? parsedSettings?.logo_url ?? getStoredLogo() ?? DEFAULT_SETTINGS.logo_url,
        hero_banner_url: backup?.hero_banner_url ?? backup?.heroBanner ?? parsedSettings?.hero_banner_url ?? getStoredHeroBanner() ?? DEFAULT_SETTINGS.hero_banner_url,
        popup_banner_image: backup?.popup_banner_image ?? backup?.eventBanner ?? parsedSettings?.popup_banner_image,
        favicon_url: backup?.favicon_url ?? backup?.faviconUrl ?? parsedSettings?.favicon_url,
        whatsapp_number: storedWA || backup?.whatsapp_number || parsedSettings?.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
      };

      return mergedData;
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Categories State
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CATEGORIES;
  });

  // Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_INITIAL_PRODUCTS;
  });

  // Orders State (Starts clean with 0 dummy orders)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((o) => o && !isSampleDummyOrderId(o.id));
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(clean));
          return clean;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettingsState] = useState<PaymentSettings>(() => {
    try {
      const saved = localStorage.getItem(PAYMENT_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PAYMENT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PAYMENT_SETTINGS;
  });

  const [events, setEvents] = useState<EventItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Store Logo, Hero Banner & Background
  const [storeLogo, setStoreLogo] = useState<string | null>(() => getStoredLogo());
  const [storeHeroBanner, setStoreHeroBannerState] = useState<string | null>(() => getStoredHeroBanner());
  const [storeBackground, setStoreBackgroundState] = useState<StoreBackgroundData>(() => getStoredBackground());

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dissof_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dissof_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save Cart and Wishlist to LocalStorage
  useEffect(() => {
    try {
      safeLocalStorageSet('dissof_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      safeLocalStorageSet('dissof_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Ref to track initial Firestore snapshot load so existing orders don't re-trigger notification popups
  const isFirstOrdersSnapshot = React.useRef(true);

  // =========================================================================
  // 1. REAL-TIME FIRESTORE DATABASE LISTENERS (SYNC ACROSS ALL MOBILE & DESKTOP)
  // =========================================================================
  useEffect(() => {
    // A. Listen to Site Settings & Branding (Real-time: supports both settings/store_config and store_settings/general)
    const settingsDocRef = doc(db, 'settings', 'store_config');
    const storeSettingsDocRef = doc(db, 'store_settings', 'general');

    const handleApplySettingsData = (data: Partial<SiteSettings> & Record<string, any>) => {
      // Map potential alternate keys (eventBanner, heroBanner, qrisImage, logoUrl, etc.)
      const normalizedData: Partial<SiteSettings> = {
        ...data,
        logo_url: data.logo_url ?? data.logoUrl ?? data.logo,
        hero_banner_url: data.hero_banner_url ?? data.heroBanner ?? data.heroBannerUrl,
        popup_banner_image: data.popup_banner_image ?? data.eventBanner ?? data.popupBanner ?? data.event_banner,
        favicon_url: data.favicon_url ?? data.favicon,
      };

      setSettings((prev) => ({
        ...prev,
        ...normalizedData,
      }));

      if (normalizedData.logo_url !== undefined) {
        setStoreLogo(normalizedData.logo_url || null);
        setStoredLogo(normalizedData.logo_url || '');
      }
      if (normalizedData.hero_banner_url !== undefined) {
        setStoreHeroBannerState(normalizedData.hero_banner_url || null);
        setStoredHeroBanner(normalizedData.hero_banner_url || '');
      }
      if (normalizedData.background) {
        setStoreBackgroundState(normalizedData.background);
        setStoredBackground(normalizedData.background);
      }
      if (normalizedData.whatsapp_number) {
        setStoredWhatsAppNumber(normalizedData.whatsapp_number);
      }
      
      // If qris image or bank info is in store_settings/general, update payment settings as well
      if (data.qrisImage || data.qris_image || data.bank_name || data.account_number) {
        setPaymentSettingsState((prev) => ({
          ...prev,
          qris_image: data.qrisImage ?? data.qris_image ?? prev.qris_image,
          bank_name: data.bank_name ?? prev.bank_name,
          account_number: data.account_number ?? prev.account_number,
          account_holder: data.account_holder ?? prev.account_holder,
        }));
      }

      safeLocalStorageSet(SETTINGS_STORAGE_KEY, JSON.stringify({ ...data }));
      setIsOnlineSynced(true);
    };

    const unsubSettings = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        handleApplySettingsData(snap.data() as SiteSettings);
      } else {
        // Seed initial settings into Firestore if empty
        const initialBg = getStoredBackground();
        const initialLogo = getStoredLogo();
        const initialBanner = getStoredHeroBanner();
        const initialWA = getStoredWhatsAppNumber() || DEFAULT_SETTINGS.whatsapp_number;
        const seedData: SiteSettings = {
          ...DEFAULT_SETTINGS,
          logo_url: initialLogo || undefined,
          hero_banner_url: initialBanner || undefined,
          background: initialBg,
          whatsapp_number: initialWA,
        };
        setDoc(settingsDocRef, seedData, { merge: true }).catch(console.warn);
      }
    }, (err) => {
      console.warn('Firestore settings listener error (offline cache active):', err);
      // Fallback load from local storage backup if Firestore is blocked by quota
      const backup = getBrandingBackupLocal();
      if (backup) {
        handleApplySettingsData(backup);
      }
    });

    const unsubStoreSettingsGeneral = onSnapshot(storeSettingsDocRef, (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data();
        handleApplySettingsData(remoteData);

        // Check if there is an un-synced local branding backup waiting to be pushed
        const meta = getBrandingBackupMetadata();
        if (meta?.pendingSync && meta.data) {
          // Attempt to sync pending changes to Firestore
          setDoc(storeSettingsDocRef, meta.data, { merge: true })
            .then(() => {
              markBrandingBackupSynced();
              console.log('[BrandingSync] Successfully synchronized offline branding backup to Firestore.');
            })
            .catch((err) => {
              console.warn('[BrandingSync] Quota still exceeded or sync deferred:', err);
            });
        }
      }
    }, (err) => {
      console.warn('Firestore store_settings/general listener info (offline cache active):', err);
      // Fallback load from local storage backup if Firestore is blocked by quota
      const backup = getBrandingBackupLocal();
      if (backup) {
        handleApplySettingsData(backup);
      }
    });

    // B. Listen to Categories (Real-time)
    const categoriesColRef = collection(db, 'categories');
    const unsubCategories = onSnapshot(categoriesColRef, (snap) => {
      if (!snap.empty) {
        const loadedCats: Category[] = [];
        snap.forEach((docSnap) => {
          loadedCats.push({ ...docSnap.data(), id: docSnap.id } as Category);
        });
        setCategories(loadedCats);
        safeLocalStorageSet(CATEGORIES_STORAGE_KEY, JSON.stringify(loadedCats));
        setIsOnlineSynced(true);
      } else {
        // Seed initial categories
        DEFAULT_CATEGORIES.forEach((cat) => {
          setDoc(doc(db, 'categories', cat.id), cat, { merge: true }).catch(console.warn);
        });
      }
    }, (err) => {
      console.warn('Firestore categories listener error:', err);
    });

    // C. Listen to Products (Real-time, Unlimited & Permanent)
    const productsColRef = collection(db, 'products');
    const unsubProducts = onSnapshot(productsColRef, (snap) => {
      if (!snap.empty) {
        const loadedProducts: Product[] = [];
        snap.forEach((docSnap) => {
          const pData = docSnap.data();
          loadedProducts.push({ ...pData, id: docSnap.id } as Product);
        });
        // Sort newest first by created_at
        loadedProducts.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setProducts(loadedProducts);
        safeLocalStorageSet(PRODUCTS_STORAGE_KEY, JSON.stringify(loadedProducts));
        idbSaveAll('products', loadedProducts).catch(() => {});
        setIsOnlineSynced(true);
      } else {
        // Only seed initial default products if collection is completely empty
        DEFAULT_INITIAL_PRODUCTS.forEach((prod) => {
          setDoc(doc(db, 'products', prod.id), prod, { merge: true }).catch(console.warn);
        });
      }
    }, (err) => {
      console.warn('Firestore products listener error:', err);
    });

    // D. Listen to Orders in Real-Time (Firestore Real-time onSnapshot)
    // Synchronizes orders across buyer devices and Admin screen instantly
    const ordersColRef = collection(db, 'orders');
    const unsubOrders = onSnapshot(ordersColRef, (snap) => {
      if (!snap.empty) {
        const loadedOrders: Order[] = [];
        snap.forEach((docSnap) => {
          if (isSampleDummyOrderId(docSnap.id)) {
            // Automatically clean legacy dummy template documents from Firestore
            deleteDoc(doc(db, 'orders', docSnap.id)).catch(() => {});
          } else {
            const data = docSnap.data();
            const proofVal = data.payment_proof || data.payment_proof_url || '';
            loadedOrders.push({
              ...data,
              id: docSnap.id,
              payment_proof: proofVal,
              payment_proof_url: proofVal,
            } as Order);
          }
        });
        // Sort newest first
        loadedOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setOrders(loadedOrders);
        safeLocalStorageSet(ORDERS_STORAGE_KEY, JSON.stringify(loadedOrders));
        setIsOnlineSynced(true);

        // Detect newly added order documents in real-time from buyer checkouts
        if (!isFirstOrdersSnapshot.current) {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added' && !isSampleDummyOrderId(change.doc.id)) {
              const data = change.doc.data();
              const proofVal = data.payment_proof || data.payment_proof_url || '';
              const newOrder = {
                ...data,
                id: change.doc.id,
                payment_proof: proofVal,
                payment_proof_url: proofVal,
              } as Order;
              
              // 1. Play sweet audio chime
              playNotificationChime();

              // 2. Dispatch cross-app custom event
              window.dispatchEvent(new CustomEvent('dissof_new_order', { detail: newOrder }));
              window.dispatchEvent(new Event('dissof_orders_updated'));

              // 3. Trigger Browser Native System Push Notification
              const itemsList = newOrder.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(', ') || 'Item aksesoris handmade';
              sendBrowserNotification(`🔔 Pesanan Baru Masuk: ${newOrder.customer_name} ♡`, {
                body: `ID: #${newOrder.id} • Total: ${formatIDR(newOrder.total)}\nItem: ${itemsList}`,
                tag: `dissof-order-${newOrder.id}`,
                onClick: () => {
                  window.dispatchEvent(new CustomEvent('dissof_open_orders_tab', { detail: newOrder }));
                }
              });
            }
          });
        } else {
          isFirstOrdersSnapshot.current = false;
        }
      } else {
        isFirstOrdersSnapshot.current = false;
        setOrders([]);
        safeLocalStorageSet(ORDERS_STORAGE_KEY, JSON.stringify([]));
      }
    }, (err) => {
      console.warn('Firestore orders listener error:', err);
    });

    // E. Listen to Payment Settings (Real-time)
    const paymentDocRef = doc(db, 'payment_settings', 'main_config');
    const unsubPayment = onSnapshot(paymentDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PaymentSettings;
        setPaymentSettingsState(data);
        safeLocalStorageSet(PAYMENT_SETTINGS_KEY, JSON.stringify(data));
        setIsOnlineSynced(true);
      } else {
        // Seed initial payment settings
        setDoc(paymentDocRef, DEFAULT_PAYMENT_SETTINGS, { merge: true }).catch(console.warn);
      }
    }, (err) => {
      console.warn('Firestore payment listener error:', err);
    });

    // F. Listen to Events (Real-time onSnapshot for Pop-Up Store & Bazaars)
    const eventsColRef = collection(db, 'events');
    const unsubEvents = onSnapshot(eventsColRef, (snap) => {
      if (!snap.empty) {
        const loadedEvents: EventItem[] = [];
        snap.forEach((docSnap) => {
          loadedEvents.push({ ...docSnap.data(), id: docSnap.id } as EventItem);
        });
        // Sort newest event first or by date
        loadedEvents.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setEvents(loadedEvents);
        safeLocalStorageSet('dissof_events', JSON.stringify(loadedEvents));
        setIsOnlineSynced(true);
      } else {
        // Seed initial default events
        DEFAULT_INITIAL_EVENTS.forEach((ev) => {
          setDoc(doc(db, 'events', ev.id), ev, { merge: true }).catch(console.warn);
        });
      }
    }, (err) => {
      console.warn('Firestore events listener error:', err);
    });

    return () => {
      unsubSettings();
      unsubStoreSettingsGeneral();
      unsubCategories();
      unsubProducts();
      unsubOrders();
      unsubPayment();
      unsubEvents();
    };
  }, []);

  // Listen to custom cross-tab events
  useEffect(() => {
    const handleBrandingUpdate = () => {
      setStoreLogo(getStoredLogo());
      setStoreHeroBannerState(getStoredHeroBanner());
      setStoreBackgroundState(getStoredBackground());
    };

    window.addEventListener('dissof_branding_updated', handleBrandingUpdate);
    return () => {
      window.removeEventListener('dissof_branding_updated', handleBrandingUpdate);
    };
  }, []);

  const refreshData = useCallback(async () => {
    // Data is synced real-time via Firestore listeners
  }, []);

  // =========================================================================
  // 2. REAL-TIME MUTATIONS (ONLINE DATABASE FIRST + LOCALSTORAGE FALLBACK)
  // =========================================================================

  // Save Settings & Branding Online
  const saveSettingsLocal = async (newSettings: Partial<SiteSettings>): Promise<SiteSettings> => {
    const updated: SiteSettings = {
      ...settings,
      ...newSettings,
    };

    // Auto-compress any raw base64 images in settings
    try {
      if (updated.logo_url && updated.logo_url.startsWith('data:')) {
        updated.logo_url = await hardCompressImage(updated.logo_url, 800, 0.6, 150);
      }
      if (updated.favicon_url && updated.favicon_url.startsWith('data:')) {
        updated.favicon_url = await hardCompressImage(updated.favicon_url, 256, 0.7, 50);
      }
      if (updated.hero_banner_url && updated.hero_banner_url.startsWith('data:')) {
        updated.hero_banner_url = await hardCompressImage(updated.hero_banner_url, 800, 0.6, 150);
      }
      if (updated.popup_banner_image && updated.popup_banner_image.startsWith('data:')) {
        updated.popup_banner_image = await hardCompressImage(updated.popup_banner_image, 800, 0.6, 150);
      }
      if (Array.isArray(updated.highlight_images)) {
        updated.highlight_images = await Promise.all(
          updated.highlight_images.map(async (img) => {
            if (img && img.startsWith('data:')) {
              return await hardCompressImage(img, 800, 0.6, 150);
            }
            return img;
          })
        );
      }
      if (Array.isArray(updated.instagram_feed_images)) {
        updated.instagram_feed_images = await Promise.all(
          updated.instagram_feed_images.map(async (img) => {
            if (img && img.startsWith('data:')) {
              return await hardCompressImage(img, 800, 0.6, 150);
            }
            return img;
          })
        );
      }
    } catch (compressErr) {
      console.warn('Settings image compression fallback:', compressErr);
    }

    if (newSettings.whatsapp_number) {
      setStoredWhatsAppNumber(newSettings.whatsapp_number);
    }

    setSettings(updated);
    safeLocalStorageSet(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'settings', 'store_config'), updated, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for settings:', e);
    }

    return updated;
  };

  const updateWhatsAppNumberLocal = (newNumber: string) => {
    setStoredWhatsAppNumber(newNumber);
    setSettings((prev) => ({ ...prev, whatsapp_number: newNumber }));
    setDoc(doc(db, 'settings', 'store_config'), { whatsapp_number: newNumber }, { merge: true }).catch(console.warn);
  };

  const saveStoreLogo = async (logoData: string): Promise<void> => {
    setStoredLogo(logoData);
    setStoreLogo(logoData);
    setSettings((prev) => (prev ? { ...prev, logo_url: logoData } : prev));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), { logo_url: logoData }, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for logo:', e);
    }
  };

  const removeStoreLogo = async (): Promise<void> => {
    removeStoredLogo();
    setStoreLogo(null);
    setSettings((prev) => (prev ? { ...prev, logo_url: undefined } : prev));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), { logo_url: '' }, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for removing logo:', e);
    }
  };

  const saveHeroBanner = async (bannerData: string): Promise<void> => {
    setStoredHeroBanner(bannerData);
    setStoreHeroBannerState(bannerData);
    setSettings((prev) => (prev ? { ...prev, hero_banner_url: bannerData } : prev));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), { hero_banner_url: bannerData }, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for hero banner:', e);
    }
  };

  const removeHeroBanner = async (): Promise<void> => {
    removeStoredHeroBanner();
    setStoreHeroBannerState(null);
    setSettings((prev) => (prev ? { ...prev, hero_banner_url: undefined } : prev));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), { hero_banner_url: '' }, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for removing hero banner:', e);
    }
  };

  const saveStoreBackground = async (bg: StoreBackgroundData): Promise<void> => {
    setStoredBackground(bg);
    setStoreBackgroundState(bg);
    setSettings((prev) => (prev ? { ...prev, background: bg } : prev));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), { background: bg }, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for background:', e);
    }
  };

  const resetStoreBackground = async (): Promise<void> => {
    resetStoredBackground();
    const defaultBg = getStoredBackground();
    setStoreBackgroundState(defaultBg);
    setSettings((prev) => (prev ? { ...prev, background: defaultBg } : prev));
    try {
      await setDoc(doc(db, 'settings', 'store_config'), { background: defaultBg }, { merge: true });
    } catch (e) {
      console.warn('Online sync failed for reset background:', e);
    }
  };

  const savePaymentSettings = async (newSettings: PaymentSettings) => {
    setPaymentSettingsState(newSettings);
    safeLocalStorageSet(PAYMENT_SETTINGS_KEY, JSON.stringify(newSettings));
    
    // Also synchronize WhatsApp number if specified
    if (newSettings.whatsapp_number) {
      setStoredWhatsAppNumber(newSettings.whatsapp_number);
      setSettings((prev) => (prev ? { ...prev, whatsapp_number: newSettings.whatsapp_number } : prev));
    }

    try {
      await setDoc(doc(db, 'payment_settings', 'main_config'), newSettings, { merge: true });
      if (newSettings.whatsapp_number) {
        await setDoc(doc(db, 'settings', 'store_config'), { whatsapp_number: newSettings.whatsapp_number }, { merge: true });
      }
    } catch (e) {
      console.warn('Online sync failed for payment settings:', e);
    }
  };

  // Categories Online Sync
  const saveCategoryLocal = async (categoryName: string, categoryData?: Partial<Category>): Promise<Category> => {
    const trimmed = safeTrim(categoryName);
    if (!trimmed) {
      throw new Error('Nama kategori tidak boleh kosong.');
    }

    const slug = safeToLowerCase(categoryData?.slug || trimmed).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = categories.find((c) => safeToLowerCase(c.name) === safeToLowerCase(trimmed) || safeToLowerCase(c.slug) === slug);
    if (existing) {
      return existing;
    }

    let fallbackImg = DEFAULT_CATEGORIES[0].image;
    if (slug.includes('phone') || slug.includes('charm')) fallbackImg = DEFAULT_CATEGORIES[1].image;
    else if (slug.includes('neck') || slug.includes('kalung')) fallbackImg = DEFAULT_CATEGORIES[2].image;
    else if (slug.includes('ring') || slug.includes('cincin')) fallbackImg = DEFAULT_CATEGORIES[3].image;
    else if (slug.includes('key') || slug.includes('bag')) fallbackImg = DEFAULT_CATEGORIES[4].image;
    else if (slug.includes('gift') || slug.includes('set') || slug.includes('hampers')) fallbackImg = DEFAULT_CATEGORIES[5].image;

    const newCat: Category = {
      id: slug || `cat-${Date.now()}`,
      name: trimmed,
      slug: slug || `cat-${Date.now()}`,
      description: categoryData?.description || `Koleksi ${trimmed} handmade DISSOF.ID`,
      icon: categoryData?.icon || '✨',
      image: categoryData?.image || fallbackImg,
    };

    const updatedCategories = [...categories, newCat];
    setCategories(updatedCategories);
    safeLocalStorageSet(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));

    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat, { merge: true });
    } catch (e) {
      console.warn('Failed to sync new category to online database:', e);
    }

    return newCat;
  };

  const saveFullCategoryLocal = async (category: Category): Promise<Category> => {
    const current = [...categories];
    const index = current.findIndex((c) => c.id === category.id || c.slug === category.slug);

    let updated: Category[];
    if (index >= 0) {
      current[index] = { ...current[index], ...category };
      updated = current;
    } else {
      updated = [...current, category];
    }

    setCategories(updated);
    safeLocalStorageSet(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'categories', category.id), category, { merge: true });
    } catch (e) {
      console.warn('Failed to sync category update to online database:', e);
    }

    return category;
  };

  const deleteCategoryLocal = async (categoryId: string): Promise<void> => {
    const updated = categories.filter((c) => c.id !== categoryId && c.slug !== categoryId);
    setCategories(updated);
    safeLocalStorageSet(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (e) {
      console.warn('Failed to delete category from online database:', e);
    }
  };

  const resetCategoriesToDefault = async () => {
    setCategories(DEFAULT_CATEGORIES);
    safeLocalStorageSet(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));

    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
      }
    } catch (e) {
      console.warn('Failed to reset categories in online database:', e);
    }
  };

  // Products Online Sync with Hard Compression & Firebase Quota Bypass
  const saveProductLocal = async (productData: Partial<Product>, editingId?: string): Promise<Product> => {
    let currentProducts = [...products];

    const category = categories.find((c) => c.id === productData.category_id);
    const categoryName = category?.name || productData.category_name || 'Accessories';

    // 1. Hard-compress all base64 images to guaranteed <= 200 KB before saving
    let compressedImages: string[] = [];
    if (productData.images && productData.images.length > 0) {
      compressedImages = await Promise.all(
        productData.images.map(async (img) => {
          if (img && (img.startsWith('data:') || img.length > 500)) {
            try {
              return await hardCompressImage(img, 800, 0.6, 195);
            } catch {
              return img;
            }
          }
          return img;
        })
      );
    }

    let updatedProduct: Product;

    if (editingId) {
      const targetIndex = currentProducts.findIndex((p) => p.id === editingId);
      if (targetIndex === -1) {
        throw new Error(`Produk dengan ID ${editingId} tidak ditemukan.`);
      }

      updatedProduct = {
        ...currentProducts[targetIndex],
        ...productData,
        images: compressedImages.length > 0 ? compressedImages : (productData.images || []),
        category_name: categoryName,
        updated_at: new Date().toISOString(),
      } as Product;

      currentProducts[targetIndex] = updatedProduct;
    } else {
      const slug = safeToLowerCase(productData.name || 'product')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newId = `prod-${Date.now()}`;

      updatedProduct = {
        id: newId,
        name: safeString(productData.name) || 'Produk Baru',
        slug: `${slug || 'prod'}-${Math.floor(Math.random() * 1000)}`,
        category_id: safeString(productData.category_id) || 'bracelets',
        category_name: categoryName,
        price: Number(productData.price) || 0,
        original_price: productData.original_price ? Number(productData.original_price) : undefined,
        stock: productData.stock != null ? Number(productData.stock) : 10,
        description: productData.description || '',
        details: productData.details || [],
        variants: productData.variants || [],
        tags: productData.tags || [],
        images: compressedImages.length > 0 ? compressedImages : (productData.images || []),
        is_best_seller: Boolean(productData.is_best_seller),
        is_sold_out: Boolean(productData.is_sold_out),
        is_visible: productData.is_visible !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      currentProducts = [updatedProduct, ...currentProducts];
    }

    // 2. Immediate Local State Update
    setProducts(currentProducts);

    // 3. Resilient LocalStorage & IndexedDB Persistence
    safeLocalStorageSet(PRODUCTS_STORAGE_KEY, JSON.stringify(currentProducts));
    idbSaveAll('products', currentProducts).catch(() => {});

    // 4. Firebase Firestore Sync with Transparent Quota Bypass
    try {
      await setDoc(doc(db, 'products', updatedProduct.id), updatedProduct, { merge: true });
    } catch (e: any) {
      if (isQuotaExceededError(e)) {
        console.warn(
          '[Firebase Quota Bypass] Firebase Quota Exceeded. Product successfully preserved in Offline/IndexedDB/LocalStorage fallback:',
          e
        );
      } else {
        console.warn('Firebase sync warning (product safely saved in local offline storage):', e);
      }
    }

    return updatedProduct;
  };

  const deleteProductLocal = async (productId: string): Promise<void> => {
    const updatedProducts = products.filter((p) => p.id !== productId);
    setProducts(updatedProducts);
    safeLocalStorageSet(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
    idbSaveAll('products', updatedProducts).catch(() => {});
    idbDeleteItem('products', productId).catch(() => {});

    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (e: any) {
      if (isQuotaExceededError(e)) {
        console.warn('[Firebase Quota Bypass] Delete synced locally (IndexedDB/LocalStorage):', e);
      } else {
        console.warn('Failed to delete product from online database (deleted locally):', e);
      }
    }
  };

  // Orders Online Sync (Real-time sync between buyer & admin HP)
  const createOrderLocal = async (orderData: {
    customer_name: string;
    customer_whatsapp: string;
    customer_address?: string;
    order_notes?: string;
    payment_method: 'bank_transfer' | 'qris' | 'whatsapp';
    payment_proof?: string;
    payment_proof_url?: string;
  }): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Keranjang belanja kosong.');
    }

    const orderItems = cart.map((item) => {
      const itm: Record<string, any> = {
        product_id: safeString(item?.product?.id || 'prod-custom'),
        product_name: safeString(item?.product?.name || 'Aksesoris DISSOF'),
        price: Number(item?.product?.price) || 0,
        quantity: Number(item?.quantity) || 1,
      };
      if (item?.selectedVariant) itm.variant = safeString(item.selectedVariant);
      if (item?.customNote) itm.custom_note = safeString(item.customNote);
      if (item?.product?.images?.[0]) itm.image = safeString(item.product.images[0]);
      return itm;
    });

    const proofVal = safeString(orderData.payment_proof || orderData.payment_proof_url || '');
    const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const safeCustName = safeTrim(orderData.customer_name);
    const safeCustPhone = safeTrim(orderData.customer_whatsapp);
    const safeCustAddress = safeTrim(orderData.customer_address) || 'Dumai (Ambil di tempat / Kirim)';
    const safeOrderNotes = safeTrim(orderData.order_notes || (orderData as any).notes || '');
    const rawMethod = safeString(orderData.payment_method || 'bank_transfer');
    const safePaymentMethod: Order['payment_method'] = rawMethod === 'whatsapp' ? 'whatsapp' : rawMethod === 'qris' ? 'qris' : 'bank_transfer';

    const newOrder: Order = {
      id: newOrderId,
      customer_name: safeCustName,
      customer_whatsapp: safeCustPhone,
      customer_address: safeCustAddress,
      items: orderItems as any,
      subtotal: Number(cartSubtotal) || 0,
      total: Number(cartSubtotal) || 0,
      order_notes: safeOrderNotes,
      notes: safeOrderNotes,
      source: 'online',
      payment_method: safePaymentMethod,
      payment_proof: proofVal || undefined,
      payment_proof_url: proofVal || undefined,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update local state immediately for instant feedback
    const updatedOrders = [newOrder, ...orders.filter((o) => !isSampleDummyOrderId(o.id))];
    setOrders(updatedOrders);
    safeLocalStorageSet(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    idbSaveAll('orders', updatedOrders).catch(() => {});

    // Push to Firestore Online Database (Directly triggers Admin's dashboard in real-time)
    try {
      const cleanOrderPayload: Record<string, any> = {};
      Object.entries(newOrder).forEach(([key, val]) => {
        if (val !== undefined) {
          cleanOrderPayload[key] = val;
        }
      });
      await setDoc(doc(db, 'orders', newOrderId), cleanOrderPayload);
    } catch (e: any) {
      if (isQuotaExceededError(e)) {
        console.warn(
          '[Firebase Quota Bypass] Firebase Quota Exceeded. Order successfully preserved in LocalStorage/IndexedDB:',
          e
        );
      } else {
        console.warn('Failed to sync new order to Firestore (saved locally):', e);
      }
    }

    window.dispatchEvent(new CustomEvent('dissof_new_order', { detail: newOrder }));
    window.dispatchEvent(new Event('dissof_orders_updated'));
    playNotificationChime();

    return newOrder;
  };

  const updateOrderStatusLocal = async (orderId: string, status: Order['status']): Promise<void> => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o));
    setOrders(updated);
    safeLocalStorageSet(ORDERS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to sync order status update to online database:', e);
    }
  };

  const deleteOrderLocal = async (orderId: string): Promise<void> => {
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    safeLocalStorageSet(ORDERS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      console.warn('Failed to delete order from online database:', e);
    }
  };

  // Events Online Sync (Real-time sync to all devices)
  const saveEventLocal = async (eventData: Partial<EventItem>, editingId?: string): Promise<EventItem> => {
    const currentEvents = [...events];
    let posterUrl = eventData.poster_url || '';

    // Auto-compress poster image if it's a raw base64
    if (posterUrl && posterUrl.startsWith('data:')) {
      try {
        posterUrl = await hardCompressImage(posterUrl, 800, 0.6, 150);
      } catch (err) {
        console.warn('Poster auto-compression fallback:', err);
      }
    }

    let updatedEvent: EventItem;
    if (editingId) {
      const idx = currentEvents.findIndex((e) => e.id === editingId);
      const existing = idx >= 0 ? currentEvents[idx] : ({} as EventItem);
      updatedEvent = {
        ...existing,
        ...eventData,
        id: editingId,
        poster_url: posterUrl || existing.poster_url || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
      } as EventItem;

      if (idx >= 0) {
        currentEvents[idx] = updatedEvent;
      } else {
        currentEvents.unshift(updatedEvent);
      }
    } else {
      const newId = `ev-${Date.now()}`;
      updatedEvent = {
        id: newId,
        title: eventData.title || 'Event Baru',
        tagline: eventData.tagline || 'Pop-Up Market',
        location: eventData.location || 'Dumai, Riau',
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '19.00 - 23.00 WIB',
        status: eventData.status || 'upcoming',
        poster_url: posterUrl || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
        gallery_images: eventData.gallery_images || [],
        description: eventData.description || '',
        booth_number: eventData.booth_number || '',
        google_maps_url: eventData.google_maps_url || '',
        created_at: new Date().toISOString(),
      };
      currentEvents.unshift(updatedEvent);
    }

    setEvents(currentEvents);
    safeLocalStorageSet('dissof_events', JSON.stringify(currentEvents));

    // Save to Firestore Online Database (Instantly syncs to all phones)
    try {
      await setDoc(doc(db, 'events', updatedEvent.id), updatedEvent, { merge: true });
    } catch (e) {
      console.warn('Failed to sync event to Firestore:', e);
    }

    return updatedEvent;
  };

  const deleteEventLocal = async (eventId: string): Promise<void> => {
    const updated = events.filter((e) => e.id !== eventId);
    setEvents(updated);
    safeLocalStorageSet('dissof_events', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (e) {
      console.warn('Failed to delete event from Firestore:', e);
    }
  };

  const addToCart = (product: Product, quantity = 1, selectedVariant?: string, customNote?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant === selectedVariant && item.customNote === customNote
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity, selectedVariant, customNote }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, selectedVariant?: string, customNote?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedVariant === selectedVariant && item.customNote === customNote)
      )
    );
  };

  const updateCartQty = (productId: string, quantity: number, selectedVariant?: string, customNote?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedVariant, customNote);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedVariant === selectedVariant && item.customNote === customNote) {
          const maxStock = item.product.stock || 99;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartSubtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;

  const checkoutViaWhatsApp = async (customer: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  }) => {
    if (cart.length === 0) return;

    await createOrderLocal({
      customer_name: customer.name,
      customer_whatsapp: customer.phone,
      customer_address: customer.address,
      order_notes: customer.notes,
      payment_method: 'whatsapp',
    });

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F472B6', '#FB7185', '#C084FC', '#FDE047', '#A7F3D0'],
    });

    let itemsText = '';
    cart.forEach((item, index) => {
      itemsText += `${index + 1}. *${item.product.name}*\n`;
      if (item.selectedVariant) {
        itemsText += `   • Varian: ${item.selectedVariant}\n`;
      }
      if (item.customNote) {
        itemsText += `   • Request/Inisial: ${item.customNote}\n`;
      }
      itemsText += `   • Jumlah: ${item.quantity} pcs x ${formatIDR(item.product.price)} = *${formatIDR(item.product.price * item.quantity)}*\n\n`;
    });

    const waNumber = settings?.whatsapp_number || getStoredWhatsAppNumber();
    const message = `Halo ${settings?.brand_name || 'DISSOF.ID'} ♡\nSaya ingin order aksesoris handmade berikut:\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Data Pemesan:*\n` +
      `• Nama: ${customer.name}\n` +
      `• No. HP / WA: ${customer.phone}\n` +
      (customer.address ? `• Alamat / Pengambilan: ${customer.address}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🛍️ *Daftar Produk:*\n` +
      itemsText +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total Belanja:* *${formatIDR(cartSubtotal)}*\n` +
      (customer.notes ? `📝 *Catatan Tambahan:* ${customer.notes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Mohon info total ongkir & rekening pembayarannya ya kak. Terima kasih ♡`;

    const waUrl = createWhatsAppLink(waNumber, message);
    window.location.href = waUrl;

    clearCart();
    setIsCartOpen(false);
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        products,
        orders,
        events,
        testimonials,
        paymentSettings,
        cart,
        wishlist,
        isCartOpen,
        isLoading,
        isOnlineSynced,
        storeLogo,
        storeHeroBanner,
        storeBackground,
        saveStoreLogo,
        removeStoreLogo,
        saveHeroBanner,
        removeHeroBanner,
        saveStoreBackground,
        resetStoreBackground,
        setIsCartOpen,
        setCartOpen: setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWishlist,
        isWishlisted,
        refreshData,
        saveProductLocal,
        deleteProductLocal,
        saveCategoryLocal,
        saveFullCategoryLocal,
        deleteCategoryLocal,
        resetCategoriesToDefault,
        savePaymentSettings,
        saveSettingsLocal,
        updateWhatsAppNumberLocal,
        saveEventLocal,
        deleteEventLocal,
        createOrderLocal,
        updateOrderStatusLocal,
        deleteOrderLocal,
        cartSubtotal,
        cartCount,
        pendingOrdersCount,
        checkoutViaWhatsApp,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
