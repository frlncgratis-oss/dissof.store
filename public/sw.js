// Service Worker for DISSOF.ID - Web Push Notifications for Admin (iOS / Android / Desktop)
const CACHE_NAME = 'dissof-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push from Server (Apple APNs / Google FCM / W3C Push Service)
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Pesanan Baru Masuk! 🛍️💖';
  const options = {
    body: data.body || 'Ada pesanan baru masuk ke toko DISSOF.ID! Periksa detail pesanan segera.',
    icon: data.icon || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=192&auto=format&fit=crop&q=80',
    badge: data.badge || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=96&auto=format&fit=crop&q=80',
    tag: 'dissof-order-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: data.data?.url || data.url || '/',
      orderId: data.data?.orderId || data.orderId || null,
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click: Open or focus Admin Orders tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and dispatch event
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ 
            type: 'DISSOF_NAVIGATE_ORDERS', 
            orderId: event.notification.data?.orderId 
          });
          return;
        }
      }
      // If not open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Allow client window to request notification display via service worker (for in-browser triggers)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
