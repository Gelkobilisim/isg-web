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
