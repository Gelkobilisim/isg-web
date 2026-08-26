const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state for filter
code = code.replace(
  "const [yuklemeAnaTab, setYuklemeAnaTab] = useState('list');",
  "const [yuklemeAnaTab, setYuklemeAnaTab] = useState('list');\n    const [yuklemeListFilter, setYuklemeListFilter] = useState('all');"
);

// 2. Replace the 'yuklemeAnaTab === calendar' ending part
// Current code:
//             renderLoadingList(loadings)
//           )}
//         </div>
//        );
//     }
// 
// I'll replace renderLoadingList(loadings) with the filtered version.

const filterLogic = `            <div>
              <div className="flex justify-end mb-4 gap-2">
                <button onClick={() => setYuklemeListFilter('day')} className={\`px-4 py-2 text-sm font-bold rounded-xl transition-colors \${yuklemeListFilter === 'day' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>Bugün</button>
                <button onClick={() => setYuklemeListFilter('week')} className={\`px-4 py-2 text-sm font-bold rounded-xl transition-colors \${yuklemeListFilter === 'week' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>Bu Hafta</button>
                <button onClick={() => setYuklemeListFilter('month')} className={\`px-4 py-2 text-sm font-bold rounded-xl transition-colors \${yuklemeListFilter === 'month' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>Bu Ay</button>
                <button onClick={() => setYuklemeListFilter('all')} className={\`px-4 py-2 text-sm font-bold rounded-xl transition-colors \${yuklemeListFilter === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>Tümü</button>
              </div>
              {renderLoadingList(loadings.filter(l => {
                if (yuklemeListFilter === 'all') return true;
                const now = new Date();
                if (yuklemeListFilter === 'day') {
                   const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                   return l.timestamp >= startOfDay;
                }
                if (yuklemeListFilter === 'week') {
                   const day = now.getDay();
                   const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                   const startOfWeek = new Date(now.setDate(diff)).setHours(0,0,0,0);
                   return l.timestamp >= startOfWeek;
                }
                if (yuklemeListFilter === 'month') {
                   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                   return l.timestamp >= startOfMonth;
                }
                return true;
              }))}
            </div>`;

code = code.replace(/renderLoadingList\(loadings\)/, filterLogic);

fs.writeFileSync('src/App.jsx', code);
