import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

new_modal = """        {showNotifHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                    <div className="p-5 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-xl flex items-center"><Bell className="w-6 h-6 mr-3"/> Bildirim Geçmişi</h3>
                        <button onClick={() => setShowNotifHistoryModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
                        {isLoadingNotifs ? (
                            <div className="flex justify-center p-8"><LoadingSpinner /></div>
                        ) : notifHistoryData.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">Henüz hiç bildiriminiz yok.</div>
                        ) : (
                            <div className="space-y-3">
                                {notifHistoryData.map(notif => (
                                    <div key={notif.id} onClick={() => markNotifAsRead(notif.id, notif.read)} className={`p-4 rounded-2xl border transition-colors cursor-pointer shadow-sm ${notif.read ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-indigo-800 dark:text-indigo-300'}`}>{notif.title}</h4>
                                            <span className="text-xs text-gray-400 shrink-0 ml-2 mt-0.5">
                                                {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleString('tr-TR', {hour: '2-digit', minute:'2-digit', day:'numeric', month:'short'}) : 'Şimdi'}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200 font-medium'} leading-relaxed`}>{notif.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
"""

for i, line in enumerate(lines):
    if "{showFeedbackModal && (" in line:
        lines.insert(i, new_modal)
        break

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)
