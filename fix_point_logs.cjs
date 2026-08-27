const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Extract setPointLogs context value just to be sure we can access it inside AdminDashboard if needed
// Actually, I already added pointLogs to AppContext in previous step.
// Let's add it to AdminDashboard destruction:
code = code.replace(
  /loadings, setLoadings, adminSystemMode, setAdminSystemMode,/,
  'loadings, setLoadings, adminSystemMode, setAdminSystemMode, pointLogs,'
);

// 2. Update handleCustomBonus to write to point_logs collection
code = code.replace(
  /const handleCustomBonus = async \(dept\) => \{[\s\S]*?alert\(\`\$\{dept\} birimine \$\{num\} puan \$\{num >= 0 \? 'eklendi' : 'düşüldü'\}\.\`\);\n               \} else \{/,
  `const handleCustomBonus = async (dept) => {
           const bonusAmount = window.prompt(\`\${dept} birimine eklemek istediğiniz puan miktarını girin (Örn: 10, -5):\`);
           const reason = window.prompt(\`Bu puan değişikliği için bir açıklama girin:\`);
           if (bonusAmount !== null && bonusAmount !== '' && reason !== null) {
               const num = parseInt(bonusAmount, 10);
               if (!isNaN(num)) {
                   const pointsRef = doc(db, "system", "points");
                   const currentScore = points[dept] || 100;
                   await updateDoc(pointsRef, { [dept]: currentScore + num });
                   
                   const logRef = doc(collection(db, "point_logs"));
                   await setDoc(logRef, {
                       id: logRef.id,
                       dept,
                       points: num,
                       reason,
                       adminName: currentUser.name,
                       timestamp: Date.now(),
                       dateStr: new Date().toLocaleString('tr-TR')
                   });
                   
                   alert(\`\${dept} birimine \${num} puan \${num >= 0 ? 'eklendi' : 'düşüldü'}.\`);
               } else {`
);

// 3. Add Point Logs UI to the Leaderboard
const pointLogsUI = `
             <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-600" /> Puan Hareketleri</h3>
                {(!pointLogs || pointLogs.length === 0) ? (
                   <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz bir puan hareketi bulunmuyor.</p>
                ) : (
                   <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                     {pointLogs.map(log => (
                       <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                         <div>
                           <div className="flex items-center space-x-2">
                             <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{log.dept}</span>
                             <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{log.adminName}</span>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">"{log.reason}" - {log.dateStr}</p>
                         </div>
                         <span className={\`font-extrabold text-sm px-2 py-1 rounded-lg shadow-sm \${log.points >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                           {log.points >= 0 ? '+' : ''}{log.points}
                         </span>
                       </div>
                     ))}
                   </div>
                )}
             </div>
`;

code = code.replace(
  /Henüz kaydedilmiş bir geçmiş tablo bulunmuyor\.<\/p>\s*\) : \([\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\);\s*\}/,
  `$& ${pointLogsUI}`
);

fs.writeFileSync('src/App.jsx', code);
