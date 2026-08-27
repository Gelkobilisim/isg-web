const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// ModDashboard handleSubmit check
code = code.replace(
  'if (!imgPreview) {\n            alert(t(\'err_photo_required\') || "Lütfen ihlali kanıtlayacak bir fotoğraf ekleyin.");\n            return;\n        }',
  '// Photo is now optional for ISG Mod\n        // if (!imgPreview) { ... }'
);

// Form Label
code = code.replace(
  '<label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t(\'photo\') || \'Fotoğraf\'} <span className="text-red-500">({t(\'photo_required\') || \'Zorunlu\'})</span></label>',
  '<label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t(\'photo\') || \'Fotoğraf\'} <span className="text-gray-400 dark:text-gray-500">({t(\'optional\') || \'İsteğe Bağlı\'})</span></label>'
);

fs.writeFileSync('src/App.jsx', code);
