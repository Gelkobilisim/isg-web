import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

new_code = """    const [showNotifHistoryModal, setShowNotifHistoryModal] = useState(false);
    const [notifHistoryData, setNotifHistoryData] = useState([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

    useEffect(() => {
        if (showNotifHistoryModal && currentUser) {
            setIsLoadingNotifs(true);
            const unsub = onSnapshot(
                query(collection(db, "user_notifications"), where("userId", "==", currentUser.id), orderBy("timestamp", "desc"), limit(50)),
                (snapshot) => {
                    setNotifHistoryData(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
                    setIsLoadingNotifs(false);
                },
                (err) => {
                    console.error("Notif history error", err);
                    setIsLoadingNotifs(false);
                }
            );
            return () => unsub();
        }
    }, [showNotifHistoryModal, currentUser, db]);

    const markNotifAsRead = async (id, readStatus) => {
        if (readStatus) return;
        try {
            await updateDoc(doc(db, "user_notifications", id), { read: true });
        } catch(e) { console.error(e); }
    };
"""

for i, line in enumerate(lines):
    if "const [showFeedbackModal, setShowFeedbackModal] = useState(false);" in line:
        lines.insert(i, new_code)
        break

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)
