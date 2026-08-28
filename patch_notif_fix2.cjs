const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  '          if (autoUser) setCurrentUser(autoUser);',
  `          if (autoUser) {
            setCurrentUser(autoUser);
            if (localStorage.getItem('isg_notification_device_owner') === autoUser.id) {
               localStorage.setItem('isg_notification_role', autoUser.role);
               localStorage.setItem('isg_notification_dept', autoUser.dept || '');
            }
          }`
);

fs.writeFileSync('src/App.jsx', code);
