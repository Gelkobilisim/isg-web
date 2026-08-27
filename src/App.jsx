import { DICT } from "./i18n";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Send, Camera, AlertTriangle, CheckCircle, XCircle, LogOut, Clock, ShieldAlert, Calendar, Image as ImageIcon, X, ArrowDownRight, ChevronRight, ArrowLeft, Activity, AlertCircle, List, CalendarDays, Lock, User, Users, Plus, Trash2, Truck, Package, Save, CheckSquare, Globe, Eye, EyeOff, Menu, Maximize2, MapPin, Building2, Hash, Scale, TrendingUp, Printer } from 'lucide-react';

import html2pdf from 'html2pdf.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const getDeptKey = (deptStr) => {
  const map = {
    "Boyahane": "dept_boyahane",
    "Altyapı": "dept_altyapi",
    "Dalgaduvar": "dept_dalgaduvar",
    "Lazer": "dept_lazer",
    "Güç": "dept_guc",
    "Kaynaklı imalat": "dept_kaynakli",
    "Dış alan": "dept_dis",
    "Bakım & Onarım": "dept_bakim"
  };
  return map[deptStr] || deptStr;
};
const DEPARTMENTS = ["Boyahane", "Altyapı", "Dalgaduvar", "Lazer", "Güç", "Kaynaklı imalat", "Dış alan", "Bakım & Onarım"];

const COUNTRIES = [
  "Türkiye", "Almanya", "İngiltere", "Fransa", "İtalya", "İspanya", "Hollanda", "Belçika", 
  "İsveç", "Polonya", "Romanya", "Bulgaristan", "Yunanistan", "Rusya", "ABD", "Kanada", 
  "BAE", "Suudi Arabistan", "Katar", "Irak", "İran", "Azerbaycan", "Özbekistan", "Diğer"
];
const PRIORITIES = {
  basit: { label_key: 'pri_basit', multiplier: 1, color: 'bg-blue-100 text-blue-800' },
  orta: { label_key: 'pri_orta', multiplier: 2, color: 'bg-yellow-100 text-yellow-800' },
  kritik: { label_key: 'pri_kritik', multiplier: 5, color: 'bg-red-100 text-red-800' }
};

const STATUS_INFO = {
  cozuldu: { label_key: 'stat_cozuldu', color: 'bg-green-100 text-green-800 border-green-500', icon: CheckCircle },
  onay_bekliyor: { label_key: 'stat_onay', color: 'bg-yellow-100 text-yellow-800 border-yellow-500', icon: Clock },
  acik: { label_key: 'stat_acik', color: 'bg-red-100 text-red-800 border-red-500', icon: AlertTriangle },
  itiraz_edildi: { label_key: 'stat_itiraz', color: 'bg-red-100 text-red-800 border-red-500', icon: AlertTriangle },
  iptal: { label_key: 'stat_iptal', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-400', icon: XCircle }
};

const formatDate = (dateObj) => {
  return `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
};

const formatTime = (dateObj) => {
  return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
};

const handleImageUpload = (file, callback) => {
  if (!file) return;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) { height = Math.round((height *= MAX_WIDTH / width)); width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.75)); 
    };
  };
};

const CompanyLogo = ({ className = "", scale = "scale-100", theme = 'blue' }) => (
    <div className={`flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm ${className}`}>
      <div className={`flex items-center space-x-1 ${scale} origin-center`}>
        <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-full border-t-4 border-l-4 rounded-tl-full opacity-80 ${theme==='orange'?'border-orange-600':'border-blue-900'}`}></div>
           <div className={`absolute top-1 left-1 w-[90%] h-[90%] border-t-4 border-l-4 rounded-tl-full ${theme==='orange'?'border-orange-400':'border-blue-400'}`}></div>
           <div className="absolute top-3 left-2 w-[80%] h-[80%] border-t-4 border-l-4 border-gray-400 rounded-tl-full opacity-50"></div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-1">
            <span className="text-gray-800 dark:text-gray-100 font-extrabold text-2xl tracking-tighter">ADS</span>
            <span className="text-gray-800 dark:text-gray-100 font-bold text-xl">Metal A.Ş.</span>
          </div>
          <span className={`text-[6px] font-bold text-white px-1 rounded-sm tracking-widest uppercase -mt-1 w-max ${theme==='orange'?'bg-orange-600':'bg-blue-900'}`}>Transformer Tanks & Fin Walls</span>
        </div>
      </div>
    </div>
  );

const TimerWrapper = ({ children }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  return children(now);
};

