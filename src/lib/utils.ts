import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { safeLocalStorageSet, hardCompressImage } from './storageFallback';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts any unknown value to a string. Returns empty string for null/undefined.
 */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  return String(val);
}

/**
 * Safely converts any unknown value to lowercase string without throwing TypeError.
 */
export function safeToLowerCase(val: unknown): string {
  return safeString(val).toLowerCase();
}

/**
 * Safely trims any unknown value as a string without throwing TypeError.
 */
export function safeTrim(val: unknown): string {
  return safeString(val).trim();
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned || '6282284901234';
}

export function getStoredWhatsAppNumber(): string {
  try {
    const stored = localStorage.getItem('whatsapp_number');
    if (stored && stored.trim()) {
      return cleanPhone(stored.trim());
    }
    const settingsRaw = localStorage.getItem('site_settings');
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed.whatsapp_number) {
        return cleanPhone(parsed.whatsapp_number);
      }
    }
  } catch (e) {
    console.warn('Could not retrieve stored whatsapp number:', e);
  }
  return '6282284901234';
}

export function setStoredWhatsAppNumber(num: string): void {
  try {
    const cleaned = cleanPhone(num);
    localStorage.setItem('whatsapp_number', cleaned);
    window.dispatchEvent(new Event('dissof_whatsapp_updated'));
  } catch (e) {
    console.warn('Could not store whatsapp number:', e);
  }
}

