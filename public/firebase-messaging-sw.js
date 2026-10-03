/**
 * ADS Takip - Service Worker for Background Push Notifications & Background Sync
 * Desteklenen Özellikler:
 * - Tarayıcı kapalıyken arka planda push bildirim alma ve gösterme ('push')
 * - Arka plan senkronizasyonu ('sync' & 'periodicsync')
 * - Bildirim tıklama ve pencere odaklama / açma ('notificationclick')
 * - Bildirim kapatma ('notificationclose')
 * - Push abonelik yenileme ('pushsubscriptionchange')
 */

// Firebase SDK compat import
try {
  importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');
} catch (e) {
  console.warn('[SW] Firebase compat script yüklenemedi (offline olabilir):', e);
}

const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey') || "AIzaSyCKdLCPFTXl4JdGJpSD--yAIpd29BtnN-k";

// Firebase App Başlatma
let firebaseMessaging = null;
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp({
      apiKey: apiKey,
      authDomain: "isg-web-6363.firebaseapp.com",
      projectId: "isg-web-6363",
      storageBucket: "isg-web-6363.firebasestorage.app",
      messagingSenderId: "821576627724",
      appId: "1:821576627724:web:5941a738ff70940599a029"
    });
    firebaseMessaging = firebase.messaging();
  }
} catch (e) {
  console.warn('[SW] Firebase initializeApp uyarısı:', e);
}

// 1. Firebase onBackgroundMessage (FCM formatındaki iletiler için)
if (firebaseMessaging) {
  try {
    firebaseMessaging.onBackgroundMessage(function(payload) {
      console.log('[SW] Firebase onBackgroundMessage tetiklendi:', payload);
      const title = payload.notification?.title || payload.data?.title || "ADS Metal İSG Bildirimi";
      const body = payload.notification?.body || payload.data?.body || "Yeni bir bildiriminiz var.";
      const targetUrl = payload.data?.click_action || payload.data?.url || payload.fcmOptions?.link || '/';
      const tag = payload.data?.tag || payload.data?.violationId || ('isg-fcm-' + Date.now());

      const options = {
        body: body,
        icon: '/adsmetal_logo.jpg',
        badge: '/adsmetal_logo.jpg',
        image: payload.notification?.image || payload.data?.image || undefined,
        vibrate: [300, 100, 300, 100, 300],
        silent: false,
        tag: tag,
        renotify: true,
        requireInteraction: true,
        data: {
          url: targetUrl,
          timestamp: Date.now(),
          type: payload.data?.type || 'isg_alert'
        },
        actions: [
          { action: 'open', title: 'İncele / Aç' },
          { action: 'dismiss', title: 'Kapat' }
        ]
      };

      return self.registration.showNotification(title, options);
    });
  } catch (err) {
    console.error('[SW] onBackgroundMessage listener hatası:', err);
  }
}

// 2. Doğrudan Native 'push' Event Listener (Tarayıcı tamamen kapalıyken veya raw WebPush geldiğinde güvenilir tetikleme)
self.addEventListener('push', function(event) {
  console.log('[SW] Native push event alındı.');

  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      try {
        payload = { notification: { body: event.data.text() } };
      } catch (textErr) {
        payload = { notification: { body: "Yeni bir İSG saha bildirimi alındı." } };
      }
    }
  }

  const notificationData = payload.notification || {};
  const customData = payload.data || {};

  const title = notificationData.title || customData.title || "ADS Metal İSG Bildirimi";
  const body = notificationData.body || customData.body || "Yeni bir saha denetimi veya görev bildirimi var.";
  const clickAction = customData.click_action || customData.url || payload.fcmOptions?.link || '/';
  const tag = customData.tag || customData.violationId || ('isg-push-' + Date.now());

  const options = {
    body: body,
    icon: '/adsmetal_logo.jpg',
    badge: '/adsmetal_logo.jpg',
    image: notificationData.image || customData.image || undefined,
    vibrate: [300, 100, 300, 100, 300],
    tag: tag,
    renotify: true,
    requireInteraction: true,
    data: {
      url: clickAction,
      timestamp: Date.now(),
      violationId: customData.violationId,
      type: customData.type || 'isg_alert'
    },
    actions: [
      { action: 'open', title: 'İncele / Aç' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Aktif açık sekmeler varsa onlara da mesaj ilet
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload: { title, body, data: customData }
          });
        });
      });
    })
  );
});

// 3. Background Sync ('sync' eventi - Ağ bağlantısı geri geldiğinde arka planda senkronizasyon)
self.addEventListener('sync', function(event) {
  console.log('[SW] Background Sync tetiklendi, tag:', event.tag);

  if (event.tag === 'sync-notifications' || event.tag === 'isg-pending-sync') {
    event.waitUntil(
      // Bekleyen bildirimleri veya offline kayıtları kontrol et
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'BACKGROUND_SYNC_TRIGGERED',
            tag: event.tag,
            timestamp: Date.now()
          });
        });
      }).catch(err => {
        console.warn('[SW] Background sync istemcilere iletilemedi:', err);
      })
    );
  }
});

// 4. Periodic Background Sync (Destekleyen mobil tarayıcılarda periyodik arka plan senkronizasyonu)
self.addEventListener('periodicsync', function(event) {
  console.log('[SW] Periodic Background Sync tetiklendi, tag:', event.tag);
  if (event.tag === 'check-isg-alerts') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PERIODIC_SYNC_CHECK',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// 5. Notification Click Handler (Bildirime tıklandığında pencereyi açma / odaklama)
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Bildirime tıklandı. Action:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 1. Zaten açık olan bir ADS Takip penceresi var mı kontrol et
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          // Açık pencereye bildirim tıklama verisini gönder ve odakla
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: targetUrl,
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // 2. Açık pencere yoksa yeni pencere aç
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. Notification Close Handler
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Bildirim kapatıldı:', event.notification.tag);
});

// 7. Push Subscription Change (Tarayıcı token yenilediğinde istemcileri haberdar et)
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] Push aboneliği değişti, yeniden kayıt gerekiyor.');
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        client.postMessage({
          type: 'TOKEN_REFRESH_REQUIRED',
          timestamp: Date.now()
        });
      }
    })
  );
});

// 8. İstemciden Gelen Mesajları Dinleme (Client -> Service Worker)
self.addEventListener('message', function(event) {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'PING') {
    event.ports[0]?.postMessage({ type: 'PONG', version: '2.1.0', time: Date.now() });
  }
});

// 9. Yaşam Döngüsü: Install & Activate
self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker yükleniyor...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker aktifleşti.');
  event.waitUntil(self.clients.claim());
});
