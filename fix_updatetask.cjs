const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  /const now = Date.now\(\);/,
  \`const now = taskData.resolvedTimestamp || Date.now();\`
);

code = code.replace(
  /if \(chiefNote\) updates\.chiefNote = chiefNote;/,
  \`if (chiefNote) updates.chiefNote = chiefNote;
    if (newStatus === 'onay_bekliyor' || newStatus === 'itiraz_edildi') updates.resolvedTimestamp = Date.now();\`
);

fs.writeFileSync('src/App.jsx', code);
