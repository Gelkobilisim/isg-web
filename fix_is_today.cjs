const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// For ISG Calendar
code = code.replace(
  /const isToday = dayNum === currDate\.getDate\(\);/g,
  'const isToday = dayNum === currDate.getDate() && currentMonth === currDate.getMonth() && currentYear === currDate.getFullYear();'
);

fs.writeFileSync('src/App.jsx', code);
