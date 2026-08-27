const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove [db] from useCallback
code = code.replace(/await updateDoc\(taskRef, updates\);\n  \}, \[db\]\);/g, "await updateDoc(taskRef, updates);\n  }, []);");

// Remove pointLogs and CompanyLogo from useMemo inside App component
code = code.replace(
    /currentUser, isFirebaseLoading, lang, darkMode, users, points, pointsHistory, tasks, loadings, pointLogs,/g,
    "currentUser, isFirebaseLoading, lang, darkMode, users, points, pointsHistory, tasks, loadings,"
);
code = code.replace(
    /get24HourTonnage, CompanyLogo\n  \]\);/g,
    "get24HourTonnage\n  ]);"
);

fs.writeFileSync('src/App.jsx', code);