const AppContext = React.createContext();
const useAppContext = () => React.useContext(AppContext);

  const ImageLightboxModal = () => {
    const ctx = useAppContext();

    const {
      currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks, pointLogs, setPointLogs,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage,
      db
    } = ctx;
    
    if (!previewModalImg) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-slide-up" onClick={() => setPreviewModalImg(null)}>
        <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button onClick={() => setPreviewModalImg(null)} className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors shadow-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
          {previewModalTitle && (
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">
              {previewModalTitle}
            </div>
          )}
          <img src={previewModalImg} alt="Büyütülmüş Fotoğraf" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20" />
          <p className="text-white/70 text-xs mt-3 flex items-center">
            <Maximize2 className="w-3.5 h-3.5 mr-1" /> Kapatmak için görsele veya boşluğa tıklayabilirsiniz
          </p>
        </div>
      </div>
    );
  };

  const LoginScreen = () => {
    const ctx = useAppContext();

    const {
      currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage,
      db
    } = ctx;
    
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
        if (account.role === 'admin') {
           setAdminSystemMode(loginTheme);
        }
        setCurrentUser(account);
        setLoginErr('');
      } else {
        setLoginErr(t('err_wrong_cred'));
      }
    };

    if (isFirebaseLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-700">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">{t('loading_server')}</p>
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
            <button onClick={toggleLang} className="flex items-center space-x-2 bg-white dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-800 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{lang === 'tr' ? 'English' : 'Türkçe'}</span>
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl mb-8 flex space-x-1 border border-white/40 z-10">
          <button onClick={() => setLoginTheme('isg')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${isISG ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'}`}>
            <ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_tab')}
          </button>
          <button onClick={() => setLoginTheme('yukleme')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${!isISG ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'}`}>
            <Truck className="w-4 h-4 mr-2" /> {t('yukleme_tab')}
          </button>
        </div>

        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10 border border-white/20">
          <div className={`hidden md:flex flex-col items-center justify-center w-1/2 p-12 border-r border-gray-100 dark:border-gray-700 transition-colors duration-500 ${isISG ? 'bg-blue-50/50' : 'bg-orange-50/50'}`}>
            <CompanyLogo className="bg-transparent shadow-none mb-6" scale="scale-150" theme={isISG ? 'blue' : 'orange'} />
            <h1 className={`text-3xl font-bold text-center mt-8 ${isISG ? 'text-blue-900' : 'text-orange-900'}`}>
              {isISG ? t('sys_isg_title') : t('sys_yukleme_title')}<br/>{t('sys_management')}
            </h1>
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-8">
              <CompanyLogo className="mx-auto" scale="scale-110" theme={isISG ? 'blue' : 'orange'} />
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">{isISG ? t('sys_isg_title') : t('sys_yukleme_title')}</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('welcome')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{t('login_desc')}</p>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {loginErr && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center font-medium border border-red-100">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0" /> {loginErr}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('username')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 bg-gray-50 text-gray-800 dark:text-gray-100 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 transition-colors ${isISG ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`} required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 bg-gray-50 text-gray-800 dark:text-gray-100 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 transition-colors ${isISG ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`} required />
                </div>
              </div>
              
              <div className="flex items-center mt-2 pl-1">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className={`w-4 h-4 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded cursor-pointer ${isISG ? 'text-blue-600 focus:ring-blue-500' : 'text-orange-600 focus:ring-orange-500'}`} />
                <label htmlFor="rememberMe" className="ml-2 text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer select-none">{t('remember_me')}</label>
              </div>
              
              <button type="submit" className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transition-colors mt-4 ${isISG ? 'bg-blue-700 hover:bg-blue-800' : 'bg-orange-600 hover:bg-orange-700'}`}>
                {t('login_btn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const TopBar = ({ theme = 'blue' }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
    const ctx = useAppContext();

    const {
      currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage,
      db
    } = ctx;
    
    let roleText = currentUser.role;
    if (currentUser.role === 'sef') roleText = `${t(getDeptKey(currentUser.dept))} Birimi`;
    if (currentUser.role === 'yuklemeci') roleText = `Yükleme Sorumlusu`;
    
    return (
      <header className="bg-white dark:bg-gray-800 px-6 py-3 shadow-sm flex justify-between items-center sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 scale-75 md:scale-90 origin-left">
              <CompanyLogo className="bg-transparent shadow-none !p-0" theme={theme} />
            </div>
            <div className="border-l pl-4 border-gray-300 dark:border-gray-600">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base leading-tight">{currentUser.name}</h2>
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">{roleText}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button onClick={toggleLang} className="hidden sm:flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                 <Globe className="w-3.5 h-3.5" /> <span>{lang === 'tr' ? 'EN' : 'TR'}</span>
             </button>
             <button onClick={() => setDarkMode(!darkMode)} className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 transition-colors">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
             <button onClick={logout} className="hidden sm:flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm">
               <span className="hidden sm:inline">{t('logout')}</span>
               <LogOut className="w-5 h-5" />
             </button>
             
             {/* Mobile Settings Hamburger */}
             <div className="sm:hidden relative">
               <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                 <Menu className="w-5 h-5" />
               </button>
               {settingsOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button onClick={() => {toggleLang(); setSettingsOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center font-bold">
                      <Globe className="w-4 h-4 mr-2"/> {lang === 'tr' ? 'EN' : 'TR'}
                    </button>
                    <button onClick={() => {setDarkMode(!darkMode); setSettingsOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center font-bold">
                      {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />} {darkMode ? 'Açık Mod' : 'Koyu Mod'}
                    </button>
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center font-bold">
                      <LogOut className="w-4 h-4 mr-2"/> {t('logout')}
                    </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      </header>
    );
  };

  const YuklemeciDashboard = () => {
    const ctx = useAppContext();

    const {
      currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage,
      db
    } = ctx;
    
    const [isCreating, setIsCreating] = useState(false);
    const [formState, setFormState] = useState({ plaka: '', sofor: '', destCountry: 'Türkiye', destLocation: '', destCompany: '', projectNo: '', tonnage: '', not: '' });
    const [imgPreview, setImgPreview] = useState(null);
    const [finishModal, setFinishModal] = useState({ isOpen: false, loadId: null, note: '', imgPreview: null });

    const activeLoadings = useMemo(() => loadings.filter(l => l.status === 'beklemede' || l.status === 'yukleniyor'), [loadings]);
    const tonnage24h = get24HourTonnage();

    const handleStartLoading = (e) => {
      e.preventDefault();
      createLoading(formState.plaka, formState.sofor, formState.destCountry, formState.destLocation, formState.destCompany, formState.projectNo, formState.tonnage, formState.not, imgPreview);
      setFormState({ plaka: '', sofor: '', destCountry: 'Türkiye', destLocation: '', destCompany: '', projectNo: '', tonnage: '', not: '' });
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
          <div className="z-10 bg-white dark:bg-gray-800/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center space-x-3">
             <div className="bg-white dark:bg-gray-800/20 p-2 rounded-xl"><Scale className="w-6 h-6 text-white" /></div>
             <div>
               <p className="text-[11px] uppercase font-bold text-orange-200 tracking-wider">{t('tonnage_24h')}</p>
               <p className="text-2xl font-extrabold text-white">{tonnage24h.toLocaleString('tr-TR')} <span className="text-sm font-medium">{t('unit_ton') || 'Ton'}</span></p>
             </div>
          </div>
          <Package className="w-48 h-48 text-white opacity-10 absolute right-0 -bottom-10 z-0 transform -rotate-12 pointer-events-none" />
        </div>

        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="w-full bg-white dark:bg-gray-800 border-2 border-dashed border-orange-300 hover:border-orange-500 text-orange-700 py-6 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all flex justify-center items-center space-x-3 mb-8 group">
            <div className="bg-orange-100 p-2 rounded-full group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div>
            <span className="text-lg">{t('new_load_btn')}</span>
          </button>
        )}

        {isCreating && (
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-orange-100 mb-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center"><Truck className="w-6 h-6 mr-2 text-orange-500"/> {t('load_form_title')}</h3>
              <button onClick={() => {setIsCreating(false); setImgPreview(null); setFormState({plaka:'', sofor:'', destCountry:'Türkiye', destLocation:'', destCompany:'', projectNo:'', tonnage:'', not:''});}} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleStartLoading} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('plate_no')}</label>
                  <input required type="text" value={formState.plaka} onChange={e=>setFormState({...formState, plaka: e.target.value.toUpperCase()})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-800 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('driver_name')}</label>
                  <input type="text" value={formState.sofor} onChange={e=>setFormState({...formState, sofor: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('dest_country')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <select required value={formState.destCountry} onChange={e=>setFormState({...formState, destCountry: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('dest_location')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="text" value={formState.destLocation} onChange={e=>setFormState({...formState, destLocation: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100" placeholder={t('ph_dest_loc') || 'Örn: İstanbul / Dilovası'} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('dest_company')}</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="text" value={formState.destCompany} onChange={e=>setFormState({...formState, destCompany: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100" placeholder={t('ph_dest_comp') || 'Örn: ABB Trafo A.Ş.'} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('project_no')}</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="text" value={formState.projectNo} onChange={e=>setFormState({...formState, projectNo: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100" placeholder={t('ph_proj_no') || 'Örn: PRJ-2026-88'} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('tonnage')}</label>
                  <div className="relative">
                    <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="number" step="any" value={formState.tonnage} onChange={e=>setFormState({...formState, tonnage: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700 dark:text-orange-400" placeholder={t('ph_tonnage') || 'Örn: 24.5 (Ton)'} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('cam_pre')}</label>
                <input type="file" id="preLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)} />
                <div onClick={() => document.getElementById('preLoadCamera').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">
                  {imgPreview ? ( <img src={imgPreview} className="w-full h-full object-cover" /> ) : (
                    <><div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110"><Camera className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-orange-500" /></div>
                    <span className="text-sm font-bold">{t('cam_open')}</span><span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('optional')}</span></>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('note_pre')}</label>
                <input type="text" value={formState.not} onChange={e=>setFormState({...formState, not: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100" />
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg">{t('start_load_btn')}</button>
            </form>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-500"/> {t('active_loads')} ({activeLoadings.length})</h2>
        </div>

        {activeLoadings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl text-center border border-gray-100 dark:border-gray-700 shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <p className="font-bold text-xl text-gray-800 dark:text-gray-100">{t('no_active_loads')}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{t('no_active_desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLoadings.map(load => (
              <div key={load.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div><span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('plate')}</span><span className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{load.plaka}</span></div>
                  <div className="text-right"><span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('entry_time')}</span><span className="text-lg font-bold text-blue-600">{load.createdAtTime}</span></div>
                </div>
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  {load.sofor && <p className="text-xs text-gray-600 dark:text-gray-300 font-medium"><User className="w-3.5 h-3.5 inline mr-1 text-gray-400 dark:text-gray-500"/> {t('driver')}: <span className="text-gray-800 dark:text-gray-100 font-bold">{load.sofor}</span></p>}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs bg-orange-50/60 p-3 rounded-xl border border-orange-100">
                    <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('dest_country')}</span><span className="font-bold text-gray-800 dark:text-gray-100">{load.destCountry || '-'}</span></div>
                    <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('dest_location')}</span><span className="font-bold text-gray-800 dark:text-gray-100">{load.destLocation || '-'}</span></div>
                    <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('dest_company')}</span><span className="font-bold text-gray-800 dark:text-gray-100">{load.destCompany || '-'}</span></div>
                    <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('tonnage')}</span><span className="font-extrabold text-orange-700 dark:text-orange-400">{load.tonnage ? `${load.tonnage} Ton` : '-'}</span></div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mt-auto">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => load.preImgUrl && setPreviewModalImg(load.preImgUrl)}>
                       {load.preImgUrl ? (
                          <>
                            <img src={load.preImgUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                          </>
                       ) : <><ImageIcon className="w-5 h-5 mb-1"/><span className="text-[8px] font-bold">{t('no_photo')}</span></>}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1 uppercase tracking-wider">{t('pre_note_title')}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{load.preNote || t('no_note')}</p>
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
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-green-600 text-white flex justify-between items-center">
                <h3 className="font-bold text-xl flex items-center"><Save className="w-6 h-6 mr-3"/> {t('finish_form_title')}</h3>
                <button onClick={() => setFinishModal({ isOpen: false, loadId: null, note: '', imgPreview: null })} className="p-2 hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('cam_post')}</label>
                  <input type="file" id="postLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], (img) => setFinishModal({...finishModal, imgPreview: img}))} />
                  <div onClick={() => document.getElementById('postLoadCamera').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">
                    {finishModal.imgPreview ? ( <img src={finishModal.imgPreview} className="w-full h-full object-cover" /> ) : (
                      <><div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110"><Camera className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-green-500" /></div>
                      <span className="text-sm font-bold">{t('cam_open')}</span></>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('note_post')}</label>
                  <input type="text" value={finishModal.note} onChange={e=>setFinishModal({...finishModal, note: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-gray-100" />
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => setFinishModal({ isOpen: false, loadId: null, note: '', imgPreview: null })} className="flex-1 py-4 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl">{t('cancel')}</button>
                  <button onClick={handleFinishLoading} className="flex-1 py-4 font-bold text-white bg-green-600 rounded-xl shadow-lg">{t('close_job')}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const ModDashboard = () => {
    const ctx = useAppContext();
    const { t, tasks, createTask, updateTaskStatus, handleImageUpload, DEPARTMENTS } = ctx;
    
    const [actionModal, setActionModal] = React.useState({ isOpen: false, taskId: null, action: null });
    const [modNote, setModNote] = React.useState('');
    
    const reviewTasks = React.useMemo(() => {
        return tasks.filter(task => task.status === 'onay_bekliyor' || task.status === 'itiraz_edildi').sort((a,b) => b.timestamp - a.timestamp);
    }, [tasks]);

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (actionModal.action === 'approve') {
             updateTaskStatus(actionModal.taskId, 'cozuldu', '', '', modNote);
        } else if (actionModal.action === 'reject') {
             updateTaskStatus(actionModal.taskId, 'acik', '', '', modNote);
        }
        setActionModal({ isOpen: false, taskId: null, action: null });
        setModNote('');
    };
    const [imgPreview, setImgPreview] = React.useState(null);
    const [formState, setFormState] = React.useState({ dept: 'Boyahane', priority: 'yuksek', desc: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!imgPreview) {
            alert(t('err_photo_required') || "Lütfen ihlali kanıtlayacak bir fotoğraf ekleyin.");
            return;
        }
        createTask(formState.dept, formState.priority, formState.desc, 24, imgPreview);
        setFormState({ dept: 'Boyahane', priority: 'yuksek', desc: '' });
        setImgPreview(null);
        alert(t('success_created') || "İhlal kaydı oluşturuldu.");
    };

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-slide-up">
             <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-extrabold mb-8 flex items-center text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-4"><ShieldAlert className="w-8 h-8 mr-3 text-red-500"/> {t('create_violation') || 'İhlal Kaydı Oluştur'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('department') || 'İlgili Birim'}</label>
                            <select required value={formState.dept} onChange={e=>setFormState({...formState, dept: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 dark:text-gray-100">
                                <option value="Boyahane">{t('dept_boyahane') || 'Boyahane'}</option>
                                <option value="Altyapı">{t('dept_altyapi') || 'Altyapı'}</option>
                                <option value="Dalgaduvar">{t('dept_dalgaduvar') || 'Dalgaduvar'}</option>
                                <option value="Lazer">{t('dept_lazer') || 'Lazer'}</option>
                                <option value="Güç">{t('dept_guc') || 'Güç'}</option>
                                <option value="Kaynaklı imalat">{t('dept_kaynakli') || 'Kaynaklı imalat'}</option>
                                <option value="Dış alan">{t('dept_dis') || 'Dış alan'}</option>
                                <option value="Bakım & Onarım">{t('dept_bakim') || 'Bakım & Onarım'}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('priority') || 'Öncelik Seviyesi'}</label>
                            <select required value={formState.priority} onChange={e=>setFormState({...formState, priority: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 dark:text-gray-100">
                                <option value="yuksek">{t('high') || 'Yüksek'}</option>
                                <option value="orta">{t('medium') || 'Orta'}</option>
                                <option value="dusuk">{t('low') || 'Düşük'}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('description') || 'Açıklama / İhlal Detayı'}</label>
                        <textarea required rows="4" value={formState.desc} onChange={e=>setFormState({...formState, desc: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100" placeholder={t('ph_desc') || 'İhlal detayı...'}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('photo') || 'Fotoğraf'} <span className="text-red-500">({t('photo_required') || 'Zorunlu'})</span></label>
                        <input type="file" id="modCamera" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)} />
                        <div onClick={() => document.getElementById('modCamera').click()} className="w-full h-48 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">
                            {imgPreview ? ( <img src={imgPreview} className="w-full h-full object-cover" /> ) : (
                                <><div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8 text-gray-500 group-hover:text-blue-500" /></div>
                                <span className="text-sm font-bold">{t('cam_open') || 'Kamerayı Aç / Fotoğraf Yükle'}</span></>
                            )}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center transition-colors"><Send className="w-5 h-5 mr-2"/> {t('send') || 'Kaydı Gönder'}</button>
                </form>
             </div>
             
             {reviewTasks.length > 0 && (
             <div className="mt-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                <h2 className="text-2xl font-extrabold mb-6 flex items-center text-gray-800 dark:text-gray-100"><CheckCircle className="w-6 h-6 mr-3 text-green-500"/> {t('pending_reviews') || 'İnceleme Bekleyen Kayıtlar'}</h2>
                <div className="grid grid-cols-1 gap-6">
                    {reviewTasks.map(task => {
                        const isObjection = task.status === 'itiraz_edildi';
                        return (
                            <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col md:flex-row gap-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{t(getDeptKey(task.dept))}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'yuksek' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${isObjection ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{isObjection ? (t('stat_itiraz') || 'İtiraz Edildi') : (t('stat_onay') || 'Onay Bekliyor')}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-3"><span className="font-bold">{t('initial_note') || 'İlk İhlal Notu'}:</span> {task.desc}</p>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">{isObjection ? (t('chief_obj_note') || 'Birim Şefi İtiraz Notu') + ':' : (t('chief_fix_note') || 'Birim Şefi Çözüm Notu') + ':'}</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{task.chiefNote || (t('no_note') || 'Not girilmemiş.')}</p>
                                    </div>
                                </div>
                                
                                {task.afterImgUrl && (
                                    <div className="w-full md:w-48 h-32 flex-shrink-0">
                                        <img src={task.afterImgUrl} className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                                    </div>
                                )}
                                
                                <div className="flex flex-col gap-3 justify-center md:min-w-[140px]">
                                    <button onClick={() => setActionModal({ isOpen: true, taskId: task.id, action: 'approve' })} className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm">{isObjection ? (t('accept_obj') || 'İtirazı Kabul Et') : (t('approve_close') || 'Onayla (Kapat)')}</button>
                                    <button onClick={() => setActionModal({ isOpen: true, taskId: task.id, action: 'reject' })} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm">{isObjection ? (t('reject_obj') || 'İtirazı Reddet') : (t('reject_return') || 'Reddet (Geri Gönder)')}</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
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
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('mod_note') || 'Moderatör Notu / Geri Bildirim'}</label>
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
  };

  const SefDashboard = () => {
    const ctx = useAppContext();
    const { t, tasks, currentUser, updateTaskStatus, handleImageUpload } = ctx;
    const [actionModal, setActionModal] = React.useState({ isOpen: false, taskId: null, type: null });
    const [note, setNote] = React.useState('');
    const [afterImgPreview, setAfterImgPreview] = React.useState(null);

    const myTasks = React.useMemo(() => {
        return tasks.filter(task => task.dept === currentUser.dept).sort((a,b) => b.timestamp - a.timestamp);
    }, [tasks, currentUser]);

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (actionModal.type === 'fix') {
             updateTaskStatus(actionModal.taskId, 'onay_bekliyor', note, afterImgPreview, '');
        } else if (actionModal.type === 'object') {
             updateTaskStatus(actionModal.taskId, 'itiraz_edildi', note, '', '');
        }
        setActionModal({ isOpen: false, taskId: null, type: null });
        setNote('');
        setAfterImgPreview(null);
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                <h2 className="text-2xl md:text-3xl font-extrabold flex items-center text-gray-800 dark:text-gray-100"><ShieldAlert className="w-8 h-8 mr-3 text-blue-500"/> {t(getDeptKey(currentUser.dept))} {t('dept_tasks') || 'Birimi Görevleri'}</h2>
                <div className="mt-4 md:mt-0 flex items-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-800 font-bold text-sm shadow-sm">
                   {t('open_tasks') || 'Açık Görevler'}: {myTasks.filter(t => t.status === 'acik' || t.status === 'itiraz_edildi').length}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTasks.length === 0 && <div className="col-span-full text-center text-gray-500 dark:text-gray-400 p-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">{t('no_tasks') || 'Henüz bir görev bulunmamaktadır.'}</div>}
                {myTasks.map(task => {
                    const statusObj = STATUS_INFO[task.status] || STATUS_INFO['acik'];
                    const StatusIcon = statusObj.icon;
                    return (
                        <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${task.priority === 'yuksek' ? 'bg-red-100 text-red-700' : task.priority === 'orta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                                <div className={`flex items-center px-2 py-1 rounded-md border ${statusObj.color}`}><StatusIcon className="w-3.5 h-3.5 mr-1.5" /><span className="text-[10px] font-bold uppercase">{t(statusObj.label_key)}</span></div>
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-wrap">{task.desc}</p>
                            {task.imgUrl && (
                                <img src={task.imgUrl} className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-200 dark:border-gray-700" />
                            )}
                            <div className="mt-auto pt-4 flex gap-3">
                                {(task.status === 'acik' || task.status === 'itiraz_edildi') && (
                                    <>
                                        <button onClick={() => setActionModal({ isOpen: true, taskId: task.id, type: 'fix' })} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm">{t('i_fixed_it') || 'Düzelttim'}</button>
                                        <button onClick={() => setActionModal({ isOpen: true, taskId: task.id, type: 'object' })} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm">{t('object_btn') || 'İtiraz Et'}</button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{actionModal.type === 'fix' ? (t('send_to_approval') || 'Onaya Gönder') : (t('object_to_violation') || 'İhlale İtiraz Et')}</h3>
                            <button type="button" onClick={() => { setActionModal({ isOpen: false, taskId: null, type: null }); setNote(''); setAfterImgPreview(null); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><X className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={handleActionSubmit} className="space-y-5">
                            {actionModal.type === 'fix' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('fix_photo') || 'Çözüm Fotoğrafı (Zorunlu)'}</label>
                                    <input type="file" id="sefCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setAfterImgPreview)} />
                                    <div onClick={() => document.getElementById('sefCamera').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-colors group overflow-hidden">
                                        {afterImgPreview ? ( <img src={afterImgPreview} className="w-full h-full object-cover" /> ) : (
                                            <><div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-gray-500 group-hover:text-green-500" /></div><span className="text-sm font-bold">{t('open_camera') || 'Kamerayı Aç'}</span></>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('note') || 'Açıklama / Not'}</label>
                                <textarea required rows="3" value={note} onChange={e=>setNote(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100" placeholder={t('ph_chief_note') || 'Açıklama giriniz...'}></textarea>
                            </div>
                            <button type="submit" disabled={actionModal.type === 'fix' && !afterImgPreview} className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all ${actionModal.type === 'fix' ? (afterImgPreview ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed') : 'bg-red-600 hover:bg-red-700'}`}>
                                {actionModal.type === 'fix' ? 'Onaya Gönder' : 'İtirazı Gönder'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const AdminDashboard = () => {
    const ctx = useAppContext();

    const {
      currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode, pointLogs,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage,
      db
    } = ctx;
    
    
    const navigate = useNavigate();
    const location = useLocation();



    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    const [accountTab, setAccountTab] = useState('isg');
    const [isgCalendarMonth, setIsgCalendarMonth] = useState(new Date().getMonth());
    const [isgCalendarYear, setIsgCalendarYear] = useState(new Date().getFullYear());
    
    const [historyFilter, setHistoryFilter] = useState('1');
    const [pointLogsFilter, setPointLogsFilter] = useState('all');
    const [analysisFilter, setAnalysisFilter] = useState('month');
    const [selectedAnalysisDept, setSelectedAnalysisDept] = useState(null);
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/analysis/')) {
            const dept = decodeURIComponent(path.split('/')[2]);
            if (dept) {
                setAdminSystemMode('analysis');
                setSelectedAnalysisDept(dept);
                setAnalysisFilter('all');
            }
        }
    }, [location.pathname, setAdminSystemMode]);
    const [bonusModalOpen, setBonusModalOpen] = useState(false);
    const [bonusDept, setBonusDept] = useState('');
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusType, setBonusType] = useState('add');
    const [bonusReason, setBonusReason] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(10);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetCountdown, setResetCountdown] = useState(10);
        
    const [expandedLoadId, setExpandedLoadId] = useState(null);
    const [yuklemeAnaTab, setYuklemeAnaTab] = useState('list');
    const [yuklemeListFilter, setYuklemeListFilter] = useState('all');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [yuklemeCalendarMonth, setYuklemeCalendarMonth] = useState(new Date().getMonth());
    const [yuklemeCalendarYear, setYuklemeCalendarYear] = useState(new Date().getFullYear());
    const [selectedYuklemeCountry, setSelectedYuklemeCountry] = useState(null);
    const [selectedYuklemeCompany, setSelectedYuklemeCompany] = useState(null);

    useEffect(() => {
      let timer;
      if (showDeleteModal && deleteCountdown > 0) {
        timer = setTimeout(() => setDeleteCountdown(deleteCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showDeleteModal, deleteCountdown]);

    useEffect(() => {
      let timer;
      if (showResetModal && resetCountdown > 0) {
        timer = setTimeout(() => setResetCountdown(resetCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showResetModal, resetCountdown]);

    const handleIsgPrevMonth = useCallback(() => {
      setIsgCalendarMonth(prev => {
        if (prev === 0) { setIsgCalendarYear(y => y - 1); return 11; }
        return prev - 1;
      });
    }, []);

    const handleIsgNextMonth = useCallback(() => {
      setIsgCalendarMonth(prev => {
        if (prev === 11) { setIsgCalendarYear(y => y + 1); return 0; }
        return prev + 1;
      });
    }, []);

    const handleIsgToday = useCallback(() => {
      setIsgCalendarMonth(new Date().getMonth());
      setIsgCalendarYear(new Date().getFullYear());
    }, []);

    const handleYuklemePrevMonth = useCallback(() => {
      setYuklemeCalendarMonth(prev => {
        if (prev === 0) { setYuklemeCalendarYear(y => y - 1); return 11; }
        return prev - 1;
      });
    }, []);

    const handleYuklemeNextMonth = useCallback(() => {
      setYuklemeCalendarMonth(prev => {
        if (prev === 11) { setYuklemeCalendarYear(y => y + 1); return 0; }
        return prev + 1;
      });
    }, []);

    const handleYuklemeToday = useCallback(() => {
      setYuklemeCalendarMonth(new Date().getMonth());
      setYuklemeCalendarYear(new Date().getFullYear());
    }, []);


    

    const handleCreateUser = async (e) => {
      e.preventDefault();
      if(users.find(u => u.username === newUser.username)) { alert(t('err_username_taken') || 'Username taken!'); return; }
      const newUserId = Date.now().toString();
      const finalRole = accountTab === 'yukleme' ? 'yuklemeci' : newUser.role;
      const finalDept = finalRole === 'sef' ? newUser.dept : null;
      
      const userObj = { ...newUser, role: finalRole, id: newUserId, dept: finalDept };
      await setDoc(doc(db, "users", newUserId), userObj);
      setNewUser({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    };

    const handleDeleteUser = async (id) => {
      if(id === "1") return; 
      if(window.confirm(t('confirm_delete_user') || 'Delete user?')) { await deleteDoc(doc(db, "users", id)); }
    };

    const [deleteTarget, setDeleteTarget] = useState('isg');
    

    const handleCustomBonus = (dept) => {
           setBonusDept(dept);
           setBonusAmount('');
           setBonusType('add');
           setBonusReason('');
           setBonusModalOpen(true);
        };
        
        const submitCustomBonus = async () => {
           if (!bonusAmount || !bonusReason) {
               alert(t('err_fill_all') || 'Lütfen tüm alanları doldurun.');
               return;
           }
           const num = parseInt(bonusAmount, 10);
           if (isNaN(num) || num <= 0) {
               alert(t('err_valid_bonus') || 'Geçerli ve pozitif bir puan miktarı girin.');
               return;
           }
           
           const finalNum = bonusType === 'add' ? num : -num;
           const pointsRef = doc(db, "system", "points");
           const currentScore = points[bonusDept] || 100;
           await updateDoc(pointsRef, { [bonusDept]: currentScore + finalNum });
           
           const logRef = doc(collection(db, "point_logs"));
           await setDoc(logRef, {
               id: logRef.id,
               dept: bonusDept,
               points: finalNum,
               reason: bonusReason,
               adminName: currentUser.name,
               timestamp: Date.now(),
               dateStr: new Date().toLocaleString('tr-TR')
           });
           
           setBonusModalOpen(false);
        };

    const executeHistoryDelete = async () => {
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      let cutoff = 0;
      if (historyFilter === '1') cutoff = now - (1 * oneMonth);
      else if (historyFilter === '3') cutoff = now - (3 * oneMonth);
      else if (historyFilter === '6') cutoff = now - (6 * oneMonth);

      if (deleteTarget === 'isg') {
         const tasksToDelete = cutoff === 0 ? tasks : tasks.filter(t => t.timestamp <= cutoff);
         for (const t of tasksToDelete) { await deleteDoc(doc(db, "tasks", t.id)); }
      } else if (deleteTarget === 'yukleme') {
         const loadsToDelete = cutoff === 0 ? loadings : loadings.filter(l => l.timestamp <= cutoff);
         for (const l of loadsToDelete) { await deleteDoc(doc(db, "loadings", l.id)); }
      }

      setShowDeleteModal(false); setDeleteCountdown(10);
    };

    const renderRightPanel = () => {
    const handleExportPDF = () => {
        const element = document.getElementById('analysis-report-container');
        if (!element) return;
        
        const buttonsToHide = element.querySelectorAll('.print\\:hidden');
        buttonsToHide.forEach(btn => btn.style.display = 'none');
        
        // Remove styling that causes scrollbars/fixed heights in pdf
        const originalHeight = element.style.height;
        const originalOverflow = element.style.overflow;
        element.style.height = 'auto';
        element.style.overflow = 'visible';

        const opt = {
          margin:       10,
          filename:     'Analiz_Raporu.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            buttonsToHide.forEach(btn => btn.style.display = '');
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
        });
    };


      
            if (adminSystemMode === 'analysis') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = startOfDay - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 24 * 60 * 60 * 1000;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

        let filteredTasks = tasks;
        if (analysisFilter === 'day') filteredTasks = tasks.filter(t => t.timestamp >= startOfDay);
        if (analysisFilter === 'week') filteredTasks = tasks.filter(t => t.timestamp >= startOfWeek);
        if (analysisFilter === 'month') filteredTasks = tasks.filter(t => t.timestamp >= startOfMonth);
        if (analysisFilter === 'year') filteredTasks = tasks.filter(t => t.timestamp >= startOfYear);

        if (selectedAnalysisDept) {
            const deptTasks = filteredTasks.filter(t => t.dept === selectedAnalysisDept).sort((a,b) => b.timestamp - a.timestamp);
            return (
                <div id="analysis-report-container" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0 print:h-auto print:block">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700 print:border-b-2 print:pb-2">
                        <div>
                            <button onClick={() => { navigate(-1); setTimeout(() => setSelectedAnalysisDept(null), 100); }} className="mb-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center print:hidden">
                                <ArrowLeft className="w-4 h-4 mr-1" /> {t('back_to_analysis') || 'Analizlere Dön'}
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                {t(getDeptKey(selectedAnalysisDept))} - {t('violation_details') || 'İhlal Detayları'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {analysisFilter === 'day' ? (t('filter_today') || 'Bugün') : 
                                 analysisFilter === 'week' ? (t('filter_this_week') || 'Bu Hafta') : 
                                 analysisFilter === 'month' ? (t('filter_this_month') || 'Bu Ay') : 
                                 analysisFilter === 'year' ? (t('filter_yearly') || 'Bu Yıl') : 
                                 (t('filter_all') || 'Tümü')}
                            </p>
                        </div>
                        <button onClick={handleExportPDF} className="print:hidden px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center">
                            <Printer className="w-4 h-4 mr-2" /> {t('export_pdf') || 'PDF Olarak Kaydet'}
                        </button>
                    </div>
                    
                <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
                        {deptTasks.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                {t('no_records') || 'Kayıt bulunmamaktadır.'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                                {deptTasks.map(task => (
                                    <div key={task.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-4 rounded-xl print:break-inside-avoid print:border-gray-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${PRIORITIES[task.priority].color}`}>
                                                {t(PRIORITIES[task.priority].label_key)}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(task.timestamp).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-100 font-medium mb-3">{task.desc}</p>
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                            <User className="w-3.5 h-3.5 mr-1" /> {task.createdBy}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const issueCounts = {};
        DEPARTMENTS.forEach(d => issueCounts[d] = 0);
        filteredTasks.forEach(task => {
            if (issueCounts[task.dept] !== undefined) {
                issueCounts[task.dept]++;
            }
        });

        const sortedAnalysis = DEPARTMENTS.map(d => ({ name: d, count: issueCounts[d] })).sort((a,b) => b.count - a.count);
        const maxCount = sortedAnalysis.length > 0 ? sortedAnalysis[0].count : 0;
        
        const mostIssues = sortedAnalysis.filter(d => d.count === maxCount && maxCount > 0);
        const minCount = Math.min(...sortedAnalysis.map(d => d.count));
        const leastIssues = sortedAnalysis.filter(d => d.count === minCount);

        return (
            <div id="analysis-report-container" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0 print:h-auto print:block">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700 print:border-b-2 print:pb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><Activity className="w-6 h-6 mr-2 text-indigo-600"/> {t('analysis_tab') || 'Analiz Raporları'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 print:hidden">{t('analysis_desc')}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-end md:items-center print:hidden">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner flex-wrap gap-1">
                            <button onClick={() => setAnalysisFilter('day')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analysisFilter === 'day' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_today') || 'Bugün'}</button>
                            <button onClick={() => setAnalysisFilter('week')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analysisFilter === 'week' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_this_week') || 'Bu Hafta'}</button>
                            <button onClick={() => setAnalysisFilter('month')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analysisFilter === 'month' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_this_month') || 'Bu Ay'}</button>
                            <button onClick={() => setAnalysisFilter('year')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analysisFilter === 'year' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_yearly') || 'Bu Yıl'}</button>
                            <button onClick={() => setAnalysisFilter('all')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analysisFilter === 'all' ? 'bg-white dark:bg-gray-800 text-indigo-700 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_all') || 'Tümü'}</button>
                        </div>
                        <button onClick={handleExportPDF} className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center">
                            <Printer className="w-4 h-4 mr-2" /> {t('export_pdf') || 'PDF Olarak Kaydet'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800/30 print:break-inside-avoid print:bg-transparent print:border-gray-300">
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">{t('dept_most_issues') || 'En Çok Sorun Çıkan Birim'}</h4>
                        <p className="text-xl font-extrabold text-red-900 dark:text-red-300">{mostIssues.length > 0 ? mostIssues.map(d => t(getDeptKey(d.name))).join(', ') : '-'}</p>
                        <p className="text-xs text-red-700 dark:text-red-500 mt-1">{maxCount} {t('issues') || 'İhlal'}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800/30 print:break-inside-avoid print:bg-transparent print:border-gray-300">
                        <h4 className="text-sm font-bold text-green-800 dark:text-green-400 mb-2">{t('dept_least_issues') || 'En Az Sorun Çıkan Birim'}</h4>
                        <p className="text-xl font-extrabold text-green-900 dark:text-green-300">{leastIssues.length > 0 ? leastIssues.map(d => t(getDeptKey(d.name))).join(', ') : '-'}</p>
                        <p className="text-xs text-green-700 dark:text-green-500 mt-1">{minCount} {t('issues') || 'İhlal'}</p>
                    </div>
                </div>

                
                <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 print:break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('chart_violations') || 'İhlal Dağılım Grafiği'}</h3>
                    <div className="w-full overflow-x-auto pb-2">
                        <div className="h-80 min-w-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sortedAnalysis.map(item => ({ name: t(getDeptKey(item.name)), issues: item.count }))} margin={{ top: 10, right: 10, left: -20, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} angle={-45} textAnchor="end" />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                                    <Tooltip cursor={{fill: darkMode ? '#1F2937' : '#F3F4F6'}} contentStyle={{backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} itemStyle={{color: '#6366F1', fontWeight: 'bold'}} labelStyle={{color: darkMode ? '#D1D5DB' : '#374151', fontWeight: 'bold', marginBottom: '4px'}} formatter={(value) => [value, t('issues') || 'İhlal']} />
                                    <Bar dataKey="issues" name={t('issues') || 'İhlal'} radius={[4, 4, 0, 0]}>
                                    {sortedAnalysis.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? (index === 0 ? '#EF4444' : '#6366F1') : '#9CA3AF'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
<div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('total_issues') || 'Toplam Sorun (İhlal)'}</h3>
                    <div className="space-y-4">
                        {sortedAnalysis.map((item, index) => (
                            <div key={item.name} className="flex items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-2 rounded-xl transition-colors print:break-inside-avoid print:p-0 print:mb-4" onClick={() => setSelectedAnalysisDept(item.name)}>
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-xs mr-3 print:border print:border-gray-300">{index + 1}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{t(getDeptKey(item.name))}</span>
                                        <span className="font-bold text-sm text-gray-600 dark:text-gray-400">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 print:border print:border-gray-200">
                                        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500 print:bg-gray-400" style={{ width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
      }

      if (adminSystemMode === 'leaderboard') {
        const sortedDepts = Object.keys(points).filter(key => key !== 'lastDailyBonus').sort((a,b) => points[b] - points[a]);
        
                

        const executeResetAndSave = async () => {
            const now = new Date();
            const monthStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            
            const pointsToSave = {};
            Object.keys(points).forEach(k => {
               if (k !== 'lastDailyBonus') pointsToSave[k] = points[k];
            });

            const historyRef = doc(db, "system", "points_history");
            await setDoc(historyRef, { [monthStr]: pointsToSave }, { merge: true });

            const initialPoints = DEPARTMENTS.reduce((acc, dept) => { acc[dept] = 100; return acc; }, {});
            initialPoints.lastDailyBonus = points.lastDailyBonus;
            await updateDoc(doc(db, "system", "points"), initialPoints);
            setShowResetModal(false);
            setResetCountdown(10);
            alert(t('success_reset') || 'Geçmiş başarıyla kaydedildi ve tüm puanlar sıfırlandı!');
        };

        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><TrendingUp className="w-6 h-6 mr-2 text-green-600"/> {t('leaderboard') || 'Liderlik Tablosu'}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Birimlerin anlık performans puanları. Ay sonu 1. olan birim ödüllendirilecektir.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                   <button onClick={() => { setShowResetModal(true); setResetCountdown(10); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-bold flex items-center shadow-sm text-sm whitespace-nowrap">
                      {t('save_history') || 'Sıfırla ve Geçmişe Kaydet'}
                   </button>
                   
                </div>
             </div>
             
             <div className="grid gap-4 mb-8">
               {sortedDepts.map((dept, index) => (
                 <div key={dept} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border rounded-2xl transition-colors ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200' : 'bg-white dark:bg-gray-800 hover:bg-gray-50'}`}>
                   <div className="flex items-center">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg mr-4 shadow-sm ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{index + 1}</span>
                      <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{t(getDeptKey(dept))}</span>
                   </div>
                   <div className="text-right flex items-center space-x-2 sm:space-x-4 mt-4 sm:mt-0">
                     <button onClick={() => handleCustomBonus(dept)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors">{t('custom_bonus') || 'Özel Puan'}</button>
                     <div>
                       <span className="text-3xl font-extrabold text-green-600">{points[dept] || 100}</span>
                       <span className="text-sm text-gray-500 dark:text-gray-400 font-normal ml-1 tracking-wider uppercase">{t('risk') || 'Puan'}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="mt-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-purple-600" /> {t('historical_results') || 'Geçmiş Sonuçlar'}</h3>
                {(!pointsHistory || Object.keys(pointsHistory).length === 0) ? (
                   <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz kaydedilmiş bir geçmiş tablo bulunmuyor.</p>
                ) : (
                   <div className="space-y-4">
                     {Object.keys(pointsHistory).sort().reverse().map(monthKey => {
                        const mPoints = pointsHistory[monthKey];
                        const mSorted = Object.keys(mPoints).sort((a,b) => mPoints[b] - mPoints[a]);
                        return (
                          <div key={monthKey} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                             <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-3">{monthKey}</h4>
                             <div className="flex flex-wrap gap-2">
                                {mSorted.map((d, i) => (
                                   <span key={d} className={`text-xs px-2.5 py-1 rounded-md font-medium ${i===0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-white dark:bg-gray-800 border text-gray-600 dark:text-gray-300'}`}>
                                      {i+1}. {d} ({mPoints[d]}p)
                                   </span>
                                ))}
                             </div>
                          </div>
                        )
                     })}
                   </div>
                )}
             </div>
             <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                   <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-600" /> {t('point_logs') || 'Puan Hareketleri'}</h3>
                   <div className="flex flex-wrap gap-2">
                     <button onClick={() => setPointLogsFilter('day')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${pointLogsFilter === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_today') || 'Bugün'}</button>
                     <button onClick={() => setPointLogsFilter('week')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${pointLogsFilter === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_this_week') || 'Bu Hafta'}</button>
                     <button onClick={() => setPointLogsFilter('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${pointLogsFilter === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_this_month') || 'Bu Ay'}</button>
                     <button onClick={() => setPointLogsFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${pointLogsFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_all') || 'Tümü'}</button>
                   </div>
                </div>
                {(!pointLogs || pointLogs.length === 0) ? (
                   <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz bir puan hareketi bulunmuyor.</p>
                ) : (
                   <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                     {pointLogs.filter(log => {
                        if (pointLogsFilter === 'all') return true;
                        const now = new Date();
                        if (pointLogsFilter === 'day') {
                           const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                           return log.timestamp >= startOfDay;
                        }
                        if (pointLogsFilter === 'week') {
                           const day = now.getDay();
                           const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                           const startOfWeek = new Date(now.setDate(diff)).setHours(0,0,0,0);
                           return log.timestamp >= startOfWeek;
                        }
                        if (pointLogsFilter === 'month') {
                           const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                           return log.timestamp >= startOfMonth;
                        }
                        return true;
                     }).map(log => (
                       <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                         <div>
                           <div className="flex items-center space-x-2">
                             <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{t(getDeptKey(log.dept))}</span>
                             <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{log.adminName}</span>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">"{log.reason}" - {log.dateStr}</p>
                         </div>
                         <span className={`font-extrabold text-sm px-2 py-1 rounded-lg shadow-sm ${log.points >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {log.points >= 0 ? '+' : ''}{log.points}
                         </span>
                       </div>
                     ))}
                   </div>
                )}
             </div>

             {showResetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                  <div className="p-6 bg-orange-600 text-white flex justify-between items-center"><h3 className="font-bold text-xl flex items-center"><AlertTriangle className="w-6 h-6 mr-2"/> {t('are_you_sure') || 'Emin misiniz?'}</h3><button onClick={() => { setShowResetModal(false); setResetCountdown(10); }} className="p-1 hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></button></div>
                  <div className="p-6 md:p-8 text-center space-y-6">
                    <TrendingUp className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{t('save_history_title') || 'Puanları Sıfırla ve Kaydet'}</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{t('save_history_desc') || 'Geçerli ayın puan durumu geçmişe kaydedilecek ve tüm departmanların puanları yeniden 100 olarak sıfırlanacaktır.'}</p>
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button onClick={() => { setShowResetModal(false); setResetCountdown(10); }} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold rounded-xl hover:bg-gray-200">{t('cancel')}</button>
                      <button onClick={executeResetAndSave} disabled={resetCountdown > 0} className={`flex-1 py-4 font-bold rounded-xl shadow-md ${resetCountdown > 0 ? 'bg-orange-200 text-orange-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                        {resetCountdown > 0 ? `${t('wait')} (${resetCountdown}s)` : (t('save_btn_confirm') || 'Sıfırla ve Kaydet')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }


      if (adminViewMode === 'users') {
        const filteredUsers = users.filter(u => accountTab === 'isg' ? (u.role !== 'yuklemeci') : (u.role === 'yuklemeci'));
        
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><Users className="w-6 h-6 mr-2 text-blue-600"/> {t('user_management')}</h2>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl shadow-inner mb-6">
               <button onClick={() => setAccountTab('isg')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center ${accountTab === 'isg' ? 'bg-white dark:bg-gray-800 text-blue-700 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                 <ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_accounts')}
               </button>
               <button onClick={() => setAccountTab('yukleme')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center ${accountTab === 'yukleme' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                 <Truck className="w-4 h-4 mr-2" /> {t('yukleme_accounts')}
               </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-2 border-b pb-2">{t('new_account')} ({accountTab === 'isg' ? 'İSG' : 'Yükleme'})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('fullname')}</label>
                  <input type="text" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('username')}</label>
                  <input type="text" required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('password')}</label>
                  <input type="text" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" />
                </div>
                
                {accountTab === 'isg' && (
                    <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('sys_role')}</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                        <option value="sef">{t('unit_chief') || 'Birim Şefi'}</option>
                        <option value="mod">İSG Uzmanı (Moderatör)</option>
                        <option value="admin">{t('system_admin') || 'Sistem Yöneticisi'}</option>
                    </select>
                    </div>
                )}
                
                {accountTab === 'isg' && newUser.role === 'sef' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('dept')}</label>
                    <select value={newUser.dept} onChange={e=>setNewUser({...newUser, dept: e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{t(getDeptKey(d))}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" className={`text-white font-bold py-2 px-4 rounded-lg text-sm w-full flex justify-center items-center ${accountTab === 'isg' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                <Plus className="w-4 h-4 mr-1"/> {t('create_acc_btn')}
              </button>
            </form>

            <div>
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-3">{t('existing_accs')} ({filteredUsers.length})</h3>
              <div className="space-y-2">
                {filteredUsers.map(u => {
                                    return (
                    <div key={u.id} className="flex justify-between items-center p-3.5 border rounded-xl hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{u.name} <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">@{u.username}</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role === 'sef' ? `Şef - ${u.dept}` : u.role}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                         
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
          {listToRender.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-center py-10">{t('no_records')}</p> : (
            listToRender.map(load => {
              const isExpanded = expandedLoadId === load.id;
              const statusColor = load.status === 'tamamlandi' ? 'bg-green-100 text-green-700' : load.status === 'yukleniyor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
              return (
              <div key={load.id} className="flex flex-col gap-2">
                <div onClick={() => setExpandedLoadId(isExpanded ? null : load.id)} className="cursor-pointer border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col min-w-[100px]">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t('dest_country')}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{load.destCountry || '-'}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t('dest_company')}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]" title={load.destCompany}>{load.destCompany || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                       {t(`status_${load.status}`)}
                    </span>
                    <ChevronRight className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-gray-50/50 animate-slide-up">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700 gap-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{load.plaka}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium"><Calendar className="w-3 h-3 inline mr-1"/> {load.createdAtDate} - {load.createdAtTime} {load.finishedAtTime && `| Çıkış: ${load.finishedAtTime}`}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300"><User className="w-4 h-4 inline text-gray-400 dark:text-gray-500 mr-1"/> {load.sofor || '-'}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
                      <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('dest_country')}</span><span className="font-bold text-gray-800 dark:text-gray-100">{load.destCountry || '-'}</span></div>
                      <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('dest_location')}</span><span className="font-bold text-gray-800 dark:text-gray-100">{load.destLocation || '-'}</span></div>
                      <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('project_no')}</span><span className="font-bold text-gray-800 dark:text-gray-100">{load.projectNo || '-'}</span></div>
                      <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('tonnage')}</span><span className="font-extrabold text-orange-600">{load.tonnage ? `${load.tonnage} Ton` : '-'}</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">{t('before')}</span>
                        {load.preImgUrl ? (
                          <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2" onClick={() => setPreviewModalImg(load.preImgUrl)}>
                             <img src={load.preImgUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                          </div>
                        ) : <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs mb-2">{t('no_photo')}</div>}
                        <p className="text-sm text-gray-700 dark:text-gray-200 italic">"{load.preNote || "-"}"</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">{t('after')}</span>
                        {load.status === 'beklemede' ? <div className="w-full h-44 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-400 text-sm font-medium mb-2">{t('status_beklemede')}</div> : 
                         load.status === 'yukleniyor' ? <div className="w-full h-44 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center text-orange-400 text-sm font-medium mb-2">{t('status_yukleniyor')}</div> : (
                          <>{load.postImgUrl ? (
                            <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2" onClick={() => setPreviewModalImg(load.postImgUrl)}>
                               <img src={load.postImgUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                            </div>
                          ) : <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs mb-2">{t('no_photo')}</div>}
                          <p className="text-sm text-gray-700 dark:text-gray-200 italic">"{load.postNote || "-"}"</p></>
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
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
             <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
               <div>
                 <button onClick={() => setSelectedYuklemeDate(null)} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 font-medium text-sm mb-4">
                   <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                 </button>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedYuklemeDate} Sevkiyat Raporu</h2>
                 <p className="text-gray-500 dark:text-gray-400 mt-1">{t('total_record')} {dateLoadings.length}</p>
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
      const currentMonth = yuklemeCalendarMonth;
      const currentYear = yuklemeCalendarYear;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
       const startOffset = firstDay === 0 ? 6 : firstDay - 1;
      const dayNames = lang === 'tr' ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const tasksByDate = {}; tasks.forEach(t => { if(!tasksByDate[t.createdAt]) tasksByDate[t.createdAt] = []; tasksByDate[t.createdAt].push(t); });
       const monthNames = lang === 'tr' ? ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
       const loadingsByDate = {};
         loadings.forEach(l => {
           if(!loadingsByDate[l.createdAtDate]) loadingsByDate[l.createdAtDate] = [];
           loadingsByDate[l.createdAtDate].push(l);
         });

       return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><Truck className="w-6 h-6 mr-3 text-orange-500"/> {t('all_reports')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('total_tonnage')}: <b className="text-orange-600 font-bold">{totalTonnageAll.toLocaleString('tr-TR')} Ton</b></p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl shadow-inner">
              <button onClick={() => { setYuklemeAnaTab('list'); setSelectedYuklemeCountry(null); setSelectedYuklemeCompany(null); }} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'list' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                Liste
              </button>
              <button onClick={() => { setYuklemeAnaTab('analysis'); setSelectedYuklemeCountry(null); setSelectedYuklemeCompany(null); }} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'analysis' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                Analiz
              </button>
              <button onClick={() => { setYuklemeAnaTab('calendar'); setSelectedYuklemeCountry(null); setSelectedYuklemeCompany(null); }} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'calendar' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                Takvim
              </button>
            </div>
          </div>

          {yuklemeAnaTab === 'analysis' ? (
            selectedYuklemeCountry || selectedYuklemeCompany ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div>
                    <button onClick={() => { setSelectedYuklemeCountry(null); setSelectedYuklemeCompany(null); }} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 font-medium text-sm mb-4">
                      <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                    </button>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {selectedYuklemeCountry ? `${selectedYuklemeCountry} ${t('shipments_title') || 'Sevkiyatları'}` : `${selectedYuklemeCompany} ${t('shipments_title') || 'Sevkiyatları'}`}
                    </h3>
                  </div>
                </div>
                {renderLoadingList(loadings.filter(l => selectedYuklemeCountry ? l.destCountry === selectedYuklemeCountry : l.destCompany === selectedYuklemeCompany))}
              </div>
            ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Globe className="w-5 h-5 mr-2 text-blue-500"/> {t('shipments_by_country') || 'Ülkelere Göre Sevkiyatlar'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCountries.map(c => (
                    <div key={c} onClick={() => setSelectedYuklemeCountry(c)} className="cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">
                      <span className="font-bold text-gray-700 dark:text-gray-200">{c}</span>
                      <div className="text-right">
                        <span className="block text-lg font-extrabold text-orange-600">{countryStats[c].ton.toLocaleString('tr-TR')} Ton</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{countryStats[c].count} Sevkiyat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Building2 className="w-5 h-5 mr-2 text-blue-500"/> {t('shipments_by_company') || 'Firmalara Göre Sevkiyatlar'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCompanies.map(c => (
                    <div key={c} onClick={() => setSelectedYuklemeCompany(c)} className="cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">
                      <span className="font-bold text-gray-700 dark:text-gray-200 truncate w-32" title={c}>{c}</span>
                      <div className="text-right shrink-0">
                        <span className="block text-lg font-extrabold text-orange-600">{companyStats[c].ton.toLocaleString('tr-TR')} Ton</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{companyStats[c].count} Sevkiyat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )
          ) : yuklemeAnaTab === 'calendar' ? (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
                 <div>
                   <div className="flex items-center space-x-4">
                     <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xl flex items-center">
                       <CalendarDays className="w-6 h-6 mr-3 text-orange-500"/> {monthNames[currentMonth]} {currentYear}
                     </h3>
                     <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                       <button onClick={handleYuklemePrevMonth} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                       <button onClick={handleYuklemeToday} className="px-2 text-xs font-bold text-gray-600 dark:text-gray-300">{t('filter_today') || 'Bugün'}</button>
                       <button onClick={handleYuklemeNextMonth} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
                     </div>
                   </div>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-3">
                {dayNames.map(day => <div key={day} className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                 {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 opacity-50"></div>)}
                 {Array.from({ length: daysInMonth }).map((_, i) => {
                   const dayNum = i + 1;
                   const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
                   const isToday = dayNum === currDate.getDate() && currentMonth === currDate.getMonth() && currentYear === currDate.getFullYear();
                   const dayLoadings = loadingsByDate[formattedDateForCell] || [];
                   
                   return (
                     <div key={dayNum} onClick={() => dayLoadings.length > 0 && setSelectedYuklemeDate(formattedDateForCell)} className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all hover:-translate-y-1 ${isToday ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-100 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'}`}>
                       <span className={`text-sm md:text-base font-bold ${isToday ? 'text-orange-700' : 'text-gray-700 dark:text-gray-200'}`}>{dayNum}</span>
                       {dayLoadings.length > 0 && <span className="text-[9px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full mt-1 shadow-sm">{dayLoadings.length} Sevkiyat</span>}
                     </div>
                   );
                 })}
              </div>
            </div>
          ) : (
                        <div>
              <div className="flex flex-wrap justify-end mb-4 gap-2">
                <button onClick={() => setYuklemeListFilter('day')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${yuklemeListFilter === 'day' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_day')}</button>
                <button onClick={() => setYuklemeListFilter('week')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${yuklemeListFilter === 'week' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_week')}</button>
                <button onClick={() => setYuklemeListFilter('month')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${yuklemeListFilter === 'month' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_month')}</button>
                <button onClick={() => setYuklemeListFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${yuklemeListFilter === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('filter_all')}</button>
              </div>
              {renderLoadingList(loadings.filter(l => {
                if (yuklemeListFilter === 'all') return true;
                const now = new Date();
                if (yuklemeListFilter === 'day') {
                   const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                   return l.timestamp >= startOfDay;
                }
                if (yuklemeListFilter === 'week') {
                   const day = now.getDay();
                   const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                   const startOfWeek = new Date(now.setDate(diff)).setHours(0,0,0,0);
                   return l.timestamp >= startOfWeek;
                }
                if (yuklemeListFilter === 'month') {
                   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                   return l.timestamp >= startOfMonth;
                }
                return true;
              }))}
            </div>
          )}
        </div>
       );
    }

      if (selectedAdminDept || selectedAdminDate) {
        const filterTasks = selectedAdminDept ? tasks.filter(t => t.dept === selectedAdminDept) : tasks.filter(t => t.createdAt === selectedAdminDate);
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
              <div>
                <button onClick={() => { setSelectedAdminDept(null); setSelectedAdminDate(null); }} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 font-medium text-sm mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedAdminDept || selectedAdminDate} Raporu</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('total_record')} {filterTasks.length}</p>
              </div>
              {selectedAdminDept && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 px-6 py-3 rounded-2xl border border-green-200 text-center">
                 <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">{t('current_score')}</p>
                 <p className="text-3xl font-extrabold text-green-600">{points[selectedAdminDept]}</p>
              </div>)}
            </div>

            <div className="space-y-4">
              {filterTasks.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_records')}</p> : (
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
                          <div className={`p-5 rounded-2xl border-l-4 bg-gray-50 dark:bg-gray-900 ${statusDef.color.split(' ')[2]} ${isGlowing ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400 animate-[pulse_2s_ease-in-out_infinite]' : 'shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                 <span className="font-bold text-gray-800 dark:text-gray-100 block">{t(getDeptKey(task.dept))}</span>
                                 <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{task.createdAt}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                                <Icon className="w-3 h-3 mr-1" /> {t(statusDef.label_key)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                                 <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 w-full text-left">{t('before')}</span>
                                 {task.imgUrl ? (
                                    <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2 w-full" onClick={() => setPreviewModalImg(task.imgUrl)}>
                                      <img src={task.imgUrl} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                    </div>
                                 ) : <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs mb-2">{t('no_photo')}</div>}
                                 <p className="text-sm text-gray-800 dark:text-gray-100 w-full text-left">{task.desc}</p>
                               </div>
                               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center opacity-90">
                                 <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 w-full text-left">{t('solution_after')}</span>
                                 {task.status === 'cozuldu' || task.status === 'onay_bekliyor' ? (
                                   <>{task.afterImgUrl ? (
                                      <div className="relative group cursor-pointer overflow-hidden rounded-lg mb-2 w-full" onClick={() => setPreviewModalImg(task.afterImgUrl)}>
                                        <img src={task.afterImgUrl} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                      </div>
                                   ) : <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs mb-2">{t('no_photo')}</div>}
                                   <p className="text-sm text-gray-700 dark:text-gray-200 italic w-full text-left">"{task.chiefNote}"</p></>
                                 ) : <div className="w-full h-full min-h-[8rem] bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">{t('stat_acik')}</div>}
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
       const currentMonth = isgCalendarMonth;
      const currentYear = isgCalendarYear;
       const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
       const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1;
      const dayNames = lang === 'tr' ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const tasksByDate = {}; tasks.forEach(t => { if(!tasksByDate[t.createdAt]) tasksByDate[t.createdAt] = []; tasksByDate[t.createdAt].push(t); });
      const monthNames = lang === 'tr' ? ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
             <div>
               <div className="flex items-center space-x-4">
                 <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-2xl flex items-center">
                   <CalendarDays className="w-7 h-7 mr-3 text-blue-600"/> {monthNames[currentMonth]} {currentYear}
                 </h3>
                 <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                   <button onClick={handleIsgPrevMonth} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                   <button onClick={handleIsgToday} className="px-2 text-xs font-bold text-gray-600 dark:text-gray-300">{t('filter_today') || 'Bugün'}</button>
                   <button onClick={handleIsgNextMonth} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
                 </div>
               </div>
             </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {dayNames.map(day => <div key={day} className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 opacity-50"></div>)}
             {Array.from({ length: daysInMonth }).map((_, i) => {
               const dayNum = i + 1;
               const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
               const isToday = dayNum === currDate.getDate() && currentMonth === currDate.getMonth() && currentYear === currDate.getFullYear();
               const dayTasks = tasksByDate[formattedDateForCell] || [];
               
               return (
                 <div key={dayNum} onClick={() => dayTasks.length > 0 && setSelectedAdminDate(formattedDateForCell)} className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all hover:-translate-y-1 ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'}`}>
                   <span className={`text-sm md:text-base font-bold ${isToday ? 'text-blue-700' : 'text-gray-700 dark:text-gray-200'}`}>{dayNum}</span>
                   {dayTasks.length > 0 && <span className="text-[9px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full mt-1 shadow-sm">{dayTasks.length} Rapor</span>}
                 </div>
               );
             })}
          </div>
        </div>
      );
    };

    const getRedTaskCount = useCallback((deptName) => {
      return tasks.filter(t => t.dept === deptName && (t.status === 'acik' || t.status === 'itiraz_edildi')).length;
    }, [tasks]);

    const sortedDeptsAdmin = useMemo(() => {
      const depts = currentUser.role === 'sef' ? [currentUser.dept] : [...DEPARTMENTS];
      return depts.sort((a, b) => getRedTaskCount(b) - getRedTaskCount(a));
    }, [getRedTaskCount, currentUser]);

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full xl:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto">
              <div><h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">{t('admin_panel')}</h1><p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin_desc')}</p></div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col xl:flex-row flex-wrap w-full md:w-auto bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl shadow-inner gap-1`}>
               <button onClick={() => { navigate('/'); setAdminSystemMode('isg'); setAdminViewMode('calendar'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'isg' ? 'bg-white dark:bg-gray-800 text-blue-700 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}><ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_tab')}</button>
               <button onClick={() => { navigate('/'); setAdminSystemMode('yukleme'); setAdminViewMode('calendar'); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'yukleme' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}><Truck className="w-4 h-4 mr-2" /> {t('yukleme_tab')}</button>
               {currentUser.role === 'admin' && <button onClick={() => { navigate('/'); setAdminSystemMode('users'); setAdminViewMode('users'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'users' ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}><Users className="w-4 h-4 mr-2" /> {t('btn_users') || 'Kullanıcı Hesapları'}</button>}
               <button onClick={() => { navigate('/'); setAdminSystemMode('leaderboard'); setAdminViewMode('leaderboard'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'leaderboard' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}><TrendingUp className="w-4 h-4 mr-2" /> {t('leaderboard') || 'Liderlik Tablosu'}</button>
               <button onClick={() => { navigate('/analysis'); setAdminSystemMode('analysis'); setAdminViewMode('analysis'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'analysis' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}><Activity className="w-4 h-4 mr-2" /> {t('analysis_tab') || 'Analiz Raporları'}</button>

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-900 justify-between"><div className="flex items-center"><AlertCircle className="w-5 h-5 text-red-500 mr-2" /><h3 className="font-bold text-gray-800 dark:text-gray-100">{t('risk_map')}</h3></div></div>
              <div className="divide-y divide-gray-50">
                {sortedDeptsAdmin.map((dept, index) => {
                  const redCount = getRedTaskCount(dept);
                  const isSelected = selectedAdminDept === dept;
                  return (
                  <div key={dept} onClick={() => { navigate('/analysis/' + encodeURIComponent(dept)); window.scrollTo(0,0); }} className={`flex justify-between items-center p-4 cursor-pointer transition-all group border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-center"><span className="w-6 text-center text-sm font-bold mr-3 text-gray-400 dark:text-gray-500">{index + 1}.</span><span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700 dark:text-gray-200 group-hover:text-blue-600'}`}>{t(getDeptKey(dept))}</span></div>
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

        {currentUser.username === 'agiradar' && (adminSystemMode === 'isg' || adminSystemMode === 'yukleme') && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div><h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center mb-2"><AlertTriangle className="w-6 h-6 mr-2"/> {adminSystemMode === 'isg' ? "İSG Geçmişini Sil" : "Sevkiyat Geçmişini Sil"}</h3><p className="text-sm text-red-600 dark:text-red-400 font-medium">{adminSystemMode === 'isg' ? "Seçilen tarihten önceki İSG kayıtları silinecektir." : "Seçilen tarihten önceki sevkiyat kayıtları silinecektir."}</p></div>
              <div className="flex w-full md:w-auto space-x-3 items-center">
                <select value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="flex-1 md:w-48 border border-red-200 rounded-xl p-3 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  <option value="1">{t('month_1')}</option><option value="3">{t('month_3')}</option><option value="6">{t('month_6')}</option><option value="all">{t('month_all')}</option>
                </select>
                <button onClick={() => { setDeleteTarget(adminSystemMode); setShowDeleteModal(true); setDeleteCountdown(10); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md whitespace-nowrap">{t('delete_btn')}</button>
              </div>
            </div>
          </div>
        )}

        {bonusModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-blue-600" /> Özel Puan: {bonusDept}
                 </h3>
                 <button onClick={() => setBonusModalOpen(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('action_type') || 'İşlem Türü'}</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => setBonusType('add')} className={`py-3 rounded-xl font-bold flex items-center justify-center transition-colors ${bonusType === 'add' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 border-2 border-transparent'}`}>
                          <Plus className="w-5 h-5 mr-1" /> Puan Ekle
                       </button>
                       <button onClick={() => setBonusType('subtract')} className={`py-3 rounded-xl font-bold flex items-center justify-center transition-colors ${bonusType === 'subtract' ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 border-2 border-transparent'}`}>
                          <ArrowDownRight className="w-5 h-5 mr-1" /> Puan Düş
                       </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('amount') || 'Miktar'}</label>
                    <input type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder={t('ph_bonus_amt') || 'Örn: 10'} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold" min="1" />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Açıklama / Sebep</label>
                    <input type="text" value={bonusReason} onChange={e => setBonusReason(e.target.value)} placeholder={t('ph_bonus_reason') || 'Neden puan veriliyor?'} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                 <button onClick={() => setBonusModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('cancel') || 'İptal'}</button>
                 <button onClick={submitCustomBonus} className={`flex-1 py-3 font-bold rounded-xl text-white shadow-md transition-colors ${bonusType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{t('save_btn') || 'Kaydet'}</button>
              </div>
            </div>
          </div>
        )}

{showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-red-600 text-white flex justify-between items-center"><h3 className="font-bold text-xl flex items-center"><ShieldAlert className="w-6 h-6 mr-2"/> {t('are_you_sure')}</h3><button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="p-1 hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></button></div>
              <div className="p-6 md:p-8 text-center space-y-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{t('are_you_sure')}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{historyFilter === 'all' ? t('del_warn_all') : `${t('del_warn_1')} ${historyFilter} ${t('del_warn_2')}`} <b className="text-red-600">{t('del_warn_end')}</b></p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold rounded-xl hover:bg-gray-200">{t('cancel')}</button>
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
  };


export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem('isg_lang') || 'tr');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('isg_dark') === 'true');
  
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('isg_dark', darkMode);
  }, [darkMode]);
  
  const [users, setUsers] = useState([]);
  const [points, setPoints] = useState({});
  const [pointsHistory, setPointsHistory] = useState({});
  const [tasks, setTasks] = useState([]);
  const [pointLogs, setPointLogs] = useState([]);
  const [loadings, setLoadings] = useState([]);

  const [adminSystemMode, setAdminSystemMode] = useState('isg'); 
  const [adminViewMode, setAdminViewMode] = useState('list');
  const [selectedAdminDept, setSelectedAdminDept] = useState(null);
  const [selectedAdminDate, setSelectedAdminDate] = useState(null);
  const [selectedYuklemeDate, setSelectedYuklemeDate] = useState(null);

  // Full-screen Image Modal Viewer
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [previewModalTitle, setPreviewModalTitle] = useState('');

  const t = useCallback((key) => DICT[lang][key] || key, [lang]);

  const toggleLang = useCallback(() => {
    const newLang = lang === 'tr' ? 'en' : 'tr';
    setLang(newLang);
    localStorage.setItem('isg_lang', newLang);
  }, [lang]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      if (usersData.length === 0) {
        const defaultAdmin = { id: "1", username: 'agiradar', password: 'agiradar123', role: 'admin', name: 'Ağır Adar', dept: null };
        setDoc(doc(db, "users", "1"), defaultAdmin);
        setUsers([defaultAdmin]);
      } else {
        const adminAcc = usersData.find(u => u.id === "1");
        if (adminAcc && adminAcc.username === 'admin') {
           updateDoc(doc(db, "users", "1"), { username: 'agiradar', password: 'agiradar123', name: 'Ağır Adar' });
        }
        setUsers(usersData);
        
        const savedUserId = localStorage.getItem('isg_logged_in_user');
        if (savedUserId) {
          const autoUser = usersData.find(u => u.id === savedUserId);
          if (autoUser) setCurrentUser(autoUser);
        }
      }
    });

    const unsubPoints = onSnapshot(doc(db, "system", "points"), (docSnap) => {
      if (docSnap.exists()) { setPoints(docSnap.data()); } 
      else {
        const initialPoints = DEPARTMENTS.reduce((acc, dept) => { acc[dept] = 100; return acc; }, {});
        setDoc(doc(db, "system", "points"), initialPoints);
        setPoints(initialPoints);
      }
    });

    const unsubPointLogs = onSnapshot(collection(db, "point_logs"), (snapshot) => {
      const logsData = snapshot.docs.map(doc => doc.data());
      logsData.sort((a, b) => b.timestamp - a.timestamp);
      setPointLogs(logsData);
    });

    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => doc.data());
      tasksData.sort((a, b) => b.timestamp - a.timestamp);
      setTasks(tasksData);
      setIsFirebaseLoading(false);
    });

    const unsubPointsHistory = onSnapshot(doc(db, "system", "points_history"), (docSnap) => {
      if (docSnap.exists()) { setPointsHistory(docSnap.data()); }
    });

    const unsubLoadings = onSnapshot(collection(db, "loadings"), (snapshot) => {
      const loadingData = snapshot.docs.map(doc => doc.data());
      loadingData.sort((a, b) => b.timestamp - a.timestamp);
      setLoadings(loadingData);
    });

    return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); unsubPointsHistory(); unsubPointLogs(); };
  }, []);

  useEffect(() => {
    if (isFirebaseLoading || !points || Object.keys(points).length === 0) return;
    
    const checkDailyBonus = async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedYesterday = `${yesterday.getDate().toString().padStart(2, '0')}.${(yesterday.getMonth() + 1).toString().padStart(2, '0')}.${yesterday.getFullYear()}`;
        
        if (points.lastDailyBonus === formattedYesterday) return;
        
        const yesterdaysTasks = tasks.filter(t => t.createdAt === formattedYesterday);
        const deptsWithTasks = new Set(yesterdaysTasks.map(t => t.dept));
        
        let distributed = 0;
        const updates = {};
        
        DEPARTMENTS.forEach(dept => {
          if (!deptsWithTasks.has(dept)) {
            updates[dept] = (points[dept] || 100) + 20;
            distributed++;
          }
        });
        
        updates.lastDailyBonus = formattedYesterday;
        
        const pointsRef = doc(db, "system", "points");
        await updateDoc(pointsRef, updates);
        console.log(`Otomatik Günlük Bonus Dağıtıldı: ${distributed} birime 20 puan eklendi.`);
      } catch (err) {
        console.error("Otomatik bonus dağıtımı hatası:", err);
      }
    };
    checkDailyBonus();
  }, [isFirebaseLoading, points, tasks]);


  const getLastFridayOfCurrentMonth = useCallback(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); 
    while (d.getDay() !== 5) { d.setDate(d.getDate() - 1); }
    return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [lang]);

  const logout = useCallback(() => { 
    setCurrentUser(null); 
    setSelectedAdminDept(null); 
    setSelectedAdminDate(null);
    setAdminViewMode('list');
    setAdminSystemMode('isg');
    localStorage.removeItem('isg_logged_in_user');
  }, []);

  const createTask = useCallback(async (dept, priority, desc, deadlineHours, imgUrl) => {
    const taskId = Date.now().toString();
    const newTask = {
      id: taskId, dept, priority, desc, status: 'acik', 
      createdAt: formatDate(new Date()), timestamp: Date.now(), 
      deadlineHours, imgUrl: imgUrl || '', modNote: ''
    };
    await setDoc(doc(db, "tasks", taskId), newTask);
  }, []);

  const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);
    
    // Puan sistemi mantığı: Sadece "acik" durumdan "cozuldu" durumuna geçerken
    if (newStatus === 'cozuldu') {
      const taskSnap = await getDoc(taskRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        if (taskData.status !== 'cozuldu') {
           const now = taskData.resolvedTimestamp || Date.now();
           const createdAt = taskData.timestamp;
           const deadlineHours = parseInt(taskData.deadlineHours, 10) || 24;
           const timePassedHours = (now - createdAt) / (1000 * 60 * 60);
           
           let deduction = 5; // Vaktinde çözülürse düşük puan kaybı (-5)
           if (timePassedHours > deadlineHours) {
             deduction = 15; // Vaktinde çözülmezse 3 katı puan kaybı (-15)
           }
           
           const pointsRef = doc(db, "system", "points");
           const pointsSnap = await getDoc(pointsRef);
           if (pointsSnap.exists()) {
             const currentPoints = pointsSnap.data();
             const dept = taskData.dept;
             if (dept) {
               const newPoints = (currentPoints[dept] || 100) - deduction;
               await updateDoc(pointsRef, { [dept]: newPoints });
             }
           }
        }
      }
    }
    
    const updates = { status: newStatus };
    if (chiefNote) updates.chiefNote = chiefNote;
    if (afterImgUrl) updates.afterImgUrl = afterImgUrl;
    if (modNote) updates.modNote = modNote;
    if (newStatus === 'onay_bekliyor' || newStatus === 'itiraz_edildi') {
      updates.resolvedTimestamp = Date.now();
    }
    await updateDoc(taskRef, updates);
  }, []);

  const createLoading = useCallback(async (plaka, sofor, destCountry, destLocation, destCompany, projectNo, tonnage, not, imgUrl) => {
    const loadId = Date.now().toString();
    const newLoad = {
      id: loadId, 
      plaka, 
      sofor, 
      destCountry: destCountry || '',
      destLocation: destLocation || '', 
      destCompany: destCompany || '', 
      projectNo: projectNo || '', 
      tonnage: tonnage || '', 
      preNote: not, 
      preImgUrl: imgUrl || '', 
      status: 'beklemede', 
      creatorId: currentUser.id, 
      creatorName: currentUser.name,
      createdAtDate: formatDate(new Date()), 
      createdAtTime: formatTime(new Date()), 
      timestamp: Date.now(),
      postImgUrl: '', 
      postNote: '', 
      finishedAtTime: ''
    };
    await setDoc(doc(db, "loadings", loadId), newLoad);
  }, [currentUser]);

  const startLoadingProcess = useCallback(async (loadId) => {
    const loadRef = doc(db, "loadings", loadId);
    await updateDoc(loadRef, {
      status: 'yukleniyor'
    });
  }, []);

  const finishLoading = useCallback(async (loadId, postNot, postImgUrl) => {
    const loadRef = doc(db, "loadings", loadId);
    await updateDoc(loadRef, {
      status: 'tamamlandi',
      postNote: postNot,
      postImgUrl: postImgUrl || '',
      finishedAtTime: formatTime(new Date())
    });
  }, []);

  // 24 Hour Tonnage Analytics Calculation
  const get24HourTonnage = useCallback(() => {
    const past24h = Date.now() - (24 * 60 * 60 * 1000);
    return loadings
      .filter(l => l.timestamp >= past24h)
      .reduce((total, load) => {
        const val = parseFloat(load.tonnage) || 0;
        return total + val;
      }, 0);
  }, [loadings]);

  

  // Full Screen Image Modal Lightbox Component






  const contextValue = useMemo(() => ({
    currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
    lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
    loadings, setLoadings, adminSystemMode, setAdminSystemMode,
    adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
    selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
    previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
    t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
    createLoading, startLoadingProcess, finishLoading, get24HourTonnage,
    db
  }), [
    currentUser, isFirebaseLoading, lang, darkMode, users, points, pointsHistory, tasks, loadings, 
    adminSystemMode, adminViewMode, selectedAdminDept, selectedAdminDate, selectedYuklemeDate,
    previewModalImg, previewModalTitle, t, toggleLang, getLastFridayOfCurrentMonth, 
    logout, createTask, updateTaskStatus, createLoading, startLoadingProcess, finishLoading, 
    get24HourTonnage
  ]);

  return (
    <AppContext.Provider value={contextValue}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 w-full">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <ImageLightboxModal />
      
      {!currentUser ? (
        <LoginScreen />
      ) : (
        <>
          <TopBar theme={currentUser.role === 'yuklemeci' ? 'orange' : 'blue'} />
          <main className="flex-1 w-full flex">
             {currentUser.role === 'admin' && <AdminDashboard />}
             {currentUser.role === 'mod' && <ModDashboard />}
             {currentUser.role === 'sef' && <SefDashboard />}
             {currentUser.role === 'yuklemeci' && <YuklemeciDashboard />}
          </main>
        </>
      )}
    </div>
    </AppContext.Provider>
  );
}
