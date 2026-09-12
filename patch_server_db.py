import re

with open('server.ts', 'r') as f:
    lines = f.readlines()

new_block = """            // Bildirimleri kullanici bazinda history'e kaydet (user_notifications)
            const uniqueUsers = Array.from(new Set(targetUsers));
            if (uniqueUsers.length > 0) {
                try {
                    const histBatch = getFirestore().batch();
                    uniqueUsers.forEach(uid => {
                        const notifRef = getFirestore().collection('user_notifications').doc();
                        histBatch.set(notifRef, {
                            userId: uid,
                            title: notificationTitle,
                            body: notificationBody,
                            type: type,
                            dept: payload.dept || null,
                            timestamp: new Date(),
                            read: false
                        });
                    });
                    await histBatch.commit();
                } catch (histErr) {
                    console.error("Failed to save user notifications history:", histErr);
                }
            }
            
"""

for i in range(len(lines)):
    if 'try {' in lines[i] and 'await getFirestore().collection(\'notification_logs\').add({' in lines[i+1]:
        lines.insert(i, new_block)
        break

with open('server.ts', 'w') as f:
    f.writelines(lines)
