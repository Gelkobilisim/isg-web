const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldLoginHandle = `        if (registerDevice) {
            localStorage.setItem('isg_notification_device_owner', account.id);
        }
        setCurrentUser(account);`;

const newLoginHandle = `        if (registerDevice) {
            localStorage.setItem('isg_notification_device_owner', account.id);
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    console.log("Notification permission:", permission);
                });
            }
        }
        setCurrentUser(account);`;

code = code.replace(oldLoginHandle, newLoginHandle);

fs.writeFileSync('src/App.jsx', code);
