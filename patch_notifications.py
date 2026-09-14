import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Sidebar replacement
target_sidebar_btn = """                   <button onClick={requestNotificationPermission} className={`w-full flex items-center px-3 py-2.5 font-medium rounded-xl transition-colors text-sm ${notificationStatus === 'granted' ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20' : 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'}`}>
                      <Bell className="w-5 h-5 mr-3 shrink-0" /> {notificationStatus === 'granted' ? 'Bildirimler Açık' : 'Bildirimleri Aç'}
                   </button>"""

new_sidebar_btn = """                   <button onClick={requestNotificationPermission} className={`w-full flex items-center px-3 py-2.5 font-medium rounded-xl transition-colors text-sm ${(notificationStatus === 'granted' && localStorage.getItem('isg_notification_device_owner') === currentUser?.id) ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20' : 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'}`}>
                      <Bell className="w-5 h-5 mr-3 shrink-0" /> {(notificationStatus === 'granted' && localStorage.getItem('isg_notification_device_owner') === currentUser?.id) ? 'Bildirimler Açık' : 'Bildirimleri Aç'}
                   </button>"""

content = content.replace(target_sidebar_btn, new_sidebar_btn)


# Prompt effect replacement
target_effect = """  useEffect(() => {
    if (currentUser && currentUser.role !== 'yuklemeci' && (!currentUser.fcmToken || notificationStatus !== 'granted')) {"""

new_effect = """  useEffect(() => {
    const isNotificationActiveForUser = notificationStatus === 'granted' && localStorage.getItem('isg_notification_device_owner') === currentUser?.id;
    if (currentUser && currentUser.role !== 'yuklemeci' && (!currentUser.fcmToken || !isNotificationActiveForUser)) {"""

content = content.replace(target_effect, new_effect)


# Main render warning replacement
target_warning = """                {currentUser && currentUser.role !== 'yuklemeci' && (!currentUser.fcmToken || notificationStatus !== 'granted') && ("""

new_warning = """                {currentUser && currentUser.role !== 'yuklemeci' && (!currentUser.fcmToken || !(notificationStatus === 'granted' && localStorage.getItem('isg_notification_device_owner') === currentUser?.id)) && ("""

content = content.replace(target_warning, new_warning)

with open('src/App.jsx', 'w') as f:
    f.write(content)
