const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
    /onClick=\{\(\) \=\> \{ setAdminSystemMode\('isg'\); setAdminViewMode\('calendar'\); setSelectedAdminDept\(null\); setMobileMenuOpen\(false\); \}\}/g,
    "onClick={() => { navigate('/'); setAdminSystemMode('isg'); setAdminViewMode('calendar'); setSelectedAdminDept(null); setMobileMenuOpen(false); }}"
);

code = code.replace(
    /onClick=\{\(\) \=\> \{ setAdminSystemMode\('yukleme'\); setAdminViewMode\('calendar'\); setMobileMenuOpen\(false\); \}\}/g,
    "onClick={() => { navigate('/'); setAdminSystemMode('yukleme'); setAdminViewMode('calendar'); setMobileMenuOpen(false); }}"
);

code = code.replace(
    /onClick=\{\(\) \=\> \{ setAdminSystemMode\('users'\); setAdminViewMode\('users'\); setSelectedAdminDept\(null\); setMobileMenuOpen\(false\); \}\}/g,
    "onClick={() => { navigate('/'); setAdminSystemMode('users'); setAdminViewMode('users'); setSelectedAdminDept(null); setMobileMenuOpen(false); }}"
);

code = code.replace(
    /onClick=\{\(\) \=\> \{ setAdminSystemMode\('leaderboard'\); setAdminViewMode\('leaderboard'\); setSelectedAdminDept\(null\); setMobileMenuOpen\(false\); \}\}/g,
    "onClick={() => { navigate('/'); setAdminSystemMode('leaderboard'); setAdminViewMode('leaderboard'); setSelectedAdminDept(null); setMobileMenuOpen(false); }}"
);

code = code.replace(
    /onClick=\{\(\) \=\> \{ setAdminSystemMode\('analysis'\); setAdminViewMode\('analysis'\); setSelectedAdminDept\(null\); setMobileMenuOpen\(false\); \}\}/g,
    "onClick={() => { navigate('/analysis'); setAdminSystemMode('analysis'); setAdminViewMode('analysis'); setSelectedAdminDept(null); setMobileMenuOpen(false); }}"
);

fs.writeFileSync('src/App.jsx', code);
