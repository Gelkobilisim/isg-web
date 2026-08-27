const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const analysisCode = `
      if (adminSystemMode === 'analysis') {
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><Activity className="w-6 h-6 mr-2 text-indigo-600"/> {t('analysis_tab') || 'Analiz Raporları'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('analysis_desc')}</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner flex-wrap gap-1">
                        <button onClick={() => setAnalysisFilter('day')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'day' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_today') || 'Bugün'}</button>
                        <button onClick={() => setAnalysisFilter('week')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'week' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_this_week') || 'Bu Hafta'}</button>
                        <button onClick={() => setAnalysisFilter('month')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'month' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_this_month') || 'Bu Ay'}</button>
                        <button onClick={() => setAnalysisFilter('year')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'year' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_yearly') || 'Bu Yıl'}</button>
                        <button onClick={() => setAnalysisFilter('all')} className={\`px-4 py-2 text-xs font-bold rounded-lg transition-colors \${analysisFilter === 'all' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}\`}>{t('filter_all') || 'Tümü'}</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800/30">
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">{t('dept_most_issues') || 'En Çok Sorun Çıkan Birim'}</h4>
                        <p className="text-xl font-extrabold text-red-900 dark:text-red-300">{mostIssues.length > 0 ? mostIssues.map(d => t(getDeptKey(d.name))).join(', ') : '-'}</p>
                        <p className="text-xs text-red-700 dark:text-red-500 mt-1">{maxCount} {t('issues') || 'İhlal'}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800/30">
                        <h4 className="text-sm font-bold text-green-800 dark:text-green-400 mb-2">{t('dept_least_issues') || 'En Az Sorun Çıkan Birim'}</h4>
                        <p className="text-xl font-extrabold text-green-900 dark:text-green-300">{leastIssues.length > 0 ? leastIssues.map(d => t(getDeptKey(d.name))).join(', ') : '-'}</p>
                        <p className="text-xs text-green-700 dark:text-green-500 mt-1">{minCount} {t('issues') || 'İhlal'}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('total_issues') || 'Toplam Sorun (İhlal)'}</h3>
                    <div className="space-y-4">
                        {sortedAnalysis.map((item, index) => (
                            <div key={item.name} className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-xs mr-3">{index + 1}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{t(getDeptKey(item.name))}</span>
                                        <span className="font-bold text-sm text-gray-600 dark:text-gray-400">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: maxCount > 0 ? \`\${(item.count / maxCount) * 100}%\` : '0%' }}></div>
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

const anchor = "if (adminSystemMode === 'leaderboard') {";
code = code.replace(anchor, analysisCode + "\n" + anchor);

fs.writeFileSync('src/App.jsx', code);
