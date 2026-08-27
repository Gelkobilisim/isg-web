const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /             <\/div>\n          <\/div>\n        \);\n      \}\n             <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">([\s\S]*?)<\/div>\n\n\n      if \(adminViewMode === 'users'\) \{/;

const match = code.match(regex);
if (match) {
    const pointLogsHTML = '             <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">' + match[1] + '</div>';
    code = code.replace(regex, '             </div>\n' + pointLogsHTML + '\n          </div>\n        );\n      }\n\n\n      if (adminViewMode === \'users\') {');
    fs.writeFileSync('src/App.jsx', code);
    console.log("Fixed!");
} else {
    console.log("Not matched");
}
