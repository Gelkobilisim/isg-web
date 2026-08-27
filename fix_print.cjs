const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0"/g,
  'className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0 print:h-auto print:block"'
);

app = app.replace(
  /className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 relative"/,
  'className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 relative print:overflow-visible print:p-0 print:h-auto"'
);

app = app.replace(
  /className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors"/,
  'className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors print:min-h-0 print:bg-white print:h-auto print:block"'
);

fs.writeFileSync('src/App.jsx', app);
