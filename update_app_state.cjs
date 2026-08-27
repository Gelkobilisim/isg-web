const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add state
code = code.replace(
  /const \[tasks, setTasks\] = useState\(\[\]\);/,
  'const [tasks, setTasks] = useState([]);\n  const [pointLogs, setPointLogs] = useState([]);'
);

// Add subscription
code = code.replace(
  /const unsubTasks = onSnapshot\(collection\(db, "tasks"\), \(snapshot\) => \{/,
  `const unsubPointLogs = onSnapshot(collection(db, "point_logs"), (snapshot) => {
      const logsData = snapshot.docs.map(doc => doc.data());
      logsData.sort((a, b) => b.timestamp - a.timestamp);
      setPointLogs(logsData);
    });

    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {`
);

// Update return
code = code.replace(
  /return \(\) => \{ unsubUsers\(\); unsubPoints\(\); unsubTasks\(\); unsubLoadings\(\); unsubPointsHistory\(\); \};/,
  'return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); unsubPointsHistory(); unsubPointLogs(); };'
);

// Add to contextValue
code = code.replace(
  /pointsHistory, setPointsHistory, tasks, setTasks,/,
  'pointsHistory, setPointsHistory, tasks, setTasks, pointLogs, setPointLogs,'
);
code = code.replace(
  /points, pointsHistory, tasks, loadings,/,
  'points, pointsHistory, tasks, loadings, pointLogs,'
);

fs.writeFileSync('src/App.jsx', code);
