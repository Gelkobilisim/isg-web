const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "const formattedYesterday = yesterday.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });",
  "const formattedYesterday = \`\${yesterday.getDate().toString().padStart(2, '0')}.\${(yesterday.getMonth() + 1).toString().padStart(2, '0')}.\${yesterday.getFullYear()}\`;"
);

fs.writeFileSync('src/App.jsx', code);
