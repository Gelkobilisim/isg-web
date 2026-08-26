import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Moon, Sun, Camera, AlertTriangle, CheckCircle, XCircle, LogOut, Clock, ShieldAlert, Calendar, Image as ImageIcon, X, ArrowDownRight, ChevronRight, ArrowLeft, Activity, AlertCircle, List, CalendarDays, Lock, User, Users, Plus, Trash2, Truck, Package, Save, CheckSquare, Globe, Eye, EyeOff, Menu, Maximize2, MapPin, Building2, Hash, Scale, TrendingUp } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";

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

const DEPARTMENTS = ["Boyahane", "Altyapı", "Dalgaduvar", "Lazer", "Güç", "Kaynaklı imalat", "Dış alan", "Bakım & Onarım"];

const COUNTRIES = [
  "Türkiye", "Almanya", "İngiltere", "Fransa", "İtalya", "İspanya", "Hollanda", "Belçika", 
  "İsveç", "Polonya", "Romanya", "Bulgaristan", "Yunanistan", "Rusya", "ABD", "Kanada", 
  "BAE", "Suudi Arabistan", "Katar", "Irak", "İran", "Azerbaycan", "Özbekistan", "Diğer"
];

const DICT = {
  tr: {
    isg_tab: "İSG & Tertip",
    yukleme_tab: "Yükleme Takip",
    sys_isg_title: "İSG & Tertip",
    sys_yukleme_title: "Yükleme & Sevkiyat",
    sys_management: "Yönetim Sistemi",
    welcome: "Hoş Geldiniz",
    login_desc: "Sisteme devam etmek için hesap bilgilerinizi girin.",
    username: "Kullanıcı Adı",
    password: "Şifre",
    remember_me: "Oturumumu Açık Tut (Beni Hatırla)",
    login_btn: "Sisteme Giriş Yap",
    err_wrong_cred: "Kullanıcı adı veya şifre hatalı!",
    err_isg_module: "Yükleme personeli İSG modülünden giriş yapamaz!",
    err_yukleme_module: "İSG personeli Yükleme modülünden giriş yapamaz!",
    loading_server: "Sunucuya bağlanılıyor...",
    logout: "Çıkış Yap",
    
    // Priorities & Statuses
    pri_basit: "Basit", pri_orta: "Orta", pri_kritik: "Kritik",
    stat_cozuldu: "Çözüldü", stat_onay: "Cevap Bekleniyor", stat_acik: "Çözülmemiş", stat_itiraz: "İtiraz Edildi", stat_iptal: "İptal",
    
    // Yüklemeci Panel
    yuk_title: "Sevkiyat & Yükleme",
    yuk_desc: "Araç kayıtları, detaylı tonaj ve fotoğraf yönetimi",
    new_load_btn: "Yeni Yükleme / Araç Girişi Başlat",
    load_form_title: "Araç ve Sevkiyat Giriş Formu",
    plate_no: "Araç Plakası veya İrsaliye No *",
    driver_name: "Şoför Adı Soyadı (İsteğe Bağlı)",
    dest_location: "Gideceği Lokasyon / Şehir *",
    dest_company: "Gideceği Firma *",
    project_no: "Proje No / Sipariş Kodu *",
    tonnage: "Yüklenen Tonaj (kg veya Ton) *",
    cam_pre: "Boş Kasa / Durum Fotoğrafı (İsteğe Bağlı)",
    cam_open: "Kamerayı Aç / Fotoğraf Yükle",
    optional: "(Zorunlu Değil)",
    note_pre: "Kısa Not (İsteğe Bağlı)",
    start_load_btn: "Kaydı Başlat",
    active_loads: "Devam Eden Yüklemeler",
    no_active_loads: "Şu an aktif bir yükleme yok.",
    no_active_desc: "Gelen araçları yukarıdaki butondan sisteme girebilirsiniz.",
    plate: "PLAKA / İRSALİYE",
    entry_time: "GİRİŞ SAATİ",
    driver: "Şoför",
    pre_note_title: "Yükleme Giriş Notu",
    no_note: "Not girilmedi.",
    no_photo: "FOTO YOK",
    finish_load_btn: "Yüklemeyi Tamamla",
    finish_form_title: "Yükleme Bitiş Kaydı",
    cam_post: "Güvenlik / Bağlama Fotoğrafı (İsteğe Bağlı)",
    note_post: "Bitiş Notu / Teslim Alan (İsteğe Bağlı)",
    cancel: "Vazgeç",
    close_job: "İşi Kapat",
    status_done: "Tamamlandı",
    status_progress: "Devam Ediyor",
    dest_country: "Gideceği Ülke *",
    status_beklemede: "Yükleme İçin Beklemede",
    status_yukleniyor: "Yükleniyor",
    status_tamamlandi: "Yüklenip Gönderildi",
    start_loading: "Yüklemeyi Başlat",
    details: "Detaylar",

    // Admin Panel
    admin_panel: "Yönetici Paneli",
    admin_desc: "Fabrika geneli yetkili izleme, tonaj takibi ve yönetim.",
    next_reset: "Sonraki Puan Sıfırlama",
    btn_users: "Kullanıcı Hesapları",
    risk_map: "Risk Haritası",
    problem: "Problem",
    no_problem: "Sorunsuz",
    user_management: "Kullanıcı Yönetimi",
    isg_accounts: "İSG Hesapları",
    yukleme_accounts: "Yükleme Hesapları",
    new_account: "Yeni Hesap Oluştur",
    fullname: "Ad Soyad",
    sys_role: "Sistem Rolü",
    dept: "Sorumlu Olduğu Birim",
    create_acc_btn: "Hesabı Oluştur",
    existing_accs: "Mevcut Hesaplar",
    show_passwords: "Şifreleri Göster",
    delete_history: "Sistem Geçmişi Temizliği (agiradar özel)",
    delete_desc: "Veritabanı şişkinliğini önlemek için eski İSG ve Yükleme raporlarını kalıcı olarak silebilirsiniz.",
    month_1: "1 Aydan Eskiler", month_3: "3 Aydan Eskiler", month_6: "6 Aydan Eskiler", month_all: "Tüm Geçmişi Sil",
    delete_btn: "Sil",
    are_you_sure: "Emin Misiniz?",
    del_warn_1: "Son ", del_warn_2: " ay öncesine ait TÜM KAYITLAR kalıcı olarak silinecektir.",
    del_warn_all: "Veritabanındaki TÜM İSG VE YÜKLEME KAYITLARI kalıcı olarak silinecektir.",
    del_warn_end: "Bu veriler asla geri getirilemez!",
    perm_delete: "Kalıcı Olarak Sil",
    wait: "Bekle",
    all_reports: "Tüm Sevkiyat Raporları", filter_day: "Bugün", filter_week: "Bu Hafta", filter_month: "Bu Ay", filter_all: "Tümü",
    records: "Kayıt",
    no_records: "Kayıt bulunmamaktadır.",
    before: "Giriş / Kasa Durumu",
    after: "Bitiş / Yüklü Durum",
    loading_progress: "Yükleme Sürüyor...",
    return_back: "Geri Dön",
    total_record: "Toplam Kayıt:",
    current_score: "Güncel Puan",
    solution_after: "Çözüm / Sonrası",
    risk: "Risk",
    hours_left: "Saat Kaldı",
    solution_rate: "Çözüm Oranı",
    tonnage_24h: "Son 24 Saatte Yüklenen Toplam Tonaj",
    total_tonnage: "Toplam Tonaj"
  },
  en: {
    isg_tab: "OHS & Cleanliness",
    yukleme_tab: "Loading Tracking",
    sys_isg_title: "OHS & Cleanliness",
    sys_yukleme_title: "Loading & Shipment",
    sys_management: "Management System",
    welcome: "Welcome",
    login_desc: "Enter your account details to continue.",
    username: "Username",
    password: "Password",
    remember_me: "Keep me logged in (Remember Me)",
    login_btn: "Login to System",
    err_wrong_cred: "Invalid username or password!",
    err_isg_module: "Loading personnel cannot login from OHS module!",
    err_yukleme_module: "OHS personnel cannot login from Loading module!",
    loading_server: "Connecting to server...",
    logout: "Logout",
    
    // Priorities & Statuses
    pri_basit: "Low", pri_orta: "Medium", pri_kritik: "Critical",
    stat_cozuldu: "Resolved", stat_onay: "Pending Approval", stat_acik: "Unresolved", stat_itiraz: "Objected", stat_iptal: "Cancelled",
    
    // Yüklemeci Panel
    yuk_title: "Shipment & Loading",
    yuk_desc: "Vehicle records, detailed tonnage and photo management",
    new_load_btn: "Start New Loading / Vehicle Entry",
    load_form_title: "Vehicle & Shipment Entry Form",
    plate_no: "License Plate or Waybill No *",
    driver_name: "Driver Full Name (Optional)",
    dest_location: "Destination Location / City *",
    dest_company: "Destination Company *",
    project_no: "Project No / Order Code *",
    tonnage: "Loaded Tonnage (kg or Tons) *",
    cam_pre: "Empty Trailer / Status Photo (Optional)",
    cam_open: "Open Camera / Upload Photo",
    optional: "(Optional)",
    note_pre: "Short Note (Optional)",
    start_load_btn: "Start Record",
    active_loads: "Ongoing Loadings",
    no_active_loads: "There are no active loadings at the moment.",
    no_active_desc: "You can enter incoming vehicles using the button above.",
    plate: "PLATE / WAYBILL",
    entry_time: "ENTRY TIME",
    driver: "Driver",
    pre_note_title: "Entry Note",
    no_note: "No note provided.",
    no_photo: "NO PHOTO",
    finish_load_btn: "Finish Loading",
    finish_form_title: "Loading Completion Record",
    cam_post: "Security / Fastening Photo (Optional)",
    note_post: "Completion Note / Received By (Optional)",
    cancel: "Cancel",
    close_job: "Close Job",
    status_done: "Completed",
    status_progress: "In Progress",
    dest_country: "Destination Country *",
    status_beklemede: "Waiting for Loading",
    status_yukleniyor: "Loading",
    status_tamamlandi: "Loaded & Shipped",
    start_loading: "Start Loading",
    details: "Details",

    // Admin Panel
    admin_panel: "Admin Panel",
    admin_desc: "Factory-wide monitoring, tonnage tracking and management.",
    next_reset: "Next Score Reset",
    btn_users: "User Accounts",
    risk_map: "Risk Map",
    problem: "Problem",
    no_problem: "No Issues",
    user_management: "User Management",
    isg_accounts: "OHS Accounts",
    yukleme_accounts: "Loading Accounts",
    new_account: "Create New Account",
    fullname: "Full Name",
    sys_role: "System Role",
    dept: "Responsible Department",
    create_acc_btn: "Create Account",
    existing_accs: "Existing Accounts",
    show_passwords: "Show Passwords",
    delete_history: "System History Cleanup (agiradar only)",
    delete_desc: "You can permanently delete old OHS and Loading reports to prevent database bloat.",
    month_1: "Older than 1 Month", month_3: "Older than 3 Months", month_6: "Older than 6 Months", month_all: "Delete All History",
    delete_btn: "Delete",
    are_you_sure: "Are You Sure?",
    del_warn_1: "ALL RECORDS older than ", del_warn_2: " months will be permanently deleted.",
    del_warn_all: "ALL OHS AND LOADING RECORDS in the database will be permanently deleted.",
    del_warn_end: "This data can never be recovered!",
    perm_delete: "Permanently Delete",
    wait: "Wait",
    all_reports: "All Shipment Reports", filter_day: "Today", filter_week: "This Week", filter_month: "This Month", filter_all: "All",
    records: "Records",
    no_records: "No records found.",
    before: "Entry / Trailer State",
    after: "Completion / Loaded State",
    loading_progress: "Loading in Progress...",
    return_back: "Go Back",
    total_record: "Total Records:",
    current_score: "Current Score",
    solution_after: "Solution / After",
    risk: "Risk",
    hours_left: "Hours Left",
    solution_rate: "Resolution Rate",
    tonnage_24h: "Total Tonnage Loaded in 24 Hours",
    total_tonnage: "Total Tonnage"
  }
};

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

