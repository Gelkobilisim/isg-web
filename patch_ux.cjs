const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add registerDevice to LoginScreen
const loginStateInsert = "const [rememberMe, setRememberMe] = useState(false);";
code = code.replace(loginStateInsert, loginStateInsert + "\n    const [registerDevice, setRegisterDevice] = useState(false);");

const loginHandleInsert = "setCurrentUser(account);";
const loginHandleCode = `if (registerDevice) {
            localStorage.setItem('isg_notification_device_owner', account.id);
        }
        setCurrentUser(account);`;
code = code.replace(loginHandleInsert, loginHandleCode);

const checkboxCode = `              <div className="flex items-center mt-2 pl-1">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className={\`w-4 h-4 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded cursor-pointer \${isISG ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-600 focus:ring-orange-500'}\`} />
                <label htmlFor="rememberMe" className="ml-2 text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer select-none">{t('remember_me')}</label>
              </div>
              
              <div className="flex items-start mt-4 pl-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                <input type="checkbox" id="registerDevice" checked={registerDevice} onChange={(e) => setRegisterDevice(e.target.checked)} className={\`w-4 h-4 mt-0.5 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded cursor-pointer \${isISG ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-600 focus:ring-orange-500'}\`} />
                <label htmlFor="registerDevice" className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none flex flex-col">
                   <span>Bu cihazı bildirim için kaydet</span>
                   <span className="text-xs font-normal text-gray-500 mt-1 leading-tight">Giriş yaptığım bu cihaza sadece bu hesabın bildirimlerini gönder.</span>
                </label>
              </div>`;
              
const oldCheckboxCode = `              <div className="flex items-center mt-2 pl-1">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className={\`w-4 h-4 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded cursor-pointer \${isISG ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-600 focus:ring-orange-500'}\`} />
                <label htmlFor="rememberMe" className="ml-2 text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer select-none">{t('remember_me')}</label>
              </div>`;

code = code.replace(oldCheckboxCode, checkboxCode);


// 2. Add logout modal states to App component
const appStateInsert = "const [yuklemeCalendarYear, setYuklemeCalendarYear] = useState(new Date().getFullYear());";
const appStateCode = appStateInsert + `
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutCountdown, setLogoutCountdown] = useState(5);`;
code = code.replace(appStateInsert, appStateCode);

const appEffectInsert = "useEffect(() => {\n      let timer;\n      if (showDeleteModal";
const appEffectCode = `useEffect(() => {
      let timer;
      if (showLogoutModal && logoutCountdown > 0) {
        timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showLogoutModal, logoutCountdown]);

    ` + appEffectInsert;
code = code.replace(appEffectInsert, appEffectCode);

// 3. Replace logout function
const oldLogout = `  const logout = useCallback(() => { 
    setCurrentUser(null); 
    setSelectedAdminDept(null); 
    setSelectedAdminDate(null);
    setAdminViewMode('list');
    setAdminSystemMode('isg');
    localStorage.removeItem('isg_logged_in_user');
  }, []);`;

const newLogout = `  const logout = useCallback(() => { 
    setShowLogoutModal(true);
    setLogoutCountdown(5);
  }, []);

  const executeLogout = useCallback((disableNotifications) => {
    if (disableNotifications) {
      localStorage.removeItem('isg_notification_device_owner');
    }
    setCurrentUser(null); 
    setSelectedAdminDept(null); 
    setSelectedAdminDate(null);
    setAdminViewMode('list');
    setAdminSystemMode('isg');
    localStorage.removeItem('isg_logged_in_user');
    setShowLogoutModal(false);
  }, []);`;

code = code.replace(oldLogout, newLogout);

// 4. Add modal HTML to the end of App component
const modalHtml = `          
          {showLogoutModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                  <LogOut className="w-6 h-6 mr-2 text-red-500" />
                  Çıkış Yap
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                  Çıkış yapmak üzeresiniz. Lütfen bildirim tercihinizle birlikte nasıl çıkış yapmak istediğinizi seçin.
                </p>
                <div className="flex flex-col space-y-3">
                  <button onClick={() => executeLogout(false)} disabled={logoutCountdown > 0} className={\`w-full py-3 rounded-xl font-bold flex justify-center items-center transition-colors \${logoutCountdown > 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}\`}>
                    Sadece Çıkış Yap {logoutCountdown > 0 ? \`(\${logoutCountdown})\` : ''}
                  </button>
                  <button onClick={() => executeLogout(true)} disabled={logoutCountdown > 0} className={\`w-full py-3 rounded-xl font-bold shadow-md flex justify-center items-center transition-colors \${logoutCountdown > 0 ? 'bg-red-300 text-white cursor-not-allowed dark:bg-red-900/50 dark:text-red-300' : 'bg-red-600 text-white hover:bg-red-700'}\`}>
                    Bildirimleri Kapatıp Çıkış Yap {logoutCountdown > 0 ? \`(\${logoutCountdown})\` : ''}
                  </button>
                  <button onClick={() => setShowLogoutModal(false)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">
                    İptal
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>`;

const endOfApp = `        </>
      )}
    </div>`;

code = code.replace(endOfApp, modalHtml);

fs.writeFileSync('src/App.jsx', code);
