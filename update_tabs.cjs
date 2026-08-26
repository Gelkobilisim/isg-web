const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const tabReplacement = `               <button onClick={() => { setAdminSystemMode('yukleme'); setAdminViewMode('calendar'); setMobileMenuOpen(false); }} className={\`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap \${adminSystemMode === 'yukleme' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}><Truck className="w-4 h-4 mr-2" /> {t('yukleme_tab')}</button>
               <button onClick={() => { setAdminSystemMode('users'); setAdminViewMode('users'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={\`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap \${adminSystemMode === 'users' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}><Users className="w-4 h-4 mr-2" /> {t('btn_users') || 'Kullanıcı Hesapları'}</button>
               <button onClick={() => { setAdminSystemMode('leaderboard'); setAdminViewMode('leaderboard'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={\`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap \${adminSystemMode === 'leaderboard' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}><TrendingUp className="w-4 h-4 mr-2" /> Liderlik Tablosu</button>
`;

code = code.replace(
/               <button onClick=\{\(\) => \{ setAdminSystemMode\('yukleme'\);[\s\S]*?\{t\('btn_users'\) \|\| 'Kullanıcı Hesapları'\}<\/button>/,
tabReplacement
);

fs.writeFileSync('src/App.jsx', code);
