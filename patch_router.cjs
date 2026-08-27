const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const routerLogic = `
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/analysis/')) {
            const dept = decodeURIComponent(path.split('/')[2]);
            if (dept) {
                setAdminSystemMode('analysis');
                setSelectedAnalysisDept(dept);
                setAnalysisFilter('all');
            }
        }
    }, [location.pathname, setAdminSystemMode]);
`;

code = code.replace("const [newUser, setNewUser]", routerLogic + "\n    const [newUser, setNewUser]");

code = code.replace(
    /onClick=\{\(\) \=\> \{ setAdminSystemMode\('analysis'\); setSelectedAnalysisDept\(dept\); setAnalysisFilter\('all'\); window\.scrollTo\(0,0\); \}\}/g,
    "onClick={() => { navigate('/analysis/' + encodeURIComponent(dept)); window.scrollTo(0,0); }}"
);

// We should also change the back button on Analysis details view to navigate back
code = code.replace(
    /onClick=\{\(\) \=\> setSelectedAnalysisDept\(null\)\}/g,
    "onClick={() => { navigate(-1); setTimeout(() => setSelectedAnalysisDept(null), 100); }}"
);

fs.writeFileSync('src/App.jsx', code);
