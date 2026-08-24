// Firebase Cloud Messaging & Background Push Service Worker for DISSOF.ID
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "skilful-discovery-7xctm",
  appId: "1:906716667362:web:be434a5214880ea8c5adbb",
  apiKey: "AIzaSyBTC_tdvDFFcSw_qmf2VjTsFC4vQBlFJCA",
  authDomain: "skilful-discovery-7xctm.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dissofidhandmade-a6d329f3-f105-4841-baaa-e9996c3fbead",
  storageBucket: "skilful-discovery-7xctm.firebasestorage.app",
  messagingSenderId: "906716667362"
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('Firebase Messaging in SW not supported or initialized with fallback:', e);
}

// Service Worker lifecycle
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Firebase onBackgroundMessage handler
if (messaging && typeof messaging.onBackgroundMessage === 'function') {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Pesanan Baru Masuk! 💖 DISSOF.ID';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Ada pesanan baru masuk! Segera cek rincian pesanan.',
      icon: payload.notification?.icon || payload.data?.icon || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=192&auto=format&fit=crop&q=80',
      badge: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=96&auto=format&fit=crop&q=80',
      vibrate: [200, 100, 200, 100, 400],
      tag: 'dissof-order-alert',
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.data?.url || '/',
        orderId: payload.data?.orderId || null,
        timestamp: Date.now()
      }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// 2. Generic Web Push Event listener (Fallback & iOS Safari Push)
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

// 3. Notification click handler
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

// 4. Message event listener from client UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
