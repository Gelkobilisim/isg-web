import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

old_state = """    const [note, setNote] = React.useState('');
    const [afterImgPreview, setAfterImgPreview] = React.useState(null);
    const myTasks = React.useMemo(() => {
        return tasks.filter(task => task.dept === currentUser.dept).sort((a,b) => b.timestamp - a.timestamp);
    }, [tasks, currentUser]);"""

new_state = """    const [note, setNote] = React.useState('');
    const [afterImgPreview, setAfterImgPreview] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('open');

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

with open('src/App.jsx', 'w') as f:
    f.write(content)
