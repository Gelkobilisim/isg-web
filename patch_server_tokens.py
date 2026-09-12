import sys

with open('server.ts', 'r') as f:
    content = f.read()

# Replace users.forEach(u => { if (u.fcmToken) { ...
# Actually it's easier to process all users first.
content = content.replace("users.forEach(u => {", '''users.forEach(u => {
                const userTokens = [];
                if (u.fcmTokens && Array.isArray(u.fcmTokens)) userTokens.push(...u.fcmTokens);
                if (u.fcmToken) userTokens.push(u.fcmToken);
                if (userTokens.length > 0) {
''')

# But this might break the if (u.fcmToken) structure in server.ts. Let's do it cleanly by rewriting the users.forEach blocks.
