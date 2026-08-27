const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  'id="modCamera" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)}',
  'id="modCamera" accept="image/*" className="hidden" onChange={(e) => { handleImageUpload(e.target.files[0], setImgPreview); e.target.value = null; }}'
);

fs.writeFileSync('src/App.jsx', code);