export function createWhatsAppLink(phoneNumber?: string, message: string = ''): string {
  const numberToUse = phoneNumber ? cleanPhone(phoneNumber) : getStoredWhatsAppNumber();
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${numberToUse}?text=${encoded}`;
}

// ==========================================
// iOS, Safari, and PWA Detection Helpers
// ==========================================

export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('homescreen')
  );
}

// ==========================================
// Shared Web Audio Chime Engine & iOS Unlocker
// ==========================================

let globalAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

function getGlobalAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
}

/**
 * Unlocks Web Audio on iOS Safari upon the first user interaction (touch, click, pointerdown).
 * This ensures that subsequent real-time Firestore order alerts can play sound automatically.
 */
export function unlockAudioOnUserInteraction(): void {
  if (typeof window === 'undefined' || isAudioUnlocked) return;

  const unlockHandler = () => {
    try {
      const ctx = getGlobalAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            isAudioUnlocked = true;
          }).catch(() => {});
        } else {
          isAudioUnlocked = true;
        }

        // Play silent sound buffer to definitively unlock iOS Audio Hardware
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch {}

    window.removeEventListener('click', unlockHandler, true);
    window.removeEventListener('touchstart', unlockHandler, true);
    window.removeEventListener('pointerdown', unlockHandler, true);
  };

  window.addEventListener('click', unlockHandler, { capture: true, once: true });
  window.addEventListener('touchstart', unlockHandler, { capture: true, once: true });
  window.addEventListener('pointerdown', unlockHandler, { capture: true, once: true });
}

// Initialize audio unlocker immediately
if (typeof window !== 'undefined') {
  unlockAudioOnUserInteraction();
}

/**
 * Plays a loud, crisp, and boutique 4-tone cashier/store chime via Web Audio API.
 * High volume (gain 0.35), dual harmonic oscillators, and pleasant melodic intervals (E6 -> G6 -> B6 -> C7).
 * Completely offline, zero-lag, no external assets needed, and works even when Safari is muted/backgrounded.
 */
export function playNotificationChime(isExtraLoud = true): void {
  try {
    // Vibrate device if supported on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([180, 80, 180]);
      } catch {
        // ignore vibrate restrictions
      }
    }

    const ctx = getGlobalAudioContext();
    if (!ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(isExtraLoud ? 0.38 : 0.25, now);
    masterGain.connect(ctx.destination);

    // Chime Note 1: E6 (~1318.51 Hz)
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1318.51, now);
    g1.gain.setValueAtTime(0.3, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Chime Note 2: G6 (~1567.98 Hz)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.12);
    g2.gain.setValueAtTime(0.35, now + 0.12);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Chime Note 3: B6 (~1975.53 Hz) - Sparkle note
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1975.53, now + 0.24);
    g3.gain.setValueAtTime(0.38, now + 0.24);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc3.connect(g3);
    g3.connect(masterGain);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.7);

    // Chime Note 4: C7 (~2093.00 Hz) - Bright bell resonance
    const osc4 = ctx.createOscillator();
    const g4 = ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(2093.00, now + 0.36);
    g4.gain.setValueAtTime(0.42, now + 0.36);
    g4.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc4.connect(g4);
    g4.connect(masterGain);
    osc4.start(now + 0.36);
    osc4.stop(now + 0.95);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

/**
 * Registers the background Service Worker for Push & Offline Notifications
 */
export function initServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('✅ DISSOF Web Push Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration warning:', err);
        });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'DISSOF_NAVIGATE_ORDERS') {
        window.dispatchEvent(new CustomEvent('dissof_open_orders_tab', { detail: { orderId: event.data?.orderId } }));
      }
    });
  }
}

// Auto-run service worker registration
if (typeof window !== 'undefined') {
  initServiceWorker();
}

/**
 * Checks whether Browser Notifications are supported on current platform
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && ('Notification' in window || ('serviceWorker' in navigator && 'PushManager' in window));
}

/**
 * Requests browser push notification permission for the Admin (supports iOS PWA & Desktop/Android)
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) {
    return 'denied';
  }
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  } catch (err) {
    console.warn('Could not request notification permission:', err);
    return 'denied';
  }
}

/**
 * Sends a native browser system notification pop-up
 * Supports ServiceWorker showNotification (iOS Safari 16.4+ & PWA) and Notification constructor fallback.
 */
export function sendBrowserNotification(
  title: string, 
  options?: NotificationOptions & { onClick?: () => void; orderId?: string }
): void {
  if (typeof window === 'undefined') return;

  const notifOptions: NotificationOptions = {
    icon: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=128&auto=format&fit=crop&q=80',
    badge: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=96&auto=format&fit=crop&q=80',
    ...options,
    data: {
      url: '/',
      orderId: options?.orderId,
      ...((options as any)?.data || {}),
    },
  };

  // 1. Try Service Worker showNotification first (Mandatory for iOS 16.4+ Web Push & PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration && typeof registration.showNotification === 'function') {
          return registration.showNotification(title, notifOptions);
        }
        throw new Error('SW showNotification not supported');
      })
      .catch(() => {
        // Fallback to standard Notification constructor
        fallbackDirectNotification(title, notifOptions, options?.onClick);
      });
    return;
  }

  // 2. Direct fallback
  fallbackDirectNotification(title, notifOptions, options?.onClick);
}

function fallbackDirectNotification(
  title: string, 
  options: NotificationOptions, 
  onClick?: () => void
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(title, options);

    notif.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (onClick) {
        onClick();
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('Failed to display browser notification:', err);
    return null;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatFullDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isSameMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getMonthName(monthIndex: number): string {
  return INDONESIAN_MONTHS[monthIndex] || `Bulan ${monthIndex + 1}`;
}


export const STORE_LOGO_KEY = 'store_logo';
export const STORE_HERO_BANNER_KEY = 'store_hero_banner';
export const STORE_BACKGROUND_KEY = 'store_background';

export const DEFAULT_BACKGROUND_COLOR = '#F9F7F2';

export interface StoreBackgroundData {
  type: 'color' | 'image';
  value: string;
  mode?: 'cover' | 'repeat' | 'fixed';
}

export const DEFAULT_BACKGROUND: StoreBackgroundData = {
  type: 'color',
  value: DEFAULT_BACKGROUND_COLOR,
  mode: 'cover'
};

export function getStoredBackground(): StoreBackgroundData {
  try {
    const val = localStorage.getItem(STORE_BACKGROUND_KEY);
    if (!val) return DEFAULT_BACKGROUND;
    
    // Check if it's stored as JSON
    if (val.startsWith('{')) {
      const parsed = JSON.parse(val);
      if (parsed && parsed.value) {
        return {
          type: parsed.type || (parsed.value.startsWith('#') || parsed.value.startsWith('rgb') ? 'color' : 'image'),
          value: parsed.value,
          mode: parsed.mode || 'cover'
        };
      }
    }

    // Direct color string or image string
    const isColor = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
    return {
      type: isColor ? 'color' : 'image',
      value: val,
      mode: 'cover'
    };
  } catch {
    return DEFAULT_BACKGROUND;
  }
}

export function setStoredBackground(bg: StoreBackgroundData): void {
  try {
    safeLocalStorageSet(STORE_BACKGROUND_KEY, JSON.stringify(bg));
    window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: { type: 'background', value: bg } }));
  } catch (e) {
    console.warn('Error saving background to localStorage:', e);
  }
}

export function resetStoredBackground(): void {
  try {
    safeLocalStorageSet(STORE_BACKGROUND_KEY, JSON.stringify(DEFAULT_BACKGROUND));
    window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: { type: 'background', value: DEFAULT_BACKGROUND } }));
  } catch (e) {
    console.warn('Error resetting background in localStorage:', e);
  }
}

export function getStoredLogo(): string | null {
  try {
    const val = localStorage.getItem(STORE_LOGO_KEY);
    return val && val.trim() ? val : null;
  } catch {
    return null;
  }
}

export function setStoredLogo(logoBase64OrUrl: string): void {
  try {
    if (logoBase64OrUrl && logoBase64OrUrl.trim()) {
      safeLocalStorageSet(STORE_LOGO_KEY, logoBase64OrUrl.trim());
    } else {
      localStorage.removeItem(STORE_LOGO_KEY);
    }
    window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: { type: 'logo', value: logoBase64OrUrl } }));
  } catch (e) {
    console.warn('Error saving store logo to localStorage:', e);
  }
}

export function removeStoredLogo(): void {
  try {
    localStorage.removeItem(STORE_LOGO_KEY);
    window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: { type: 'logo', value: null } }));
  } catch (e) {
    console.warn('Error removing store logo from localStorage:', e);
  }
}

export function getStoredHeroBanner(): string | null {
  try {
    const val = localStorage.getItem(STORE_HERO_BANNER_KEY);
    return val && val.trim() ? val : null;
  } catch {
    return null;
  }
}

export function setStoredHeroBanner(bannerBase64OrUrl: string): void {
  try {
    if (bannerBase64OrUrl && bannerBase64OrUrl.trim()) {
      safeLocalStorageSet(STORE_HERO_BANNER_KEY, bannerBase64OrUrl.trim());
    } else {
      localStorage.removeItem(STORE_HERO_BANNER_KEY);
    }
    window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: { type: 'hero_banner', value: bannerBase64OrUrl } }));
  } catch (e) {
    console.warn('Error saving hero banner to localStorage:', e);
  }
}

export function removeStoredHeroBanner(): void {
  try {
    localStorage.removeItem(STORE_HERO_BANNER_KEY);
    window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: { type: 'hero_banner', value: null } }));
  } catch (e) {
    console.warn('Error removing hero banner from localStorage:', e);
  }
}

export {
  hardCompressImage,
  getImageSizeInKB,
  safeLocalStorageSet,
  isQuotaExceededError,
  idbSaveItem,
  idbSaveAll,
  idbGetAll,
  idbDeleteItem,
  DISSOF_BRANDING_BACKUP_KEY,
  saveBrandingBackupLocal,
  getBrandingBackupLocal,
  getBrandingBackupMetadata,
  markBrandingBackupSynced
} from './storageFallback';

/**
 * Compresses an image file from mobile gallery or file picker into an ultra-light base64 string (<200KB).
 * Applies Hard Compression (max 800px width/height, JPEG 0.60 quality) with progressive size reduction
 * to prevent Firebase/LocalStorage "Quota Exceeded" errors.
 */
export async function compressImageFile(
  file: File,
  maxDim = 800,
  quality = 0.6,
  preserveAlpha = false
): Promise<string> {
  if (preserveAlpha && file.type === 'image/png') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const limit = Math.min(maxDim, 800);
          if (width > limit || height > limit) {
            if (width > height) {
              height = Math.round((height * limit) / width);
              width = limit;
            } else {
              width = Math.round((width * limit) / height);
              height = limit;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(e.target?.result as string);
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Gagal memproses gambar PNG.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file PNG.'));
      reader.readAsDataURL(file);
    });
  }

  // Use hard compression engine for all regular images
  return hardCompressImage(file, maxDim, quality, 195);
}

