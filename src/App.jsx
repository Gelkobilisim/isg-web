import React, { useState, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle, XCircle, LogOut, Clock, ShieldAlert, Calendar, Image as ImageIcon, X, ArrowDownRight, ChevronRight, ArrowLeft, Activity, AlertCircle, List, CalendarDays, Lock, User, Users, Plus, Trash2, Truck, Globe, MapPin, Building, FileText, Weight, BarChart3, ChevronDown, ChevronUp, ZoomIn, ChevronLeft } from 'lucide-react';

const DEPARTMENTS = ["Boyahane", "Altyapı", "Dalgaduvar", "Lazer", "Güç", "Kaynaklı imalat", "Dış alan", "Bakım & Onarım"];
const COUNTRIES = ["Türkiye", "Almanya", "Fransa", "İngiltere", "İtalya", "İspanya", "Hollanda", "Belçika", "Avusturya", "İsveç", "ABD", "Kanada", "Diğer"];

const PRIORITIES = {
  basit: { label: 'Basit', multiplier: 1, color: 'bg-blue-100 text-blue-800' },
  orta: { label: 'Orta', multiplier: 2, color: 'bg-yellow-100 text-yellow-800' },
  kritik: { label: 'Kritik', multiplier: 5, color: 'bg-red-100 text-red-800' }
};

const STATUS_INFO = {
  cozuldu: { label: 'Çözüldü', color: 'bg-green-100 text-green-800 border-green-500', icon: CheckCircle },
  onay_bekliyor: { label: 'Cevap Bekleniyor', color: 'bg-yellow-100 text-yellow-800 border-yellow-500', icon: Clock },
  acik: { label: 'Çözülmemiş', color: 'bg-red-100 text-red-800 border-red-500', icon: AlertTriangle },
  itiraz_edildi: { label: 'İtiraz Edildi', color: 'bg-red-100 text-red-800 border-red-500', icon: AlertTriangle },
  iptal: { label: 'İptal Edildi', color: 'bg-gray-100 text-gray-800 border-gray-400', icon: XCircle }
};

const SHIPPING_STATUS = {
  beklemede: { label: 'Yükleme İçin Beklemede', color: 'bg-blue-100 text-blue-800 border-blue-400', icon: Clock },
  yukleniyor: { label: 'Yükleniyor', color: 'bg-orange-100 text-orange-800 border-orange-400', icon: Activity },
  gonderildi: { label: 'Yüklenip Gönderildi', color: 'bg-green-100 text-green-800 border-green-500', icon: CheckCircle }
};

const DICTIONARY = {
  tr: {
    sys_isg_title: "İSG & Tertip",
    sys_yukleme_title: "Yükleme Takip",
    sys_management: "Yönetim Sistemi",
    isg_tab: "İSG Modülü",
    yukleme_tab: "Yükleme Modülü",
    login_desc_isg: "Fabrika içi iş sağlığı, güvenliği ve 5S standartlarını korumak için tasarlanmış merkezi kontrol paneli.",
    login_desc_yukleme: "Fabrika sevkiyat, tır yüklemeleri ve uluslararası operasyonları canlı takip paneli.",
    welcome: "Hoş Geldiniz",
    login_prompt: "Sisteme devam etmek için hesap bilgilerinizi girin.",
    username: "Kullanıcı Adı",
    password: "Şifre",
    remember_me: "Beni Hatırla",
    login_btn: "Sisteme Giriş Yap",
    logout: "Çıkış Yap",
    err_login: "Kullanıcı adı veya şifre hatalı veya bu modüle yetkiniz yok!",
    no_auth: "Bu modüle giriş yetkiniz bulunmamaktadır."
  },
  en: {
    sys_isg_title: "OHS & 5S",
    sys_yukleme_title: "Shipping Tracking",
    sys_management: "Management System",
    isg_tab: "OHS Module",
    yukleme_tab: "Shipping Module",
    login_desc_isg: "Central control panel designed to maintain factory health, safety, and 5S standards.",
    login_desc_yukleme: "Live tracking panel for factory shipments, truck loadings, and international operations.",
    welcome: "Welcome",
    login_prompt: "Enter your credentials to continue to the system.",
    username: "Username",
    password: "Password",
    remember_me: "Remember Me",
    login_btn: "Login to System",
    logout: "Logout",
    err_login: "Invalid username or password, or unauthorized for this module!",
    no_auth: "You do not have authorization to access this module."
  }
};

