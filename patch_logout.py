import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """  const executeLogout = useCallback(async (disableNotifications) => {
    if (disableNotifications) {
      localStorage.removeItem('isg_notification_device_owner');
      localStorage.removeItem('isg_notification_role');
      localStorage.removeItem('isg_notification_dept');"""

new_target = """  const executeLogout = useCallback(async (disableNotifications) => {
    if (disableNotifications) {
      const loggedInUserId = localStorage.getItem('isg_logged_in_user');
      const isNotificationActive = ("Notification" in window && Notification.permission === "granted") && localStorage.getItem('isg_notification_device_owner') === loggedInUserId;
      
      if (!isNotificationActive) {
          alert('Bu cihazda zaten bildirimleriniz açık değil. Sadece çıkış yapılıyor.');
      } else {
          localStorage.removeItem('isg_notification_device_owner');
          localStorage.removeItem('isg_notification_role');
          localStorage.removeItem('isg_notification_dept');"""

content = content.replace(target, new_target)

# We also need to close the else block before `setCurrentUser(null)`
target2 = """          }
      }
    }
    setCurrentUser(null);"""

new_target2 = """          }
      }
      }
    }
    setCurrentUser(null);"""

content = content.replace(target2, new_target2)

with open('src/App.jsx', 'w') as f:
    f.write(content)
