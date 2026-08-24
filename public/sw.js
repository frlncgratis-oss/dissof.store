// Main Service Worker for DISSOF.ID - Background Push & iOS PWA Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications (even when app is closed / screen is off)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { body: event.data ? event.data.text() : 'Pesanan baru masuk ke toko DISSOF.ID!' };
  }

  const title = data.title || data.notification?.title || 'Pesanan Baru Masuk! 💖 DISSOF.ID';
  const options = {
    body: data.body || data.notification?.body || 'Ada pesanan baru masuk! Periksa bukti transfer dan siapkan pesanan.',
    icon: data.icon || data.notification?.icon || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=192&auto=format&fit=crop&q=80',
    badge: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=96&auto=format&fit=crop&q=80',
    vibrate: [200, 100, 200, 100, 400],
    tag: 'dissof-order-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      orderId: data.orderId || null,
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click: focus or open Admin orders tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
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
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Allow client window to request notification display via service worker (critical for iOS Safari)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
