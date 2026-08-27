const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  /const YuklemeciDashboard = \(\) => \{[\s\S]*?const \[mobileMenuOpen, setMobileMenuOpen\] = useState\(false\);/,
  `$&
    const [yuklemeCalendarMonth, setYuklemeCalendarMonth] = useState(new Date().getMonth());
    const [yuklemeCalendarYear, setYuklemeCalendarYear] = useState(new Date().getFullYear());`
);

code = code.replace(
  /const currDate = new Date\(\);\s*const currentMonth = currDate\.getMonth\(\);\s*const currentYear = currDate\.getFullYear\(\);\s*const daysInMonth = new Date\(currentYear, currentMonth \+ 1, 0\)\.getDate\(\);\s*const firstDay = new Date\(currentYear, currentMonth, 1\)\.getDay\(\);/,
  `const currDate = new Date();
       const currentMonth = yuklemeCalendarMonth;
       const currentYear = yuklemeCalendarYear;
       const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
       const firstDay = new Date(currentYear, currentMonth, 1).getDay();`
);

// We need to add arrows to the Yükleme calendar header
code = code.replace(
  /<h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xl flex items-center">\s*<CalendarDays className="w-6 h-6 mr-3 text-orange-500"\/> \{monthNames\[currentMonth\]\} \{currentYear\}\s*<\/h3>/,
  `<div className="flex items-center space-x-4">
                     <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xl flex items-center">
                       <CalendarDays className="w-6 h-6 mr-3 text-orange-500"/> {monthNames[currentMonth]} {currentYear}
                     </h3>
                     <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                       <button onClick={() => {
                          if (yuklemeCalendarMonth === 0) { setYuklemeCalendarMonth(11); setYuklemeCalendarYear(y => y - 1); }
                          else { setYuklemeCalendarMonth(m => m - 1); }
                       }} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                       <button onClick={() => {
                          setYuklemeCalendarMonth(new Date().getMonth());
                          setYuklemeCalendarYear(new Date().getFullYear());
                       }} className="px-2 text-xs font-bold text-gray-600 dark:text-gray-300">Bugün</button>
                       <button onClick={() => {
                          if (yuklemeCalendarMonth === 11) { setYuklemeCalendarMonth(0); setYuklemeCalendarYear(y => y + 1); }
                          else { setYuklemeCalendarMonth(m => m + 1); }
                       }} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
                     </div>
                   </div>`
);

fs.writeFileSync('src/App.jsx', code);
