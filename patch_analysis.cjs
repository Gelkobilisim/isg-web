const fs = require('fs');

// --- 1. Patch i18n.js ---
let i18n = fs.readFileSync('src/i18n.js', 'utf8');

const trAdditions = `
    export_pdf: "PDF Olarak Kaydet",
    back_to_analysis: "Analizlere Dön",
    violation_details: "İhlal Detayları",`;

const enAdditions = `
    export_pdf: "Export as PDF",
    back_to_analysis: "Back to Analysis",
    violation_details: "Violation Details",`;

i18n = i18n.replace(
  /analysis_tab: "Analiz Raporları",/,
  "analysis_tab: \"Analiz Raporları\",\n" + trAdditions
);

i18n = i18n.replace(
  /analysis_tab: "Analysis Reports",/,
  "analysis_tab: \"Analysis Reports\",\n" + enAdditions
);

fs.writeFileSync('src/i18n.js', i18n);

// --- 2. Patch App.jsx ---
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Add Printer icon
app = app.replace(/TrendingUp \} from 'lucide-react';/, "TrendingUp, Printer } from 'lucide-react';");

// Add state for selectedAnalysisDept
const stateAnchor = "const [analysisFilter, setAnalysisFilter] = useState('month');";
app = app.replace(stateAnchor, stateAnchor + "\n    const [selectedAnalysisDept, setSelectedAnalysisDept] = useState(null);");

// Extract the analysis mode block and replace it
const analysisOldStart = "if (adminSystemMode === 'analysis') {";
const analysisOldEnd = "if (adminSystemMode === 'leaderboard') {"; // Wait, 'analysis' block is right before 'leaderboard'. Let's replace the whole block up to return statement's end.

