import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Update SefDashboard context extraction and add state
old_ctx = """    const { t, tasks, currentUser, updateTaskStatus } = ctx;
    const [actionModal, setActionModal] = React.useState({ isOpen: false, taskId: null, type: null });"""

new_ctx = """    const { t, tasks, currentUser, updateTaskStatus, setPreviewModalImg, setPreviewModalTitle } = ctx;
    const [actionModal, setActionModal] = React.useState({ isOpen: false, taskId: null, type: null });
    const [expandedTasks, setExpandedTasks] = React.useState({});
    
    const toggleTask = (id) => {
        setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
    };"""

content = content.replace(old_ctx, new_ctx)

# 2. Update task mapping
old_map = """                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'yuksek' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                <div className={`flex items-center px-2 py-1 rounded-md border ${statusObj.color}`}><StatusIcon className="w-3.5 h-3.5 mr-1.5" /><span className="text-[10px] font-bold uppercase">{t(statusObj.label_key)}</span></div>
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-wrap">{task.desc}</p>
                            {task.imgUrl && (
                                <img loading="lazy" decoding="async" src={task.imgUrl} className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-200 dark:border-gray-700" />
                            )}
                            <div className="mt-auto pt-4 flex gap-3">"""

new_map = """                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'yuksek' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                <div className={`flex items-center px-2 py-1 rounded-md border ${statusObj.color}`}><StatusIcon className="w-3.5 h-3.5 mr-1.5" /><span className="text-[10px] font-bold uppercase">{t(statusObj.label_key)}</span></div>
                            </div>
                            
                            <div 
                                className="cursor-pointer group mb-2"
                                onClick={() => toggleTask(task.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {task.subject || "İhlal Bildirimi"}
                                    </h3>
                                    <span className="text-gray-400 dark:text-gray-500">
                                        {expandedTasks[task.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedTasks[task.id] && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 mt-2 whitespace-pre-wrap">{task.desc}</p>
                                        {task.imgUrl && (
                                            <img 
                                                loading="lazy" 
                                                decoding="async" 
                                                src={task.imgUrl} 
                                                alt={task.subject}
                                                onClick={() => {
                                                    setPreviewModalImg(task.imgUrl);
                                                    setPreviewModalTitle(task.subject || "İhlal Fotoğrafı");
                                                }}
                                                className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-200 dark:border-gray-700 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-auto pt-4 flex gap-3">"""

content = content.replace(old_map, new_map)

with open('src/App.jsx', 'w') as f:
    f.write(content)

