const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  'import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";\\nimport { getMessaging, getToken, onMessage } from "firebase/messaging";',
  'import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";\nimport { getMessaging, getToken, onMessage } from "firebase/messaging";'
);

fs.writeFileSync('src/App.jsx', code);
