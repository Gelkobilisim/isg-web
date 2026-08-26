const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The language button:
code = code.replace(
  /className="hidden sm:flex items-center space-x-1 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700"/g,
  'className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700"'
);

// The dark mode button:
code = code.replace(
  /className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 dark:hover:text-white transition-colors"/g,
  'className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 transition-colors"'
);

// Change space-x-4 to space-x-2 sm:space-x-4
code = code.replace(
  /<div className="flex items-center space-x-4">\s*<button onClick=\{toggleLang\}/,
  '<div className="flex items-center space-x-2 sm:space-x-4">\n             <button onClick={toggleLang}'
);

fs.writeFileSync('src/App.jsx', code);
