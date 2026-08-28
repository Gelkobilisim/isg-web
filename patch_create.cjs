const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldCreate = `    await setDoc(doc(db, "tasks", taskId), newTask);
  }, []);`;

const newCreate = `    await setDoc(doc(db, "tasks", taskId), newTask);
    
    // API Notification trigger
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'NEW_TASK',
        payload: { dept, desc, lang: localStorage.getItem('isg_lang') || 'tr' }
      })
    }).catch(err => console.error("API notify error:", err));
  }, []);`;

code = code.replace(oldCreate, newCreate);
fs.writeFileSync('src/App.jsx', code);
