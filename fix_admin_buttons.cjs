const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Insert new button
const leaderboardBtn = "1650:               <button onClick={() => { setAdminSystemMode('leaderboard'); setAdminViewMode('leaderboard'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'leaderboard' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200'}`}><TrendingUp className=\"w-4 h-4 mr-2\" /> {t('leaderboard') || 'Liderlik Tablosu'}</button>";

const searchBtnStr = code.match(/<button[^>]*onClick=\{\(\) => \{ setAdminSystemMode\('leaderboard'\)[^>]*>.*?<\/button>/)[0];

const analysisBtnStr = searchBtnStr + `\n               <button onClick={() => { setAdminSystemMode('analysis'); setAdminViewMode('analysis'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={\`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap \${adminSystemMode === 'analysis' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200'}\`}><Activity className="w-4 h-4 mr-2" /> {t('analysis_tab') || 'Analiz Raporları'}</button>`;

code = code.replace(searchBtnStr, analysisBtnStr);

// Insert analysis filter state
const stateStr = "const [pointLogsFilter, setPointLogsFilter] = useState('all');";
const stateReplaceStr = stateStr + "\n    const [analysisFilter, setAnalysisFilter] = useState('month');";
code = code.replace(stateStr, stateReplaceStr);

fs.writeFileSync('src/App.jsx', code);
