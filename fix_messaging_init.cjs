const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldInit = `const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {});`;

const newInit = `const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {});

let messaging = null;
if (import.meta.env.VITE_FIREBASE_VAPID_KEY) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.error("Messaging error", e);
  }
}`;

code = code.replace(oldInit, newInit);
fs.writeFileSync('src/App.jsx', code);
