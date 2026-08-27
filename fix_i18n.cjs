const fs = require('fs');
let code = fs.readFileSync('src/i18n.js', 'utf8');

const trAdditions = `
    analysis_tab: "Analiz Raporları",
    filter_yearly: "Bu Yıl",
    dept_most_issues: "En Çok Sorun Çıkan Birim",
    dept_least_issues: "En Az Sorun Çıkan Birim",
    total_issues: "Toplam Sorun (İhlal)",
    issues: "İhlal",
    analysis_desc: "Günlük, haftalık, aylık ve yıllık bazda departmanların sorun/ihlal sayılarını detaylı olarak inceleyebilirsiniz."`;

const enAdditions = `
    analysis_tab: "Analysis Reports",
    filter_yearly: "This Year",
    dept_most_issues: "Department with Most Issues",
    dept_least_issues: "Department with Least Issues",
    total_issues: "Total Issues (Violations)",
    issues: "Violations",
    analysis_desc: "You can examine the number of issues/violations of departments in detail on a daily, weekly, monthly and yearly basis."`;

// Insert into TR object
code = code.replace(
  /dept_bakim: "Bakım & Onarım"/,
  "dept_bakim: \"Bakım & Onarım\"," + trAdditions
);

// Insert into EN object
code = code.replace(
  /dept_bakim: "Maintenance"/,
  "dept_bakim: \"Maintenance\"," + enAdditions
);

fs.writeFileSync('src/i18n.js', code);
