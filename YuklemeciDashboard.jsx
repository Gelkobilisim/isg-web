const YuklemeciDashboard = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ 
      plaka: '', 
      sofor: '', 
      destCountry: 'Türkiye',
      destLocation: '', 
      destCompany: '', 
      projectNo: '', 
      tonnage: '', 
      not: '' 
    });
    const [imgPreview, setImgPreview] = useState(null);
    const [finishModal, setFinishModal] = useState({ isOpen: false, loadId: null, note: '', imgPreview: null });

    const activeLoadings = loadings.filter(l => l.status === 'beklemede' || l.status === 'yukleniyor');
    const tonnage24h = get24HourTonnage();

    const handleStartLoading = (e) => {
      e.preventDefault();
      createLoading(form.plaka, form.sofor, form.destCountry, form.destLocation, form.destCompany, form.projectNo, form.tonnage, form.not, imgPreview);
      setForm({ plaka: '', sofor: '', destCountry: 'Türkiye', destLocation: '', destCompany: '', projectNo: '', tonnage: '', not: '' });
      setImgPreview(null);
      setIsCreating(false);
    };

    const handleFinishLoading = () => {
      finishLoading(finishModal.loadId, finishModal.note, finishModal.imgPreview);
      setFinishModal({ isOpen: false, loadId: null, note: '', imgPreview: null });
    };

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 bg-orange-50/30">
        <div className="bg-gradient-to-r from-orange-600 to-amber-700 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-8 gap-4">
          <div className="z-10">
            <h1 className="text-3xl font-extrabold mb-2 flex items-center"><Truck className="w-8 h-8 mr-3"/> {t('yuk_title')}</h1>
            <p className="text-orange-100 font-medium">{t('yuk_desc')}</p>
          </div>
          <div className="z-10 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center space-x-3">
             <div className="bg-white/20 p-2 rounded-xl"><Scale className="w-6 h-6 text-white" /></div>
             <div>
               <p className="text-[11px] uppercase font-bold text-orange-200 tracking-wider">{t('tonnage_24h')}</p>
               <p className="text-2xl font-extrabold text-white">{tonnage24h.toLocaleString('tr-TR')} <span className="text-sm font-medium">Ton</span></p>
             </div>
          </div>
          <Package className="w-48 h-48 text-white opacity-10 absolute right-0 -bottom-10 z-0 transform -rotate-12 pointer-events-none" />
        </div>

        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="w-full bg-white border-2 border-dashed border-orange-300 hover:border-orange-500 text-orange-700 py-6 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all flex justify-center items-center space-x-3 mb-8 group">
            <div className="bg-orange-100 p-2 rounded-full group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div>
            <span className="text-lg">{t('new_load_btn')}</span>
          </button>
        )}

        {isCreating && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-orange-100 mb-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-xl text-gray-800 flex items-center"><Truck className="w-6 h-6 mr-2 text-orange-500"/> {t('load_form_title')}</h3>
              <button onClick={() => {setIsCreating(false); setImgPreview(null); setForm({plaka:'', sofor:'', destLocation:'', destCompany:'', projectNo:'', tonnage:'', not:''});}} className="text-gray-400 hover:text-gray-700"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleStartLoading} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('plate_no')}</label>
                  <input required type="text" value={form.plaka} onChange={e=>setForm({...form, plaka: e.target.value.toUpperCase()})} className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('driver_name')}</label>
                  <input type="text" value={form.sofor} onChange={e=>setForm({...form, sofor: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('dest_country')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select required value={form.destCountry} onChange={e=>setForm({...form, destCountry: e.target.value})} className="w-full border border-gray-300 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('dest_location')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="text" value={form.destLocation} onChange={e=>setForm({...form, destLocation: e.target.value})} className="w-full border border-gray-300 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Örn: İstanbul / Dilovası" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('dest_company')}</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="text" value={form.destCompany} onChange={e=>setForm({...form, destCompany: e.target.value})} className="w-full border border-gray-300 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Örn: ABB Trafo A.Ş." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('project_no')}</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="text" value={form.projectNo} onChange={e=>setForm({...form, projectNo: e.target.value})} className="w-full border border-gray-300 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Örn: PRJ-2026-88" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('tonnage')}</label>
                  <div className="relative">
                    <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="number" step="any" value={form.tonnage} onChange={e=>setForm({...form, tonnage: e.target.value})} className="w-full border border-gray-300 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700" placeholder="Örn: 24.5 (Ton)" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('cam_pre')}</label>
                <input type="file" id="preLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)} />
                <div onClick={() => document.getElementById('preLoadCamera').click()} className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-colors group overflow-hidden">
                  {imgPreview ? ( <img src={imgPreview} className="w-full h-full object-cover" /> ) : (
                    <><div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110"><Camera className="w-6 h-6 text-gray-500 group-hover:text-orange-500" /></div>
                    <span className="text-sm font-bold">{t('cam_open')}</span><span className="text-xs text-gray-400 mt-1">{t('optional')}</span></>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('note_pre')}</label>
                <input type="text" value={form.not} onChange={e=>setForm({...form, not: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg">{t('start_load_btn')}</button>
            </form>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-500"/> {t('active_loads')} ({activeLoadings.length})</h2>
        </div>

        {activeLoadings.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border border-gray-100 shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <p className="font-bold text-xl text-gray-800">{t('no_active_loads')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('no_active_desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLoadings.map(load => (
              <div key={load.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{t('plate')}</span><span className="text-xl font-extrabold text-gray-800">{load.plaka}</span></div>
                  <div className="text-right"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{t('entry_time')}</span><span className="text-lg font-bold text-blue-600">{load.createdAtTime}</span></div>
                </div>
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  {load.sofor && <p className="text-xs text-gray-600 font-medium"><User className="w-3.5 h-3.5 inline mr-1 text-gray-400"/> {t('driver')}: <span className="text-gray-800 font-bold">{load.sofor}</span></p>}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs bg-orange-50/60 p-3 rounded-xl border border-orange-100">
                    <div><span className="text-gray-400 font-bold block text-[10px]">{t('dest_country')}</span><span className="font-bold text-gray-800">{load.destCountry || '-'}</span></div>
                    <div><span className="text-gray-400 font-bold block text-[10px]">{t('dest_location')}</span><span className="font-bold text-gray-800">{load.destLocation || '-'}</span></div>
                    <div><span className="text-gray-400 font-bold block text-[10px]">{t('dest_company')}</span><span className="font-bold text-gray-800">{load.destCompany || '-'}</span></div>
                    <div><span className="text-gray-400 font-bold block text-[10px]">{t('tonnage')}</span><span className="font-extrabold text-orange-700">{load.tonnage ? `${load.tonnage} Ton` : '-'}</span></div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 p-3 rounded-xl border border-gray-100 mt-auto">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => load.preImgUrl && setPreviewModalImg(load.preImgUrl)}>
                       {load.preImgUrl ? (
                          <>
                            <img src={load.preImgUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                          </>
                       ) : <><ImageIcon className="w-5 h-5 mb-1"/><span className="text-[8px] font-bold">{t('no_photo')}</span></>}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">{t('pre_note_title')}</p>
                      <p className="text-sm text-gray-800 font-medium">{load.preNote || t('no_note')}</p>
                    </div>
                  </div>
                  {load.status === 'beklemede' ? (
                    <button onClick={() => startLoadingProcess(load.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center mt-2 transition-colors">
                      <Truck className="w-5 h-5 mr-2" /> {t('start_loading')}
                    </button>
                  ) : (
                    <button onClick={() => setFinishModal({isOpen: true, loadId: load.id, note: '', imgPreview: null})} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center mt-2 transition-colors">
                      <CheckSquare className="w-5 h-5 mr-2" /> {t('finish_load_btn')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {finishModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-green-600 text-white flex justify-between items-center">
                <h3 className="font-bold text-xl flex items-center"><Save className="w-6 h-6 mr-3"/> {t('finish_form_title')}</h3>
                <button onClick={() => setFinishModal({ isOpen: false, loadId: null, note: '', imgPreview: null })} className="p-2 hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('cam_post')}</label>
                  <input type="file" id="postLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], (img) => setFinishModal({...finishModal, imgPreview: img}))} />
                  <div onClick={() => document.getElementById('postLoadCamera').click()} className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-colors group overflow-hidden">
                    {finishModal.imgPreview ? ( <img src={finishModal.imgPreview} className="w-full h-full object-cover" /> ) : (
                      <><div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110"><Camera className="w-6 h-6 text-gray-500 group-hover:text-green-500" /></div>
                      <span className="text-sm font-bold">{t('cam_open')}</span></>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('note_post')}</label>
                  <input type="text" value={finishModal.note} onChange={e=>setFinishModal({...finishModal, note: e.target.value})} className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <button onClick={() => setFinishModal({ isOpen: false, loadId: null, note: '', imgPreview: null })} className="flex-1 py-4 font-bold text-gray-600 bg-gray-100 rounded-xl">{t('cancel')}</button>
                  <button onClick={handleFinishLoading} className="flex-1 py-4 font-bold text-white bg-green-600 rounded-xl shadow-lg">{t('close_job')}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }