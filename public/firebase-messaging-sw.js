importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey');

firebase.initializeApp({
  apiKey: apiKey || "REPLACE_ME_IF_NEEDED", // We try to get from URL, but fallback just in case, though it shouldn't be empty
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029"
});

try {
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(function(payload) {
      console.log('[firebase-messaging-sw.js] Arka plan bildirimi alındı: ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/adsmetal_logo.jpg'
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch(e) {
    console.error("SW Init error", e);
}
