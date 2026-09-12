import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# For Notifications
notif_hint = """                            <div className="space-y-3">
                                <div className="text-xs text-center text-gray-400 dark:text-gray-500 mb-2">Silmek için sağa veya sola kaydırın</div>"""
content = content.replace('                            <div className="space-y-3">', notif_hint)

# For Feedbacks
feedback_hint = """                 <div className="grid grid-cols-1 gap-4">
                     <div className="text-xs text-center text-gray-400 dark:text-gray-500 mb-2">Silmek için sağa veya sola kaydırın</div>"""
content = content.replace('                 <div className="grid grid-cols-1 gap-4">', feedback_hint)

with open('src/App.jsx', 'w') as f:
    f.write(content)
