with open('src/App.jsx', 'r') as f:
    content = f.read()

target = "const [expandedTasks, setExpandedTasks] = React.useState({});"
new_target = "const [expandedTasks, setExpandedTasks] = React.useState({});\n    const [activeTab, setActiveTab] = React.useState('open');"
content = content.replace(target, new_target)

target2 = "    const [afterImgPreview, setAfterImgPreview] = React.useState(null);\n    const myTasks = React.useMemo(() => {\n        return tasks.filter(task => task.dept === currentUser.dept).sort((a,b) => b.timestamp - a.timestamp);\n    }, [tasks, currentUser]);"

new_target2 = """    const [afterImgPreview, setAfterImgPreview] = React.useState(null);
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

content = content.replace(target2, new_target2)

with open('src/App.jsx', 'w') as f:
    f.write(content)
