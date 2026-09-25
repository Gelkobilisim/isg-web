importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey') || "AIzaSyCKdLCPFTXl4JdGJpSD--yAIpd29BtnN-k";

firebase.initializeApp({
  apiKey: apiKey,
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029"
});

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Arka plan bildirimi alindi: ', payload);
    const title = payload.notification?.title || payload.data?.title || "ADS Metal İSG Bildirimi";
    const body = payload.notification?.body || payload.data?.body || "Yeni bir bildiriminiz var.";
    const options = {
      body: body,
      icon: '/adsmetal_logo.jpg',
      badge: '/adsmetal_logo.jpg',
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
      sound: 'default',
      data: {
        url: payload.data?.click_action || payload.fcmOptions?.link || '/'
      }
    };
    self.registration.showNotification(title, options);
  });
} catch (e) {
  console.error("SW Init error", e);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        client.postMessage({ type: 'TOKEN_REFRESH_REQUIRED' });
      }
    })
  );
});
