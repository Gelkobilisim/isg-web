const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  /const filterTasks = useMemo\(\(\) => selectedAdminDept \? tasks\.filter\(t => t\.dept === selectedAdminDept\) : tasks\.filter\(t => t\.createdAt === selectedAdminDate\), \[tasks, selectedAdminDept, selectedAdminDate\]\);/g,
  `const filterTasks = selectedAdminDept ? tasks.filter(t => t.dept === selectedAdminDept) : tasks.filter(t => t.createdAt === selectedAdminDate);`
);

code = code.replace(
  /const filteredUsers = useMemo\(\(\) => users\.filter\(u => accountTab === 'isg' \? \(u\.role !== 'yuklemeci'\) : \(u\.role === 'yuklemeci'\)\), \[users, accountTab\]\);/g,
  `const filteredUsers = users.filter(u => accountTab === 'isg' ? (u.role !== 'yuklemeci') : (u.role === 'yuklemeci'));`
);

code = code.replace(
  /const sortedDepts = useMemo\(\(\) => Object\.keys\(points\)\.filter\(key => key !== 'lastDailyBonus'\)\.sort\(\(a,b\) => points\[b\] - points\[a\]\), \[points\]\);/g,
  `const sortedDepts = Object.keys(points).filter(key => key !== 'lastDailyBonus').sort((a,b) => points[b] - points[a]);`
);

code = code.replace(
  /const dateLoadings = useMemo\(\(\) => loadings\.filter\(l => l\.createdAtDate === selectedYuklemeDate\), \[loadings, selectedYuklemeDate\]\);/g,
  `const dateLoadings = loadings.filter(l => l.createdAtDate === selectedYuklemeDate);`
);

// countryStats etc
const analysisCalcRegex = /const \{ sortedCountries, sortedCompanies, countryStats, companyStats \} = useMemo\(\(\) => \{[\s\S]*?return \{ sortedCountries: sCountries, sortedCompanies: sCompanies, countryStats: cStats, companyStats: compStats \};\n    \}, \[loadings\]\);/;

const newAnalysisCalc = `const countryStats = {};
       const companyStats = {};
       loadings.forEach(load => {
          const tVal = parseFloat(load.tonnage) || 0;
          const cName = load.destCountry || 'Belirsiz';
          const compName = load.destCompany || 'Belirsiz';
          
          if(!countryStats[cName]) countryStats[cName] = { count: 0, ton: 0 };
          countryStats[cName].count += 1;
          countryStats[cName].ton += tVal;

          if(!companyStats[compName]) companyStats[compName] = { count: 0, ton: 0 };
          companyStats[compName].count += 1;
          companyStats[compName].ton += tVal;
       });
       const sortedCountries = Object.keys(countryStats).sort((a,b) => countryStats[b].ton - countryStats[a].ton);
       const sortedCompanies = Object.keys(companyStats).sort((a,b) => companyStats[b].ton - companyStats[a].ton);`;

code = code.replace(analysisCalcRegex, newAnalysisCalc);

// loadingsByDate
code = code.replace(
  /const loadingsByDate = useMemo\(\(\) => \{\n         const map = \{\};\n         loadings\.forEach\(l => \{\n           if\(!map\[l\.createdAtDate\]\) map\[l\.createdAtDate\] = \[\];\n           map\[l\.createdAtDate\]\.push\(l\);\n         \}\);\n         return map;\n       \}, \[loadings\]\);/g,
  `const loadingsByDate = {};\n         loadings.forEach(l => {\n           if(!loadingsByDate[l.createdAtDate]) loadingsByDate[l.createdAtDate] = [];\n           loadingsByDate[l.createdAtDate].push(l);\n         });`
);

// tasksByDate (two places)
code = code.replace(
  /const tasksByDate = useMemo\(\(\) => \{ const map = \{\}; tasks\.forEach\(t => \{ if\(!map\[t\.createdAt\]\) map\[t\.createdAt\] = \[\]; map\[t\.createdAt\]\.push\(t\); \}\); return map; \}, \[tasks\]\);/g,
  `const tasksByDate = {}; tasks.forEach(t => { if(!tasksByDate[t.createdAt]) tasksByDate[t.createdAt] = []; tasksByDate[t.createdAt].push(t); });`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Reverted conditional useMemos');
