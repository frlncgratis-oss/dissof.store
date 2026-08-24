/**
 * Web Push Subscription Client for DISSOF.ID
 * Handles Service Worker registration, PushManager subscription with VAPID, and backend sync.
 */

// Helper to convert URL-safe base64 string to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Get VAPID Public Key from backend
 */
export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) throw new Error('Failed to fetch VAPID public key');
    const data = await res.json();
    return data.publicKey;
  } catch (err) {
    console.warn('Could not retrieve VAPID key from backend, using default fallback:', err);
    return 'BFwE1iQZdRkUGys-q3qh5brAiWKlg_fISZOdIXCJktih32YItCT_VFuGBDFg1c-ffjNdWH8xPwfjhYzkXr-m_3o';
  }
}

/**
 * Register PushManager subscription on Admin Device and send to backend
 */
export async function registerAdminPushSubscription(): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not defined' };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { 
      success: false, 
      error: 'Push notifications tidak didukung pada browser ini. Untuk iPhone, pastikan web ditambahkan ke Home Screen (PWA iOS 16.4+).' 
    };
  }

  try {
    // 1. Ensure Service Worker is registered and ready
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 2. Fetch VAPID public key
    const vapidPublicKey = await fetchVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key tidak ditemukan');
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // 3. Check for existing subscription or subscribe new
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any
      });
    }

    if (!subscription) {
      throw new Error('Gagal membuat objek PushSubscription dari PushManager');
    }

    // 4. Send subscription to backend server
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    const payload = {
      subscription: subscription.toJSON(),
      metadata: {
        platform: isIOS ? (isStandalone ? 'iOS PWA (Home Screen)' : 'iOS Safari') : 'Web / Android',
        device: navigator.platform || 'iPhone / Mobile',
        userAgent: navigator.userAgent
      }
    };

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('Backend push subscribe returned non-200 status');
    }

    console.log('✅ [Web Push Client] Admin device registered to PushManager & Backend successfully!');
    return { success: true, subscription };
  } catch (err: any) {
    console.error('❌ [Web Push Client] Error subscribing to PushManager:', err);
    return { success: false, error: err.message || 'Gagal mendaftarkan push subscription' };
  }
}

/**
 * Triggers backend to send Web Push notification to all admin devices when a customer makes an order
 */
export async function triggerOrderWebPush(orderData: {
  orderId: string;
  customerName: string;
  totalPrice?: number;
  itemsCount?: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/push/notify-new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not reach backend /api/push/notify-new-order:', err);
    return false;
  }
}

/**
 * Sends a test Web Push notification to all admin devices
 */
export async function testServerWebPush(): Promise<any> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (err) {
    console.error('Test web push failed:', err);
    throw err;
  }
}
