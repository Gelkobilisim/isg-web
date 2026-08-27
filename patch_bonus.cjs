const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldCheck = "if (points.lastDailyBonus === formattedYesterday) return;";
const newCheck = "if (points.lastDailyBonus === formattedYesterday || (points.lastDailyBonus && points.lastDailyBonus.startsWith(formattedYesterday))) return;\n        const today = new Date();\n        const formattedToday = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;\n        if (points.lastDailyBonus === formattedToday) return; // Prevent double distribution on same day";

code = code.replace(oldCheck, newCheck);

// Let's also enforce it checks today
const oldUpdate = "updates.lastDailyBonus = formattedYesterday;";
const newUpdate = "updates.lastDailyBonus = formattedToday;";
code = code.replace(oldUpdate, newUpdate);

fs.writeFileSync('src/App.jsx', code);
