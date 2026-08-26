const AdminDashboard = () => {
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    const [accountTab, setAccountTab] = useState('isg');
    
    const [historyFilter, setHistoryFilter] = useState('1');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(10);
    const [visiblePasswords, setVisiblePasswords] = useState({});
    
    const [expandedLoadId, setExpandedLoadId] = useState(null);
    const [yuklemeAnaTab, setYuklemeAnaTab] = useState('list');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
      let timer;
      if (showDeleteModal && deleteCountdown > 0) {
        timer = setTimeout(() => setDeleteCountdown(deleteCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showDeleteModal, deleteCountdown]);

    const togglePasswordVisibility = (userId) => {
      setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const handleCreateUser = async (e) => {
      e.preventDefault();
      if(users.find(u => u.username === newUser.username)) { alert("Username taken!"); return; }
      const newUserId = Date.now().toString();
      const finalRole = accountTab === 'yukleme' ? 'yuklemeci' : newUser.role;
      const finalDept = finalRole === 'sef' ? newUser.dept : null;
      
      const userObj = { ...newUser, role: finalRole, id: newUserId, dept: finalDept };
      await setDoc(doc(db, "users", newUserId), userObj);
      setNewUser({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    };

    const handleDeleteUser = async (id) => {
      if(id === "1") return; 
      if(window.confirm("Delete user?")) { await deleteDoc(doc(db, "users", id)); }
    };

    const executeHistoryDelete = async () => {
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      let cutoff = 0;
      if (historyFilter === '1') cutoff = now - (1 * oneMonth);
      else if (historyFilter === '3') cutoff = now - (3 * oneMonth);
      else if (historyFilter === '6') cutoff = now - (6 * oneMonth);
      else if (historyFilter === 'all') cutoff = now + 10000;

      const tasksToDelete = tasks.filter(t => t.timestamp <= cutoff);
      for (const t of tasksToDelete) { await deleteDoc(doc(db, "tasks", t.id)); }
      const loadsToDelete = loadings.filter(l => l.timestamp <= cutoff);
      for (const l of loadsToDelete) { await deleteDoc(doc(db, "loadings", l.id)); }

      setShowDeleteModal(false); setDeleteCountdown(10);
    };

    const renderRightPanel = () => {
      if (adminViewMode === 'users') {
        const filteredUsers = users.filter(u => accountTab === 'isg' ? (u.role !== 'yuklemeci') : (u.role === 'yuklemeci'));
        
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Users className="w-6 h-6 mr-2 text-blue-600"/> {t('user_management')}</h2>
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner mb-6">
               <button onClick={() => setAccountTab('isg')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center ${accountTab === 'isg' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
                 <ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_accounts')}
               </button>
               <button onClick={() => setAccountTab('yukleme')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center ${accountTab === 'yukleme' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                 <Truck className="w-4 h-4 mr-2" /> {t('yukleme_accounts')}
               </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8 space-y-4">
              <h3 className="font-bold text-gray-700 text-sm mb-2 border-b pb-2">{t('new_account')} ({accountTab === 'isg' ? 'İSG' : 'Yükleme'})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('fullname')}</label>
                  <input type="text" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('username')}</label>
                  <input type="text" required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('password')}</label>
                  <input type="text" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                
                {accountTab === 'isg' && (
                    <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('sys_role')}</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                        <option value="sef">Birim Şefi</option>
                        <option value="mod">İSG Uzmanı (Moderatör)</option>
                        <option value="admin">Sistem Yöneticisi</option>
                    </select>
                    </div>
                )}
                
                {accountTab === 'isg' && newUser.role === 'sef' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('dept')}</label>
                    <select value={newUser.dept} onChange={e=>setNewUser({...newUser, dept: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" className={`text-white font-bold py-2 px-4 rounded-lg text-sm w-full flex justify-center items-center ${accountTab === 'isg' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                <Plus className="w-4 h-4 mr-1"/> {t('create_acc_btn')}
              </button>
            </form>

            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-3">{t('existing_accs')} ({filteredUsers.length})</h3>
              <div className="space-y-2">
                {filteredUsers.map(u => {
                  const isVisible = visiblePasswords[u.id];
                  return (
                    <div key={u.id} className="flex justify-between items-center p-3.5 border rounded-xl hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{u.name} <span className="text-xs text-gray-400 font-normal ml-2">@{u.username}</span></p>
                        <p className="text-xs text-gray-500 capitalize">{u.role === 'sef' ? `Şef - ${u.dept}` : u.role}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Admin şifre görebilme özelliği */}
                        {currentUser?.username === 'agiradar' && (
                          <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                            <span className="text-xs font-mono font-bold text-gray-700 mr-2">
                              {isVisible ? u.password : '••••••••'}
                            </span>
                            <button onClick={() => togglePasswordVisibility(u.id)} className="text-gray-500 hover:text-gray-800 focus:outline-none">
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                        {u.id !== "1" && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><Trash2 className="w-4 h-4"/></button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

    const renderLoadingList = (listToRender) => {
      return (
        <div className="space-y-4">
          {listToRender.length === 0 ? <p className="text-gray-500 text-center py-10">{t('no_records')}</p> : (
            listToRender.map(load => {
              const isExpanded = expandedLoadId === load.id;
              const statusColor = load.status === 'tamamlandi' ? 'bg-green-100 text-green-700' : load.status === 'yukleniyor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
              return (
              <div key={load.id} className="flex flex-col gap-2">
                <div onClick={() => setExpandedLoadId(isExpanded ? null : load.id)} className="cursor-pointer border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col min-w-[100px]">
                      <span className="text-xs text-gray-400 font-bold uppercase">{t('dest_country')}</span>
                      <span className="font-bold text-gray-800">{load.destCountry || '-'}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-xs text-gray-400 font-bold uppercase">{t('dest_company')}</span>
                      <span className="font-bold text-gray-800 truncate max-w-[200px]" title={load.destCompany}>{load.destCompany || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                       {t(`status_${load.status}`)}
                    </span>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 animate-slide-up">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-3 border-b border-gray-100 gap-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-xl font-extrabold text-gray-800">{load.plaka}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium"><Calendar className="w-3 h-3 inline mr-1"/> {load.createdAtDate} - {load.createdAtTime} {load.finishedAtTime && `| Çıkış: ${load.finishedAtTime}`}</p>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600"><User className="w-4 h-4 inline text-gray-400 mr-1"/> {load.sofor || '-'}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-gray-100 mb-4">
                      <div><span className="text-gray-400 font-bold block text-[10px]">{t('dest_country')}</span><span className="font-bold text-gray-800">{load.destCountry || '-'}</span></div>
                      <div><span className="text-gray-400 font-bold block text-[10px]">{t('dest_location')}</span><span className="font-bold text-gray-800">{load.destLocation || '-'}</span></div>
                      <div><span className="text-gray-400 font-bold block text-[10px]">{t('project_no')}</span><span className="font-bold text-gray-800">{load.projectNo || '-'}</span></div>
                      <div><span className="text-gray-400 font-bold block text-[10px]">{t('tonnage')}</span><span className="font-extrabold text-orange-600">{load.tonnage ? `${load.tonnage} Ton` : '-'}</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('before')}</span>
                        {load.preImgUrl ? (
                          <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2" onClick={() => setPreviewModalImg(load.preImgUrl)}>
                             <img src={load.preImgUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                          </div>
                        ) : <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2">{t('no_photo')}</div>}
                        <p className="text-sm text-gray-700 italic">"{load.preNote || "-"}"</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('after')}</span>
                        {load.status === 'beklemede' ? <div className="w-full h-44 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-400 text-sm font-medium mb-2">{t('status_beklemede')}</div> : 
                         load.status === 'yukleniyor' ? <div className="w-full h-44 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center text-orange-400 text-sm font-medium mb-2">{t('status_yukleniyor')}</div> : (
                          <>{load.postImgUrl ? (
                            <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2" onClick={() => setPreviewModalImg(load.postImgUrl)}>
                               <img src={load.postImgUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                            </div>
                          ) : <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2">{t('no_photo')}</div>}
                          <p className="text-sm text-gray-700 italic">"{load.postNote || "-"}"</p></>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>
      );
    };

    if (adminSystemMode === 'yukleme') {
       if (selectedYuklemeDate) {
         const dateLoadings = loadings.filter(l => l.createdAtDate === selectedYuklemeDate);
         return (
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
             <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-100">
               <div>
                 <button onClick={() => setSelectedYuklemeDate(null)} className="flex items-center text-gray-500 hover:text-gray-800 font-medium text-sm mb-4">
                   <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                 </button>
                 <h2 className="text-2xl font-bold text-gray-800">{selectedYuklemeDate} Sevkiyat Raporu</h2>
                 <p className="text-gray-500 mt-1">{t('total_record')} {dateLoadings.length}</p>
               </div>
             </div>
             {renderLoadingList(dateLoadings)}
           </div>
         );
       }

       const totalTonnageAll = loadings.reduce((acc, l) => acc + (parseFloat(l.tonnage) || 0), 0);

       // Analysis calculations
       const countryStats = {};
       const companyStats = {};
       
       loadings.forEach(load => {
          const tVal = parseFloat(load.tonnage) || 0;
          const cName = load.destCountry || 'Belirsiz';
          const compName = load.destCompany || 'Belirsiz';
          
          if(!countryStats[cName]) countryStats[cName] = { count: 0, ton: 0 };
          countryStats[cName].count += 1;
          countryStats[cName].ton += tVal;

          if(!companyStats[compName]) companyStats[compName] = { count: 0, ton: 0 };
          companyStats[compName].count += 1;
          companyStats[compName].ton += tVal;
       });

       const sortedCountries = Object.keys(countryStats).sort((a,b) => countryStats[b].ton - countryStats[a].ton);
       const sortedCompanies = Object.keys(companyStats).sort((a,b) => companyStats[b].ton - companyStats[a].ton);

       const currDate = new Date();
       const currentMonth = currDate.getMonth();
       const currentYear = currDate.getFullYear();
       const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
       const firstDay = new Date(currentYear, currentMonth, 1).getDay();
       const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
       const dayNames = lang === 'tr' ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
       const monthNames = lang === 'tr' ? ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

       return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Truck className="w-6 h-6 mr-3 text-orange-500"/> {t('all_reports')}</h2>
              <p className="text-xs text-gray-500 mt-1">{t('total_tonnage')}: <b className="text-orange-600 font-bold">{totalTonnageAll.toLocaleString('tr-TR')} Ton</b></p>
            </div>
            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner">
              <button onClick={() => setYuklemeAnaTab('list')} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                Liste
              </button>
              <button onClick={() => setYuklemeAnaTab('analysis')} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'analysis' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                Analiz
              </button>
              <button onClick={() => setYuklemeAnaTab('calendar')} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                Takvim
              </button>
            </div>
          </div>

          {yuklemeAnaTab === 'analysis' ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Globe className="w-5 h-5 mr-2 text-blue-500"/> Ülkelere Göre Sevkiyatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCountries.map(c => (
                    <div key={c} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-700">{c}</span>
                      <div className="text-right">
                        <span className="block text-lg font-extrabold text-orange-600">{countryStats[c].ton.toLocaleString('tr-TR')} Ton</span>
                        <span className="text-xs text-gray-500 font-medium">{countryStats[c].count} Sevkiyat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Building2 className="w-5 h-5 mr-2 text-blue-500"/> Firmalere Göre Sevkiyatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCompanies.map(c => (
                    <div key={c} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-700 truncate w-32" title={c}>{c}</span>
                      <div className="text-right shrink-0">
                        <span className="block text-lg font-extrabold text-orange-600">{companyStats[c].ton.toLocaleString('tr-TR')} Ton</span>
                        <span className="text-xs text-gray-500 font-medium">{companyStats[c].count} Sevkiyat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : yuklemeAnaTab === 'calendar' ? (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
                 <div>
                   <h3 className="font-extrabold text-gray-800 text-xl flex items-center">
                     <CalendarDays className="w-6 h-6 mr-3 text-orange-500"/> {monthNames[currentMonth]} {currentYear}
                   </h3>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-3">
                {dayNames.map(day => <div key={day} className="text-xs font-bold text-gray-400 uppercase py-2 bg-gray-50 rounded-lg">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                 {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-gray-50 border border-gray-100 opacity-50"></div>)}
                 {Array.from({ length: daysInMonth }).map((_, i) => {
                   const dayNum = i + 1;
                   const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
                   const isToday = dayNum === currDate.getDate();
                   const dayLoadings = loadings.filter(l => l.createdAtDate === formattedDateForCell);
                   
                   return (
                     <div key={dayNum} onClick={() => dayLoadings.length > 0 && setSelectedYuklemeDate(formattedDateForCell)} className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all hover:-translate-y-1 ${isToday ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-100 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                       <span className={`text-sm md:text-base font-bold ${isToday ? 'text-orange-700' : 'text-gray-700'}`}>{dayNum}</span>
                       {dayLoadings.length > 0 && <span className="text-[9px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full mt-1 shadow-sm">{dayLoadings.length} Sevkiyat</span>}
                     </div>
                   );
                 })}
              </div>
            </div>
          ) : (
            renderLoadingList(loadings)
          )}
        </div>
       );
    }

      if (selectedAdminDept || selectedAdminDate) {
        const filterTasks = selectedAdminDept ? tasks.filter(t => t.dept === selectedAdminDept) : tasks.filter(t => t.createdAt === selectedAdminDate);
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-100">
              <div>
                <button onClick={() => { setSelectedAdminDept(null); setSelectedAdminDate(null); }} className="flex items-center text-gray-500 hover:text-gray-800 font-medium text-sm mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{selectedAdminDept || selectedAdminDate} Raporu</h2>
                <p className="text-gray-500 mt-1">{t('total_record')} {filterTasks.length}</p>
              </div>
              {selectedAdminDept && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 px-6 py-3 rounded-2xl border border-green-200 text-center">
                 <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">{t('current_score')}</p>
                 <p className="text-3xl font-extrabold text-green-600">{points[selectedAdminDept]}</p>
              </div>)}
            </div>

            <div className="space-y-4">
              {filterTasks.length === 0 ? <p className="text-sm text-gray-500">{t('no_records')}</p> : (
                filterTasks.map(task => {
                  return (
                    <TimerWrapper key={task.id}>
                      {(now) => {
                        const statusDef = STATUS_INFO[task.status];
                        const Icon = statusDef.icon;
                        
                        let timeDisplay = null;
                        let isGlowing = false;
                        
                        if (task.status === 'acik') {
                          const deadlineMs = task.timestamp + (task.deadlineHours * 60 * 60 * 1000);
                          const diff = deadlineMs - now;
                          
                          if (diff <= 0) {
                            const lateMs = Math.abs(diff);
                            const lateHours = Math.floor(lateMs / (1000 * 60 * 60));
                            const lateMins = Math.floor((lateMs % (1000 * 60 * 60)) / (1000 * 60));
                            
                            timeDisplay = (
                              <span className="text-xs text-red-700 font-extrabold px-2 py-1 bg-red-100 rounded-md">
                                <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" />
                                {lateHours > 0 ? `${lateHours} saat ` : ''}{lateMins} dk geç kalındı!
                              </span>
                            );
                            isGlowing = true;
                          } else {
                            const leftHours = Math.floor(diff / (1000 * 60 * 60));
                            const leftMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const isCritical = diff < (30 * 60 * 1000);
                            
                            if (isCritical) {
                              isGlowing = true;
                              timeDisplay = (
                                <span className="text-xs text-red-700 font-bold px-2 py-1 bg-red-100 rounded-md animate-pulse">
                                  <Clock className="w-3 h-3 inline mr-1 mb-0.5" />
                                  {leftMins} dk kaldı
                                </span>
                              );
                            } else {
                              timeDisplay = (
                                <span className="text-xs text-orange-600 font-bold">
                                  <Clock className="w-3 h-3 inline mr-1 mb-0.5" />
                                  {leftHours > 0 ? `${leftHours} saat ` : ''}{leftMins} dk kaldı
                                </span>
                              );
                            }
                          }
                        }

                        return (
                          <div className={`p-5 rounded-2xl border-l-4 bg-gray-50 ${statusDef.color.split(' ')[2]} ${isGlowing ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400 animate-[pulse_2s_ease-in-out_infinite]' : 'shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                 <span className="font-bold text-gray-800 block">{task.dept}</span>
                                 <span className="text-xs text-gray-500 font-medium">{task.createdAt}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                                <Icon className="w-3 h-3 mr-1" /> {t(statusDef.label_key)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center">
                                 <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 w-full text-left">{t('before')}</span>
                                 {task.imgUrl ? (
                                    <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2 w-full" onClick={() => setPreviewModalImg(task.imgUrl)}>
                                      <img src={task.imgUrl} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                    </div>
                                 ) : <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2">{t('no_photo')}</div>}
                                 <p className="text-sm text-gray-800 w-full text-left">{task.desc}</p>
                               </div>
                               <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center opacity-90">
                                 <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 w-full text-left">{t('solution_after')}</span>
                                 {task.status === 'cozuldu' || task.status === 'onay_bekliyor' ? (
                                   <>{task.afterImgUrl ? (
                                      <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2 w-full" onClick={() => setPreviewModalImg(task.afterImgUrl)}>
                                        <img src={task.afterImgUrl} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                      </div>
                                   ) : <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2">{t('no_photo')}</div>}
                                   <p className="text-sm text-gray-700 italic w-full text-left">"{task.chiefNote}"</p></>
                                 ) : <div className="w-full h-full min-h-[8rem] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs">{t('stat_acik')}</div>}
                               </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                               <span className={`text-xs px-2 py-1 rounded-lg font-medium ${PRIORITIES[task.priority].color}`}>{t(PRIORITIES[task.priority].label_key)} {t('risk')}</span>
                               {timeDisplay}
                            </div>
                          </div>
                        );
                      }}
                    </TimerWrapper>
                  );
                })
              )}
            </div>
          </div>
        );
      }

      const currDate = new Date();
      const currentMonth = currDate.getMonth();
      const currentYear = currDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
      const dayNames = lang === 'tr' ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const monthNames = lang === 'tr' ? ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
             <div>
               <h3 className="font-extrabold text-gray-800 text-2xl flex items-center">
                 <CalendarDays className="w-7 h-7 mr-3 text-blue-600"/> {monthNames[currentMonth]} {currentYear}
               </h3>
             </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {dayNames.map(day => <div key={day} className="text-xs font-bold text-gray-400 uppercase py-2 bg-gray-50 rounded-lg">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-gray-50 border border-gray-100 opacity-50"></div>)}
             {Array.from({ length: daysInMonth }).map((_, i) => {
               const dayNum = i + 1;
               const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
               const isToday = dayNum === currDate.getDate();
               const dayTasks = tasks.filter(t => t.createdAt === formattedDateForCell);
               
               return (
                 <div key={dayNum} onClick={() => dayTasks.length > 0 && setSelectedAdminDate(formattedDateForCell)} className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all hover:-translate-y-1 ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                   <span className={`text-sm md:text-base font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>{dayNum}</span>
                   {dayTasks.length > 0 && <span className="text-[9px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full mt-1 shadow-sm">{dayTasks.length} Rapor</span>}
                 </div>
               );
             })}
          </div>
        </div>
      );
    };

    const getRedTaskCount = (deptName) => tasks.filter(t => t.dept === deptName && (t.status === 'acik' || t.status === 'itiraz_edildi')).length;
    const sortedDeptsAdmin = [...DEPARTMENTS].sort((a, b) => getRedTaskCount(b) - getRedTaskCount(a));

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full xl:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto">
              <div><h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-1">{t('admin_panel')}</h1><p className="text-gray-500 text-sm">{t('admin_desc')}</p></div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col sm:flex-row w-full md:w-auto bg-gray-100 p-1.5 rounded-xl shadow-inner gap-1`}>
               <button onClick={() => { setAdminSystemMode('isg'); setAdminViewMode('calendar'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'isg' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_tab')}</button>
               <button onClick={() => { setAdminSystemMode('yukleme'); setAdminViewMode('calendar'); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'yukleme' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Truck className="w-4 h-4 mr-2" /> {t('yukleme_tab')}</button>
               <button onClick={() => { setAdminSystemMode('users'); setAdminViewMode('users'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'users' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Users className="w-4 h-4 mr-2" /> {t('btn_users') || 'Kullanıcı Hesapları'}</button>
            </div>
          </div>
          {adminSystemMode === 'isg' && (
            <div className="flex items-center bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 mt-4 md:mt-0">
              <Calendar className="w-6 h-6 text-blue-600 mr-3" />
              <div><p className="text-xs font-bold text-blue-800 uppercase tracking-wider">{t('next_reset')}</p><p className="text-lg font-bold text-blue-900">{getLastFridayOfCurrentMonth()}</p></div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {adminSystemMode === 'isg' && (
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50 justify-between"><div className="flex items-center"><AlertCircle className="w-5 h-5 text-red-500 mr-2" /><h3 className="font-bold text-gray-800">{t('risk_map')}</h3></div></div>
              <div className="divide-y divide-gray-50">
                {sortedDeptsAdmin.map((dept, index) => {
                  const redCount = getRedTaskCount(dept);
                  const isSelected = selectedAdminDept === dept;
                  return (
                  <div key={dept} onClick={() => { setSelectedAdminDept(dept); setSelectedAdminDate(null); setAdminViewMode('calendar'); }} className={`flex justify-between items-center p-4 cursor-pointer transition-all group border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-center"><span className="w-6 text-center text-sm font-bold mr-3 text-gray-400">{index + 1}.</span><span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'}`}>{dept}</span></div>
                    <div className="flex items-center">
                       {redCount > 0 ? <div className="flex items-center bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-100 mr-2 shadow-sm"><span className="font-bold text-xs">{redCount} {t('problem')}</span></div> : <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 mr-2 opacity-90"><span className="font-bold text-xs">{t('no_problem')}</span></div>}
                       <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-300'}`} />
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
          )}
          <div className={adminSystemMode === 'isg' ? "lg:col-span-2" : "lg:col-span-3"}>{renderRightPanel()}</div>
        </div>

        {currentUser.username === 'agiradar' && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div><h3 className="text-xl font-bold text-red-700 flex items-center mb-2"><AlertTriangle className="w-6 h-6 mr-2"/> {t('delete_history')}</h3><p className="text-sm text-red-600 font-medium">{t('delete_desc')}</p></div>
              <div className="flex w-full md:w-auto space-x-3 items-center">
                <select value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="flex-1 md:w-48 border border-red-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 cursor-pointer">
                  <option value="1">{t('month_1')}</option><option value="3">{t('month_3')}</option><option value="6">{t('month_6')}</option><option value="all">{t('month_all')}</option>
                </select>
                <button onClick={() => { setShowDeleteModal(true); setDeleteCountdown(10); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md whitespace-nowrap">{t('delete_btn')}</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-red-600 text-white flex justify-between items-center"><h3 className="font-bold text-xl flex items-center"><ShieldAlert className="w-6 h-6 mr-2"/> {t('are_you_sure')}</h3><button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="p-1 hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></button></div>
              <div className="p-8 text-center space-y-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{t('are_you_sure')}</h4>
                  <p className="text-gray-600 text-sm">{historyFilter === 'all' ? t('del_warn_all') : `${t('del_warn_1')} ${historyFilter} ${t('del_warn_2')}`} <b className="text-red-600">{t('del_warn_end')}</b></p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="flex-1 py-4 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200">{t('cancel')}</button>
                  <button onClick={executeHistoryDelete} disabled={deleteCountdown > 0} className={`flex-1 py-4 font-bold rounded-xl shadow-md ${deleteCountdown > 0 ? 'bg-red-200 text-red-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                    {deleteCountdown > 0 ? `${t('wait')} (${deleteCountdown}s)` : t('perm_delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }