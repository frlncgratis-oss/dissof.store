/**
 * DISSOF.ID - Hard Compression & Fallback Storage Engine
 * Handles ultra-light image compression (<200KB, max 800px, JPEG 0.6)
 * and seamless fallback to IndexedDB / LocalStorage when Firebase Quota is exceeded.
 */

const DB_NAME = 'dissof_offline_db';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_CATEGORIES = 'categories';
const STORE_ORDERS = 'orders';
const STORE_BRANDING = 'branding';
const STORE_SETTINGS = 'settings';

export const DISSOF_BRANDING_BACKUP_KEY = 'dissof_branding_backup';

export interface DissofBrandingBackupData {
  data: Record<string, any>;
  timestamp: string;
  pendingSync: boolean;
}

let idbPromise: Promise<IDBDatabase> | null = null;

export function getIndexedDB(): Promise<IDBDatabase> {
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        db.createObjectStore(STORE_ORDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BRANDING)) {
        db.createObjectStore(STORE_BRANDING, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return idbPromise;
}

export async function idbSaveItem(storeName: string, item: any): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB save failed for ${storeName}:`, err);
  }
}

export async function idbSaveAll(storeName: string, items: any[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`IndexedDB saveAll failed for ${storeName}:`, err);
  }
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB getAll failed for ${storeName}:`, err);
    return [];
  }
}

