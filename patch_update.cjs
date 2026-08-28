const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldUpdate = `    await updateDoc(taskRef, updates);
  }, []);`;

const newUpdate = `    await updateDoc(taskRef, updates);

    // Fetch the task data to get the department and oldStatus for notification
    try {
        const tSnap = await getDoc(taskRef);
        if (tSnap.exists()) {
           const tData = tSnap.data();
           const dept = tData.dept;
           // We infer oldStatus as it might not be explicitly passed, but we pass newStatus
           fetch('/api/notify', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   type: 'STATUS_CHANGE',
                   payload: { dept, newStatus, lang: localStorage.getItem('isg_lang') || 'tr' }
               })
           }).catch(err => console.error("API notify error:", err));
        }
    } catch(e) {}
  }, []);`;

code = code.replace(oldUpdate, newUpdate);
fs.writeFileSync('src/App.jsx', code);
