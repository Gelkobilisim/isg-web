const fs = require('fs');
let code = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');
code = code.replace("appId: \"1:821576627724:web:8c69d80d2fa3c3328e62d4\"", "appId: \"1:821576627724:web:5941a738ff70940599a029\"");
fs.writeFileSync('public/firebase-messaging-sw.js', code);
