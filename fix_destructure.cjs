const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  /lang, setLang, users, setUsers, points, setPoints, tasks, setTasks,/g,
  "lang, setLang, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,"
);

fs.writeFileSync('src/App.jsx', code);
