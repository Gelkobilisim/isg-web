import re

with open('server.ts', 'r') as f:
    content = f.read()

# I will replace tokensToNotify.push(u.fcmToken) with tokensToNotify.push({token: u.fcmToken, userId: u.id})
# And change const tokensToNotify = []; to let targetUsers = [];
# Wait, let's just make a new python script to rewrite it cleanly

lines = content.split('\n')

for i in range(len(lines)):
    if 'tokensToNotify.push(u.fcmToken);' in lines[i]:
        lines[i] = lines[i].replace('tokensToNotify.push(u.fcmToken);', 'tokensToNotify.push(u.fcmToken); targetUsers.push(u.id);')

# Also initialize targetUsers
for i in range(len(lines)):
    if 'const tokensToNotify = [];' in lines[i]:
        lines[i] = '        const tokensToNotify: string[] = [];\n        const targetUsers: string[] = [];'

with open('server.ts', 'w') as f:
    f.write('\n'.join(lines))

