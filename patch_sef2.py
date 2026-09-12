import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Update State and Memo
old_state = """    const [expandedTasks, setExpandedTasks] = React.useState({});
    
    const toggleTask = (id) => {
        setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const myTasks = React.useMemo(() => {
        return tasks.filter(task => task.dept === currentUser.dept).sort((a,b) => b.timestamp - a.timestamp);
    }, [tasks, currentUser]);"""

new_state = """    const [expandedTasks, setExpandedTasks] = React.useState({});
    const [activeTab, setActiveTab] = React.useState('open');
    
    const toggleTask = (id) => {
        setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const { openTasks, completedTasks, openCount } = React.useMemo(() => {
        const my = tasks.filter(task => task.dept === currentUser.dept).sort((a,b) => b.timestamp - a.timestamp);
        const opens = my.filter(t => t.status === 'acik' || t.status === 'itiraz_edildi');
        return {
            openTasks: opens,
            completedTasks: my.filter(t => t.status !== 'acik' && t.status !== 'itiraz_edildi'),
            openCount: opens.length
        };
    }, [tasks, currentUser]);

    const displayTasks = activeTab === 'open' ? openTasks : completedTasks;

    const formatTimeRemaining = (timestamp, deadlineHours) => {
        if (!timestamp || !deadlineHours) return null;
        const deadline = timestamp + (deadlineHours * 60 * 60 * 1000);
        const now = Date.now();
        const diff = deadline - now;
        
        if (diff < 0) {
            const h = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
            return <span className="text-red-600 dark:text-red-400 font-bold">{h > 0 ? `${h} saat` : 'Süresi'} gecikti</span>;
        } else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return <span className="text-orange-600 dark:text-orange-400 font-bold">{h}s {m}d kaldı</span>;
        }
    };
    
    const formatDateStr = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };"""

content = content.replace(old_state, new_state)

# 2. Update Header & Tabs
old_header = """            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                <h2 className="text-2xl md:text-3xl font-extrabold flex items-center text-gray-800 dark:text-gray-100"><ShieldAlert className="w-8 h-8 mr-3 text-blue-500"/> {t(getDeptKey(currentUser.dept))} {t('dept_tasks') || 'Birimi Görevleri'}</h2>
                <div className="mt-4 md:mt-0 flex items-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-800 font-bold text-sm shadow-sm">
                   {t('open_tasks') || 'Açık Görevler'}: {myTasks.filter(t => t.status === 'acik' || t.status === 'itiraz_edildi').length}
                </div>
            </div>"""

new_header = """            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                <h2 className="text-2xl md:text-3xl font-extrabold flex items-center text-gray-800 dark:text-gray-100"><ShieldAlert className="w-8 h-8 mr-3 text-blue-500"/> {t(getDeptKey(currentUser.dept))} {t('dept_tasks') || 'Birimi Görevleri'}</h2>
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                   <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                       <button onClick={() => setActiveTab('open')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'open' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Açık İhlaller ({openCount})</button>
                       <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Düzeltilenler</button>
                   </div>
                </div>
            </div>"""
content = content.replace(old_header, new_header)

# 3. Update myTasks to displayTasks
content = content.replace("myTasks.length === 0", "displayTasks.length === 0")
content = content.replace("myTasks.map(task => {", "displayTasks.map(task => {")

# 4. Update the task card to include date and time remaining
old_task_top = """                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'yuksek' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                <div className={`flex items-center px-2 py-1 rounded-md border ${statusObj.color}`}><StatusIcon className="w-3.5 h-3.5 mr-1.5" /><span className="text-[10px] font-bold uppercase">{t(statusObj.label_key)}</span></div>
                            </div>
                            
                            <div """

new_task_top = """                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col gap-1.5">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase self-start ${task.priority === 'yuksek' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center font-medium"><Calendar className="w-3.5 h-3.5 mr-1"/> {formatDateStr(task.timestamp)}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className={`flex items-center px-2 py-1 rounded-md border ${statusObj.color}`}><StatusIcon className="w-3.5 h-3.5 mr-1.5" /><span className="text-[10px] font-bold uppercase">{t(statusObj.label_key)}</span></div>
                                    {(task.status === 'acik' || task.status === 'itiraz_edildi') && (
                                        <div className="text-xs flex items-center bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                                            <Clock className="w-3.5 h-3.5 mr-1 text-gray-400"/>
                                            {formatTimeRemaining(task.timestamp, task.deadlineHours)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div """
content = content.replace(old_task_top, new_task_top)


with open('src/App.jsx', 'w') as f:
    f.write(content)
