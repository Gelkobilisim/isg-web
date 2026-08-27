const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The error shows Firestore is struggling with experimentalForceLongPolling or network issues in this environment.
// We should remove experimentalForceLongPolling if it's causing issues, or add better offline persistence handling.
// Given it's a web environment, experimentalForceLongPolling is sometimes problematic. Let's revert it to standard init.

code = code.replace(
  'const db = initializeFirestore(app, { experimentalForceLongPolling: true });',
  'const db = initializeFirestore(app, {});'
);

fs.writeFileSync('src/App.jsx', code);
