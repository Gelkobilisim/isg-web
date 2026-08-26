const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('getDoc,')) {
  code = code.replace('getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot', 'getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc');
}

code = code.replace(/import\("firebase\/firestore"\)\.then\(m => m\.getDoc\((.*?)\)\)/g, 'getDoc($1)');

fs.writeFileSync('src/App.jsx', code);
