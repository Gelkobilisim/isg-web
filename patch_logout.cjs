const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldLogout = `  const executeLogout = useCallback((disableNotifications) => {
    if (disableNotifications) {
      localStorage.removeItem('isg_notification_device_owner');
      localStorage.removeItem('isg_notification_role');
      localStorage.removeItem('isg_notification_dept');
    }
    setCurrentUser(null); 
    setSelectedAdminDept(null); 
    setSelectedAdminDate(null);
    setAdminViewMode('list');
    setAdminSystemMode('isg');
    localStorage.removeItem('isg_logged_in_user');
    setShowLogoutModal(false);
  }, []);`;

const newLogout = `  const executeLogout = useCallback(async (disableNotifications) => {
    if (disableNotifications) {
      localStorage.removeItem('isg_notification_device_owner');
      localStorage.removeItem('isg_notification_role');
      localStorage.removeItem('isg_notification_dept');
      
      // Remove FCM Token from database to stop background push notifications
      const loggedInUserId = localStorage.getItem('isg_logged_in_user');
      if (loggedInUserId) {
        try {
          await updateDoc(doc(db, "users", loggedInUserId), { fcmToken: null });
        } catch (e) {
          console.error("FCM Token silinemedi:", e);
        }
      }
    }
    setCurrentUser(null); 
    setSelectedAdminDept(null); 
    setSelectedAdminDate(null);
    setAdminViewMode('list');
    setAdminSystemMode('isg');
    localStorage.removeItem('isg_logged_in_user');
    setShowLogoutModal(false);
  }, []);`;

code = code.replace(oldLogout, newLogout);
fs.writeFileSync('src/App.jsx', code);
