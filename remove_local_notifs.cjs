const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldLogic = `          if (ownerId && notifRole) {
            tasksData.forEach(newTask => {
              const oldTask = prevTasks.find(t => t.id === newTask.id);
              if (!oldTask) {
                const isTargetUser = (notifRole === 'sef' && notifDept === newTask.dept) || notifRole === 'admin';
                if (isTargetUser) {
                  new Notification(localLang === 'tr' ? "Yeni İSG İhlali" : "New OHS Violation", {
                    body: newTask.desc,
                    icon: '/favicon.svg'
                  });
                }
              } else if (oldTask.status !== newTask.status) {
                const isTargetAdmin = notifRole === 'admin' || notifRole === 'mod';
                const isTargetChief = notifRole === 'sef' && notifDept === newTask.dept;
                
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
          }`;

const newLogic = `        // Yerel bildirim mantığı backend tarafına taşındı.`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.jsx', code);
