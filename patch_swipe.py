import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# For Notifications:
old_notif_start = """                                {notifHistoryData.map(notif => (
                                    <div key={notif.id} onClick={(e) => toggleNotifReadStatus(notif.id, notif.read, e)} className={`p-4 rounded-2xl border transition-colors cursor-pointer shadow-sm group ${notif.read ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50'}`}>"""

new_notif_start = """                                <AnimatePresence mode="popLayout">
                                {notifHistoryData.map(notif => (
                                    <motion.div 
                                        key={notif.id} 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.8}
                                        onDragEnd={async (event, info) => {
                                            if (info.offset.x > 100 || info.offset.x < -100) {
                                                try {
                                                    await deleteDoc(doc(db, "user_notifications", notif.id));
                                                } catch(err) { console.error(err); }
                                            }
                                        }}
                                        onClick={(e) => toggleNotifReadStatus(notif.id, notif.read, e)} 
                                        className={`p-4 rounded-2xl border transition-colors cursor-pointer shadow-sm group ${notif.read ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50'}`}>"""

content = content.replace(old_notif_start, new_notif_start)

# The end of the notif block is:
#                                     </div>
#                                 ))}
# We need to change `</div>` to `</motion.div>` and close `</AnimatePresence>`

old_notif_end = """                                        <p className={`text-sm ml-8 ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200 font-medium'} leading-relaxed`}>{notif.body}</p>
                                    </div>
                                ))}"""
new_notif_end = """                                        <p className={`text-sm ml-8 ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200 font-medium'} leading-relaxed`}>{notif.body}</p>
                                    </motion.div>
                                ))}
                                </AnimatePresence>"""

content = content.replace(old_notif_end, new_notif_end)

# For Feedbacks:
old_feedback_start = """                     {feedbacks.map(f => (
                         <div key={f.id} onClick={() => markAsRead(f.id, f.status)} className={`p-5 rounded-2xl border transition-colors cursor-pointer ${f.status === 'new' ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-900/30' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>"""

new_feedback_start = """                     <AnimatePresence mode="popLayout">
                     {feedbacks.map(f => (
                         <motion.div 
                            key={f.id} 
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.8}
                            onDragEnd={async (event, info) => {
                                if (info.offset.x > 100 || info.offset.x < -100) {
                                    try {
                                        await deleteDoc(doc(db, "feedbacks", f.id));
                                    } catch(err) { console.error(err); }
                                }
                            }}
                            onClick={() => markAsRead(f.id, f.status)} 
                            className={`p-5 rounded-2xl border transition-colors cursor-pointer ${f.status === 'new' ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-900/30' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>"""

content = content.replace(old_feedback_start, new_feedback_start)

old_feedback_end = """                            <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{f.text}</p>
                         </div>
                     ))}"""
                     
new_feedback_end = """                            <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{f.text}</p>
                         </motion.div>
                     ))}
                     </AnimatePresence>"""

content = content.replace(old_feedback_end, new_feedback_end)

with open('src/App.jsx', 'w') as f:
    f.write(content)
