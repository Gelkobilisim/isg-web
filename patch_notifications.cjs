const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldUnsubTasks = `    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => doc.data());
      tasksData.sort((a, b) => b.timestamp - a.timestamp);
      setTasks(tasksData);
      setIsFirebaseLoading(false);
    });`;

const newUnsubTasks = `    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => doc.data());
      tasksData.sort((a, b) => b.timestamp - a.timestamp);
      
      setTasks(prevTasks => {
        if (prevTasks.length > 0 && "Notification" in window && Notification.permission === "granted") {
          const ownerId = localStorage.getItem('isg_notification_device_owner');
          // Only show if the current device is registered for notifications, 
          // or if someone is logged in on this device.
          // Let's use the local storage owner ID to check role if possible, or just currentUser.
          // Since we can't easily access currentUser inside this stale closure without adding it to deps, 
          // we can rely on localStorage to get the active user's role for notifications.
          const localLang = localStorage.getItem('isg_lang') || 'tr';
          
          tasksData.forEach(newTask => {
            const oldTask = prevTasks.find(t => t.id === newTask.id);
            if (!oldTask) {
              // New task added (ISG Mod created it)
              // Notify Chief of that department
              const isTargetUser = ownerId && ownerId.includes(newTask.dept.toLowerCase());
              if (isTargetUser) {
                new Notification(localLang === 'tr' ? "Yeni İSG İhlali" : "New OHS Violation", {
                  body: newTask.desc,
                  icon: '/favicon.svg'
                });
              }
            } else if (oldTask.status !== newTask.status) {
              // Status changed
              const isTargetAdmin = ownerId === '1'; // admin id is '1'
              const isTargetChief = ownerId && ownerId.includes(newTask.dept.toLowerCase());
              
              let title = "";
              let body = "";
              if (newTask.status === 'cozuldu' && isTargetAdmin) {
                title = localLang === 'tr' ? "İhlal Çözüldü" : "Violation Resolved";
                body = \`\${newTask.dept} departmanı bir ihlali çözdü ve onay bekliyor.\`;
              } else if (newTask.status === 'itiraz_edildi' && isTargetAdmin) {
                title = localLang === 'tr' ? "İhlale İtiraz Edildi" : "Violation Objected";
                body = \`\${newTask.dept} departmanı bir ihlale itiraz etti.\`;
              } else if (newTask.status === 'kapatildi' && isTargetChief) {
                title = localLang === 'tr' ? "İhlal Kapatıldı" : "Violation Closed";
                body = \`\${newTask.dept} departmanındaki bir ihlal kaydı onaylandı ve kapatıldı.\`;
              } else if (newTask.status === 'acik' && oldTask.status === 'cozuldu' && isTargetChief) {
                title = localLang === 'tr' ? "Çözüm Reddedildi" : "Solution Rejected";
                body = \`İSG Uzmanı çözümünüzü reddetti, ihlal tekrar açıldı.\`;
              }
              
              if (title && body) {
                new Notification(title, { body, icon: '/favicon.svg' });
              }
            }
          });
        }
        return tasksData;
      });
      setIsFirebaseLoading(false);
    });`;

code = code.replace(oldUnsubTasks, newUnsubTasks);
fs.writeFileSync('src/App.jsx', code);
