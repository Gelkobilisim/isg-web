import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

feedbacks_admin_component = """
  const FeedbacksAdmin = () => {
    const ctx = useAppContext();
    const { db } = ctx;
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "feedbacks"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFeedbacks(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feedbacks:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const markAsRead = async (id, currentStatus) => {
        if (currentStatus === 'read') return;
        try {
            await updateDoc(doc(db, "feedbacks", id), { status: 'read' });
        } catch(e) {
            console.error("Update error", e);
        }
    }

    if (loading) {
        return <div className="flex-1 w-full flex items-center justify-center p-8"><LoadingSpinner /></div>;
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-slide-up">
             <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex items-center">
                <MessageSquare className="w-8 h-8 text-pink-500 mr-4" />
                <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">Gelen Bildirimler & Hatalar</h2>
             </div>
             
             {feedbacks.length === 0 ? (
                 <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl text-center text-gray-500 shadow-sm">
                    Henüz hiç geri bildirim veya hata raporu bulunmuyor.
                 </div>
             ) : (
                 <div className="grid grid-cols-1 gap-4">
                     {feedbacks.map(f => (
                         <div key={f.id} onClick={() => markAsRead(f.id, f.status)} className={`p-5 rounded-2xl border transition-colors cursor-pointer ${f.status === 'new' ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-900/30' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-gray-800 dark:text-gray-100">{f.userName}</span>
                                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase">{f.userRole}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs text-gray-500">
                                        {f.timestamp?.toDate ? f.timestamp.toDate().toLocaleString('tr-TR') : 'Şimdi'}
                                    </span>
                                    {f.status === 'new' && <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Yeni</span>}
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{f.text}</p>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    );
  };
"""

mod_idx = -1
for i, line in enumerate(lines):
    if "const AdminDashboard =" in line:
        mod_idx = i
        break

lines.insert(mod_idx, feedbacks_admin_component)

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)
