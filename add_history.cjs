const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state
code = code.replace(
  "const [points, setPoints] = useState({});",
  "const [points, setPoints] = useState({});\n  const [pointsHistory, setPointsHistory] = useState({});"
);

// 2. Add snapshot
code = code.replace(
  "const unsubLoadings = onSnapshot(collection(db, \"loadings\"), (snapshot) => {",
  "const unsubPointsHistory = onSnapshot(doc(db, \"system\", \"points_history\"), (docSnap) => {\n      if (docSnap.exists()) { setPointsHistory(docSnap.data()); }\n    });\n\n    const unsubLoadings = onSnapshot(collection(db, \"loadings\"), (snapshot) => {"
);

// 3. Cleanup
code = code.replace(
  "return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); };",
  "return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); unsubPointsHistory(); };"
);

// 4. Add to context
code = code.replace(
  "lang, setLang, users, setUsers, points, setPoints, tasks, setTasks,",
  "lang, setLang, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,"
);
code = code.replace(
  "currentUser, isFirebaseLoading, lang, users, points, tasks, loadings,",
  "currentUser, isFirebaseLoading, lang, users, points, pointsHistory, tasks, loadings,"
);

// 5. Destructure in AdminDashboard (which is inside App.jsx as renderRightPanel / components)
code = code.replace(
  "lang, setLang, users, setUsers, points, setPoints, tasks, setTasks,",
  "lang, setLang, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,"
);

fs.writeFileSync('src/App.jsx', code);
