const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  /const AdminDashboard = \(\) => \{[\s\S]*?const \[accountTab, setAccountTab\] = useState\('isg'\);/,
  `$&
    const [isgCalendarMonth, setIsgCalendarMonth] = useState(new Date().getMonth());
    const [isgCalendarYear, setIsgCalendarYear] = useState(new Date().getFullYear());`
);

// We need to replace the calendar logic inside AdminDashboard
code = code.replace(
  /const currDate = new Date\(\);\s*const currentMonth = currDate\.getMonth\(\);\s*const currentYear = currDate\.getFullYear\(\);\s*const daysInMonth = new Date\(currentYear, currentMonth \+ 1, 0\)\.getDate\(\);\s*const firstDay = new Date\(currentYear, currentMonth, 1\)\.getDay\(\);/,
  `const currDate = new Date();
      const currentMonth = isgCalendarMonth;
      const currentYear = isgCalendarYear;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();`
);

// We also need to add arrows to the ISG calendar header
code = code.replace(
  /<h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-2xl flex items-center">\s*<CalendarDays className="w-7 h-7 mr-3 text-blue-600"\/> \{monthNames\[currentMonth\]\} \{currentYear\}\s*<\/h3>/,
  `<div className="flex items-center space-x-4">
                 <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-2xl flex items-center">
                   <CalendarDays className="w-7 h-7 mr-3 text-blue-600"/> {monthNames[currentMonth]} {currentYear}
                 </h3>
                 <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                   <button onClick={() => {
                      if (isgCalendarMonth === 0) { setIsgCalendarMonth(11); setIsgCalendarYear(y => y - 1); }
                      else { setIsgCalendarMonth(m => m - 1); }
                   }} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                   <button onClick={() => {
                      setIsgCalendarMonth(new Date().getMonth());
                      setIsgCalendarYear(new Date().getFullYear());
                   }} className="px-2 text-xs font-bold text-gray-600 dark:text-gray-300">Bugün</button>
                   <button onClick={() => {
                      if (isgCalendarMonth === 11) { setIsgCalendarMonth(0); setIsgCalendarYear(y => y + 1); }
                      else { setIsgCalendarMonth(m => m + 1); }
                   }} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
                 </div>
               </div>`
);

fs.writeFileSync('src/App.jsx', code);
