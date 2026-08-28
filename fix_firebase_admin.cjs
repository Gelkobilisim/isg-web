const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "import admin from 'firebase-admin';",
  "import { initializeApp, cert } from 'firebase-admin/app';\nimport { getFirestore } from 'firebase-admin/firestore';\nimport { getMessaging } from 'firebase-admin/messaging';"
);

code = code.replace(
  "admin.initializeApp({\n            credential: admin.credential.cert(serviceAccount)\n        });",
  "initializeApp({\n            credential: cert(serviceAccount)\n        });"
);

code = code.replace("await admin.firestore().collection('users').get()", "await getFirestore().collection('users').get()");

code = code.replace("await admin.messaging().sendEachForMulticast(message)", "await getMessaging().sendEachForMulticast(message)");

fs.writeFileSync('server.ts', code);
