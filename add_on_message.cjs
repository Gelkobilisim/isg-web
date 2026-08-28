const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {`;

const newUseEffect = `  useEffect(() => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Ön planda mesaj alındı: ", payload);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/adsmetal_logo.jpg'
          });
        }
      });
    }
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {`;

code = code.replace(oldUseEffect, newUseEffect);
fs.writeFileSync('src/App.jsx', code);
