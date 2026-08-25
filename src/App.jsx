import React, { useState, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle, XCircle, LogOut, Clock, ShieldAlert, Calendar, Image as ImageIcon, X, ArrowDownRight, ChevronRight, ArrowLeft, Activity, AlertCircle, List, CalendarDays, Lock, User, Users, Plus, Trash2 } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkdLCPFTXl4JdGJpSD--yAIpd29BtnN-k",
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEPARTMENTS = ["Boyahane", "Altyapı", "Dalgaduvar", "Lazer", "Güç", "Kaynaklı imalat", "Dış alan", "Bakım & Onarım"];

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

const formatDate = (dateObj) => {
  return `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
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
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) { height = Math.round((height *= MAX_WIDTH / width)); width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.7)); 
    };
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  
  const [users, setUsers] = useState([]);
  const [points, setPoints] = useState({});
  const [tasks, setTasks] = useState([]);

  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, task: null, image: null });
  const [modActionModal, setModActionModal] = useState({ isOpen: false, type: null, task: null });
  const [errorMsg, setErrorMsg] = useState('');
  
  const [adminViewMode, setAdminViewMode] = useState('list');
  const [selectedAdminDept, setSelectedAdminDept] = useState(null);
  const [selectedAdminDate, setSelectedAdminDate] = useState(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      if (usersData.length === 0) {
        // Yeni Admin Bilgileri
        const defaultAdmin = { id: "1", username: 'agiradar', password: 'agiradar123', role: 'admin', name: 'Sistem Yöneticisi', dept: null };
        setDoc(doc(db, "users", "1"), defaultAdmin);
        setUsers([defaultAdmin]);
      } else {
        // Eğer veritabanında eski "admin" varsa, onu otomatik olarak "agiradar" ile güncelle
        const adminAcc = usersData.find(u => u.id === "1");
        if (adminAcc && adminAcc.username === 'admin') {
           updateDoc(doc(db, "users", "1"), { username: 'agiradar', password: 'agiradar123' });
        }
        setUsers(usersData);
        
        const savedUserId = localStorage.getItem('isg_logged_in_user') || sessionStorage.getItem('isg_logged_in_user');
        if (savedUserId) {
          const autoUser = usersData.find(u => u.id === savedUserId);
          if (autoUser) setCurrentUser(autoUser);
        }
      }
    });

    const unsubPoints = onSnapshot(doc(db, "system", "points"), (docSnap) => {
      if (docSnap.exists()) {
        setPoints(docSnap.data());
      } else {
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

    return () => {
      unsubUsers();
      unsubPoints();
      unsubTasks();
    };
  }, []);

  const getLastFridayOfCurrentMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); 
    while (d.getDay() !== 5) { d.setDate(d.getDate() - 1); }
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const logout = () => { 
    setCurrentUser(null); 
    setSelectedAdminDept(null); 
    setSelectedAdminDate(null);
    setAdminViewMode('list');
    localStorage.removeItem('isg_logged_in_user');
    sessionStorage.removeItem('isg_logged_in_user');
  };

  const createTask = async (dept, priority, desc, deadlineHours, imgUrl) => {
    const taskId = Date.now().toString();
    const newTask = {
      id: taskId, dept, priority, desc, status: 'acik', 
      createdAt: formatDate(new Date()), 
      timestamp: Date.now(), 
      deadlineHours, imgUrl: imgUrl || '', modNote: ''
    };
    await setDoc(doc(db, "tasks", taskId), newTask);
  };

  const updateTaskStatus = async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);
    const updates = { status: newStatus };
    if (chiefNote) updates.chiefNote = chiefNote;
    if (afterImgUrl) updates.afterImgUrl = afterImgUrl;
    if (modNote) updates.modNote = modNote;
    await updateDoc(taskRef, updates);
  };

  const updatePointsInDB = async (dept, changeAmount) => {
    const newPoints = { ...points, [dept]: points[dept] + changeAmount };
    await updateDoc(doc(db, "system", "points"), newPoints);
  };

  const approveTask = async (task) => {
    await updateTaskStatus(task.id, 'cozuldu');
    const earnedPoints = PRIORITIES[task.priority].multiplier * 10;
    await updatePointsInDB(task.dept, earnedPoints);
  };

  const rejectTask = async (task, modReason) => {
    await updateTaskStatus(task.id, 'acik', '', '', modReason);
    const lostPoints = PRIORITIES[task.priority].multiplier * 5;
    await updatePointsInDB(task.dept, -lostPoints);
  };

  const rejectObjection = async (task, modReason) => {
    await updateTaskStatus(task.id, 'acik', '', '', modReason);
  };

  const CompanyLogo = ({ className = "", scale = "scale-100" }) => (
    <div className={`flex flex-col items-center justify-center bg-white p-2 rounded-xl shadow-sm ${className}`}>
      <div className={`flex items-center space-x-1 ${scale} origin-center`}>
        <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full border-t-4 border-l-4 border-blue-900 rounded-tl-full opacity-80"></div>
           <div className="absolute top-1 left-1 w-[90%] h-[90%] border-t-4 border-l-4 border-blue-400 rounded-tl-full"></div>
           <div className="absolute top-3 left-2 w-[80%] h-[80%] border-t-4 border-l-4 border-gray-400 rounded-tl-full opacity-50"></div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-1">
            <span className="text-gray-800 font-extrabold text-2xl tracking-tighter">ADS</span>
            <span className="text-gray-800 font-bold text-xl">Metal A.Ş.</span>
          </div>
          <span className="text-[6px] font-bold text-white bg-blue-900 px-1 rounded-sm tracking-widest uppercase -mt-1 w-max">Transformer Tanks & Fin Walls</span>
        </div>
      </div>
    </div>
  );

  const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginErr, setLoginErr] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = (e) => {
      e.preventDefault();
      const account = users.find(u => u.username === username.toLowerCase().trim());
      
      if (account && account.password === password) {
        if (rememberMe) {
          localStorage.setItem('isg_logged_in_user', account.id);
          sessionStorage.removeItem('isg_logged_in_user');
        } else {
          sessionStorage.setItem('isg_logged_in_user', account.id);
          localStorage.removeItem('isg_logged_in_user');
        }
        setCurrentUser(account);
        setLoginErr('');
      } else {
        setLoginErr('Kullanıcı adı veya şifre hatalı!');
      }
    };

    if (isFirebaseLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-gray-600 font-medium animate-pulse">Sunucuya bağlanılıyor...</p>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-white text-gray-800 p-12 border-r border-gray-100">
            <CompanyLogo className="bg-transparent shadow-none mb-6" scale="scale-150" />
            <h1 className="text-3xl font-bold text-center mt-8 text-blue-900">İSG & Tertip<br/>Yönetim Sistemi</h1>
            <p className="text-gray-500 text-center mt-4 text-sm max-w-xs">Fabrika içi iş sağlığı, güvenliği ve 5S standartlarını korumak için tasarlanmış merkezi kontrol paneli.</p>
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-8">
              <CompanyLogo className="mx-auto" scale="scale-110" />
              <h1 className="text-xl font-bold text-gray-800 mt-4">İSG & Tertip Sistemi</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoş Geldiniz</h2>
            <p className="text-gray-500 mb-8 text-sm">Sisteme devam etmek için hesap bilgilerinizi girin.</p>
            
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
              
              <div className="flex items-center mt-2 pl-1">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" 
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm font-bold text-gray-600 cursor-pointer select-none">Oturumumu Açık Tut (Beni Hatırla)</label>
              </div>
              
              <button type="submit" className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg transition-colors mt-4">
                Sisteme Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const TopBar = () => (
    <header className="bg-white px-6 py-3 shadow-sm flex justify-between items-center sticky top-0 z-30 border-b border-gray-200">
      <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 scale-75 md:scale-90 origin-left">
             <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full border-t-4 border-l-4 border-blue-900 rounded-tl-full opacity-80"></div>
               <div className="absolute top-1 left-1 w-[90%] h-[90%] border-t-4 border-l-4 border-blue-400 rounded-tl-full"></div>
             </div>
             <div className="flex flex-col">
               <div className="flex items-baseline space-x-1">
                 <span className="text-gray-800 font-extrabold text-2xl tracking-tighter">ADS</span>
                 <span className="text-gray-800 font-bold text-xl hidden sm:inline">Metal A.Ş.</span>
               </div>
             </div>
          </div>
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

  const AdminDashboard = () => {
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    
    // Geçmiş Silme States
    const [historyFilter, setHistoryFilter] = useState('1');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(10);
    const [activeTab, setActiveTab] = useState('list');

    // 10 Saniye Sayacı
    useEffect(() => {
      let timer;
      if (showDeleteModal && deleteCountdown > 0) {
        timer = setTimeout(() => setDeleteCountdown(deleteCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showDeleteModal, deleteCountdown]);

    const handleCreateUser = async (e) => {
      e.preventDefault();
      if(users.find(u => u.username === newUser.username)) {
        alert("Bu kullanıcı adı zaten alınmış!"); return;
      }
      const newUserId = Date.now().toString();
      const userObj = { ...newUser, id: newUserId, dept: newUser.role === 'sef' ? newUser.dept : null };
      
      await setDoc(doc(db, "users", newUserId), userObj);
      setNewUser({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });
    };

    const handleDeleteUser = async (id) => {
      if(id === "1") return; 
      if(window.confirm("Kullanıcıyı silmek istediğinize emin misiniz?")) {
        await deleteDoc(doc(db, "users", id));
      }
    };

    // Geçmişi Silme İşlemi (Veritabanından)
    const executeHistoryDelete = async () => {
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      let cutoff = 0;

      if (historyFilter === '1') cutoff = now - (1 * oneMonth);
      else if (historyFilter === '3') cutoff = now - (3 * oneMonth);
      else if (historyFilter === '6') cutoff = now - (6 * oneMonth);
      else if (historyFilter === 'all') cutoff = now + 10000; // Hepsini silmek için bugünden sonrasını hedefle

      const tasksToDelete = tasks.filter(t => t.timestamp <= cutoff);

      for (const t of tasksToDelete) {
        await deleteDoc(doc(db, "tasks", t.id));
      }

      setShowDeleteModal(false);
      setDeleteCountdown(10);
    };

    const renderRightPanel = () => {
      if (adminViewMode === 'users') {
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><Users className="w-6 h-6 mr-2 text-blue-600"/> Kullanıcı Yönetimi</h2>
            
            <form onSubmit={handleCreateUser} className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8 space-y-4">
              <h3 className="font-bold text-gray-700 text-sm mb-2 border-b pb-2">Yeni Hesap Oluştur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label>
                  <input type="text" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Örn: Ahmet Yılmaz" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Kullanıcı Adı</label>
                  <input type="text" required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Örn: ahmetyilmaz" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Şifre</label>
                  <input type="text" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sistem Rolü</label>
                  <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                    <option value="sef">Birim Şefi</option>
                    <option value="mod">İSG Uzmanı (Moderatör)</option>
                    <option value="admin">Sistem Yöneticisi</option>
                  </select>
                </div>
                {newUser.role === 'sef' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Sorumlu Olduğu Birim</label>
                    <select value={newUser.dept} onChange={e=>setNewUser({...newUser, dept: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm w-full flex justify-center items-center">
                <Plus className="w-4 h-4 mr-1"/> Hesabı Oluştur
              </button>
            </form>

            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-3">Mevcut Hesaplar ({users.length})</h3>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{u.name} <span className="text-xs text-gray-400 font-normal ml-2">@{u.username}</span></p>
                      <p className="text-xs text-gray-500 capitalize">{u.role === 'sef' ? `${u.dept} Şefi` : u.role}</p>
                    </div>
                    {u.id !== "1" && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (selectedAdminDept) {
        const deptTasks = tasks.filter(t => t.dept === selectedAdminDept);
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <button onClick={() => setSelectedAdminDept(null)} className="flex items-center text-gray-500 hover:text-gray-800 font-medium text-sm mb-4 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{selectedAdminDept} Raporu</h2>
                <p className="text-gray-500 mt-1">Toplam Kayıt: {deptTasks.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 px-6 py-3 rounded-2xl border border-green-200 text-center">
                 <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">Güncel Puan</p>
                 <p className="text-3xl font-extrabold text-green-600">{points[selectedAdminDept]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {deptTasks.length === 0 ? (
                 <p className="text-sm text-gray-500 p-4 col-span-full">Bu birime ait kayıt bulunmamaktadır.</p>
              ) : (
                deptTasks.map(task => {
                  const statusDef = STATUS_INFO[task.status];
                  const Icon = statusDef.icon;
                  return (
                    <div key={task.id} className={`p-4 rounded-xl shadow-sm border-l-4 bg-gray-50 ${statusDef.color.split(' ')[2]} flex flex-col`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 font-medium">{task.createdAt}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                          <Icon className="w-3 h-3 mr-1" /> {statusDef.label}
                        </span>
                      </div>
                      <div className="flex flex-row gap-3 mb-3">
                         <div className="w-16 h-16 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 shrink-0 overflow-hidden relative">
                           {task.imgUrl && task.imgUrl.startsWith('data:image') ? (
                             <img src={task.imgUrl} className="w-full h-full object-cover" alt="Öncesi" />
                           ) : (
                             <><ImageIcon className="w-6 h-6 mb-1"/><span className="text-[9px] font-bold">ÖNCESİ</span></>
                           )}
                         </div>
                         <p className="text-gray-800 text-sm font-medium flex-1">{task.desc}</p>
                      </div>
                      
                      {task.status === 'cozuldu' && (
                         <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center space-x-2 mt-2">
                           <div className="w-10 h-10 bg-green-200 rounded-md flex items-center justify-center overflow-hidden shrink-0">
                               {task.afterImgUrl && task.afterImgUrl.startsWith('data:image') ? (
                                  <img src={task.afterImgUrl} className="w-full h-full object-cover" alt="Sonrası" />
                               ) : (
                                  <CheckCircle className="w-5 h-5 text-green-700"/>
                               )}
                           </div>
                           <p className="text-xs text-green-800 italic flex-1">"{task.chiefNote}"</p>
                         </div>
                      )}
                      <div className="mt-auto flex justify-between items-center pt-2">
                         <span className={`text-xs px-2 py-1 rounded-lg font-medium ${PRIORITIES[task.priority].color}`}>{PRIORITIES[task.priority].label} Risk</span>
                         {task.status === 'acik' && <span className="text-xs text-red-600 font-bold"><Clock className="w-3 h-3 inline mr-1"/>{task.deadlineHours} Saat Kaldı</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      }

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dateTasks.length === 0 ? (
                 <p className="text-sm text-gray-500 p-4 col-span-full">Bu tarihte herhangi bir kayıt açılmamış.</p>
              ) : (
                dateTasks.map(task => {
                  const statusDef = STATUS_INFO[task.status];
                  const Icon = statusDef.icon;
                  return (
                    <div key={task.id} className={`p-4 rounded-xl shadow-sm border-l-4 bg-gray-50 ${statusDef.color.split(' ')[2]} flex flex-col`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-800 font-bold">{task.dept}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                          <Icon className="w-3 h-3 mr-1" /> {statusDef.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-row gap-3 mb-3">
                         <div className="w-16 h-16 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 shrink-0 overflow-hidden relative">
                           {task.imgUrl && task.imgUrl.startsWith('data:image') ? (
                             <img src={task.imgUrl} className="w-full h-full object-cover" alt="Öncesi" />
                           ) : (
                             <><ImageIcon className="w-6 h-6 mb-1"/><span className="text-[9px] font-bold">ÖNCESİ</span></>
                           )}
                         </div>
                         <p className="text-gray-600 text-sm font-medium flex-1">{task.desc}</p>
                      </div>
                      
                      {task.status === 'cozuldu' && (
                         <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex items-center space-x-2 mt-2">
                           <div className="w-10 h-10 bg-green-200 rounded-md flex items-center justify-center overflow-hidden shrink-0">
                               {task.afterImgUrl && task.afterImgUrl.startsWith('data:image') ? (
                                  <img src={task.afterImgUrl} className="w-full h-full object-cover" alt="Sonrası" />
                               ) : (
                                  <CheckCircle className="w-5 h-5 text-green-700"/>
                               )}
                           </div>
                           <p className="text-xs text-green-800 italic flex-1">"{task.chiefNote}"</p>
                         </div>
                      )}
                      
                      <div className="mt-auto pt-2">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${PRIORITIES[task.priority].color}`}>{PRIORITIES[task.priority].label} Risk</span>
                      </div>
                    </div>
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
      
      const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
      
      const totalTasksThisMonth = tasks.filter(t => {
         const taskMonth = parseInt(t.createdAt.split('.')[1], 10) - 1;
         const taskYear = parseInt(t.createdAt.split('.')[2], 10);
         return taskMonth === currentMonth && taskYear === currentYear;
      });

      const resolvedThisMonth = totalTasksThisMonth.filter(t => t.status === 'cozuldu').length;

      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
             <div>
               <h3 className="font-extrabold text-gray-800 text-2xl flex items-center">
                 <CalendarDays className="w-7 h-7 mr-3 text-blue-600"/>
                 {monthNames[currentMonth]} {currentYear}
               </h3>
               <p className="text-gray-500 text-sm mt-1">Bu ay toplam {totalTasksThisMonth.length} kayıt açıldı.</p>
             </div>
             
             <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-center">
                <span className="block text-xs font-bold text-blue-800 uppercase mb-1">Çözüm Oranı</span>
                <span className="text-xl font-extrabold text-blue-600">
                   {totalTasksThisMonth.length > 0 ? Math.round((resolvedThisMonth / totalTasksThisMonth.length) * 100) : 0}%
                </span>
             </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {dayNames.map(day => (
              <div key={day} className="text-xs font-bold text-gray-400 uppercase py-2 bg-gray-50 rounded-lg">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: startOffset }).map((_, i) => (
               <div key={`empty-${i}`} className="h-16 md:h-24 lg:h-28 rounded-xl bg-gray-50 border border-gray-100 opacity-50"></div>
             ))}
             
             {Array.from({ length: daysInMonth }).map((_, i) => {
               const dayNum = i + 1;
               const formattedDateForCell = `${dayNum.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
               const isToday = dayNum === currDate.getDate();
               
               const dayTasks = tasks.filter(t => t.createdAt === formattedDateForCell);
               const hasRed = dayTasks.some(t => t.status === 'acik' || t.status === 'itiraz_edildi');
               const hasYellow = dayTasks.some(t => t.status === 'onay_bekliyor');
               const hasGreen = dayTasks.some(t => t.status === 'cozuldu');

               return (
                 <div 
                   key={dayNum} 
                   onClick={() => dayTasks.length > 0 && setSelectedAdminDate(formattedDateForCell)}
                   className={`h-16 md:h-24 lg:h-28 rounded-xl border flex flex-col items-center justify-start pt-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1
                     ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-sm' : 'bg-white border-gray-200'}
                     ${dayTasks.length > 0 ? 'border-gray-300 shadow-sm' : ''}
                   `}
                 >
                   <span className={`text-sm md:text-base font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>{dayNum}</span>
                   
                   {dayTasks.length > 0 && (
                      <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                        {dayTasks.length} Kayıt
                      </span>
                   )}

                   <div className="flex space-x-1.5 mt-auto mb-2">
                      {hasRed && <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full shadow-sm animate-pulse" title="Çözülmemiş Sorun"></span>}
                      {hasYellow && <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-400 rounded-full shadow-sm" title="Onay Bekleyen"></span>}
                      {hasGreen && <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full shadow-sm" title="Çözüldü"></span>}
                   </div>
                 </div>
               );
             })}
          </div>
          
          <div className="flex justify-center space-x-6 mt-8 border-t border-gray-100 pt-6">
             <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg"><span className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm animate-pulse"></span> Problem / İtiraz</div>
             <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2 shadow-sm"></span> Onay Bekliyor</div>
             <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg"><span className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-sm"></span> Çözüldü</div>
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
            <p className="text-gray-500">Fabrika genel durumunu, risk haritasını ve kullanıcıları takip edin.</p>
          </div>
          <div className="mt-4 xl:mt-0 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100">
              <Calendar className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Sonraki Puan Sıfırlama</p>
                <p className="text-lg font-bold text-blue-900">{getLastFridayOfCurrentMonth()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex lg:hidden bg-gray-200 p-1 rounded-xl shadow-inner mb-4 overflow-x-auto">
           <button onClick={() => setAdminViewMode('list')} className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all flex justify-center items-center whitespace-nowrap ${adminViewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
             <List className="w-4 h-4 mr-2"/> Birimler
           </button>
           <button onClick={() => setAdminViewMode('calendar')} className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all flex justify-center items-center whitespace-nowrap ${adminViewMode === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
             <CalendarDays className="w-4 h-4 mr-2"/> Takvim
           </button>
           <button onClick={() => setAdminViewMode('users')} className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all flex justify-center items-center whitespace-nowrap ${adminViewMode === 'users' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
             <Users className="w-4 h-4 mr-2"/> Hesaplar
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:block ${adminViewMode === 'list' ? 'block' : 'hidden'} lg:col-span-1 space-y-4`}>
            <button onClick={() => {setAdminViewMode('users'); setSelectedAdminDept(null);}} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-sm flex items-center justify-center transition-colors">
              <Users className="w-5 h-5 mr-2" /> Kullanıcı Hesaplarını Yönet
            </button>
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
                    onClick={() => { setSelectedAdminDept(dept); setAdminViewMode('calendar'); }}
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

          <div className={`lg:block ${adminViewMode === 'calendar' || adminViewMode === 'users' ? 'block' : 'hidden'} lg:col-span-2`}>
            {renderRightPanel()}
          </div>
        </div>

        {/* SADECE ANA ADMİN (agiradar) İÇİN SİLME BÖLÜMÜ */}
        {currentUser.username === 'agiradar' && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-red-700 flex items-center mb-2"><AlertTriangle className="w-6 h-6 mr-2"/> Sistem Geçmişi Temizliği</h3>
                <p className="text-sm text-red-600 font-medium">Veritabanı şişkinliğini önlemek için eski raporları kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz!</p>
              </div>
              <div className="flex w-full md:w-auto space-x-3 items-center">
                <select value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="flex-1 md:w-48 border border-red-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 cursor-pointer">
                  <option value="1">1 Aydan Eskiler</option>
                  <option value="3">3 Aydan Eskiler</option>
                  <option value="6">6 Aydan Eskiler</option>
                  <option value="all">Tüm Geçmişi Sil</option>
                </select>
                <button onClick={() => { setShowDeleteModal(true); setDeleteCountdown(10); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors whitespace-nowrap">
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SİLME ONAY MODALI */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-red-600 text-white flex justify-between items-center">
                <h3 className="font-bold text-xl flex items-center"><ShieldAlert className="w-6 h-6 mr-2"/> Kritik İşlem Onayı</h3>
                <button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 text-center space-y-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Emin Misiniz?</h4>
                  <p className="text-gray-600 text-sm">
                    {historyFilter === 'all' ? 'Veritabanındaki TÜM KAYITLAR' : `Son ${historyFilter} ay öncesine ait TÜM KAYITLAR`} kalıcı olarak silinecektir. Bu veriler <b className="text-red-600">asla geri getirilemez!</b>
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => { setShowDeleteModal(false); setDeleteCountdown(10); }} className="flex-1 py-4 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200">İptal</button>
                  <button 
                    onClick={executeHistoryDelete} 
                    disabled={deleteCountdown > 0}
                    className={`flex-1 py-4 font-bold rounded-xl transition-all shadow-md ${deleteCountdown > 0 ? 'bg-red-200 text-red-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  >
                    {deleteCountdown > 0 ? `Onay (${deleteCountdown}s)` : 'Kalıcı Olarak Sil'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const ModDashboard = () => {
    const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
    const [dept, setDept] = useState(DEPARTMENTS[0]);
    const [priority, setPriority] = useState('orta');
    const [desc, setDesc] = useState('');
    const [deadline, setDeadline] = useState(2);
    const [activeTab, setActiveTab] = useState('aktif');
    const [imagePreview, setImagePreview] = useState(null);

    const handleSubmit = (e) => {
      e.preventDefault();
      createTask(dept, priority, desc, deadline, imagePreview);
      setIsMobileFormOpen(false); setDesc(''); setActiveTab('aktif'); setImagePreview(null);
    };

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="block lg:hidden mb-6">
          <button onClick={() => setIsMobileFormOpen(!isMobileFormOpen)} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>{isMobileFormOpen ? 'Formu Kapat' : 'Yeni İhlal Kaydı Oluştur'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className={`lg:col-span-1 ${isMobileFormOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center mb-6 text-gray-800">
                <div className="p-3 bg-blue-50 rounded-xl mr-3 text-blue-600"><Camera className="w-6 h-6" /></div>
                <div><h3 className="font-bold text-lg">Yeni İhlal Kaydı</h3></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="file" id="modCameraInput" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], setImagePreview)} />
                <div onClick={() => document.getElementById('modCameraInput').click()} className="w-full h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition hover:border-blue-400 group overflow-hidden relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
                        <Camera className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">Fotoğraf Çek / Yükle</span>
                    </>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">İlgili Birim</label>
                  <select value={dept} onChange={e=>setDept(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Risk Seviyesi</label>
                    <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="basit">Basit Risk</option>
                      <option value="orta">Orta Risk</option>
                      <option value="kritik">Kritik Risk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Süre (Saat)</label>
                    <input type="number" required min="1" value={deadline} onChange={e=>setDeadline(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Açıklama</label>
                  <textarea required value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 h-24 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
                
                <button type="submit" className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold hover:bg-blue-800 shadow-md">Kaydet & Görev Ata</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex bg-gray-200 p-1.5 rounded-xl shadow-inner w-full max-w-md">
               <button onClick={() => setActiveTab('aktif')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'aktif' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>Aksiyon Bekleyenler</button>
               <button onClick={() => setActiveTab('raporlar')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'raporlar' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>Tüm Raporlar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {tasks
                .filter(t => activeTab === 'aktif' ? (t.status !== 'cozuldu' && t.status !== 'iptal') : true)
                .sort((a, b) => {
                  const weight = { kritik: 3, orta: 2, basit: 1 };
                  return weight[b.priority] - weight[a.priority];
                })
                .map(task => {
                  const statusDef = STATUS_INFO[task.status];
                  const StatusIcon = statusDef.icon;
                  const isCriticalAndOpen = task.priority === 'kritik' && task.status === 'acik';
                  
                  return (
                  <div key={task.id} className={`bg-white p-5 rounded-2xl shadow-sm border ${isCriticalAndOpen ? 'border-red-400 glow-red' : 'border-gray-100'} relative flex flex-col`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${statusDef.color.split(' ')[2]}`}></div>
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                         <span className="font-extrabold text-gray-800 text-lg block leading-tight">{task.dept}</span>
                         <span className="text-xs text-gray-400 font-medium">{task.createdAt}</span>
                      </div>
                      <div className="flex flex-col items-end space-y-1.5">
                         <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" /> {statusDef.label}
                         </span>
                         <span className={`text-xs px-2 py-0.5 rounded-full font-bold border border-opacity-20 ${PRIORITIES[task.priority].color}`}>{PRIORITIES[task.priority].label}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100 flex space-x-4 items-start ml-2 flex-1">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 shrink-0 overflow-hidden relative">
                        {task.imgUrl && task.imgUrl.startsWith('data:image') ? (
                          <img src={task.imgUrl} className="w-full h-full object-cover" alt="Öncesi" />
                        ) : (
                          <><ImageIcon className="w-6 h-6 mb-1"/><span className="text-[9px] font-bold">ÖNCESİ</span></>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm font-medium">{task.desc}</p>
                    </div>
                    
                    {activeTab === 'aktif' && task.status === 'onay_bekliyor' && (
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 ml-2 mt-auto">
                        <div className="bg-white p-3 rounded-lg border border-yellow-100 mb-4 flex space-x-4 items-start">
                          <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-lg flex flex-col items-center justify-center text-green-600 shrink-0 overflow-hidden relative">
                            {task.afterImgUrl && task.afterImgUrl.startsWith('data:image') ? (
                              <img src={task.afterImgUrl} className="w-full h-full object-cover" alt="Sonrası" />
                            ) : (
                              <><Camera className="w-6 h-6 mb-1"/><span className="text-[9px] font-bold">SONRASI</span></>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Şefin Notu</p>
                            <p className="text-sm text-gray-800 font-medium italic">"{task.chiefNote}"</p>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button onClick={() => approveTask(task)} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold shadow-sm">Çözümü Onayla</button>
                          <button onClick={() => setModActionModal({isOpen: true, type: 'cozum_red', task})} className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold shadow-sm">Yetersiz (Reddet)</button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'aktif' && task.status === 'itiraz_edildi' && (
                       <div className="bg-red-50 p-4 rounded-xl border border-red-200 ml-2 mt-auto">
                        <div className="bg-white p-3 rounded-lg border border-red-100 mb-4 flex space-x-3 items-start">
                          <div>
                            <p className="text-xs text-red-600 font-bold mb-1 uppercase tracking-wider flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> İtiraz Açıklaması</p>
                            <p className="text-sm text-gray-800 font-medium italic">"{task.chiefNote}"</p>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button onClick={() => approveTask(task)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl text-sm font-bold shadow-sm">Haklı (Çözüldü İşaretle)</button>
                          <button onClick={() => setModActionModal({isOpen: true, type: 'itiraz_red', task})} className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-bold shadow-sm">Haksız (Reddet)</button>
                        </div>
                       </div>
                    )}
                  </div>
                )})}
            </div>
          </div>
        </div>

        {modActionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 flex justify-between items-center bg-red-600 text-white">
                <h3 className="font-bold text-xl flex items-center"><XCircle className="w-6 h-6 mr-3"/> {modActionModal.type === 'cozum_red' ? 'Çözümü Reddet' : 'İtirazı Reddet'}</h3>
                <button onClick={() => { setModActionModal({ isOpen: false, type: null, task: null }); setErrorMsg(''); }} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                {errorMsg && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{errorMsg}</div>}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Reddetme Gerekçesi (Şefe iletilecek) *</label>
                  <textarea id="modReasonInput" className="w-full border border-gray-300 rounded-2xl p-4 h-32 focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none text-base resize-none"></textarea>
                </div>
                <div className="flex space-x-4 pt-2">
                  <button onClick={() => { setModActionModal({ isOpen: false, type: null, task: null }); setErrorMsg(''); }} className="flex-1 py-4 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Vazgeç</button>
                  <button onClick={() => {
                      const reason = document.getElementById('modReasonInput').value;
                      if(!reason) { setErrorMsg("Lütfen reddetme gerekçesini giriniz."); return; }
                      if (modActionModal.type === 'cozum_red') { rejectTask(modActionModal.task, reason); } 
                      else { rejectObjection(modActionModal.task, reason); }
                      setModActionModal({ isOpen: false, type: null, task: null }); setErrorMsg('');
                    }}
                    className="flex-1 py-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg"
                  >Gerekçeyi Gönder</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SefDashboard = () => {
    const myTasks = tasks.filter(t => t.dept === currentUser.dept);
    const activeTasks = myTasks.filter(t => t.status !== 'cozuldu' && t.status !== 'iptal');
    const [activeTab, setActiveTab] = useState('aktif');

    const displayTasks = activeTab === 'aktif' ? activeTasks : myTasks;

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-8 md:p-10 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden mb-8">
          <div className="z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{currentUser.dept} Birimi</h1>
            <p className="text-teal-200 font-medium text-lg">Tertip ve Düzen Yönetim Paneli</p>
          </div>
          <ShieldAlert className="w-48 h-48 text-teal-300 opacity-10 absolute right-10 -bottom-10 z-0 transform -rotate-12" />
        </div>

        <div className="flex bg-gray-200 p-1.5 rounded-xl shadow-inner w-full max-w-md mb-8">
           <button onClick={() => setActiveTab('aktif')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'aktif' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Açık Görevler</button>
           <button onClick={() => setActiveTab('raporlar')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'raporlar' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Geçmiş Kayıtlar</button>
        </div>

        <div>
          {displayTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center text-gray-500 border border-gray-100 shadow-sm">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="font-bold text-xl text-gray-800 mb-2">Harika İş Çıkarıyorsunuz!</p>
              <p className="text-gray-500">Şu anda biriminizde bekleyen herhangi bir uygunsuzluk kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayTasks.map(task => {
                const statusDef = STATUS_INFO[task.status];
                const StatusIcon = statusDef.icon;
                const isCriticalAndOpen = task.priority === 'kritik' && task.status === 'acik';
                
                return (
                <div key={task.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${isCriticalAndOpen ? 'border-red-400 glow-red' : 'border-gray-100'} relative flex flex-col hover:shadow-md transition-shadow`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${statusDef.color.split(' ')[2]}`}></div>
                  
                  <div className="flex justify-between items-start mb-4 pl-3">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center ${statusDef.color.split(' ').slice(0,2).join(' ')}`}>
                        <StatusIcon className="w-4 h-4 mr-1.5" /> {statusDef.label}
                    </span>
                    {task.status === 'acik' && (
                       <span className="flex items-center text-xs text-red-700 font-bold bg-red-50 px-2 py-1.5 rounded-lg border border-red-100"><Clock className="w-3.5 h-3.5 mr-1.5" /> {task.deadlineHours} Saat Kaldı</span>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 flex space-x-4 items-start ml-3 flex-1">
                    <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-lg flex flex-col items-center justify-center text-red-500 shrink-0 overflow-hidden relative">
                       {task.imgUrl && task.imgUrl.startsWith('data:image') ? (
                         <img src={task.imgUrl} className="w-full h-full object-cover" alt="Öncesi" />
                       ) : (
                         <><ImageIcon className="w-6 h-6 mb-1"/><span className="text-[9px] font-bold">ÖNCESİ</span></>
                       )}
                    </div>
                    <div>
                       <p className="text-[10px] text-gray-400 font-bold mb-1">{task.createdAt}</p>
                       <p className="text-gray-800 text-sm font-medium leading-relaxed">{task.desc}</p>
                    </div>
                  </div>

                  {task.modNote && task.status === 'acik' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 ml-3 animate-pulse">
                      <div className="flex items-center text-red-700 font-bold text-xs mb-2 uppercase tracking-wider">
                        <ArrowDownRight className="w-4 h-4 mr-1.5" /> İSG Uzmanı Uyarı Notu
                      </div>
                      <p className="text-sm text-red-900 italic font-medium">"{task.modNote}"</p>
                    </div>
                  )}

                  {task.status === 'cozuldu' && task.resolvedByObjection && (
                    <div className="bg-gray-100 text-gray-600 p-3 rounded-xl border border-gray-200 ml-3 mt-auto mb-2 flex items-center text-xs font-bold">
                      <CheckCircle className="w-4 h-4 mr-2"/> İtiraz Haklı Bulundu: Birimin sorumluluğunda değildir.
                    </div>
                  )}
                  
                  {task.status === 'acik' && activeTab === 'aktif' && (
                    <div className="grid grid-cols-2 gap-3 mt-auto ml-3 pt-2">
                      <button onClick={() => setActionModal({ isOpen: true, type: 'cozum', task, image: null })} className="bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center transition-colors shadow-sm">
                        <Camera className="w-4 h-4 mr-2"/> Çözdüm
                      </button>
                      <button onClick={() => setActionModal({ isOpen: true, type: 'itiraz', task, image: null })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl text-sm font-bold transition-colors border border-gray-200">
                        İtiraz Et
                      </button>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>

        {actionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className={`p-6 flex justify-between items-center text-white ${actionModal.type === 'cozum' ? 'bg-teal-700' : 'bg-gray-800'}`}>
                <h3 className="font-bold text-xl flex items-center">
                  {actionModal.type === 'cozum' ? <><CheckCircle className="w-6 h-6 mr-3"/> Çözüm Bildirimi</> : <><AlertTriangle className="w-6 h-6 mr-3"/> İtiraz Bildirimi</>}
                </h3>
                <button onClick={() => { setActionModal({ isOpen: false, type: null, task: null }); setErrorMsg(''); }} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                {errorMsg && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{errorMsg}</div>}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">{actionModal.type === 'cozum' ? "Sonrası Fotoğrafını Çekin *" : "Kanıt Fotoğrafı Ekle (Zorunlu Değil)"}</label>
                  <input type="file" id="actionCameraInput" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], (img) => setActionModal({...actionModal, image: img}))} />
                  <div onClick={() => document.getElementById('actionCameraInput').click()} className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors group hover:border-teal-400 overflow-hidden relative">
                    {actionModal.image ? (
                       <img src={actionModal.image} alt="Action Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-gray-600 group-hover:text-teal-600" /></div>
                        <span className="text-sm font-bold">Kamerayı Aç / Yükle</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Açıklama / Notunuz *</label>
                  <textarea id="actionNote" className="w-full border border-gray-300 rounded-2xl p-4 h-32 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-500 resize-none text-base"></textarea>
                </div>
                
                <div className="flex space-x-4 pt-2">
                  <button onClick={() => { setActionModal({ isOpen: false, type: null, task: null, image: null }); setErrorMsg(''); }} className="flex-1 py-4 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Vazgeç</button>
                  <button onClick={() => {
                      const note = document.getElementById('actionNote').value;
                      if(!note) { setErrorMsg("Lütfen açıklama giriniz."); return; }
                      if (actionModal.type === 'cozum') { updateTaskStatus(actionModal.task.id, 'onay_bekliyor', note, actionModal.image || '', ''); } 
                      else { updateTaskStatus(actionModal.task.id, 'itiraz_edildi', note, actionModal.image || '', ''); }
                      setActionModal({ isOpen: false, type: null, task: null, image: null }); setErrorMsg('');
                    }}
                    className={`flex-1 py-4 font-bold text-white rounded-xl shadow-lg transition-colors ${actionModal.type === 'cozum' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                  >{actionModal.type === 'cozum' ? "Çözümü Gönder" : "İtirazı İlet"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 w-full">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes glowRed { 0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); } 50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); } 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); } }
        .glow-red { animation: glowRed 2s infinite; }
      `}</style>
      
      {!currentUser ? (
        <LoginScreen />
      ) : (
        <>
          <TopBar />
          <main className="flex-1 w-full flex">
             {currentUser.role === 'admin' && <AdminDashboard />}
             {currentUser.role === 'mod' && <ModDashboard />}
             {currentUser.role === 'sef' && <SefDashboard />}
          </main>
        </>
      )}
    </div>
  );
}