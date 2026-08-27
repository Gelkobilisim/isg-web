const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  'if (afterImgUrl) updates.afterImgUrl = afterImgUrl;',
  'if (finalAfterImgUrl) updates.afterImgUrl = finalAfterImgUrl;'
);

fs.writeFileSync('src/App.jsx', code);
