const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldUpdate = `  const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);
    const updates = { status: newStatus };
    if (chiefNote) updates.chiefNote = chiefNote;
    if (afterImgUrl) updates.afterImgUrl = afterImgUrl;
    if (modNote) updates.modNote = modNote;
    await updateDoc(taskRef, updates);
  }, []);`;

const newUpdate = `  const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);
    
    // Puan sistemi mantığı: Sadece "acik" durumdan "cozuldu" durumuna geçerken
    if (newStatus === 'cozuldu') {
      const taskSnap = await import("firebase/firestore").then(m => m.getDoc(taskRef));
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        if (taskData.status !== 'cozuldu') {
           const now = Date.now();
           const createdAt = taskData.timestamp;
           const deadlineHours = parseInt(taskData.deadlineHours, 10) || 24;
           const timePassedHours = (now - createdAt) / (1000 * 60 * 60);
           
           let deduction = 5; // Vaktinde çözülürse düşük puan kaybı (-5)
           if (timePassedHours > deadlineHours) {
             deduction = 15; // Vaktinde çözülmezse 3 katı puan kaybı (-15)
           }
           
           const pointsRef = doc(db, "system", "points");
           const pointsSnap = await import("firebase/firestore").then(m => m.getDoc(pointsRef));
           if (pointsSnap.exists()) {
             const currentPoints = pointsSnap.data();
             const dept = taskData.dept;
             if (dept) {
               const newPoints = (currentPoints[dept] || 100) - deduction;
               await updateDoc(pointsRef, { [dept]: newPoints });
             }
           }
        }
      }
    }
    
    const updates = { status: newStatus };
    if (chiefNote) updates.chiefNote = chiefNote;
    if (afterImgUrl) updates.afterImgUrl = afterImgUrl;
    if (modNote) updates.modNote = modNote;
    await updateDoc(taskRef, updates);
  }, [db]);`;

code = code.replace(oldUpdate, newUpdate);
fs.writeFileSync('src/App.jsx', code);