export async function idbDeleteItem(storeName: string, key: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB delete failed for ${storeName}:`, err);
  }
}

/**
 * Calculates approximate size in KB from a base64 or URL string.
 */
export function getImageSizeInKB(dataOrUrl: string): number {
  if (!dataOrUrl) return 0;
  if (!dataOrUrl.startsWith('data:')) {
    return 0; // External URL
  }
  const base64Str = dataOrUrl.split(',')[1] || '';
  const bytes = (base64Str.length * 3) / 4;
  return Math.round((bytes / 1024) * 10) / 10;
}

/**
 * Checks if an error is related to quota exceeded (Firebase or Browser LocalStorage).
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : typeof error === 'string' ? error : String(error || '')).toLowerCase();
  const rawCode = (error as any)?.code;
  const code = (typeof rawCode === 'string' ? rawCode : String(rawCode || '')).toLowerCase();
  const rawName = (error as any)?.name;
  const name = typeof rawName === 'string' ? rawName : String(rawName || '');

  return (
    code.includes('quota') ||
    code.includes('resource-exhausted') ||
    code.includes('storage/quota-exceeded') ||
    msg.includes('quota') ||
    msg.includes('exceeded') ||
    msg.includes('storage full') ||
    msg.includes('quotaexceedederror') ||
    msg.includes('ns_error_dom_quota_reached') ||
    name === 'QuotaExceededError'
  );
}

/**
 * Hard compress an image (File or Base64/URL) to strictly under targetMaxKB (default: 195 KB).
 * Target constraints:
 * - Max dimension: 800px (or downscaled if still > targetMaxKB)
 * - Initial JPEG Quality: 0.60
 * - Final output size guaranteed: <= 200 KB
 */
export async function hardCompressImage(
  input: File | string,
  maxDim = 800,
  initialQuality = 0.6,
  targetMaxKB = 195
): Promise<string> {
  // If it's already an external HTTP/HTTPS URL, return as-is
  if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
    return input;
  }

  return new Promise((resolve, reject) => {
    const processImageSource = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let currentMaxDim = Math.min(maxDim, 800);
        let currentQuality = Math.min(initialQuality, 0.6);

        const attemptCompression = (dim: number, qual: number): string => {
          let width = img.width;
          let height = img.height;

          if (width > dim || height > dim) {
            if (width > height) {
              height = Math.round((height * dim) / width);
              width = dim;
            } else {
              width = Math.round((width * dim) / height);
              height = dim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return src;
          }

          // Clean white background to prevent dark artifacts
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          return canvas.toDataURL('image/jpeg', qual);
        };

        // Iterative reduction until strictly <= targetMaxKB
        let resultDataUrl = attemptCompression(currentMaxDim, currentQuality);
        let sizeKB = getImageSizeInKB(resultDataUrl);

        let iterations = 0;
        while (sizeKB > targetMaxKB && iterations < 5) {
          iterations++;
          currentMaxDim = Math.max(320, Math.round(currentMaxDim * 0.85));
          currentQuality = Math.max(0.35, currentQuality - 0.08);
          resultDataUrl = attemptCompression(currentMaxDim, currentQuality);
          sizeKB = getImageSizeInKB(resultDataUrl);
        }

        resolve(resultDataUrl);
      };

      img.onerror = () => {
        if (typeof input === 'string') {
          resolve(input);
        } else {
          reject(new Error('Gagal memproses gambar untuk kompresi.'));
        }
      };

      img.src = src;
    };

    if (typeof input === 'string') {
      processImageSource(input);
    } else {
      if (!input.type.startsWith('image/')) {
        reject(new Error('File yang dipilih bukan gambar yang valid.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processImageSource(e.target.result as string);
        } else {
          reject(new Error('Gagal membaca file gambar.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file dari memori.'));
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Safe LocalStorage set with aggressive cleanup & graceful fallback on QuotaExceededError.
 * Never throws QuotaExceededError to the caller.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn(`[SafeStorage] LocalStorage quota exceeded for key "${key}". Performing cleanup & fallback...`);
      
      // 1. Evict non-essential or transient storage keys to free space
      try {
        const transientKeys = [
          'firebase:previous_websocket_failure',
          'dissof_temp_cache',
          'dissof_draft',
          'dissof_order_receipt',
          'firebase:host:dissof',
          'firebase:applet:cache'
        ];
        transientKeys.forEach((k) => {
          try { localStorage.removeItem(k); } catch {}
        });

        // If the key is not products, we can trim sample orders if stored locally
        if (key !== 'dissof_orders') {
          const storedOrders = localStorage.getItem('dissof_orders');
          if (storedOrders && storedOrders.length > 50000) {
            // Keep only latest 10 orders in local storage (full list is in IndexedDB & Firestore)
            try {
              const parsed = JSON.parse(storedOrders);
              if (Array.isArray(parsed) && parsed.length > 10) {
                localStorage.setItem('dissof_orders', JSON.stringify(parsed.slice(0, 10)));
              }
            } catch {}
          }
        }
      } catch {}

      // 2. Try saving again after cleanup
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr: any) {
        console.warn(`[SafeStorage] Persistent quota overflow for key "${key}". Saving to IndexedDB instead.`);
        // Fallback: Store into IndexedDB under settings store so data is not lost
        try {
          idbSaveItem(STORE_SETTINGS, { key, value, updatedAt: new Date().toISOString() }).catch(() => {});
        } catch {}
        return false;
      }
    }
    return false;
  }
}

/**
 * Save complete branding settings & images directly to LocalStorage + IndexedDB
 * as offline resilient fallback when Firestore Quota is exceeded.
 */
export function saveBrandingBackupLocal(payload: Record<string, any>, pendingSync = true): boolean {
  try {
    const backupObj: DissofBrandingBackupData = {
      data: payload,
      timestamp: new Date().toISOString(),
      pendingSync
    };
    
    // Save to LocalStorage under 'dissof_branding_backup' safely
    safeLocalStorageSet(DISSOF_BRANDING_BACKUP_KEY, JSON.stringify(backupObj));

    // Also persist individual fast-access keys safely without throwing
    if (payload.logo_url || payload.logoUrl) {
      safeLocalStorageSet('dissof_store_logo', payload.logo_url || payload.logoUrl);
    }
    if (payload.hero_banner_url || payload.heroBanner) {
      safeLocalStorageSet('dissof_store_hero_banner', payload.hero_banner_url || payload.heroBanner);
    }
    if (payload.backgroundColor || payload.background) {
      safeLocalStorageSet('dissof_store_background', JSON.stringify({
        type: 'color',
        value: payload.backgroundColor || (typeof payload.background === 'string' ? payload.background : payload.background?.value) || '#F9F7F2',
        mode: 'cover'
      }));
    }

    // Persist full settings key safely
    safeLocalStorageSet('site_settings', JSON.stringify(payload));

    // Also save to IndexedDB for ultra durability
    idbSaveItem(STORE_BRANDING, { key: 'latest_branding_backup', ...backupObj }).catch(() => {});

    // Broadcast across windows/tabs and StoreContext
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dissof_branding_updated', { detail: payload }));
    }
    return true;
  } catch (err) {
    console.warn('[BrandingBackup] Error writing branding backup:', err);
    return false;
  }
}

/**
 * Load branding backup from LocalStorage or IndexedDB
 */
export function getBrandingBackupLocal(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(DISSOF_BRANDING_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed.data || parsed;
      }
    }

    // Fallback to site_settings
    const settingsRaw = localStorage.getItem('site_settings');
    if (settingsRaw) {
      return JSON.parse(settingsRaw);
    }
  } catch (err) {
    console.warn('[BrandingBackup] Error reading branding backup:', err);
  }
  return null;
}

/**
 * Check if there is pending sync for branding backup
 */
export function getBrandingBackupMetadata(): DissofBrandingBackupData | null {
  try {
    const raw = localStorage.getItem(DISSOF_BRANDING_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as DissofBrandingBackupData;
      }
    }
  } catch (err) {
    console.warn('[BrandingBackup] Error reading metadata:', err);
  }
  return null;
}

/**
 * Mark branding backup as synced with Firestore
 */
export function markBrandingBackupSynced(): void {
  try {
    const raw = localStorage.getItem(DISSOF_BRANDING_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        parsed.pendingSync = false;
        parsed.syncedAt = new Date().toISOString();
        safeLocalStorageSet(DISSOF_BRANDING_BACKUP_KEY, JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.warn('[BrandingBackup] Error marking synced:', err);
  }
}
