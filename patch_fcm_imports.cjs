const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldImports = 'import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";';
const newImports = oldImports + '\\nimport { getMessaging, getToken, onMessage } from "firebase/messaging";';

code = code.replace(oldImports, newImports);

const oldInit = `const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});`;
const newInit = `const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
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
