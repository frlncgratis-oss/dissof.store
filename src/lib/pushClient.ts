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

import { getServiceWorkerUrl, getServiceWorkerScope } from './utils';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Register PushManager subscription on Admin Device and send to backend & Firestore
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
    // 1. Ensure Service Worker is registered and ready with correct relative path for GitHub Pages
    const swUrl = getServiceWorkerUrl();
    const scope = getServiceWorkerScope();
    let registration: ServiceWorkerRegistration;

    try {
      registration = await navigator.serviceWorker.register(swUrl, { scope });
    } catch {
      registration = await navigator.serviceWorker.register('./sw.js');
    }
    await navigator.serviceWorker.ready;

    // 2. Fetch VAPID public key
    const vapidPublicKey = await fetchVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key tidak ditemukan');
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // 3. Unsubscribe any stale subscription and subscribe with current VAPID key
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (e) {
        console.warn('Could not unsubscribe stale push subscription:', e);
      }
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any
    });

    if (!subscription) {
      throw new Error('Gagal membuat objek PushSubscription dari PushManager');
    }

    // 4. Save subscription to Firestore and send to backend
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

    // Save directly to Firestore collection `admin_push_subscriptions`
    try {
      const endpointHash = subscription.endpoint.slice(-60).replace(/[^a-zA-Z0-9_-]/g, '_');
      await setDoc(doc(db, 'admin_push_subscriptions', endpointHash), {
        endpoint: subscription.endpoint,
        subscription: subscription.toJSON(),
        platform: isIOS ? (isStandalone ? 'iOS PWA (Home Screen)' : 'iOS Safari') : 'Web / Android',
        device: navigator.platform || 'iPhone / Mobile',
        userAgent: navigator.userAgent,
        updatedAt: new Date().toISOString(),
        role: 'admin'
      }, { merge: true });
      console.log('✅ Push subscription successfully saved to Firestore admin_push_subscriptions');
    } catch (fsErr) {
      console.warn('Firestore subscription sync warning:', fsErr);
    }

    // Send to backend endpoint if backend is reachable
    fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});

    console.log('✅ [Web Push Client] Admin device registered to PushManager successfully!');
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
