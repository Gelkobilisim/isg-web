import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

new_btn = """               <button onClick={() => { setShowNotifHistoryModal(true); setSidebarOpen(false); }} className="w-full flex items-center px-3 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 font-bold rounded-xl transition-colors text-sm mt-2">
                   <Bell className="w-5 h-5 mr-3 shrink-0" /> Bildirim Geçmişi
               </button>
"""

for i, line in enumerate(lines):
    if "Sorun Bildir / Feedback" in line:
        # The button ends at i+1
        lines.insert(i+2, new_btn)
        break

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)
