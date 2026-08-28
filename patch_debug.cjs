const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldInit = `const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,`;

const newInit = `// Firebase Debug Mechanism
console.log("🔥 Firebase Initialization Debug:");
console.log("API Key Status:", import.meta.env.VITE_FIREBASE_API_KEY ? "✅ Mevcut (Yüklendi)" : "❌ EKSİK (.env dosyasını kontrol edin!)");
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.error("KRİTİK HATA: VITE_FIREBASE_API_KEY bulunamadı! .env dosyası eksik veya okunmuyor olabilir.");
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,`;

code = code.replace(oldInit, newInit);
fs.writeFileSync('src/App.jsx', code);