const analysisBlockReplacement = `      if (adminSystemMode === 'analysis') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = startOfDay - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 24 * 60 * 60 * 1000;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

        let filteredTasks = tasks;
        if (analysisFilter === 'day') filteredTasks = tasks.filter(t => t.timestamp >= startOfDay);
        if (analysisFilter === 'week') filteredTasks = tasks.filter(t => t.timestamp >= startOfWeek);
        if (analysisFilter === 'month') filteredTasks = tasks.filter(t => t.timestamp >= startOfMonth);
        if (analysisFilter === 'year') filteredTasks = tasks.filter(t => t.timestamp >= startOfYear);

        if (selectedAnalysisDept) {
            const deptTasks = filteredTasks.filter(t => t.dept === selectedAnalysisDept).sort((a,b) => b.timestamp - a.timestamp);
            return (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700 print:border-b-2 print:pb-2">
                        <div>
                            <button onClick={() => setSelectedAnalysisDept(null)} className="mb-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center print:hidden">
                                <ArrowLeft className="w-4 h-4 mr-1" /> {t('back_to_analysis') || 'Analizlere Dön'}
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                {t(getDeptKey(selectedAnalysisDept))} - {t('violation_details') || 'İhlal Detayları'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {analysisFilter === 'day' ? (t('filter_today') || 'Bugün') : 
                                 analysisFilter === 'week' ? (t('filter_this_week') || 'Bu Hafta') : 
                                 analysisFilter === 'month' ? (t('filter_this_month') || 'Bu Ay') : 
                                 analysisFilter === 'year' ? (t('filter_yearly') || 'Bu Yıl') : 
                                 (t('filter_all') || 'Tümü')}
                            </p>
                        </div>
                        <button onClick={() => window.print()} className="print:hidden px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center">
                            <Printer className="w-4 h-4 mr-2" /> {t('export_pdf') || 'PDF Olarak Kaydet'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
                        {deptTasks.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                {t('no_records') || 'Kayıt bulunmamaktadır.'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                                {deptTasks.map(task => (
                                    <div key={task.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-4 rounded-xl print:break-inside-avoid print:border-gray-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={\`text-xs font-bold px-2 py-1 rounded-md \${PRIORITIES[task.priority].color}\`}>
                                                {t(PRIORITIES[task.priority].label_key)}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(task.timestamp).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-100 font-medium mb-3">{task.desc}</p>
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                            <User className="w-3.5 h-3.5 mr-1" /> {task.createdBy}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const issueCounts = {};
        DEPARTMENTS.forEach(d => issueCounts[d] = 0);
        filteredTasks.forEach(task => {
            if (issueCounts[task.dept] !== undefined) {
                issueCounts[task.dept]++;
            }
        });

        const sortedAnalysis = DEPARTMENTS.map(d => ({ name: d, count: issueCounts[d] })).sort((a,b) => b.count - a.count);
        const maxCount = sortedAnalysis.length > 0 ? sortedAnalysis[0].count : 0;
        
        const mostIssues = sortedAnalysis.filter(d => d.count === maxCount && maxCount > 0);
        const minCount = Math.min(...sortedAnalysis.map(d => d.count));
        const leastIssues = sortedAnalysis.filter(d => d.count === minCount);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700 print:border-b-2 print:pb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><Activity className="w-6 h-6 mr-2 text-indigo-600"/> {t('analysis_tab') || 'Analiz Raporları'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 print:hidden">{t('analysis_desc')}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-end md:items-center print:hidden">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner flex-wrap gap-1">
                            <button onClick={() => setAnalysisFilter('day')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'day' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_today') || 'Bugün'}</button>
                            <button onClick={() => setAnalysisFilter('week')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'week' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_this_week') || 'Bu Hafta'}</button>
                            <button onClick={() => setAnalysisFilter('month')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'month' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_this_month') || 'Bu Ay'}</button>
                            <button onClick={() => setAnalysisFilter('year')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'year' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_yearly') || 'Bu Yıl'}</button>
                            <button onClick={() => setAnalysisFilter('all')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'all' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_all') || 'Tümü'}</button>
                        </div>
                        <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center">
                            <Printer className="w-4 h-4 mr-2" /> {t('export_pdf') || 'PDF Olarak Kaydet'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800/30 print:break-inside-avoid print:bg-transparent print:border-gray-300">
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">{t('dept_most_issues') || 'En Çok Sorun Çıkan Birim'}</h4>
                        <p className="text-xl font-extrabold text-red-900 dark:text-red-300">{mostIssues.length > 0 ? mostIssues.map(d => t(getDeptKey(d.name))).join(', ') : '-'}</p>
                        <p className="text-xs text-red-700 dark:text-red-500 mt-1">{maxCount} {t('issues') || 'İhlal'}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800/30 print:break-inside-avoid print:bg-transparent print:border-gray-300">
                        <h4 className="text-sm font-bold text-green-800 dark:text-green-400 mb-2">{t('dept_least_issues') || 'En Az Sorun Çıkan Birim'}</h4>
                        <p className="text-xl font-extrabold text-green-900 dark:text-green-300">{leastIssues.length > 0 ? leastIssues.map(d => t(getDeptKey(d.name))).join(', ') : '-'}</p>
                        <p className="text-xs text-green-700 dark:text-green-500 mt-1">{minCount} {t('issues') || 'İhlal'}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('total_issues') || 'Toplam Sorun (İhlal)'}</h3>
                    <div className="space-y-4">
                        {sortedAnalysis.map((item, index) => (
                            <div key={item.name} className="flex items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-2 rounded-xl transition-colors print:break-inside-avoid print:p-0 print:mb-4" onClick={() => setSelectedAnalysisDept(item.name)}>
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-xs mr-3 print:border print:border-gray-300">{index + 1}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{t(getDeptKey(item.name))}</span>
                                        <span className="font-bold text-sm text-gray-600 dark:text-gray-400">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 print:border print:border-gray-200">
                                        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500 print:bg-gray-400" style={{ width: maxCount > 0 ? \`\${(item.count / maxCount) * 100}%\` : '0%' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
      }
`;

const startIndex = app.indexOf(analysisOldStart);
const endIndex = app.indexOf("if (adminSystemMode === 'leaderboard') {");
app = app.substring(0, startIndex) + analysisBlockReplacement + "\n      " + app.substring(endIndex);

// Add print:hidden to sidebars and mobile navs
app = app.replace(/<aside className="w-64 bg-white dark:bg-gray-800 border-r/g, "<aside className=\"w-64 bg-white dark:bg-gray-800 border-r print:hidden");
// Since there's multiple elements, let's find the mobile header container
app = app.replace(/<div className="md:hidden bg-white/g, "<div className=\"md:hidden bg-white print:hidden");

fs.writeFileSync('src/App.jsx', app);
