import re

with open('server.ts', 'r') as f:
    content = f.read()

# For building tokensToNotify
def replace_push(match):
    return """const userTokens = Array.isArray(u.fcmTokens) ? u.fcmTokens : (u.fcmToken ? [u.fcmToken] : []);
                    userTokens.forEach(token => {
                        tokensToNotify.push(token);
                    });"""

# This is tricky because the structure varies.
# It's easier to just do it directly.

# Find all blocks of `users.forEach(u => { ... })` and replace them.
# The `users.forEach` logic is very repetitive. Let's just create a helper function at the top of the route handler.

