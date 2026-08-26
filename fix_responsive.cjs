const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix Leaderboard Buttons Wrapper
code = code.replace(
  /<div className="flex gap-2 w-full sm:w-auto">[\s\S]*?<button onClick=\{handleResetAndSave\}/,
  `<div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">\n                   <button onClick={handleResetAndSave}`
);

// 2. Fix Leaderboard Row
code = code.replace(
  /<div className="text-right flex items-center space-x-4">/g,
  '<div className="text-right flex items-center space-x-2 sm:space-x-4 mt-4 sm:mt-0">'
);
code = code.replace(
  /key=\{dept\} className=\{\`flex justify-between items-center/g,
  'key={dept} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center'
);

// 3. Fix Admin Tabs Wrapper
code = code.replace(
  /className=\{`\$\{mobileMenuOpen \? 'flex' : 'hidden'\} md:flex flex-col sm:flex-row w-full md:w-auto bg-gray-100 p-1\.5 rounded-xl shadow-inner gap-1`\}/g,
  "className={`\${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col xl:flex-row flex-wrap w-full md:w-auto bg-gray-100 p-1.5 rounded-xl shadow-inner gap-1`}"
);

fs.writeFileSync('src/App.jsx', code);
