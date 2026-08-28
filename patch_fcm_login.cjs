const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldLogic = `        if (registerDevice) {
            localStorage.setItem('isg_notification_device_owner', account.id);
            localStorage.setItem('isg_notification_role', account.role);
            localStorage.setItem('isg_notification_dept', account.dept || '');
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    console.log("Notification permission:", permission);
                });
            }
        }`;

const newLogic = `        if (registerDevice) {
            localStorage.setItem('isg_notification_device_owner', account.id);
            localStorage.setItem('isg_notification_role', account.role);
            localStorage.setItem('isg_notification_dept', account.dept || '');
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    console.log("Notification permission:", permission);
                    if (permission === 'granted' && messaging && import.meta.env.VITE_FIREBASE_VAPID_KEY) {
                        navigator.serviceWorker.register(\`/firebase-messaging-sw.js?apiKey=\${import.meta.env.VITE_FIREBASE_API_KEY}\`)
                        .then((registration) => {
                            getToken(messaging, { 
                                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                                serviceWorkerRegistration: registration 
                            }).then((currentToken) => {
                                if (currentToken) {
                                    updateDoc(doc(db, "users", account.id), { fcmToken: currentToken });
                                }
                            }).catch(err => console.error("FCM Token alınamadı:", err));
                        });
                    }
                });
            }
        }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.jsx', code);
