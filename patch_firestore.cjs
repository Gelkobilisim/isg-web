const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  'import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";',
  'import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";'
);

code = code.replace(
  'const db = getFirestore(app);',
  'const db = initializeFirestore(app, { experimentalForceLongPolling: true });'
);

fs.writeFileSync('src/App.jsx', code);
