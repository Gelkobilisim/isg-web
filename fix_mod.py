import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Extract old ModDashboard
start_idx = content.find("const ModDashboard = () => {")

brace_count = 0
found_first = False
end_idx = start_idx
for i in range(start_idx, len(content)):
    if content[i] == '{':
        brace_count += 1
        found_first = True
    elif content[i] == '}':
        brace_count -= 1
    
    if found_first and brace_count == 0:
        end_idx = i + 1
        break

old_mod = content[start_idx:end_idx]

new_mod = """const ModDashboard = () => {
    const ctx = useAppContext();
    const { t, tasks, createTask, updateTaskStatus, DEPARTMENTS } = ctx;
    
    const [activeTab, setActiveTab] = React.useState('create'); // 'create' or 'review'
    const [actionModal, setActionModal] = React.useState({ isOpen: false, taskId: null, action: null });
    const [modNote, setModNote] = React.useState('');
    const [imgPreview, setImgPreview] = React.useState(null);
    const [formState, setFormState] = React.useState({ dept: 'Boyahane', priority: 'yuksek', subject: '', desc: '' });

    const reviewTasks = React.useMemo(() => {
        return tasks.filter(t => t.status === 'onay_bekliyor' || t.status === 'itiraz_edildi').sort((a,b) => b.timestamp - a.timestamp);
    }, [tasks]);

    const handleSubmit = (e) => {
        e.preventDefault();
        createTask(formState.dept, formState.priority, formState.subject, formState.desc, 24, imgPreview);
        setFormState({ dept: 'Boyahane', priority: 'yuksek', subject: '', desc: '' });
        setImgPreview(null);
        alert(t('success_created') || "İhlal kaydı oluşturuldu.");
        setActiveTab('review');
    };

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (actionModal.action === 'approve') { 
            updateTaskStatus(actionModal.taskId, 'kapatildi', modNote, '', '');
        } else if (actionModal.action === 'reject') { 
            updateTaskStatus(actionModal.taskId, 'acik', modNote, '', '');
        }
        setActionModal({ isOpen: false, taskId: null, action: null });
        setModNote('');
    };

    const handleImageUpload = (file, setter) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setter(reader.result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8 animate-slide-up">
            
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold flex items-center text-gray-800 dark:text-gray-100">
                        <ShieldAlert className="w-8 h-8 mr-3 text-blue-500"/> 
                        İSG Uzmanı Paneli
                    </h2>
                    
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-full md:w-auto">
                        <button 
                            onClick={() => setActiveTab('create')} 
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <span className="flex items-center justify-center"><Plus className="w-4 h-4 mr-2" /> İhlal Oluştur</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('review')} 
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'review' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <span className="flex items-center justify-center">
                                <CheckSquare className="w-4 h-4 mr-2" /> 
                                Yanıtları Kontrol Et 
                                {reviewTasks.length > 0 && <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{reviewTasks.length}</span>}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'create' && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                    <h2 className="text-xl md:text-2xl font-extrabold mb-6 flex items-center text-gray-800 dark:text-gray-100"><AlertTriangle className="w-6 h-6 mr-3 text-blue-500"/> {t('create_violation') || 'İhlal Kaydı Oluştur'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('department') || 'Departman'}</label>
                                <select required value={formState.dept} onChange={e=>setFormState({...formState, dept: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 dark:text-gray-100">
                                    {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{t(d.key)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('priority') || 'Öncelik Seviyesi'}</label>
                                <select required value={formState.priority} onChange={e=>setFormState({...formState, priority: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 dark:text-gray-100">
                                    <option value="kritik">{t('pri_kritik') || 'Kritik'}</option>
                                    <option value="yuksek">{t('high') || 'Yüksek'}</option>
                                    <option value="orta">{t('medium') || 'Orta'}</option>
                                    <option value="dusuk">{t('low') || 'Düşük'}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Konu / Başlık</label>
                            <input type="text" required value={formState.subject} onChange={e=>setFormState({...formState, subject: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100" placeholder="Örn: Baret Kullanımı" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('description') || 'Açıklama / İhlal Detayı'}</label>
                            <textarea required rows="4" value={formState.desc} onChange={e=>setFormState({...formState, desc: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100" placeholder={t('ph_desc') || 'İhlal detayı...'}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('photo') || 'Fotoğraf'} <span className="text-gray-400 dark:text-gray-500">({t('optional') || 'İsteğe Bağlı'})</span></label>
                            <input type="file" id="modCamera" accept="image/*" className="hidden" onChange={(e) => { handleImageUpload(e.target.files[0], setImgPreview); e.target.value = null; }} />
                            <label htmlFor="modCamera" className="w-full h-48 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">
                                {imgPreview ? ( <img loading="lazy" decoding="async" src={imgPreview} className="w-full h-full object-cover" /> ) : (
                                    <><div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8 text-gray-500 group-hover:text-blue-500" /></div>
                                    <span className="text-sm font-bold">{t('cam_open') || 'Kamerayı Aç / Fotoğraf Yükle'}</span></>
                                )}
                            </label>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center transition-colors"><Send className="w-5 h-5 mr-2"/> {t('send') || 'Kaydı Gönder'}</button>
                    </form>
                </div>
            )}

            {activeTab === 'review' && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                    <h2 className="text-xl md:text-2xl font-extrabold mb-6 flex items-center text-gray-800 dark:text-gray-100"><CheckCircle className="w-6 h-6 mr-3 text-green-500"/> {t('pending_reviews') || 'İnceleme Bekleyen Kayıtlar'}</h2>
                    
                    {reviewTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full inline-block mb-4">
                                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Harika! Bekleyen yanıt yok.</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Şefler tarafından gönderilen çözümler veya itirazlar burada görünecektir.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {reviewTasks.map(task => {
                                const isObjection = task.status === 'itiraz_edildi';
                                return (
                                    <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">{task.subject || "İhlal Bildirimi"}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">({t(ctx.getDeptKey(task.dept))})</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'yuksek' || task.priority === 'kritik' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{t(task.priority)}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${isObjection ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{isObjection ? (t('stat_itiraz') || 'İtiraz Edildi') : (t('stat_onay') || 'Onay Bekliyor')}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-200 mb-4"><span className="font-bold">{t('initial_note') || 'İlk İhlal Notu'}:</span> {task.desc}</p>
                                            
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">{isObjection ? (t('chief_obj_note') || 'Birim Şefi İtiraz Notu') + ':' : (t('chief_fix_note') || 'Birim Şefi Çözüm Notu') + ':'}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-200">{task.chiefNote || (t('no_note') || 'Not girilmemiş.')}</p>
                                            </div>
                                        </div>
                                        
                                        {task.afterImgUrl && (
                                            <div className="w-full md:w-48 h-32 flex-shrink-0 mt-2 md:mt-0">
                                                <img 
                                                    loading="lazy" 
                                                    decoding="async" 
                                                    src={task.afterImgUrl} 
                                                    onClick={() => {
                                                        ctx.setPreviewModalImg(task.afterImgUrl);
                                                        ctx.setPreviewModalTitle(isObjection ? "İtiraz Fotoğrafı" : "Çözüm Fotoğrafı");
                                                    }}
                                                    className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-700 cursor-zoom-in hover:opacity-90" 
                                                    alt="Çözüm" 
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col gap-3 justify-center md:min-w-[150px]">
                                            <button onClick={() => setActionModal({ isOpen: true, taskId: task.id, action: 'approve' })} className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">{isObjection ? (t('accept_obj') || 'İtirazı Kabul Et') : (t('approve_close') || 'Onayla (Kapat)')}</button>
                                            <button onClick={() => setActionModal({ isOpen: true, taskId: task.id, action: 'reject' })} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">{isObjection ? (t('reject_obj') || 'İtirazı Reddet') : (t('reject_return') || 'Reddet (Geri Gönder)')}</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{actionModal.action === 'approve' ? (t('approve_action') || 'Onaylama İşlemi') : (t('reject_action') || 'Reddetme İşlemi')}</h3>
                            <button type="button" onClick={() => { setActionModal({ isOpen: false, taskId: null, action: null }); setModNote(''); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><X className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={handleActionSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('mod_note') || 'İSG Uzmanı Notu / Geri Bildirim'}</label>
                                <textarea rows="3" value={modNote} onChange={e=>setModNote(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100" placeholder={t('ph_mod_note') || 'İsteğe bağlı açıklama...'}></textarea>
                            </div>
                            <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all ${actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {actionModal.action === 'approve' ? (t('approve_btn') || 'İşlemi Onayla') : (t('reject_btn') || 'Reddet ve Geri Gönder')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};"""

content = content.replace(old_mod, new_mod)

with open('src/App.jsx', 'w') as f:
    f.write(content)