export default function App() {
  const [lang, setLang] = useState('tr');
  const t = (key) => DICTIONARY[lang][key] || key;
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loginTheme, setLoginTheme] = useState('isg'); // 'isg' | 'yukleme'
  
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('isg_users');
    if (saved) return JSON.parse(saved);
    return [{ id: 1, username: 'agiradar', password: 'agiradar123', role: 'admin', name: 'A. Adar', dept: null }];
  });

  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('isg_points');
    if (saved) return JSON.parse(saved);
    return DEPARTMENTS.reduce((acc, dept) => { acc[dept] = 100; return acc; }, {});
  });
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('isg_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [loadings, setLoadings] = useState(() => {
    const saved = localStorage.getItem('loadings');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('isg_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('isg_points', JSON.stringify(points)); }, [points]);
  useEffect(() => { localStorage.setItem('isg_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('loadings', JSON.stringify(loadings)); }, [loadings]);

  const [lightboxImg, setLightboxImg] = useState(null);

  const formatDate = (dateObj) => {
    return `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
  };

  const logout = () => { setCurrentUser(null); };

  const get24HourTonnage = () => {
    const past24h = Date.now() - (24 * 60 * 60 * 1000);
    return loadings.filter(l => l.timestamp >= past24h).reduce((total, load) => total + (parseFloat(load.tonnage) || 0), 0);
  };

  const CompanyLogo = ({ className = "", scale = "scale-100", theme = 'blue', showBox = true }) => (
    <div className={`flex flex-col items-center justify-center rounded-2xl ${showBox ? 'bg-white px-16 py-6 shadow-2xl border border-gray-100' : ''} ${className}`}>
      <div className={`flex items-center space-x-2 ${scale} origin-center`}>
        <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
           <div className={`absolute top-0 left-0 w-full h-full border-t-4 border-l-4 rounded-tl-full opacity-80 ${theme==='orange'?'border-orange-600':'border-blue-900'}`}></div>
           <div className={`absolute top-1 left-1 w-[90%] h-[90%] border-t-4 border-l-4 rounded-tl-full ${theme==='orange'?'border-orange-400':'border-blue-400'}`}></div>
           <div className="absolute top-3 left-2 w-[80%] h-[80%] border-t-4 border-l-4 border-gray-400 rounded-tl-full opacity-50"></div>
        </div>
        <div className="flex flex-col items-start">
          <div className="flex items-baseline space-x-1">
            <span className="text-gray-800 font-extrabold text-2xl tracking-tighter">ADS</span>
            <span className="text-gray-800 font-bold text-xl">Metal A.Ş.</span>
          </div>
          <span className={`text-[6.5px] font-bold text-white px-1.5 py-0.5 rounded-sm tracking-widest uppercase -mt-0.5 w-max ${theme==='orange'?'bg-orange-600':'bg-blue-900'}`}>Transformer Tanks & Fin Walls</span>
        </div>
      </div>
    </div>
  );

  const ImageLightboxModal = () => {
    if (!lightboxImg) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setLightboxImg(null)}>
        <button className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full"><X className="w-8 h-8" /></button>
        <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
           <img src={lightboxImg} alt="Enlarged" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/20" />
        </div>
      </div>
    );
  };

  const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginErr, setLoginErr] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    const isISG = loginTheme === 'isg';

    const handleLogin = (e) => {
      e.preventDefault();
      const account = users.find(u => u.username === username.toLowerCase().trim());
      
      if (account && account.password === password) {
        if (loginTheme === 'isg' && account.role === 'yuklemeci') { setLoginErr(t('no_auth')); return; }
        if (loginTheme === 'yukleme' && (account.role === 'sef' || account.role === 'mod')) { setLoginErr(t('no_auth')); return; }
        setCurrentUser(account);
        setLoginErr('');
      } else {
        setLoginErr(t('err_login'));
      }
    };

    return (
      <div className="relative flex items-center justify-center min-h-screen bg-gray-900 p-6 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="ads-metal-anadolu-osb.jpg" alt="ADS Metal Factory" className="w-full h-full object-cover" />
           <div className={`absolute inset-0 bg-gradient-to-br ${isISG ? 'from-blue-900/90 to-gray-900/90' : 'from-orange-900/90 to-gray-900/90'}`}></div>
        </div>

        <div className="absolute top-6 right-6 z-20 flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
          <button onClick={() => setLang('tr')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === 'tr' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}`}>TR</button>
          <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === 'en' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}`}>EN</button>
        </div>

        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10 border border-white/40 mt-12 md:mt-0">
          <div className={`hidden md:flex flex-col items-center justify-center w-1/2 p-12 border-r border-gray-100 transition-colors duration-500 ${isISG ? 'bg-blue-50/50' : 'bg-orange-100/30'}`}>
            <CompanyLogo className="mb-8" scale="scale-150" theme={isISG ? 'blue' : 'orange'} showBox={true} />
            <div className="flex space-x-2 bg-gray-200 p-1 rounded-xl shadow-inner mb-6">
              <button onClick={() => setLoginTheme('isg')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${isISG ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}><ShieldAlert className="w-4 h-4 mr-1.5" /> İSG</button>
              <button onClick={() => setLoginTheme('yukleme')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${!isISG ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'}`}><Truck className="w-4 h-4 mr-1.5" /> Yükleme</button>
            </div>
            <h1 className={`text-3xl font-bold text-center mt-2 ${isISG ? 'text-blue-900' : 'text-orange-900'}`}>{isISG ? t('sys_isg_title') : t('sys_yukleme_title')}<br/>{t('sys_management')}</h1>
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-6">
              <CompanyLogo className="mx-auto" scale="scale-110" theme={isISG ? 'blue' : 'orange'} showBox={false} />
              <div className="flex justify-center space-x-2 bg-gray-200 p-1 rounded-xl shadow-inner mt-6 mx-auto w-max">
                <button onClick={() => setLoginTheme('isg')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${isISG ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}><ShieldAlert className="w-4 h-4 mr-1.5" /> İSG</button>
                <button onClick={() => setLoginTheme('yukleme')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${!isISG ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'}`}><Truck className="w-4 h-4 mr-1.5" /> Yükleme</button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('welcome')}</h2>
            <p className="text-gray-500 mb-8 text-sm">{t('login_prompt')}</p>
            
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
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" required />
                </div>
              </div>
              <div className="flex items-center mt-2 pl-1"><input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 bg-gray-100 border-gray-300 rounded cursor-pointer" /><label htmlFor="rememberMe" className="ml-2 text-sm font-bold text-gray-600 cursor-pointer">{t('remember_me')}</label></div>
              <button type="submit" className={`w-full py-4 text-white rounded-xl font-bold shadow-lg mt-4 ${isISG ? 'bg-blue-700 hover:bg-blue-800' : 'bg-orange-600 hover:bg-orange-700'}`}>{t('login_btn')}</button>
            </form>
          </div>
        </div>
        
        <div className="absolute bottom-4 w-full text-center z-10 pointer-events-none">
          <span className="text-xs text-white/50 italic font-medium tracking-wider">by agiradar</span>
        </div>
      </div>
    );
  };

  const TopBar = ({ theme = 'blue' }) => (
    <header className="bg-white px-6 py-3 shadow-sm flex justify-between items-center sticky top-0 z-30 border-b border-gray-200">
      <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 scale-75 md:scale-90 origin-left"><CompanyLogo className="!p-0" theme={theme} showBox={false} /></div>
          <div className="border-l pl-4 border-gray-300"><h2 className="font-bold text-gray-800 text-sm md:text-base leading-tight">{currentUser.name}</h2><span className="text-[10px] md:text-xs text-gray-500 capitalize leading-tight">{currentUser.role === 'sef' ? `${currentUser.dept} Birimi` : (currentUser.role === 'yuklemeci' ? 'Yükleme Sorumlusu' : currentUser.role)}</span></div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors">TR / EN</button>
          <button onClick={logout} className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"><span className="hidden sm:inline">{t('logout')}</span><LogOut className="w-5 h-5" /></button>
        </div>
      </div>
    </header>
  );

  const AdminDashboard = () => {
    const [adminViewMode, setAdminViewMode] = useState('isg'); // 'isg' | 'yukleme'
    
    // ISG Sub-states
    const [isgTab, setIsgTab] = useState('list'); // 'list' | 'calendar' | 'users'
    const [selectedAdminDept, setSelectedAdminDept] = useState(null);
    const [selectedAdminDate, setSelectedAdminDate] = useState(null);
    
    // Yükleme Sub-states
    const [yuklemeTab, setYuklemeTab] = useState('calendar'); // 'calendar' | 'analiz'
    
    // Users state
    const [userTab, setUserTab] = useState('isg'); // 'isg' | 'yukleme'
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });

    // Calendar logic
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
    const getCalendarDate = () => {
      const d = new Date();
      d.setMonth(d.getMonth() + currentMonthOffset);
      return d;
    };
    
    // Calendar filter for shipping
    const [shipFilter, setShipFilter] = useState('today'); // 'today' | 'month' | 'year' | 'all'

    const handleCreateUser = (e) => {
      e.preventDefault();
      if(users.find(u => u.username === newUser.username)) { alert("Bu kullanıcı adı zaten alınmış!"); return; }
      setUsers([...users, { ...newUser, id: Date.now(), dept: newUser.role === 'sef' ? newUser.dept : null }]);
      setNewUser({ username: '', password: '', name: '', role: userTab === 'isg' ? 'sef' : 'yuklemeci', dept: DEPARTMENTS[0] });
    };

    const handleDeleteUser = (id) => {
      if(id === 1) return;
      if(window.confirm("Silmek istediğinize emin misiniz?")) { setUsers(users.filter(u => u.id !== id)); }
    };

    const isAdminAgiradar = currentUser.username === 'agiradar';

    const renderUsers = () => (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><Users className="w-6 h-6 mr-2 text-blue-600"/> Kullanıcı Yönetimi</h2>
        
        <div className="flex space-x-2 mb-6 border-b pb-2">
          <button onClick={() => {setUserTab('isg'); setNewUser({...newUser, role: 'sef'});}} className={`px-4 py-2 font-bold text-sm rounded-t-lg ${userTab === 'isg' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500'}`}>İSG Hesapları</button>
          <button onClick={() => {setUserTab('yukleme'); setNewUser({...newUser, role: 'yuklemeci'});}} className={`px-4 py-2 font-bold text-sm rounded-t-lg ${userTab === 'yukleme' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600' : 'text-gray-500'}`}>Yükleme Hesapları</button>
        </div>

        <form onSubmit={handleCreateUser} className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8 space-y-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2">Yeni Hesap Oluştur ({userTab === 'isg' ? 'İSG' : 'Yükleme'})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label><input type="text" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Kullanıcı Adı</label><input type="text" required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full border rounded-lg p-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Şifre</label><input type="text" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg p-2 text-sm" /></div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Rol</label>
              <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                {userTab === 'isg' ? (
                  <><option value="sef">Birim Şefi</option><option value="mod">İSG Uzmanı</option></>
                ) : (
                  <option value="yuklemeci">Yükleme Sorumlusu</option>
                )}
              </select>
            </div>
            {newUser.role === 'sef' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">Sorumlu Birim</label>
                <select value={newUser.dept} onChange={e=>setNewUser({...newUser, dept: e.target.value})} className="w-full border rounded-lg p-2 text-sm">{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
            )}
          </div>
          <button type="submit" className={`font-bold py-2 px-4 rounded-lg text-sm w-full flex justify-center items-center text-white ${userTab === 'isg' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}><Plus className="w-4 h-4 mr-1"/> Hesap Oluştur</button>
        </form>

        <div>
          <h3 className="font-bold text-gray-700 text-sm mb-3">Mevcut Hesaplar</h3>
          <div className="space-y-2">
            {users.filter(u => u.id === 1 || (userTab === 'isg' ? u.role !== 'yuklemeci' : u.role === 'yuklemeci')).map(u => (
              <div key={u.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{u.name} <span className="text-xs text-gray-400 font-normal ml-2">@{u.username}</span></p>
                  <p className="text-xs text-gray-500 capitalize">{u.role === 'sef' ? `${u.dept} Şefi` : u.role}</p>
                  {isAdminAgiradar && <p className="text-[10px] text-red-500 font-bold mt-1">Şifre: {u.password}</p>}
                </div>
                {u.id !== 1 && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><Trash2 className="w-4 h-4"/></button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderISGCalendar = () => {
      const currDate = getCalendarDate();
      const currentMonth = currDate.getMonth();
      const currentYear = currDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
      
      const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-3">
               <button onClick={() => setCurrentMonthOffset(prev => prev - 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
               <h3 className="font-extrabold text-gray-800 text-2xl w-40 text-center">{monthNames[currentMonth]} {currentYear}</h3>
               <button onClick={() => setCurrentMonthOffset(prev => prev + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600"/></button>
             </div>
             <span className="text-sm text-blue-800 bg-blue-50 px-3 py-1 rounded-lg font-bold flex items-center hidden sm:flex"><Calendar className="w-4 h-4 mr-2"/> Aylık İSG Görünümü</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center mb-3 text-xs font-bold text-gray-400 uppercase py-2">
            <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-transparent"></div>)}
             {Array.from({ length: daysInMonth }).map((_, i) => {
               const dayNum = i + 1;
               const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
               const realToday = new Date();
               const isToday = dayNum === realToday.getDate() && currentMonth === realToday.getMonth() && currentYear === realToday.getFullYear();
               const dayTasks = tasks.filter(t => t.createdAt === formattedDateForCell);
               const hasRed = dayTasks.some(t => t.status === 'acik' || t.status === 'itiraz_edildi');
               const hasYellow = dayTasks.some(t => t.status === 'onay_bekliyor');
               const hasGreen = dayTasks.some(t => t.status === 'cozuldu');

               return (
                 <div key={dayNum} onClick={() => dayTasks.length > 0 && setSelectedAdminDate(formattedDateForCell)}
                   className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all
                     ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-300'}
                     ${dayTasks.length > 0 ? 'border-gray-300 shadow-sm' : ''}
                   `}
                 >
                   <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>{dayNum}</span>
                   <div className="flex space-x-1.5 mt-2">
                      {hasRed && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse"></span>}
                      {hasYellow && <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-sm"></span>}
                      {hasGreen && <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span>}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      );
    };

    const renderShippingCalendar = () => {
      const currDate = getCalendarDate();
      const currentMonth = currDate.getMonth();
      const currentYear = currDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
      
      const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      
      const getFilteredLoadings = () => {
        const todayStr = formatDate(new Date());
        return loadings.filter(load => {
          const loadDateStr = formatDate(new Date(load.timestamp));
          if (shipFilter === 'today') return loadDateStr === todayStr;
          if (shipFilter === 'month') return new Date(load.timestamp).getMonth() === currentMonth && new Date(load.timestamp).getFullYear() === currentYear;
          if (shipFilter === 'year') return new Date(load.timestamp).getFullYear() === currentYear;
          return true; // 'all'
        }).sort((a,b) => b.timestamp - a.timestamp);
      };

      const filteredLoadings = getFilteredLoadings();
      const totalFilteredTonnage = filteredLoadings.reduce((sum, l) => sum + (parseFloat(l.tonnage)||0), 0);

      const [expandedId, setExpandedId] = useState(null);

      return (
        <div className="animate-slide-up space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-2xl flex items-center"><Truck className="w-6 h-6 mr-2 text-orange-600"/> Sevkiyat Raporları</h3>
                </div>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
                  <button onClick={()=>setShipFilter('today')} className={`px-4 py-2 text-sm font-bold rounded-lg ${shipFilter==='today'?'bg-white text-orange-600 shadow-sm':'text-gray-500'}`}>Bugün</button>
                  <button onClick={()=>setShipFilter('month')} className={`px-4 py-2 text-sm font-bold rounded-lg ${shipFilter==='month'?'bg-white text-orange-600 shadow-sm':'text-gray-500'}`}>Bu Ay</button>
                  <button onClick={()=>setShipFilter('year')} className={`px-4 py-2 text-sm font-bold rounded-lg ${shipFilter==='year'?'bg-white text-orange-600 shadow-sm':'text-gray-500'}`}>Bu Yıl</button>
                  <button onClick={()=>setShipFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-lg ${shipFilter==='all'?'bg-white text-orange-600 shadow-sm':'text-gray-500'}`}>Tümü</button>
                </div>
             </div>

             <div className="flex justify-between items-center mb-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
               <span className="text-sm font-bold text-orange-800">Seçili Dönem Toplam Yükleme:</span>
               <span className="text-xl font-extrabold text-orange-600">{totalFilteredTonnage} Ton</span>
             </div>

             <div className="space-y-3">
               {filteredLoadings.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 font-medium">Bu döneme ait sevkiyat bulunamadı.</div>
               ) : (
                 filteredLoadings.map(load => {
                   const sDef = SHIPPING_STATUS[load.status];
                   const Icon = sDef.icon;
                   const isExpanded = expandedId === load.id;

                   return (
                     <div key={load.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                       <div onClick={() => setExpandedId(isExpanded ? null : load.id)} className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer bg-white hover:bg-gray-50`}>
                          <div className="flex items-center space-x-4 mb-2 md:mb-0">
                            <div className="bg-gray-100 p-3 rounded-xl hidden sm:block"><Globe className="w-5 h-5 text-gray-500"/></div>
                            <div>
                              <p className="font-bold text-gray-800 text-lg flex items-center">
                                {load.country} / {load.city}
                              </p>
                              <p className="text-sm text-gray-500">{load.company} <span className="mx-2">•</span> {load.plate}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                            <span className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center ${sDef.color.split(' ').slice(0,2).join(' ')} border ${sDef.color.split(' ')[2]}`}>
                              <Icon className="w-4 h-4 mr-1.5" /> {sDef.label}
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                          </div>
                       </div>
                       
                       {isExpanded && (
                         <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border shadow-sm"><span className="block text-[10px] text-gray-400 uppercase font-bold">Proje No</span><span className="font-bold text-gray-800">{load.projectNo}</span></div>
                                <div className="bg-white p-3 rounded-lg border shadow-sm"><span className="block text-[10px] text-gray-400 uppercase font-bold">Tonaj</span><span className="font-bold text-gray-800">{load.tonnage} Ton</span></div>
                                <div className="bg-white p-3 rounded-lg border shadow-sm col-span-2"><span className="block text-[10px] text-gray-400 uppercase font-bold">Tarih</span><span className="font-bold text-gray-800">{formatDate(new Date(load.timestamp))} {new Date(load.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span></div>
                              </div>
                              {load.desc && (
                                <div className="bg-white p-3 rounded-lg border shadow-sm">
                                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Notlar</span>
                                  <p className="text-sm text-gray-700">{load.desc}</p>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {load.startImg ? (
                                <div onClick={()=>setLightboxImg(load.startImg)} className="relative h-32 bg-gray-200 rounded-xl overflow-hidden border cursor-zoom-in group">
                                  <img src={load.startImg} alt="Araç Giriş" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-8 h-8"/></div>
                                  <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-2 py-1 rounded font-bold">GİRİŞ</span>
                                </div>
                              ) : <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed flex items-center justify-center text-xs font-bold text-gray-400">Giriş Fotoğrafı Yok</div>}
                              
                              {load.endImg ? (
                                <div onClick={()=>setLightboxImg(load.endImg)} className="relative h-32 bg-gray-200 rounded-xl overflow-hidden border cursor-zoom-in group">
                                  <img src={load.endImg} alt="Araç Çıkış" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-8 h-8"/></div>
                                  <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-2 py-1 rounded font-bold">ÇIKIŞ</span>
                                </div>
                              ) : <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed flex items-center justify-center text-xs font-bold text-gray-400">Çıkış Fotoğrafı Yok</div>}
                            </div>
                         </div>
                       )}
                     </div>
                   );
                 })
               )}
             </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center space-x-3">
                 <button onClick={() => setCurrentMonthOffset(prev => prev - 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
                 <h3 className="font-extrabold text-gray-800 text-2xl w-40 text-center">{monthNames[currentMonth]} {currentYear}</h3>
                 <button onClick={() => setCurrentMonthOffset(prev => prev + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600"/></button>
               </div>
               <span className="text-sm text-orange-800 bg-orange-50 px-3 py-1 rounded-lg font-bold flex items-center hidden sm:flex"><Calendar className="w-4 h-4 mr-2"/> Aylık Yükleme Takvimi</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-3 text-xs font-bold text-gray-400 uppercase py-2">
              <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
               {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-transparent"></div>)}
               {Array.from({ length: daysInMonth }).map((_, i) => {
                 const dayNum = i + 1;
                 const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
                 const realToday = new Date();
                 const isToday = dayNum === realToday.getDate() && currentMonth === realToday.getMonth() && currentYear === realToday.getFullYear();
                 const dayLoads = loadings.filter(l => formatDate(new Date(l.timestamp)) === formattedDateForCell);
                 
                 const hasWaiting = dayLoads.some(l => l.status === 'beklemede');
                 const hasLoading = dayLoads.some(l => l.status === 'yukleniyor');
                 const hasDone = dayLoads.some(l => l.status === 'gonderildi');
  
                 return (
                   <div key={dayNum} onClick={() => { if(dayLoads.length>0){ setShipFilter('all'); } }}
                     className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all
                       ${isToday ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-100' : 'bg-white border-gray-100 hover:border-orange-300'}
                       ${dayLoads.length > 0 ? 'border-gray-300 shadow-sm' : ''}
                     `}
                   >
                     <span className={`text-sm font-bold ${isToday ? 'text-orange-700' : 'text-gray-700'}`}>{dayNum}</span>
                     <div className="flex space-x-1.5 mt-2">
                        {hasWaiting && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"></span>}
                        {hasLoading && <span className="w-2.5 h-2.5 bg-orange-400 rounded-full shadow-sm"></span>}
                        {hasDone && <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span>}
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      );
    };

    const renderShippingAnalysis = () => {
      const statsByCountry = {};
      const statsByCompany = {};

      loadings.forEach(l => {
        const ton = parseFloat(l.tonnage) || 0;
        if(l.country) { statsByCountry[l.country] = (statsByCountry[l.country] || 0) + ton; }
        if(l.company) { statsByCompany[l.company] = (statsByCompany[l.company] || 0) + ton; }
      });

      const sortedCountries = Object.entries(statsByCountry).sort((a,b)=>b[1]-a[1]);
      const sortedCompanies = Object.entries(statsByCompany).sort((a,b)=>b[1]-a[1]);

      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
           <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><BarChart3 className="w-6 h-6 mr-2 text-orange-600"/> Lojistik & Sevkiyat Analizi</h2>
           <p className="text-gray-500 text-sm mb-8">Sisteme kaydedilmiş tüm zamanların toplam sevkiyat verileri.</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h3 className="font-bold text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center"><Globe className="w-4 h-4 mr-2"/> Ülkelere Göre Tonaj</h3>
                 <div className="space-y-3">
                   {sortedCountries.length === 0 ? <p className="text-sm text-gray-400">Veri yok</p> : sortedCountries.map(([c, ton], idx) => (
                     <div key={c} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                        <span className="font-medium text-gray-800"><span className="text-gray-400 mr-2">{idx+1}.</span>{c}</span>
                        <span className="font-bold text-orange-600">{ton} Ton</span>
                     </div>
                   ))}
                 </div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center"><Building className="w-4 h-4 mr-2"/> Firmalara Göre Tonaj</h3>
                 <div className="space-y-3">
                   {sortedCompanies.length === 0 ? <p className="text-sm text-gray-400">Veri yok</p> : sortedCompanies.map(([comp, ton], idx) => (
                     <div key={comp} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                        <span className="font-medium text-gray-800"><span className="text-gray-400 mr-2">{idx+1}.</span>{comp}</span>
                        <span className="font-bold text-orange-600">{ton} Ton</span>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>
      );
    };

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Yönetici Paneli</h1>
            <p className="text-gray-500 text-sm md:text-base">Tüm sistem modüllerini buradan yönetebilirsiniz.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setAdminViewMode('isg')} className={`px-6 py-3 font-bold text-sm rounded-lg transition-all flex items-center ${adminViewMode==='isg'?'bg-white text-blue-700 shadow-sm':'text-gray-500'}`}><ShieldAlert className="w-4 h-4 mr-2"/> İSG</button>
             <button onClick={() => setAdminViewMode('yukleme')} className={`px-6 py-3 font-bold text-sm rounded-lg transition-all flex items-center ${adminViewMode==='yukleme'?'bg-white text-orange-700 shadow-sm':'text-gray-500'}`}><Truck className="w-4 h-4 mr-2"/> Yükleme</button>
          </div>
        </div>

        {adminViewMode === 'isg' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <button onClick={() => {setIsgTab('users'); setSelectedAdminDept(null);}} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-sm flex items-center justify-center transition-colors">
                <Users className="w-5 h-5 mr-2" /> Hesap Yönetimi
              </button>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50 justify-between">
                  <div className="flex items-center"><AlertCircle className="w-5 h-5 text-red-500 mr-2" /><h3 className="font-bold text-gray-800">İSG Risk Haritası</h3></div>
                </div>
                <div className="divide-y divide-gray-50">
                  {DEPARTMENTS.map((dept, index) => {
                    const isSelected = selectedAdminDept === dept;
                    return (
                    <div key={dept} onClick={() => { setSelectedAdminDept(dept); setIsgTab('calendar'); }} className={`flex justify-between items-center p-4 cursor-pointer transition-all border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                      <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{index + 1}. {dept}</span>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-300'}`} />
                    </div>
                  )})}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              {isgTab === 'users' ? renderUsers() : (selectedAdminDept ? <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">Birim Raporları Burada Gösterilecek (Detaylar önceki sürümlerde mevcuttur)</div> : renderISGCalendar())}
            </div>
          </div>
        )}

        {adminViewMode === 'yukleme' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setYuklemeTab('calendar')} className={`w-full text-left p-5 font-bold flex items-center transition-all border-l-4 ${yuklemeTab === 'calendar' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'}`}><CalendarDays className="w-5 h-5 mr-3"/> Sevkiyat & Takvim</button>
                <button onClick={() => setYuklemeTab('analiz')} className={`w-full text-left p-5 font-bold flex items-center transition-all border-l-4 border-t border-t-gray-50 ${yuklemeTab === 'analiz' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'}`}><BarChart3 className="w-5 h-5 mr-3"/> Lojistik Analizi</button>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-2xl shadow-sm text-white text-center">
                 <Weight className="w-10 h-10 mx-auto mb-2 opacity-80" />
                 <p className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">Son 24 Saat Yükleme</p>
                 <p className="text-4xl font-extrabold">{get24HourTonnage()} <span className="text-lg">Ton</span></p>
              </div>
            </div>
            <div className="lg:col-span-3">
              {yuklemeTab === 'calendar' ? renderShippingCalendar() : renderShippingAnalysis()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const YuklemeciDashboard = () => {
    const [plate, setPlate] = useState('');
    const [driver, setDriver] = useState('');
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [city, setCity] = useState('');
    const [company, setCompany] = useState('');
    const [projectNo, setProjectNo] = useState('');
    const [tonnage, setTonnage] = useState('');
    const [desc, setDesc] = useState('');

    const activeLoadings = loadings.filter(l => l.status !== 'gonderildi');

    const handleCreateLoading = (e) => {
      e.preventDefault();
      const newLoad = {
        id: Date.now(), timestamp: Date.now(), plate, driver, country, city, company, projectNo, tonnage, desc,
        status: 'beklemede', startImg: null, endImg: null
      };
      setLoadings([newLoad, ...loadings]);
      setPlate(''); setDriver(''); setCity(''); setCompany(''); setProjectNo(''); setTonnage(''); setDesc('');
    };

    const updateStatus = (id, newStatus, imgType) => {
      // Simulate photo selection
      const mockImg = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800";
      setLoadings(loadings.map(l => l.id === id ? { ...l, status: newStatus, [imgType]: mockImg } : l));
    };

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 p-8 md:p-10 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden mb-8">
          <div className="z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Yükleme & Sevkiyat</h1>
            <p className="text-orange-200 font-medium text-lg">Araç kayıt ve lojistik takip ekranı</p>
          </div>
          <div className="z-10 mt-6 md:mt-0 text-center bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
             <p className="text-xs font-bold uppercase tracking-widest text-orange-200 mb-1">24 Saatlik Hacim</p>
             <p className="text-3xl font-extrabold">{get24HourTonnage()} <span className="text-lg font-medium">Ton</span></p>
          </div>
          <Truck className="w-64 h-64 text-orange-400 opacity-10 absolute right-0 -bottom-10 z-0 transform -scale-x-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center"><Plus className="w-5 h-5 mr-2 text-orange-600"/> Yeni Araç Kaydı</h3>
              <form onSubmit={handleCreateLoading} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Araç Plakası *</label><input type="text" required value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} className="w-full border rounded-xl p-3 bg-gray-50 uppercase font-bold" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Şoför Adı</label><input type="text" value={driver} onChange={e=>setDriver(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50" /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ülke *</label>
                    <select value={country} onChange={e=>setCountry(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50 font-bold text-gray-700">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Şehir *</label><input type="text" required value={city} onChange={e=>setCity(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50" /></div>
                </div>

                <div><label className="block text-xs font-bold text-gray-500 mb-1">Gideceği Firma *</label><input type="text" required value={company} onChange={e=>setCompany(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Proje No</label><input type="text" value={projectNo} onChange={e=>setProjectNo(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50 font-mono" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Tonaj (Ton) *</label><input type="number" step="0.1" required value={tonnage} onChange={e=>setTonnage(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50" /></div>
                </div>

                <div><label className="block text-xs font-bold text-gray-500 mb-1">Ek Notlar</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50 h-20 resize-none"></textarea></div>
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold shadow-md transition-colors">Araç Kaydını Aç</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-xl text-gray-800 border-b pb-4">Aktif Yüklemeler ({activeLoadings.length})</h3>
            {activeLoadings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center text-gray-500 border border-gray-100">
                <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="font-bold text-xl text-gray-800">Saha Boş</p>
                <p>Şu anda işlem bekleyen veya devam eden araç bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {activeLoadings.map(load => (
                  <div key={load.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full space-y-3">
                       <div className="flex justify-between items-start">
                         <div>
                           <div className="text-2xl font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg inline-block border-2 border-gray-300">{load.plate}</div>
                           <p className="text-gray-500 font-medium mt-2"><MapPin className="inline w-4 h-4 mr-1"/>{load.country} / {load.city} - {load.company}</p>
                         </div>
                         <div className="text-right">
                           <span className="block text-2xl font-bold text-orange-600">{load.tonnage} <span className="text-sm">Ton</span></span>
                           <span className="text-xs text-gray-400 font-mono">Prj: {load.projectNo || '-'}</span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="w-full md:w-64 shrink-0 flex flex-col space-y-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                      {load.status === 'beklemede' && (
                        <>
                          <div className="text-center mb-2"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">Beklemede</span></div>
                          <button onClick={() => updateStatus(load.id, 'yukleniyor', 'startImg')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-md">
                            <Camera className="w-5 h-5 mr-2"/> Yüklemeyi Başlat
                          </button>
                        </>
                      )}
                      {load.status === 'yukleniyor' && (
                        <>
                           <div className="text-center mb-2"><span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 animate-pulse">Yükleniyor...</span></div>
                           <button onClick={() => updateStatus(load.id, 'gonderildi', 'endImg')} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-md">
                            <Camera className="w-5 h-5 mr-2"/> İşi Bitir & Gönder
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 w-full relative">
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
      <ImageLightboxModal />
      
      {!currentUser ? <LoginScreen /> : (
        <>
          <TopBar theme={currentUser.role === 'yuklemeci' ? 'orange' : 'blue'} />
          <main className="flex-1 w-full flex">
             {currentUser.role === 'admin' && <AdminDashboard />}
             {(currentUser.role === 'mod' || currentUser.role === 'sef') && <div className="p-8 text-center w-full">İSG Panel İçerikleri (Şef/Mod) önceki versiyonlardadır.</div>}
             {currentUser.role === 'yuklemeci' && <YuklemeciDashboard />}
          </main>
          
          <footer className="w-full text-center py-4 mt-auto">
             <span className="text-xs text-gray-400 italic font-medium tracking-wider">by agiradar</span>
          </footer>
        </>
      )}
    </div>
  );
}