const TimerWrapper = ({ children }) => {
  const [now, setNow] = useState(Date.now());
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
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage, CompanyLogo,
      handleImageUpload, db
    } = ctx;
    
    if (!previewModalImg) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-slide-up" onClick={() => setPreviewModalImg(null)}>
        <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button onClick={() => setPreviewModalImg(null)} className="p-3 bg-white dark:bg-gray-800/20 hover:bg-white dark:bg-gray-800/40 text-white rounded-full transition-colors shadow-lg">
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
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage, CompanyLogo,
      handleImageUpload, db
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
            <button onClick={toggleLang} className="flex items-center space-x-2 bg-white dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-800 dark:text-gray-100 hover:bg-white dark:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{lang === 'tr' ? 'English' : 'Türkçe'}</span>
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl mb-8 flex space-x-1 border border-white/40 z-10">
          <button onClick={() => setLoginTheme('isg')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${isISG ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:bg-gray-800'}`}>
            <ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_tab')}
          </button>
          <button onClick={() => setLoginTheme('yukleme')} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${!isISG ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:bg-gray-800'}`}>
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

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-8">
              <CompanyLogo className="mx-auto" scale="scale-110" theme={isISG ? 'blue' : 'orange'} />
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">{isISG ? t('sys_isg_title') : t('sys_yukleme_title')}</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('welcome')}</h2>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-8 text-sm">{t('login_desc')}</p>
            
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
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 transition-colors ${isISG ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`} required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 transition-colors ${isISG ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`} required />
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
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage, CompanyLogo,
      handleImageUpload, db
    } = ctx;
    
    let roleText = currentUser.role;
    if (currentUser.role === 'sef') roleText = `${currentUser.dept} Birimi`;
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
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 capitalize leading-tight">{roleText}</span>
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
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage, CompanyLogo,
      handleImageUpload, db
    } = ctx;
    
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
          <div className="z-10 bg-white dark:bg-gray-800/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center space-x-3">
             <div className="bg-white dark:bg-gray-800/20 p-2 rounded-xl"><Scale className="w-6 h-6 text-white" /></div>
             <div>
               <p className="text-[11px] uppercase font-bold text-orange-200 tracking-wider">{t('tonnage_24h')}</p>
               <p className="text-2xl font-extrabold text-white">{tonnage24h.toLocaleString('tr-TR')} <span className="text-sm font-medium">Ton</span></p>
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
              <button onClick={() => {setIsCreating(false); setImgPreview(null); setForm({plaka:'', sofor:'', destLocation:'', destCompany:'', projectNo:'', tonnage:'', not:''});}} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleStartLoading} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('plate_no')}</label>
                  <input required type="text" value={form.plaka} onChange={e=>setForm({...form, plaka: e.target.value.toUpperCase()})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('driver_name')}</label>
                  <input type="text" value={form.sofor} onChange={e=>setForm({...form, sofor: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('dest_country')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <select required value={form.destCountry} onChange={e=>setForm({...form, destCountry: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('dest_location')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="text" value={form.destLocation} onChange={e=>setForm({...form, destLocation: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Örn: İstanbul / Dilovası" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('dest_company')}</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="text" value={form.destCompany} onChange={e=>setForm({...form, destCompany: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Örn: ABB Trafo A.Ş." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('project_no')}</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="text" value={form.projectNo} onChange={e=>setForm({...form, projectNo: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Örn: PRJ-2026-88" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('tonnage')}</label>
                  <div className="relative">
                    <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input required type="number" step="any" value={form.tonnage} onChange={e=>setForm({...form, tonnage: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700" placeholder="Örn: 24.5 (Ton)" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('cam_pre')}</label>
                <input type="file" id="preLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImgPreview)} />
                <div onClick={() => document.getElementById('preLoadCamera').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-pointer transition-colors group overflow-hidden">
                  {imgPreview ? ( <img src={imgPreview} className="w-full h-full object-cover" /> ) : (
                    <><div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110"><Camera className="w-6 h-6 text-gray-500 dark:text-gray-400 dark:text-gray-500 group-hover:text-orange-500" /></div>
                    <span className="text-sm font-bold">{t('cam_open')}</span><span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('optional')}</span></>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('note_pre')}</label>
                <input type="text" value={form.not} onChange={e=>setForm({...form, not: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
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
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-2">{t('no_active_desc')}</p>
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
                    <div><span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">{t('tonnage')}</span><span className="font-extrabold text-orange-700">{load.tonnage ? `${load.tonnage} Ton` : '-'}</span></div>
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
                <button onClick={() => setFinishModal({ isOpen: false, loadId: null, note: '', imgPreview: null })} className="p-2 hover:bg-white dark:bg-gray-800/20 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('cam_post')}</label>
                  <input type="file" id="postLoadCamera" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], (img) => setFinishModal({...finishModal, imgPreview: img}))} />
                  <div onClick={() => document.getElementById('postLoadCamera').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-pointer transition-colors group overflow-hidden">
                    {finishModal.imgPreview ? ( <img src={finishModal.imgPreview} className="w-full h-full object-cover" /> ) : (
                      <><div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110"><Camera className="w-6 h-6 text-gray-500 dark:text-gray-400 dark:text-gray-500 group-hover:text-green-500" /></div>
                      <span className="text-sm font-bold">{t('cam_open')}</span></>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('note_post')}</label>
                  <input type="text" value={finishModal.note} onChange={e=>setFinishModal({...finishModal, note: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-green-500" />
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

  const AdminDashboard = () => {
    const ctx = useAppContext();

    const {
      currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
      lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
      loadings, setLoadings, adminSystemMode, setAdminSystemMode,
      adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
      selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
      previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
      t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
      createLoading, startLoadingProcess, finishLoading, get24HourTonnage, CompanyLogo,
      handleImageUpload, db
    } = ctx;
    
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    const [accountTab, setAccountTab] = useState('isg');
    
    const [historyFilter, setHistoryFilter] = useState('1');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(10);
    const [visiblePasswords, setVisiblePasswords] = useState({});
    
    const [expandedLoadId, setExpandedLoadId] = useState(null);
    const [yuklemeAnaTab, setYuklemeAnaTab] = useState('list');
    const [yuklemeListFilter, setYuklemeListFilter] = useState('all');
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

    const [deleteTarget, setDeleteTarget] = useState('isg');
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

      if (adminSystemMode === 'leaderboard') {
        const sortedDepts = Object.keys(points).filter(key => key !== 'lastDailyBonus').sort((a,b) => points[b] - points[a]);
        
                const handleCustomBonus = async (dept) => {
           const bonusAmount = window.prompt(`${dept} birimine eklemek istediğiniz puan miktarını girin (Örn: 10, -5):`);
           if (bonusAmount !== null && bonusAmount !== '') {
               const num = parseInt(bonusAmount, 10);
               if (!isNaN(num)) {
                   const pointsRef = doc(db, "system", "points");
                   const currentScore = points[dept] || 100;
                   await updateDoc(pointsRef, { [dept]: currentScore + num });
                   alert(`${dept} birimine ${num} puan ${num >= 0 ? 'eklendi' : 'düşüldü'}.`);
               } else {
                   alert("Geçersiz sayı girdiniz.");
               }
           }
        };

        const handleResetAndSave = async () => {
            if(window.confirm('Yeni aya başlamak için puanları geçmişe kaydedip tüm birimleri 100 olarak sıfırlamak istediğinize emin misiniz?')) {
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
                alert("Geçmiş başarıyla kaydedildi ve tüm puanlar sıfırlandı!");
            }
        };

        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-4 border-gray-100 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><TrendingUp className="w-6 h-6 mr-2 text-green-600"/> Liderlik Tablosu</h2>
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Birimlerin anlık performans puanları. Ay sonu 1. olan birim ödüllendirilecektir.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                   <button onClick={handleResetAndSave} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-bold flex items-center shadow-sm text-sm whitespace-nowrap">
                      Sıfırla ve Geçmişe Kaydet
                   </button>
                   
                </div>
             </div>
             
             <div className="grid gap-4 mb-8">
               {sortedDepts.map((dept, index) => (
                 <div key={dept} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border rounded-2xl transition-colors ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200' : 'bg-white dark:bg-gray-800 hover:bg-gray-50'}`}>
                   <div className="flex items-center">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg mr-4 shadow-sm ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>{index + 1}</span>
                      <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{dept}</span>
                   </div>
                   <div className="text-right flex items-center space-x-2 sm:space-x-4 mt-4 sm:mt-0">
                     <button onClick={() => handleCustomBonus(dept)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors">Özel Puan</button>
                     <div>
                       <span className="text-3xl font-extrabold text-green-600">{points[dept] || 100}</span>
                       <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 font-normal ml-1 tracking-wider uppercase">Puan</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="mt-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-purple-600" /> Geçmiş Sonuçlar</h3>
                {(!pointsHistory || Object.keys(pointsHistory).length === 0) ? (
                   <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">Henüz kaydedilmiş bir geçmiş tablo bulunmuyor.</p>
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
               <button onClick={() => setAccountTab('isg')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center ${accountTab === 'isg' ? 'bg-white dark:bg-gray-800 text-blue-700 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                 <ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_accounts')}
               </button>
               <button onClick={() => setAccountTab('yukleme')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center ${accountTab === 'yukleme' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                 <Truck className="w-4 h-4 mr-2" /> {t('yukleme_accounts')}
               </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-2 border-b pb-2">{t('new_account')} ({accountTab === 'isg' ? 'İSG' : 'Yükleme'})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('fullname')}</label>
                  <input type="text" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('username')}</label>
                  <input type="text" required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('password')}</label>
                  <input type="text" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                
                {accountTab === 'isg' && (
                    <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('sys_role')}</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                        <option value="sef">Birim Şefi</option>
                        <option value="mod">İSG Uzmanı (Moderatör)</option>
                        <option value="admin">Sistem Yöneticisi</option>
                    </select>
                    </div>
                )}
                
                {accountTab === 'isg' && newUser.role === 'sef' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('dept')}</label>
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
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-3">{t('existing_accs')} ({filteredUsers.length})</h3>
              <div className="space-y-2">
                {filteredUsers.map(u => {
                  const isVisible = visiblePasswords[u.id];
                  return (
                    <div key={u.id} className="flex justify-between items-center p-3.5 border rounded-xl hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{u.name} <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">@{u.username}</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 capitalize">{u.role === 'sef' ? `Şef - ${u.dept}` : u.role}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Admin şifre görebilme özelliği */}
                        {currentUser?.username === 'agiradar' && (
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200 mr-2">
                              {isVisible ? u.password : '••••••••'}
                            </span>
                            <button onClick={() => togglePasswordVisibility(u.id)} className="text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100 focus:outline-none">
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
          {listToRender.length === 0 ? <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-10">{t('no_records')}</p> : (
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium"><Calendar className="w-3 h-3 inline mr-1"/> {load.createdAtDate} - {load.createdAtTime} {load.finishedAtTime && `| Çıkış: ${load.finishedAtTime}`}</p>
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
                 <button onClick={() => setSelectedYuklemeDate(null)} className="flex items-center text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100 font-medium text-sm mb-4">
                   <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                 </button>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedYuklemeDate} Sevkiyat Raporu</h2>
                 <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{t('total_record')} {dateLoadings.length}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><Truck className="w-6 h-6 mr-3 text-orange-500"/> {t('all_reports')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{t('total_tonnage')}: <b className="text-orange-600 font-bold">{totalTonnageAll.toLocaleString('tr-TR')} Ton</b></p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl shadow-inner">
              <button onClick={() => setYuklemeAnaTab('list')} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'list' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                Liste
              </button>
              <button onClick={() => setYuklemeAnaTab('analysis')} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'analysis' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                Analiz
              </button>
              <button onClick={() => setYuklemeAnaTab('calendar')} className={`py-1.5 px-3 text-sm font-bold rounded-lg transition-all ${yuklemeAnaTab === 'calendar' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                Takvim
              </button>
            </div>
          </div>

          {yuklemeAnaTab === 'analysis' ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Globe className="w-5 h-5 mr-2 text-blue-500"/> Ülkelere Göre Sevkiyatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCountries.map(c => (
                    <div key={c} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="font-bold text-gray-700 dark:text-gray-200">{c}</span>
                      <div className="text-right">
                        <span className="block text-lg font-extrabold text-orange-600">{countryStats[c].ton.toLocaleString('tr-TR')} Ton</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">{countryStats[c].count} Sevkiyat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><Building2 className="w-5 h-5 mr-2 text-blue-500"/> Firmalere Göre Sevkiyatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCompanies.map(c => (
                    <div key={c} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="font-bold text-gray-700 dark:text-gray-200 truncate w-32" title={c}>{c}</span>
                      <div className="text-right shrink-0">
                        <span className="block text-lg font-extrabold text-orange-600">{companyStats[c].ton.toLocaleString('tr-TR')} Ton</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">{companyStats[c].count} Sevkiyat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : yuklemeAnaTab === 'calendar' ? (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
                 <div>
                   <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xl flex items-center">
                     <CalendarDays className="w-6 h-6 mr-3 text-orange-500"/> {monthNames[currentMonth]} {currentYear}
                   </h3>
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
                   const isToday = dayNum === currDate.getDate();
                   const dayLoadings = loadings.filter(l => l.createdAtDate === formattedDateForCell);
                   
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
                <button onClick={() => { setSelectedAdminDept(null); setSelectedAdminDate(null); }} className="flex items-center text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100 font-medium text-sm mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('return_back')}
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedAdminDept || selectedAdminDate} Raporu</h2>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{t('total_record')} {filterTasks.length}</p>
              </div>
              {selectedAdminDept && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 px-6 py-3 rounded-2xl border border-green-200 text-center">
                 <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">{t('current_score')}</p>
                 <p className="text-3xl font-extrabold text-green-600">{points[selectedAdminDept]}</p>
              </div>)}
            </div>

            <div className="space-y-4">
              {filterTasks.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('no_records')}</p> : (
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
                                 <span className="font-bold text-gray-800 dark:text-gray-100 block">{task.dept}</span>
                                 <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">{task.createdAt}</span>
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
      const currentMonth = currDate.getMonth();
      const currentYear = currDate.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
      const dayNames = lang === 'tr' ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const monthNames = lang === 'tr' ? ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
             <div>
               <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-2xl flex items-center">
                 <CalendarDays className="w-7 h-7 mr-3 text-blue-600"/> {monthNames[currentMonth]} {currentYear}
               </h3>
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
               const isToday = dayNum === currDate.getDate();
               const dayTasks = tasks.filter(t => t.createdAt === formattedDateForCell);
               
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

    const getRedTaskCount = (deptName) => tasks.filter(t => t.dept === deptName && (t.status === 'acik' || t.status === 'itiraz_edildi')).length;
    const sortedDeptsAdmin = [...DEPARTMENTS].sort((a, b) => getRedTaskCount(b) - getRedTaskCount(a));

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full xl:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto">
              <div><h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">{t('admin_panel')}</h1><p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">{t('admin_desc')}</p></div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col xl:flex-row flex-wrap w-full md:w-auto bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl shadow-inner gap-1`}>
               <button onClick={() => { setAdminSystemMode('isg'); setAdminViewMode('calendar'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'isg' ? 'bg-white dark:bg-gray-800 text-blue-700 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200'}`}><ShieldAlert className="w-4 h-4 mr-2" /> {t('isg_tab')}</button>
               <button onClick={() => { setAdminSystemMode('yukleme'); setAdminViewMode('calendar'); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'yukleme' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200'}`}><Truck className="w-4 h-4 mr-2" /> {t('yukleme_tab')}</button>
               <button onClick={() => { setAdminSystemMode('users'); setAdminViewMode('users'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'users' ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200'}`}><Users className="w-4 h-4 mr-2" /> {t('btn_users') || 'Kullanıcı Hesapları'}</button>
               <button onClick={() => { setAdminSystemMode('leaderboard'); setAdminViewMode('leaderboard'); setSelectedAdminDept(null); setMobileMenuOpen(false); }} className={`w-full sm:w-auto justify-center sm:justify-start py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center whitespace-nowrap ${adminSystemMode === 'leaderboard' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200'}`}><TrendingUp className="w-4 h-4 mr-2" /> Liderlik Tablosu</button>

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
                  <div key={dept} onClick={() => { setSelectedAdminDept(dept); setSelectedAdminDate(null); setAdminViewMode('calendar'); }} className={`flex justify-between items-center p-4 cursor-pointer transition-all group border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-center"><span className="w-6 text-center text-sm font-bold mr-3 text-gray-400 dark:text-gray-500">{index + 1}.</span><span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700 dark:text-gray-200 group-hover:text-blue-600'}`}>{dept}</span></div>
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

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-red-600 text-white flex justify-between items-center"><h3 className="font-bold text-xl flex items-center"><ShieldAlert className="w-6 h-6 mr-2"/> {t('are_you_sure')}</h3><button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="p-1 hover:bg-white dark:bg-gray-800/20 rounded-full"><X className="w-6 h-6" /></button></div>
              <div className="p-8 text-center space-y-6">
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

    return () => { unsubUsers(); unsubPoints(); unsubTasks(); unsubLoadings(); unsubPointsHistory(); };
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
           const now = Date.now();
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
    await updateDoc(taskRef, updates);
  }, [db]);

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

  // Full Screen Image Modal Lightbox Component






  const contextValue = useMemo(() => ({
    currentUser, setCurrentUser, isFirebaseLoading, setIsFirebaseLoading,
    lang, setLang, darkMode, setDarkMode, users, setUsers, points, setPoints, pointsHistory, setPointsHistory, tasks, setTasks,
    loadings, setLoadings, adminSystemMode, setAdminSystemMode,
    adminViewMode, setAdminViewMode, selectedAdminDept, setSelectedAdminDept,
    selectedAdminDate, setSelectedAdminDate, selectedYuklemeDate, setSelectedYuklemeDate,
    previewModalImg, setPreviewModalImg, previewModalTitle, setPreviewModalTitle,
    t, toggleLang, getLastFridayOfCurrentMonth, logout, createTask, updateTaskStatus,
    createLoading, startLoadingProcess, finishLoading, get24HourTonnage, CompanyLogo,
    handleImageUpload, db
  }), [
    currentUser, isFirebaseLoading, lang, darkMode, users, points, pointsHistory, tasks, loadings, 
    adminSystemMode, adminViewMode, selectedAdminDept, selectedAdminDate, selectedYuklemeDate,
    previewModalImg, previewModalTitle, t, toggleLang, getLastFridayOfCurrentMonth, 
    logout, createTask, updateTaskStatus, createLoading, startLoadingProcess, finishLoading, 
    get24HourTonnage, CompanyLogo
  ]);

  return (
    <AppContext.Provider value={contextValue}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 w-full">
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
             {currentUser.role === 'mod' && <div className="p-8 text-xl font-bold flex-1 text-center mt-10">ISG Mod Paneli (Active)</div>}
             {currentUser.role === 'sef' && <div className="p-8 text-xl font-bold flex-1 text-center mt-10">Birim Şefi Paneli (Active)</div>}
             {currentUser.role === 'yuklemeci' && <YuklemeciDashboard />}
          </main>
        </>
      )}
    </div>
    </AppContext.Provider>
  );
}
