import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """            if (currentToken) {
                await updateDoc(doc(db, "users", currentUser.id), { fcmToken: currentToken, lastActive: new Date() });
                setToastMessage({ type: 'success', message: "Bildirimler başarıyla açıldı! Artık bu cihaza bildirim gelecek." });
                setShowNotifPrompt(false);
            }"""

new_target = """            if (currentToken) {
                await updateDoc(doc(db, "users", currentUser.id), { fcmToken: currentToken, lastActive: new Date() });
                localStorage.setItem('isg_notification_device_owner', currentUser.id);
                localStorage.setItem('isg_notification_role', currentUser.role);
                localStorage.setItem('isg_notification_dept', currentUser.dept || '');
                setToastMessage({ type: 'success', message: "Bildirimler başarıyla açıldı! Artık bu cihaza bildirim gelecek." });
                setShowNotifPrompt(false);
            }"""

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)
