const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update executeHistoryDelete
code = code.replace(
  /const executeHistoryDelete = async \(\) => \{[\s\S]*?setShowDeleteModal\(false\); setDeleteCountdown\(10\);\n    \};/,
  `const [deleteTarget, setDeleteTarget] = useState('isg');
    const executeHistoryDelete = async () => {
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      let cutoff = 0;
      if (historyFilter === '1') cutoff = now - (1 * oneMonth);
      else if (historyFilter === '3') cutoff = now - (3 * oneMonth);
      else if (historyFilter === '6') cutoff = now - (6 * oneMonth);

      if (deleteTarget === 'isg') {
         const tasksToDelete = cutoff === 0 ? tasks : tasks.filter(t => t.timestamp <= cutoff);
         for (const t of tasksToDelete) { await deleteDoc(doc(db, "tasks", t.id)); }
      } else if (deleteTarget === 'yukleme') {
         const loadsToDelete = cutoff === 0 ? loadings : loadings.filter(l => l.timestamp <= cutoff);
         for (const l of loadsToDelete) { await deleteDoc(doc(db, "loadings", l.id)); }
      }

      setShowDeleteModal(false); setDeleteCountdown(10);
    };`
);

// 2. Update the red delete block to be specific to the current tab
code = code.replace(
  /\{currentUser\.username === 'agiradar' && \(\n\s*<div className="mt-8 bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 animate-slide-up">[\s\S]*?<\/select>\n\s*<button onClick=\{\(\) => \{ setShowDeleteModal\(true\); setDeleteCountdown\(10\); \}\} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md whitespace-nowrap">\{t\('delete_btn'\)\}<\/button>[\s\S]*?<\/div>\n\s*<\/div>\n\s*\)\}/,
  `{currentUser.username === 'agiradar' && (adminSystemMode === 'isg' || adminSystemMode === 'yukleme') && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div><h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center mb-2"><AlertTriangle className="w-6 h-6 mr-2"/> {adminSystemMode === 'isg' ? "İSG Geçmişini Sil" : "Sevkiyat Geçmişini Sil"}</h3><p className="text-sm text-red-600 dark:text-red-400 font-medium">{adminSystemMode === 'isg' ? "Seçilen tarihten önceki İSG kayıtları silinecektir." : "Seçilen tarihten önceki sevkiyat kayıtları silinecektir."}</p></div>
              <div className="flex w-full md:w-auto space-x-3 items-center">
                <select value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="flex-1 md:w-48 border border-red-200 rounded-xl p-3 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  <option value="1">{t('month_1')}</option><option value="3">{t('month_3')}</option><option value="6">{t('month_6')}</option><option value="all">{t('month_all')}</option>
                </select>
                <button onClick={() => { setDeleteTarget(adminSystemMode); setShowDeleteModal(true); setDeleteCountdown(10); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md whitespace-nowrap">{t('delete_btn')}</button>
              </div>
            </div>
          </div>
        )}`
);

// 3. Update the TopBar so mobile has a settings menu instead of hidden items
code = code.replace(
  /const TopBar = \(\{ theme = 'blue' \}\) => \{/,
  "const TopBar = ({ theme = 'blue' }) => {\n  const [settingsOpen, setSettingsOpen] = useState(false);"
);

// We need to replace the flex items in the TopBar for the toggles.
code = code.replace(
  /<div className="flex items-center space-x-2 sm:space-x-4">\s*<button onClick=\{toggleLang\} className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">\s*<Globe className="w-3\.5 h-3\.5" \/> <span>\{lang === 'tr' \? 'EN' : 'TR'\}<\/span>\s*<\/button>\s*<button onClick=\{\(\) => setDarkMode\(!darkMode\)\} className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 transition-colors">\s*\{darkMode \? <Sun className="w-4 h-4" \/> : <Moon className="w-4 h-4" \/>\}\s*<\/button>\s*<button onClick=\{logout\} className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm">\s*<span className="hidden sm:inline">\{t\('logout'\)\}<\/span>\s*<LogOut className="w-5 h-5" \/>\s*<\/button>\s*<\/div>/,
  `<div className="flex items-center space-x-2 sm:space-x-4">
             <button onClick={toggleLang} className="hidden sm:flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                 <Globe className="w-3.5 h-3.5" /> <span>{lang === 'tr' ? 'EN' : 'TR'}</span>
             </button>
             <button onClick={() => setDarkMode(!darkMode)} className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 transition-colors">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
             <button onClick={logout} className="hidden sm:flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm">
               <span className="hidden sm:inline">{t('logout')}</span>
               <LogOut className="w-5 h-5" />
             </button>
             
             {/* Mobile Settings Hamburger */}
             <div className="sm:hidden relative">
               <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                 <Menu className="w-5 h-5" />
               </button>
               {settingsOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button onClick={() => {toggleLang(); setSettingsOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center font-bold">
                      <Globe className="w-4 h-4 mr-2"/> {lang === 'tr' ? 'EN' : 'TR'}
                    </button>
                    <button onClick={() => {setDarkMode(!darkMode); setSettingsOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center font-bold">
                      {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />} {darkMode ? 'Açık Mod' : 'Koyu Mod'}
                    </button>
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center font-bold">
                      <LogOut className="w-4 h-4 mr-2"/> {t('logout')}
                    </button>
                 </div>
               )}
             </div>
          </div>`
);

fs.writeFileSync('src/App.jsx', code);
