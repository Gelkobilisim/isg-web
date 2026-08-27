const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const effectCode = `    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/analysis/')) {
            const dept = decodeURIComponent(path.split('/')[2]);
            if (dept) {
                setAdminSystemMode('analysis');
                setSelectedAnalysisDept(dept);
                setAnalysisFilter('all');
            }
        }
    }, [location.pathname, setAdminSystemMode]);`;

// Remove the effect from its current position
code = code.replace(effectCode, "");

// Insert it right after selectedAnalysisDept state is declared
code = code.replace(
    /const \[selectedAnalysisDept, setSelectedAnalysisDept\] = useState\(null\);/,
    "const [selectedAnalysisDept, setSelectedAnalysisDept] = useState(null);\n" + effectCode
);

// We should also fix the login admin redirection
code = code.replace(
    /if \(rememberMe\) \{\s*localStorage\.setItem\('isg_logged_in_user', account\.id\);\s*\}/,
    `if (rememberMe) {
          localStorage.setItem('isg_logged_in_user', account.id);
        }
        if (account.role === 'admin') {
           setAdminSystemMode(loginTheme);
        }`
);

fs.writeFileSync('src/App.jsx', code);
