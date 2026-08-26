const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  'all_reports: "Tüm Sevkiyat Raporları",',
  'all_reports: "Tüm Sevkiyat Raporları", filter_day: "Bugün", filter_week: "Bu Hafta", filter_month: "Bu Ay", filter_all: "Tümü",'
);

code = code.replace(
  'all_reports: "All Shipment Reports",',
  'all_reports: "All Shipment Reports", filter_day: "Today", filter_week: "This Week", filter_month: "This Month", filter_all: "All",'
);

code = code.replace(
  />Bugün<\/button>/g,
  ">{t('filter_day')}</button>"
);
code = code.replace(
  />Bu Hafta<\/button>/g,
  ">{t('filter_week')}</button>"
);
code = code.replace(
  />Bu Ay<\/button>/g,
  ">{t('filter_month')}</button>"
);
code = code.replace(
  />Tümü<\/button>/g,
  ">{t('filter_all')}</button>"
);

fs.writeFileSync('src/App.jsx', code);
