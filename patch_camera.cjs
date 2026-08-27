const fs = require('fs');

let i18n = fs.readFileSync('src/i18n.js', 'utf8');
const trAdds = `
    err_photo_required: "Lütfen ihlali kanıtlayacak bir fotoğraf ekleyin.",
    photo_required: "Zorunlu",`;
const enAdds = `
    err_photo_required: "Please add a photo to prove the violation.",
    photo_required: "Required",`;

i18n = i18n.replace(/export_pdf: "PDF Olarak Kaydet",/, "export_pdf: \"PDF Olarak Kaydet\",\n" + trAdds);
i18n = i18n.replace(/export_pdf: "Export as PDF",/, "export_pdf: \"Export as PDF\",\n" + enAdds);
fs.writeFileSync('src/i18n.js', i18n);

let app = fs.readFileSync('src/App.jsx', 'utf8');

const submitOld = `    const handleSubmit = (e) => {
        e.preventDefault();
        const current = formRef.current;
        createTask(current.dept, current.priority, current.desc, 24, imgPreview);
        formRef.current = { dept: "Boyahane", priority: 'yuksek', desc: '' };
        e.target.reset();
        setImgPreview(null);
        alert(t('success_created') || "İhlal kaydı oluşturuldu.");
    };`;

const submitNew = `    const handleSubmit = (e) => {
        e.preventDefault();
        if (!imgPreview) {
            alert(t('err_photo_required') || "Lütfen ihlali kanıtlayacak bir fotoğraf ekleyin.");
            return;
        }
        const current = formRef.current;
        createTask(current.dept, current.priority, current.desc, 24, imgPreview);
        formRef.current = { dept: "Boyahane", priority: 'yuksek', desc: '' };
        e.target.reset();
        setImgPreview(null);
        alert(t('success_created') || "İhlal kaydı oluşturuldu.");
    };`;

app = app.replace(submitOld, submitNew);

const inputOld = `<label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('photo') || 'Fotoğraf'} ({t('optional') || 'Opsiyonel'})</label>
                        <input type="file" id="modCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)} />`;
                        
const inputNew = `<label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('photo') || 'Fotoğraf'} <span className="text-red-500">({t('photo_required') || 'Zorunlu'})</span></label>
                        <input type="file" id="modCamera" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)} />`;

app = app.replace(inputOld, inputNew);

fs.writeFileSync('src/App.jsx', app);
