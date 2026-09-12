import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """        if (currentToken && userObj.fcmToken !== currentToken) {
            console.log("Token mismatch detected, updating Firestore...");
            await updateDoc(doc(db, "users", userObj.id), { fcmToken: currentToken });
            console.log("Token updated successfully for user:", userObj.username);
        }"""

new_target = """        if (currentToken) {
            localStorage.setItem('isg_notification_device_owner', userObj.id);
            localStorage.setItem('isg_notification_role', userObj.role);
            localStorage.setItem('isg_notification_dept', userObj.dept || '');
            
            if (userObj.fcmToken !== currentToken) {
                console.log("Token mismatch detected, updating Firestore...");
                await updateDoc(doc(db, "users", userObj.id), { fcmToken: currentToken });
                console.log("Token updated successfully for user:", userObj.username);
            }
        }"""

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)
