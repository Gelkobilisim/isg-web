const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. replace onChange in modCamera
code = code.replace(
  'onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)}',
  'onChange={(e) => { handleImageUpload(e.target.files[0], setImgPreview); e.target.value = null; }}'
);

// 2. preLoadCamera
code = code.replace(
  'id="preLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)}',
  'id="preLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleImageUpload(e.target.files[0], setImgPreview); e.target.value = null; }}'
);

// 3. postLoadCamera
code = code.replace(
  'id="postLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], (img) => setFinishModal({...finishModal, imgPreview: img}))}',
  'id="postLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleImageUpload(e.target.files[0], (img) => setFinishModal({...finishModal, imgPreview: img})); e.target.value = null; }}'
);

// 4. sefCamera
code = code.replace(
  'id="sefCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setAfterImgPreview)}',
  'id="sefCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleImageUpload(e.target.files[0], setAfterImgPreview); e.target.value = null; }}'
);

fs.writeFileSync('src/App.jsx', code);
