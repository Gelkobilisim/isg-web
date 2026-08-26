const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /if \(adminSystemMode === 'leaderboard'\) \{[\s\S]*?return \([\s\S]*?<\/div>[\s\S]*?\);\n      \}/;

const newCode = `if (adminSystemMode === 'leaderboard') {
        const sortedDepts = Object.keys(points).filter(key => key !== 'lastDailyBonus').sort((a,b) => points[b] - points[a]);
        
        const handleDailyBonus = async () => {
           const yesterday = new Date();
           yesterday.setDate(yesterday.getDate() - 1);
           const formattedYesterday = \`\${yesterday.getDate().toString().padStart(2, '0')}.\${(yesterday.getMonth() + 1).toString().padStart(2, '0')}.\${yesterday.getFullYear()}\`;
           
           const yesterdaysTasks = tasks.filter(t => t.createdAt === formattedYesterday);
           const deptsWithTasks = new Set(yesterdaysTasks.map(t => t.dept));
           
           const pointsRef = doc(db, "system", "points");
           const pointsSnap = await getDoc(pointsRef);
           
           if (pointsSnap.exists()) {
             const currentPoints = pointsSnap.data();
             if (currentPoints.lastDailyBonus === formattedYesterday) {
                alert("Dünün bonusları zaten dağıtılmış!");
                return;
             }
             
             const updates = {};
             let distributed = 0;
             
             DEPARTMENTS.forEach(dept => {
                if (!deptsWithTasks.has(dept)) {
                   updates[dept] = (currentPoints[dept] || 100) + 20;
                   distributed++;
                }
             });
             
             updates.lastDailyBonus = formattedYesterday;
             
             await updateDoc(pointsRef, updates);
             
             if (distributed > 0) {
                alert(\`Dün sorunsuz çalışan \${distributed} birime 20 bonus puan eklendi.\`);
             } else {
                alert("Dün tüm birimlerde sorun yaşandı, bonus dağıtılamadı ancak gün değerlendirildi.");
             }
           }
        };

        const handleCustomBonus = async (dept) => {
           const bonusAmount = window.prompt(\`\${dept} birimine eklemek istediğiniz puan miktarını girin (Örn: 10, -5):\`);
           if (bonusAmount !== null && bonusAmount !== '') {
               const num = parseInt(bonusAmount, 10);
               if (!isNaN(num)) {
                   const pointsRef = doc(db, "system", "points");
                   const currentScore = points[dept] || 100;
                   await updateDoc(pointsRef, { [dept]: currentScore + num });
                   alert(\`\${dept} birimine \${num} puan \${num >= 0 ? 'eklendi' : 'düşüldü'}.\`);
               } else {
                   alert("Geçersiz sayı girdiniz.");
               }
           }
        };

        const handleResetAndSave = async () => {
            if(window.confirm('Yeni aya başlamak için puanları geçmişe kaydedip tüm birimleri 100 olarak sıfırlamak istediğinize emin misiniz?')) {
                const now = new Date();
                const monthStr = \`\${(now.getMonth() + 1).toString().padStart(2, '0')}-\${now.getFullYear()}\`;
                
                const pointsToSave = {};
                Object.keys(points).forEach(k => {
                   if (k !== 'lastDailyBonus') pointsToSave[k] = points[k];
                });

                const historyRef = doc(db, "system", "points_history");
                await setDoc(historyRef, { [monthStr]: pointsToSave }, { merge: true });

                const initialPoints = DEPARTMENTS.reduce((acc, dept) => { acc[dept] = 100; return acc; }, {});
                initialPoints.lastDailyBonus = points.lastDailyBonus;
                await updateDoc(doc(db, "system", "points"), initialPoints);
                alert("Geçmiş başarıyla kaydedildi ve tüm puanlar sıfırlandı!");
            }
        };

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up h-full flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-4 border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center"><TrendingUp className="w-6 h-6 mr-2 text-green-600"/> Liderlik Tablosu</h2>
                  <p className="text-gray-500 text-sm mt-1">Birimlerin anlık performans puanları. Ay sonu 1. olan birim ödüllendirilecektir.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <button onClick={handleResetAndSave} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold flex items-center shadow-sm text-sm whitespace-nowrap">
                      Sıfırla ve Geçmişe Kaydet
                   </button>
                   <button onClick={handleDailyBonus} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center shadow-md text-sm whitespace-nowrap">
                      <CalendarDays className="w-4 h-4 mr-2" /> Günlük Bonus Dağıt (20p)
                   </button>
                </div>
             </div>
             
             <div className="grid gap-4 mb-8">
               {sortedDepts.map((dept, index) => (
                 <div key={dept} className={\`flex justify-between items-center p-5 border rounded-2xl transition-colors \${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200' : 'bg-white hover:bg-gray-50'}\`}>
                   <div className="flex items-center">
                      <span className={\`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg mr-4 shadow-sm \${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}\`}>{index + 1}</span>
                      <span className="font-bold text-lg text-gray-800">{dept}</span>
                   </div>
                   <div className="text-right flex items-center space-x-4">
                     <button onClick={() => handleCustomBonus(dept)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors">Özel Puan</button>
                     <div>
                       <span className="text-3xl font-extrabold text-green-600">{points[dept] || 100}</span>
                       <span className="text-sm text-gray-500 font-normal ml-1 tracking-wider uppercase">Puan</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="mt-4 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-purple-600" /> Geçmiş Sonuçlar</h3>
                {(!pointsHistory || Object.keys(pointsHistory).length === 0) ? (
                   <p className="text-gray-500 text-sm">Henüz kaydedilmiş bir geçmiş tablo bulunmuyor.</p>
                ) : (
                   <div className="space-y-4">
                     {Object.keys(pointsHistory).sort().reverse().map(monthKey => {
                        const mPoints = pointsHistory[monthKey];
                        const mSorted = Object.keys(mPoints).sort((a,b) => mPoints[b] - mPoints[a]);
                        return (
                          <div key={monthKey} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                             <h4 className="font-bold text-gray-700 mb-3">{monthKey}</h4>
                             <div className="flex flex-wrap gap-2">
                                {mSorted.map((d, i) => (
                                   <span key={d} className={\`text-xs px-2.5 py-1 rounded-md font-medium \${i===0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-white border text-gray-600'}\`}>
                                      {i+1}. {d} ({mPoints[d]}p)
                                   </span>
                                ))}
                             </div>
                          </div>
                        )
                     })}
                   </div>
                )}
             </div>
          </div>
        );
      }`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/App.jsx', code);
