import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """            if (currentToken) {
                await updateDoc(doc(db, "users", currentUser.id), { fcmToken: currentToken, lastActive: new Date() });
                setToastMessage({ type: 'success', message: "Bildirimler başarıyla açıldı! Artık bu cihaza bildirim gelecek." });
            }"""

new_target = """            if (currentToken) {
                await updateDoc(doc(db, "users", currentUser.id), { fcmToken: currentToken, lastActive: new Date() });
                setToastMessage({ type: 'success', message: "Bildirimler başarıyla açıldı! Artık bu cihaza bildirim gelecek." });
                setShowNotifPrompt(false);
            }"""

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)

