const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace("{t('save_btn_confirm') || 'Sıfırla ve Kaydet'}", "(t('save_btn_confirm') || 'Sıfırla ve Kaydet')");

fs.writeFileSync('src/App.jsx', code);
