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
    welcome: "Hoş Geldiniz",
    login_prompt: "Sisteme devam etmek için hesap bilgilerinizi girin.",
    err_login: "Kullanıcı adı veya şifre hatalı veya bu modüle yetkiniz yok!",
    no_auth: "Bu modüle giriş yetkiniz bulunmamaktadır."
  },
  en: {
    sys_isg_title: "OHS & 5S",
    sys_yukleme_title: "Shipping Tracking",
    sys_management: "Management System",
    welcome: "Welcome",
    login_prompt: "Enter your credentials to continue to the system.",
    err_login: "Invalid username or password, or unauthorized for this module!",
    no_auth: "You do not have authorization to access this module."
  }
};

export default function App() {
  const [lang, setLang] = useState('tr');
  const t = (key) => DICTIONARY[lang][key] || key;
  
  // Oturum Persistence (Sayfa yenilendiğinde atmaması için Local/Session Storage kullanımı)
  const [currentUser, setCurrentUser] = useState(() => {
    const local = localStorage.getItem('isg_auth');
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem('isg_auth');
    if (session) return JSON.parse(session);
    return null;
  });

  const [loginTheme, setLoginTheme] = useState('isg');
  
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

  // Veritabanı (Storage) Dinamik Güncelleme
  useEffect(() => { localStorage.setItem('isg_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('isg_points', JSON.stringify(points)); }, [points]);
  useEffect(() => { localStorage.setItem('isg_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('loadings', JSON.stringify(loadings)); }, [loadings]);

  const [lightboxImg, setLightboxImg] = useState(null);

  const formatDate = (dateObj) => {
    return `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
  };

  const logout = () => { 
    localStorage.removeItem('isg_auth');
    sessionStorage.removeItem('isg_auth');
    setCurrentUser(null); 
  };

  const get24HourTonnage = () => {
    const past24h = Date.now() - (24 * 60 * 60 * 1000);
    return loadings.filter(l => l.timestamp >= past24h).reduce((total, load) => total + (parseFloat(load.tonnage) || 0), 0);
  };

  const CompanyLogo = ({ className = "", scale = "scale-100", theme = 'blue', showBox = true }) => (
    <div className={`flex flex-col items-center justify-center rounded-2xl ${showBox ? 'bg-white/95 px-16 py-8 shadow-2xl border border-gray-100/50 backdrop-blur-sm' : ''} ${className}`}>
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out" onClick={() => setLightboxImg(null)}>
        <button className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full"><X className="w-8 h-8" /></button>
        <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
           <img src={lightboxImg} alt="Enlarged" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/20" />
        </div>
      </div>
    );
  };

  const TopBar = ({ theme = 'blue' }) => (
    <header className="bg-white px-6 py-3 shadow-sm flex justify-between items-center sticky top-0 z-30 border-b border-gray-200">
      <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center space-x-4">
          <CompanyLogo scale="scale-75 md:scale-90" theme={theme} showBox={false} />
          <div className="border-l pl-4 border-gray-300">
            <h2 className="font-bold text-gray-800 text-sm md:text-base leading-tight">{currentUser.name}</h2>
            <span className="text-[10px] md:text-xs text-gray-500 capitalize leading-tight">{currentUser.role === 'sef' ? `${currentUser.dept} Birimi` : currentUser.role} Paneli</span>
          </div>
        </div>
        <button onClick={logout} className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm">
          <span className="hidden sm:inline">Çıkış Yap</span>
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );

  const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginErr, setLoginErr] = useState('');
    const [rememberMe, setRememberMe] = useState(true); // Beni Hatırla state'i
    
    const isISG = loginTheme === 'isg';

    const handleLogin = (e) => {
      e.preventDefault();
      const account = users.find(u => u.username === username.toLowerCase().trim());
      
      if (account && account.password === password) {
        if (loginTheme === 'isg' && account.role === 'yuklemeci') { setLoginErr(t('no_auth')); return; }
        if (loginTheme === 'yukleme' && (account.role === 'sef' || account.role === 'mod')) { setLoginErr(t('no_auth')); return; }
        
        // Beni hatırla seçeneğine göre Storage ayarı
        if (rememberMe) {
          localStorage.setItem('isg_auth', JSON.stringify(account));
        } else {
          sessionStorage.setItem('isg_auth', JSON.stringify(account));
        }

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
           <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-1000 ${isISG ? 'from-blue-900/90 to-gray-900/90' : 'from-orange-900/90 to-gray-900/90'}`}></div>
        </div>

        <div className="absolute top-6 right-6 z-20 flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-xl">
          <button onClick={() => setLang('tr')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === 'tr' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}`}>TR</button>
          <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === 'en' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}`}>EN</button>
        </div>

        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10 border border-white/40 mt-12 md:mt-0">
          <div className={`hidden md:flex flex-col items-center justify-center w-1/2 p-12 border-r border-gray-100 transition-colors duration-500 ${isISG ? 'bg-blue-50/50' : 'bg-orange-100/30'}`}>
            <CompanyLogo className="mb-8" scale="scale-150" theme={isISG ? 'blue' : 'orange'} showBox={true} />
            <div className="flex space-x-2 bg-gray-200 p-1.5 rounded-xl shadow-inner mb-6">
              <button onClick={() => setLoginTheme('isg')} className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${isISG ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}><ShieldAlert className="w-4 h-4 mr-1.5" /> İSG</button>
              <button onClick={() => setLoginTheme('yukleme')} className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${!isISG ? 'bg-white text-orange-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}><Truck className="w-4 h-4 mr-1.5" /> Yükleme</button>
            </div>
            <h1 className={`text-3xl font-bold text-center mt-2 leading-tight ${isISG ? 'text-blue-900' : 'text-orange-900'}`}>{isISG ? t('sys_isg_title') : t('sys_yukleme_title')}<br/>{t('sys_management')}</h1>
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-6">
              <CompanyLogo className="mx-auto" scale="scale-110" theme={isISG ? 'blue' : 'orange'} showBox={false} />
              <div className="flex justify-center space-x-2 bg-gray-200 p-1.5 rounded-xl shadow-inner mt-6 mx-auto w-max">
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Kullanıcı Adı</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Beni Hatırla Seçeneği Eklendi */}
              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm font-medium text-gray-600 cursor-pointer">
                  Beni Hatırla
                </label>
              </div>
              
              <button type="submit" className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transition-colors mt-6 ${isISG ? 'bg-blue-700 hover:bg-blue-800' : 'bg-orange-600 hover:bg-orange-700'}`}>
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    // 3 Ana Görünüm: 'isg' | 'yukleme' | 'users'
    const [adminViewMode, setAdminViewMode] = useState('isg'); 
    
    // İSG Tabları
    const [isgMonthOffset, setIsgMonthOffset] = useState(0);
    const [selectedAdminDept, setSelectedAdminDept] = useState(null);
    const [selectedAdminDate, setSelectedAdminDate] = useState(null);
    
    // Yükleme Tabları
    const [yuklemeTab, setYuklemeTab] = useState('calendar');
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
    const [shipFilter, setShipFilter] = useState('today');
    const [expandedId, setExpandedId] = useState(null);

    // Kullanıcı Yönetimi State'leri
    const [userTab, setUserTab] = useState('isg');
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    
    // Admin Wipe Feature States
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(0);

    const isAdminAgiradar = currentUser?.username === 'agiradar';

    // Kullanıcı Metodları
    const handleCreateUser = (e) => {
      e.preventDefault();
      if(users.find(u => u.username === newUser.username)) { alert("Bu kullanıcı adı alınmış!"); return; }
      setUsers([...users, { ...newUser, id: Date.now(), dept: newUser.role === 'sef' ? newUser.dept : null }]);
      setNewUser({ username: '', password: '', name: '', role: userTab === 'isg' ? 'sef' : 'yuklemeci', dept: DEPARTMENTS[0] });
      alert("Kullanıcı başarıyla oluşturuldu.");
    };

    const handleDeleteUser = (id) => {
      if(id === 1) return; 
      if(window.confirm("Kullanıcı silinsin mi?")) setUsers(users.filter(u => u.id !== id));
    };

    const handleWipeData = () => {
      if(window.confirm("TÜM GEÇMİŞ RAPORLARI SİLMEK ÜZERESİNİZ! Bu işlem geri alınamaz. Emin misiniz?")) {
        setTasks([]);
        setLoadings([]);
        setPoints(DEPARTMENTS.reduce((acc, dept) => { acc[dept] = 100; return acc; }, {}));
        setIsDeleting(false);
        alert("Tüm geçmiş kayıtlar başarıyla temizlendi.");
      }
    };

    const startDeleteCountdown = () => {
      setIsDeleting(true);
      setDeleteCountdown(10);
      let count = 10;
      const interval = setInterval(() => {
        count -= 1;
        setDeleteCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    };

    const renderUsers = () => (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><Users className="w-6 h-6 mr-2 text-purple-600"/> Sistem & Kullanıcı Yönetimi</h2>
        
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
          <button onClick={() => {setUserTab('isg'); setNewUser({...newUser, role:'sef'});}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${userTab==='isg'?'bg-white text-blue-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>İSG Hesapları</button>
          <button onClick={() => {setUserTab('yukleme'); setNewUser({...newUser, role:'yuklemeci'});}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${userTab==='yukleme'?'bg-white text-orange-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Yükleme Hesapları</button>
        </div>

        <form onSubmit={handleCreateUser} className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8 space-y-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2 border-b pb-2">Yeni Hesap Oluştur ({userTab === 'isg' ? 'İSG Modülü' : 'Yükleme Modülü'})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label><input type="text" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-purple-400" placeholder="Örn: Ahmet Yılmaz" /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Kullanıcı Adı (Giriş için)</label><input type="text" required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-purple-400" placeholder="örn: ahmetyilmaz" /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Şifre</label><input type="text" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-purple-400" /></div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Sistem Rolü</label>
              <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-purple-400">
                {userTab === 'isg' ? (
                  <>
                    <option value="sef">Birim Şefi</option>
                    <option value="mod">İSG Uzmanı (Moderatör)</option>
                    <option value="admin">Sistem Yöneticisi (Admin)</option>
                  </>
                ) : (
                  <option value="yuklemeci">LOJİSTİK - Yükleme Sorumlusu</option>
                )}
              </select>
            </div>
            {newUser.role === 'sef' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">Sorumlu Olduğu Birim</label>
                <select value={newUser.dept} onChange={e=>setNewUser({...newUser, dept: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-purple-400">{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
            )}
          </div>
          <button type="submit" className={`font-bold py-3 px-4 rounded-xl text-sm w-full flex justify-center items-center text-white shadow-md transition-colors ${userTab === 'isg' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}><Plus className="w-5 h-5 mr-2"/> Hesabı Oluştur</button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-700 text-sm mb-3">Mevcut Hesaplar ({users.length})</h3>
            <div className="space-y-2">
              {users.filter(u => u.id === 1 || (userTab === 'isg' ? u.role !== 'yuklemeci' : u.role === 'yuklemeci')).map(u => (
                <div key={u.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{u.name} <span className="text-xs text-gray-400 font-normal ml-2">@{u.username}</span></p>
                    <p className="text-xs text-gray-500 capitalize">{u.role === 'sef' ? `${u.dept} Şefi` : u.role}</p>
                    {/* YENİ: Sadece agiradar hesap şifrelerini görebilir */}
                    {isAdminAgiradar && u.id !== 1 && <p className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded w-max">Şifre: {u.password}</p>}
                  </div>
                  {u.id !== 1 && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>}
                </div>
              ))}
            </div>
          </div>
          
          {/* YENİ: Wipe data sadece agiradar'a özel */}
          {isAdminAgiradar && (
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center text-red-600"><AlertTriangle className="w-4 h-4 mr-2"/> Sistem Veritabanı (Admin Özel)</h3>
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center justify-center text-center">
                 <h3 className="font-bold text-red-700 text-lg mb-2">Toplu Veri Temizliği</h3>
                 <p className="text-sm text-red-600 mb-6">Sistemin veritabanını temizlemek istiyorsanız bu butonu kullanabilirsiniz. İSG ve Nakliye dahil tüm kayıtlı raporlar kalıcı olarak silinir.</p>
                 
                 {!isDeleting ? (
                   <button onClick={startDeleteCountdown} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center">
                     <Trash2 className="w-5 h-5 mr-2" /> Tüm Geçmiş Raporları Sil
                   </button>
                 ) : (
                   <button disabled={deleteCountdown > 0} onClick={handleWipeData} className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center ${deleteCountdown > 0 ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'}`}>
                     {deleteCountdown > 0 ? `Onay Bekleniyor (${deleteCountdown}s)` : 'Eminim, Her Şeyi Sil!'}
                   </button>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    );

    const renderIsgRightPanel = () => {
      // 1. Departman Görünümü
      if (selectedAdminDept) {
        const deptTasks = tasks.filter(t => t.dept === selectedAdminDept);
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <button onClick={() => setSelectedAdminDept(null)} className="flex items-center text-gray-500 hover:text-gray-800 font-medium text-sm mb-4 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Takvime Dön
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{selectedAdminDept} Departmanı Raporu</h2>
                <p className="text-gray-500 mt-1">Toplam İhlal Kaydı: {deptTasks.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 px-6 py-3 rounded-2xl border border-green-200 text-center">
                 <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">Güncel Puan</p>
                 <p className="text-3xl font-extrabold text-green-600">{points[selectedAdminDept]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {deptTasks.length === 0 ? (
                 <p className="text-sm text-gray-500 p-4 col-span-full">Bu departmana ait kayıt bulunmamaktadır.</p>
              ) : (
                deptTasks.map(task => {
                  const statusDef = STATUS_INFO[task.status];
                  const Icon = statusDef.icon;
                  return (
                    <div key={task.id} className={`p-5 rounded-xl shadow-sm border-l-4 bg-gray-50 flex flex-col md:flex-row gap-6 ${statusDef.color.split(' ')[2]}`}>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs text-gray-500 font-bold">{task.createdAt}</span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                            <Icon className="w-3.5 h-3.5 mr-1" /> {statusDef.label}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm font-medium mb-4 bg-white p-3 rounded-lg border border-gray-100">{task.desc}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${PRIORITIES[task.priority].color}`}>{PRIORITIES[task.priority].label} Risk</span>
                      </div>
                      
                      {/* Fotoğraflar (Öncesi ve Sonrası) */}
                      <div className="flex gap-3 md:w-64 shrink-0 mt-4 md:mt-0 items-center justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
                        {task.imgUrl ? (
                           <div className="text-center group cursor-zoom-in" onClick={() => setLightboxImg(task.imgUrl)}>
                             <div className="w-20 h-20 bg-gray-200 rounded-lg border border-gray-300 overflow-hidden relative">
                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-6 h-6"/></div>
                               <ImageIcon className="w-8 h-8 m-auto mt-6 text-gray-400" />
                             </div>
                             <span className="text-[10px] font-bold text-gray-500 mt-1 block">ÖNCESİ</span>
                           </div>
                        ) : null}
                        
                        {task.afterImgUrl ? (
                           <div className="text-center group cursor-zoom-in" onClick={() => setLightboxImg(task.afterImgUrl)}>
                             <div className="w-20 h-20 bg-green-50 rounded-lg border border-green-300 overflow-hidden relative">
                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-6 h-6"/></div>
                               <CheckCircle className="w-8 h-8 m-auto mt-6 text-green-400" />
                             </div>
                             <span className="text-[10px] font-bold text-green-600 mt-1 block">SONRASI</span>
                           </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      }

      // 2. Takvim Günlük Görünümü
      if (selectedAdminDate) {
        const dateTasks = tasks.filter(t => t.createdAt === selectedAdminDate);
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <button onClick={() => setSelectedAdminDate(null)} className="flex items-center text-gray-500 hover:text-gray-800 font-medium text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Takvime Dön
            </button>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Günlük İSG Raporu</h2>
                <p className="text-blue-600 font-medium text-lg mt-1">{selectedAdminDate}</p>
              </div>
              <CalendarDays className="w-12 h-12 text-blue-100" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dateTasks.length === 0 ? (
                 <p className="text-sm text-gray-500 p-4 col-span-full">Bu tarihte herhangi bir kayıt açılmamış.</p>
              ) : (
                dateTasks.map(task => {
                  const statusDef = STATUS_INFO[task.status];
                  const Icon = statusDef.icon;
                  return (
                    <div key={task.id} className={`p-5 rounded-xl shadow-sm border-l-4 bg-gray-50 flex flex-col md:flex-row gap-6 ${statusDef.color.split(' ')[2]}`}>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm text-gray-800 font-bold">{task.dept} Departmanı</span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                            <Icon className="w-3.5 h-3.5 mr-1" /> {statusDef.label}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm font-medium mb-4 bg-white p-3 rounded-lg border border-gray-100">{task.desc}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${PRIORITIES[task.priority].color}`}>{PRIORITIES[task.priority].label} Risk</span>
                      </div>
                      
                      {/* Fotoğraflar (Öncesi ve Sonrası) */}
                      <div className="flex gap-3 md:w-64 shrink-0 mt-4 md:mt-0 items-center justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
                        {task.imgUrl ? (
                           <div className="text-center group cursor-zoom-in" onClick={() => setLightboxImg(task.imgUrl)}>
                             <div className="w-20 h-20 bg-gray-200 rounded-lg border border-gray-300 overflow-hidden relative">
                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-6 h-6"/></div>
                               <ImageIcon className="w-8 h-8 m-auto mt-6 text-gray-400" />
                             </div>
                             <span className="text-[10px] font-bold text-gray-500 mt-1 block">ÖNCESİ</span>
                           </div>
                        ) : null}
                        
                        {task.afterImgUrl ? (
                           <div className="text-center group cursor-zoom-in" onClick={() => setLightboxImg(task.afterImgUrl)}>
                             <div className="w-20 h-20 bg-green-50 rounded-lg border border-green-300 overflow-hidden relative">
                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-6 h-6"/></div>
                               <CheckCircle className="w-8 h-8 m-auto mt-6 text-green-400" />
                             </div>
                             <span className="text-[10px] font-bold text-green-600 mt-1 block">SONRASI</span>
                           </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      }

      // 3. Varsayılan (Geri Döndürülen) İSG Takvimi
      const isgDate = new Date();
      isgDate.setMonth(isgDate.getMonth() + isgMonthOffset);
      const currentMonth = isgDate.getMonth();
      const currentYear = isgDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
      
      const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-3">
               <button onClick={() => setIsgMonthOffset(prev => prev - 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
               <h3 className="font-extrabold text-gray-800 text-2xl w-40 text-center">{monthNames[currentMonth]} {currentYear}</h3>
               <button onClick={() => setIsgMonthOffset(prev => prev + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600"/></button>
             </div>
             <span className="text-sm text-blue-800 bg-blue-50 px-3 py-1 rounded-lg font-bold flex items-center hidden sm:flex"><Calendar className="w-4 h-4 mr-2"/> Aylık İSG Takvimi</span>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {dayNames.map(day => (
              <div key={day} className="text-xs font-bold text-gray-400 uppercase py-2">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: startOffset }).map((_, i) => (
               <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-transparent"></div>
             ))}
             
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
                 <div 
                   key={dayNum} 
                   onClick={() => dayTasks.length > 0 && setSelectedAdminDate(formattedDateForCell)}
                   className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all
                     ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-300'}
                     ${dayTasks.length > 0 ? 'border-gray-300 shadow-sm hover:shadow-md' : ''}
                   `}
                 >
                   <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>{dayNum}</span>
                   
                   <div className="flex space-x-1.5 mt-2">
                      {hasRed && <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full shadow-sm animate-pulse"></span>}
                      {hasYellow && <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-400 rounded-full shadow-sm"></span>}
                      {hasGreen && <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full shadow-sm"></span>}
                   </div>
                 </div>
               );
             })}
          </div>
          
          <div className="flex justify-center space-x-6 mt-8 border-t pt-6">
             <div className="flex items-center text-xs font-medium text-gray-600"><span className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm"></span> İhlal / İtiraz Var</div>
             <div className="flex items-center text-xs font-medium text-gray-600"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2 shadow-sm"></span> Onay Bekleniyor</div>
             <div className="flex items-center text-xs font-medium text-gray-600"><span className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-sm"></span> Tümü Çözüldü</div>
          </div>
        </div>
      );
    };

    const renderShippingCalendar = () => {
      const shipDate = new Date();
      shipDate.setMonth(shipDate.getMonth() + currentMonthOffset);
      const currentMonth = shipDate.getMonth();
      const currentYear = shipDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
      
      const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      
      const getFilteredLoadings = () => {
        const todayStr = formatDate(new Date());
        return loadings.filter(load => {
          const loadDateStr = formatDate(new Date(load.timestamp));
          if (shipFilter === 'today') return loadDateStr === todayStr;
          if (shipFilter === 'month') return new Date(load.timestamp).getMonth() === new Date().getMonth() && new Date(load.timestamp).getFullYear() === new Date().getFullYear();
          if (shipFilter === 'year') return new Date(load.timestamp).getFullYear() === new Date().getFullYear();
          return true; // 'all'
        }).sort((a,b) => b.timestamp - a.timestamp);
      };

      const filteredLoadings = getFilteredLoadings();
      const totalFilteredTonnage = filteredLoadings.reduce((sum, l) => sum + (parseFloat(l.tonnage)||0), 0);

      return (
        <div className="animate-slide-up space-y-6 w-full">
          {/* Takvim Üstte */}
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
                       ${dayLoads.length > 0 ? 'border-gray-300 shadow-sm hover:shadow-md' : ''}
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

          {/* Raporlar Altta */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-2xl flex items-center"><Truck className="w-6 h-6 mr-2 text-orange-600"/> Sevkiyat Raporları</h3>
                </div>
                <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-xl">
                  <button onClick={()=>setShipFilter('today')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${shipFilter==='today'?'bg-white text-orange-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Bugün</button>
                  <button onClick={()=>setShipFilter('month')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${shipFilter==='month'?'bg-white text-orange-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Bu Ay</button>
                  <button onClick={()=>setShipFilter('year')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${shipFilter==='year'?'bg-white text-orange-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Bu Yıl</button>
                  <button onClick={()=>setShipFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${shipFilter==='all'?'bg-white text-orange-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Tümü</button>
                </div>
             </div>

             <div className="flex justify-between items-center mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
               <span className="text-sm font-bold text-orange-800">Seçili Dönem Toplam Yükleme:</span>
               <span className="text-xl font-extrabold text-orange-600">{totalFilteredTonnage} Ton</span>
             </div>

             <div className="space-y-3">
               {filteredLoadings.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed">Seçili döneme ait sevkiyat bulunamadı.</div>
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
                              <p className="text-sm text-gray-500">{load.company} <span className="mx-2">•</span> Plaka: <span className="font-bold text-gray-700">{load.plate}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                            <span className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center ${sDef.color.split(' ').slice(0,2).join(' ')} border ${sDef.color.split(' ')[2]}`}>
                              <Icon className="w-4 h-4 mr-1.5" /> {sDef.label}
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                          </div>
                       </div>
                       
                       {/* Yükleme Detayları (Accordion) */}
                       {isExpanded && (
                         <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border shadow-sm"><span className="block text-[10px] text-gray-400 uppercase font-bold">Proje No</span><span className="font-bold text-gray-800">{load.projectNo || '-'}</span></div>
                                <div className="bg-white p-3 rounded-lg border shadow-sm"><span className="block text-[10px] text-gray-400 uppercase font-bold">Yüklenen Tonaj</span><span className="font-bold text-gray-800">{load.tonnage} Ton</span></div>
                                <div className="bg-white p-3 rounded-lg border shadow-sm col-span-2"><span className="block text-[10px] text-gray-400 uppercase font-bold">Kayıt Tarihi</span><span className="font-bold text-gray-800">{formatDate(new Date(load.timestamp))} {new Date(load.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span></div>
                              </div>
                              {load.desc && (
                                <div className="bg-white p-3 rounded-lg border shadow-sm">
                                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Şoför / Ek Notlar</span>
                                  <p className="text-sm text-gray-700">{load.desc}</p>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {load.startImg ? (
                                <div onClick={()=>setLightboxImg(load.startImg)} className="relative h-32 bg-gray-200 rounded-xl overflow-hidden border cursor-zoom-in group">
                                  <img src={load.startImg} alt="Kayıt Fotoğrafı" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-8 h-8"/></div>
                                  <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-2 py-1 rounded font-bold">ARAÇ GİRİŞ</span>
                                </div>
                              ) : <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed flex items-center justify-center text-xs font-bold text-gray-400">Giriş Fotoğrafı Yok</div>}
                              
                              {load.endImg ? (
                                <div onClick={()=>setLightboxImg(load.endImg)} className="relative h-32 bg-gray-200 rounded-xl overflow-hidden border cursor-zoom-in group">
                                  <img src={load.endImg} alt="Bitiş Fotoğrafı" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white w-8 h-8"/></div>
                                  <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-2 py-1 rounded font-bold">YÜKLEME SONU</span>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up w-full">
           <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><BarChart3 className="w-6 h-6 mr-2 text-orange-600"/> Lojistik & Sevkiyat Analizi</h2>
           <p className="text-gray-500 text-sm mb-8">Sisteme kaydedilmiş tüm zamanların toplam sevkiyat tonaj verileri.</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h3 className="font-bold text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center"><Globe className="w-4 h-4 mr-2"/> Ülkelere Göre Tonaj</h3>
                 <div className="space-y-3">
                   {sortedCountries.length === 0 ? <p className="text-sm text-gray-400">Kayıtlı veri yok</p> : sortedCountries.map(([c, ton], idx) => (
                     <div key={c} className="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-gray-800"><span className="text-gray-400 mr-2">{idx+1}.</span>{c}</span>
                        <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">{ton} Ton</span>
                     </div>
                   ))}
                 </div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center"><Building className="w-4 h-4 mr-2"/> Firmalara Göre Tonaj</h3>
                 <div className="space-y-3">
                   {sortedCompanies.length === 0 ? <p className="text-sm text-gray-400">Kayıtlı veri yok</p> : sortedCompanies.map(([comp, ton], idx) => (
                     <div key={comp} className="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-gray-800"><span className="text-gray-400 mr-2">{idx+1}.</span>{comp}</span>
                        <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">{ton} Ton</span>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>
      );
    };

    const getRedTaskCount = (deptName) => tasks.filter(t => t.dept === deptName && (t.status === 'acik' || t.status === 'itiraz_edildi')).length;
    const sortedDeptsAdmin = [...DEPARTMENTS].sort((a, b) => getRedTaskCount(b) - getRedTaskCount(a));

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Yönetici Paneli</h1>
            <p className="text-gray-500">Fabrika genel durumunu, risk haritasını ve sevkiyatları takip edin.</p>
          </div>
          
          {/* Ana Gezinme Tuşları - 3 Ana Sekme */}
          <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner w-full md:w-auto overflow-x-auto">
             <button onClick={() => setAdminViewMode('isg')} className={`px-6 py-3 font-bold text-sm rounded-lg transition-all flex items-center whitespace-nowrap ${adminViewMode==='isg'?'bg-white text-blue-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}><ShieldAlert className="w-4 h-4 mr-2"/> İSG Yönetimi</button>
             <button onClick={() => setAdminViewMode('yukleme')} className={`px-6 py-3 font-bold text-sm rounded-lg transition-all flex items-center whitespace-nowrap ${adminViewMode==='yukleme'?'bg-white text-orange-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}><Truck className="w-4 h-4 mr-2"/> Yükleme Sistemi</button>
             <button onClick={() => setAdminViewMode('users')} className={`px-6 py-3 font-bold text-sm rounded-lg transition-all flex items-center whitespace-nowrap ${adminViewMode==='users'?'bg-white text-purple-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}><Users className="w-4 h-4 mr-2"/> Kullanıcı Yönetimi</button>
          </div>
        </div>

        {/* Görünüm 1: İSG */}
        {adminViewMode === 'isg' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50 justify-between">
                  <div className="flex items-center">
                     <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                     <h3 className="font-bold text-gray-800">Risk Haritası</h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {sortedDeptsAdmin.map((dept, index) => {
                    const redCount = getRedTaskCount(dept);
                    const isSelected = selectedAdminDept === dept;
                    return (
                    <div 
                      key={dept} 
                      onClick={() => { setSelectedAdminDept(dept); setSelectedAdminDate(null); }}
                      className={`flex justify-between items-center p-4 cursor-pointer transition-all group border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 text-center text-sm font-bold mr-3 text-gray-400">{index + 1}.</span>
                        <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'}`}>{dept}</span>
                      </div>
                      <div className="flex items-center">
                         {redCount > 0 ? (
                           <div className="flex items-center bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-100 mr-2 shadow-sm">
                             <div className="relative flex items-center justify-center w-2.5 h-2.5 mr-2">
                               <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                               <span className="relative inline-flex rounded-full h-full w-full bg-red-600"></span>
                             </div>
                             <span className="font-bold text-xs">{redCount} Problem</span>
                           </div>
                         ) : (
                           <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 mr-2 opacity-90">
                             <CheckCircle className="w-3 h-3 mr-1" />
                             <span className="font-bold text-xs">Sorunsuz</span>
                           </div>
                         )}
                         <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
               {renderIsgRightPanel()}
            </div>
          </div>
        )}

        {/* Görünüm 2: Yükleme Sistemi */}
        {adminViewMode === 'yukleme' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setYuklemeTab('calendar')} className={`w-full text-left p-5 font-bold flex items-center transition-all border-l-4 ${yuklemeTab === 'calendar' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'}`}><CalendarDays className="w-5 h-5 mr-3"/> Sevkiyat Raporları</button>
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

        {/* Görünüm 3: Kullanıcı Yönetimi */}
        {adminViewMode === 'users' && (
          <div className="flex justify-center w-full">
             {renderUsers()}
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
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Ek Notlar (Zorunlu Değil)</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50 h-20 resize-none"></textarea></div>
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
                            <Camera className="w-5 h-5 mr-2"/> Yüklemeyi Başlat (Fotoğraf)
                          </button>
                        </>
                      )}
                      {load.status === 'yukleniyor' && (
                        <>
                           <div className="text-center mb-2"><span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 animate-pulse">Yükleniyor...</span></div>
                           <button onClick={() => updateStatus(load.id, 'gonderildi', 'endImg')} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-md">
                            <Camera className="w-5 h-5 mr-2"/> İşi Bitir & Gönder (Fotoğraf)
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
             {(currentUser.role === 'mod' || currentUser.role === 'sef') && <div className="p-8 text-center w-full mt-12 text-gray-500 font-medium">Bu panel sadece İSG yetkilileri içindir. Lütfen Admin hesabınızı kullanın.</div>}
             {currentUser.role === 'yuklemeci' && <YuklemeciDashboard />}
          </main>
          
          <footer className="w-full text-center py-5 mt-auto border-t border-gray-200 bg-white shadow-inner">
             <span className="text-xs text-gray-400 italic font-medium tracking-wider">by agiradar</span>
          </footer>
        </>
      )}
    </div>
  );
}
