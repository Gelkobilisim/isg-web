const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// I'll replace the block from 960 to the end of Puan Hareketleri with the correct structure.

const searchRegex = /<\/\/div>\n                        \)\n                     \}\)}\n                   <\/div>\n                \)\}\n             <\/div>\n          <\/div>\n        \);\n      \}\n             <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">/;

// Wait, I can just use sed to do surgery.
// Let's move lines 969 to 999 BEFORE 966.

