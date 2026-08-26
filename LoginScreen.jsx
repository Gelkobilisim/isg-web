const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginErr, setLoginErr] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loginTheme, setLoginTheme] = useState('isg'); 

    const handleLogin = (e) => {
      e.preventDefault();
      const account = users.find(u => u.username === username.toLowerCase().trim());
      
      if (account && account.password === password) {
        if (loginTheme === 'isg' && account.role === 'yuklemeci') {
            setLoginErr(t('err_isg_module')); return;
        }
        if (loginTheme === 'yukleme' && (account.role === 'sef' || account.role === 'mod')) {
            setLoginErr(t('err_yukleme_module')); return;
        }

        if (rememberMe) {
          localStorage.setItem('isg_logged_in_user', account.id);
        }
        setCurrentUser(account);
        setLoginErr('');
      } else {
        setLoginErr(t('err_wrong_cred'));
      }
    };

    if (isFirebaseLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-gray-600 font-medium animate-pulse">{t('loading_server')}</p>
        </div>
      );
    }

    const isISG = loginTheme === 'isg';

    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6 relative"
        style={{ 
          backgroundImage: "url('/ads-metal-anadolu-osb.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/60 z-0"></div>

        <div className="w-full max-w-4xl flex justify-end z-10 mb-4 md:absolute md:top-6 md:right-6 md:mb-0">
            <button onClick={toggleLang} className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-800 hover:bg-white transition-colors border border-gray-200">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{lang === 'tr' ? 'English' : 'Türkçe'}</span>
            </button>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl mb-8 flex space-x-1 border border-white/40 z-10">
          <button onClick={() => setLoginTheme('isg')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${isISG ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
            <ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_tab')}
          </button>
          <button onClick={() => setLoginTheme('yukleme')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${!isISG ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
            <Truck className="w-4 h-4 mr-2" /> {t('yukleme_tab')}
          </button>
        </div>

        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10 border border-white/20">
          <div className={`hidden md:flex flex-col items-center justify-center w-1/2 p-12 border-r border-gray-100 transition-colors duration-500 ${isISG ? 'bg-blue-50/50' : 'bg-orange-50/50'}`}>
            <CompanyLogo className="bg-transparent shadow-none mb-6" scale="scale-150" theme={isISG ? 'blue' : 'orange'} />
            <h1 className={`text-3xl font-bold text-center mt-8 ${isISG ? 'text-blue-900' : 'text-orange-900'}`}>
              {isISG ? t('sys_isg_title') : t('sys_yukleme_title')}<br/>{t('sys_management')}
            </h1>
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-8">
              <CompanyLogo className="mx-auto" scale="scale-110" theme={isISG ? 'blue' : 'orange'} />
              <h1 className="text-xl font-bold text-gray-800 mt-4">{isISG ? t('sys_isg_title') : t('sys_yukleme_title')}</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('welcome')}</h2>
            <p className="text-gray-500 mb-8 text-sm">{t('login_desc')}</p>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {loginErr && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center font-medium border border-red-100">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> {loginErr}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('username')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-colors ${isISG ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`} required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-colors ${isISG ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`} required />
                </div>
              </div>
              
              <div className="flex items-center mt-2 pl-1">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className={`w-4 h-4 bg-gray-100 border-gray-300 rounded cursor-pointer ${isISG ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-600 focus:ring-orange-500'}`} />
                <label htmlFor="rememberMe" className="ml-2 text-sm font-bold text-gray-600 cursor-pointer select-none">{t('remember_me')}</label>
              </div>
              
              <button type="submit" className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transition-colors mt-4 ${isISG ? 'bg-blue-700 hover:bg-blue-800' : 'bg-orange-600 hover:bg-orange-700'}`}>
                {t('login_btn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }