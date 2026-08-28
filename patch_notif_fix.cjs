const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Patch login
code = code.replace(
  "localStorage.setItem('isg_notification_device_owner', account.id);",
  "localStorage.setItem('isg_notification_device_owner', account.id);\n            localStorage.setItem('isg_notification_role', account.role);\n            localStorage.setItem('isg_notification_dept', account.dept || '');"
);

// Patch logout
code = code.replace(
  "localStorage.removeItem('isg_notification_device_owner');",
  "localStorage.removeItem('isg_notification_device_owner');\n      localStorage.removeItem('isg_notification_role');\n      localStorage.removeItem('isg_notification_dept');"
);

// Patch unsubTasks logic
const oldLogic = `          const ownerId = localStorage.getItem('isg_notification_device_owner');
          // Only show if the current device is registered for notifications, 
          // or if someone is logged in on this device.
          // Let's use the local storage owner ID to check role if possible, or just currentUser.
          // Since we can't easily access currentUser inside this stale closure without adding it to deps, 
          // we can rely on localStorage to get the active user's role for notifications.
          const localLang = localStorage.getItem('isg_lang') || 'tr';
          
          tasksData.forEach(newTask => {
            const oldTask = prevTasks.find(t => t.id === newTask.id);
            if (!oldTask) {
              // New task added (ISG Mod created it)
              // Notify Chief of that department
              const isTargetUser = ownerId && ownerId.includes(newTask.dept.toLowerCase());
              if (isTargetUser) {
                new Notification(localLang === 'tr' ? "Yeni İSG İhlali" : "New OHS Violation", {
                  body: newTask.desc,
                  icon: '/favicon.svg'
                });
              }
            } else if (oldTask.status !== newTask.status) {
              // Status changed
              const isTargetAdmin = ownerId === '1'; // admin id is '1'
              const isTargetChief = ownerId && ownerId.includes(newTask.dept.toLowerCase());`;

const newLogic = `          const ownerId = localStorage.getItem('isg_notification_device_owner');
          const notifRole = localStorage.getItem('isg_notification_role');
          const notifDept = localStorage.getItem('isg_notification_dept');
          const localLang = localStorage.getItem('isg_lang') || 'tr';
          
          if (ownerId && notifRole) {
            tasksData.forEach(newTask => {
              const oldTask = prevTasks.find(t => t.id === newTask.id);
              if (!oldTask) {
                const isTargetUser = (notifRole === 'sef' && notifDept === newTask.dept) || notifRole === 'admin';
                if (isTargetUser) {
                  new Notification(localLang === 'tr' ? "Yeni İSG İhlali" : "New OHS Violation", {
                    body: newTask.desc,
                    icon: '/favicon.svg'
                  });
                }
              } else if (oldTask.status !== newTask.status) {
                const isTargetAdmin = notifRole === 'admin' || notifRole === 'mod';
                const isTargetChief = notifRole === 'sef' && notifDept === newTask.dept;`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.jsx', code);
