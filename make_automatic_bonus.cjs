const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove handleDailyBonus definition
const handleDailyBonusRegex = /const handleDailyBonus = async \(\) => \{[\s\S]*?^\s*\};\n\n/m;
code = code.replace(handleDailyBonusRegex, "");

// 2. Remove the "Günlük Bonus Dağıt" button
code = code.replace(
  /<button onClick=\{handleDailyBonus\}[\s\S]*?<\/button>/,
  ""
);

// 3. Add automatic check inside App component
const autoBonusCode = `
  useEffect(() => {
    if (isFirebaseLoading || !points || Object.keys(points).length === 0) return;
    
    const checkDailyBonus = async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedYesterday = \`\${yesterday.getDate().toString().padStart(2, '0')}.\${(yesterday.getMonth() + 1).toString().padStart(2, '0')}.\${yesterday.getFullYear()}\`;
        
        if (points.lastDailyBonus === formattedYesterday) return;
        
        const yesterdaysTasks = tasks.filter(t => t.createdAt === formattedYesterday);
        const deptsWithTasks = new Set(yesterdaysTasks.map(t => t.dept));
        
        let distributed = 0;
        const updates = {};
        
        DEPARTMENTS.forEach(dept => {
          if (!deptsWithTasks.has(dept)) {
            updates[dept] = (points[dept] || 100) + 20;
            distributed++;
          }
        });
        
        updates.lastDailyBonus = formattedYesterday;
        
        const pointsRef = doc(db, "system", "points");
        await updateDoc(pointsRef, updates);
        console.log(\`Otomatik Günlük Bonus Dağıtıldı: \${distributed} birime 20 puan eklendi.\`);
      } catch (err) {
        console.error("Otomatik bonus dağıtımı hatası:", err);
      }
    };
    checkDailyBonus();
  }, [isFirebaseLoading, points, tasks]);
`;

code = code.replace(
  "return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); unsubPointsHistory(); };\n  }, []);",
  "return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); unsubPointsHistory(); };\n  }, []);\n" + autoBonusCode
);

fs.writeFileSync('src/App.jsx', code);
