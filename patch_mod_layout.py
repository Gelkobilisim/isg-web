import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
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
            </div>"""

new_target = """            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold flex items-center text-gray-800 dark:text-gray-100">
                        <ShieldAlert className="w-8 h-8 mr-3 text-blue-500"/> 
                        İSG Uzmanı Paneli
                    </h2>
                    
                    <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-full md:w-auto">
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
            </div>"""

content = content.replace(target, new_target)

target_footer = """        </div>
    );
};"""

new_footer = """            
            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe pt-2 px-4 flex justify-around pb-4">
                <button 
                    onClick={() => setActiveTab('create')} 
                    className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all ${activeTab === 'create' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Plus className={`w-6 h-6 mb-1 ${activeTab === 'create' ? 'animate-pulse' : ''}`} /> 
                    <span className="text-xs font-bold">Oluştur</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('review')} 
                    className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all relative ${activeTab === 'review' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <div className="relative">
                        <CheckSquare className={`w-6 h-6 mb-1 ${activeTab === 'review' ? 'animate-pulse' : ''}`} /> 
                        {reviewTasks.length > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800">
                                {reviewTasks.length}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-bold">Kontrol Et</span>
                </button>
            </div>
            {/* Pad the bottom of the container to prevent content from hiding under mobile nav */}
            <div className="h-20 md:hidden"></div>
        </div>
    );
};"""

content = content.replace(target_footer, new_footer)

with open('src/App.jsx', 'w') as f:
    f.write(content)
