const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const leaderboardCode = `
      if (adminSystemMode === 'leaderboard') {
        const sortedDepts = Object.keys(points).sort((a,b) => points[b] - points[a]);
        
        const handleDailyBonus = async () => {
           const yesterday = new Date();
           yesterday.setDate(yesterday.getDate() - 1);
           const formattedYesterday = yesterday.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
           
           const yesterdaysTasks = tasks.filter(t => t.createdAt === formattedYesterday);
           const deptsWithTasks = new Set(yesterdaysTasks.map(t => t.dept));
           
           const pointsRef = doc(db, "system", "points");
           const pointsSnap = await getDoc(pointsRef);
           
           if (pointsSnap.exists()) {
             const currentPoints = pointsSnap.data();
             const updates = {};
             let distributed = 0;
             
             DEPARTMENTS.forEach(dept => {
                if (!deptsWithTasks.has(dept)) {
                   updates[dept] = (currentPoints[dept] || 100) + 5;
                   distributed++;
                }
             });
             
             if (distributed > 0) {
                await updateDoc(pointsRef, updates);
                alert(\`Dün sorunsuz çalışan \${distributed} birime 5 bonus puan eklendi.\`);
             } else {
                alert("Dün tüm birimlerde sorun yaşandı, bonus dağıtılamadı.");
             }
           }
        };

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up h-full">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-4 border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center"><TrendingUp className="w-6 h-6 mr-2 text-green-600"/> Liderlik Tablosu</h2>
                  <p className="text-gray-500 text-sm mt-1">Birimlerin anlık performans puanları. Ay sonu 1. olan birim ödüllendirilecektir.</p>
                </div>
                <button onClick={handleDailyBonus} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center shadow-md text-sm whitespace-nowrap">
                   <CalendarDays className="w-4 h-4 mr-2" /> Günlük Bonus Dağıt
                </button>
             </div>
             
             <div className="grid gap-4">
               {sortedDepts.map((dept, index) => (
                 <div key={dept} className={\`flex justify-between items-center p-5 border rounded-2xl transition-colors \${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200' : 'bg-white hover:bg-gray-50'}\`}>
                   <div className="flex items-center">
                      <span className={\`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg mr-4 shadow-sm \${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}\`}>{index + 1}</span>
                      <span className="font-bold text-lg text-gray-800">{dept}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-3xl font-extrabold text-green-600">{points[dept] || 100}</span>
                     <span className="text-sm text-gray-500 font-normal ml-1 tracking-wider uppercase">Puan</span>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        );
      }
`;

code = code.replace("const renderRightPanel = () => {", "const renderRightPanel = () => {\n" + leaderboardCode);
fs.writeFileSync('src/App.jsx', code);
