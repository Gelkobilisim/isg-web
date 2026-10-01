import { triggerHaptic } from "./utils/haptics";
import { DICT, getCountryName } from "./i18n";
import { Toaster, toast } from "react-hot-toast";
import { CountUp } from "./components/CountUp";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  Bell,
  BellOff,
  RotateCcw,
  Moon,
  Sun,
  Send,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  Filter,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
  X,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Activity,
  AlertCircle,
  List,
  CalendarDays,
  Lock,
  User,
  Users,
  Plus,
  Trash2,
  Truck,
  Package,
  Save,
  CheckSquare,
  Globe,
  Eye,
  EyeOff,
  Loader2,
  Menu,
  Maximize2,
  MapPin,
  Building2,
  Hash,
  Scale,
  TrendingUp,
  Printer,
  Edit,
  Bug,
  MessageSquare,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  KeyRound,
  Volume2,
  VolumeX,
  LayoutDashboard,
  Trophy,
  CheckCircle2,
  Search,
  Key,
  UserCheck,
  UserPlus,
  RefreshCw,
  HardHat,
  TrendingDown,
  Award,
  History,
  Medal,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  query,
  orderBy,
  limit,
  deleteField,
  increment,
  where,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken,
  isSupported,
} from "firebase/messaging";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import {
  TaskCardSkeleton,
  ShipmentCardSkeleton,
  PaginationControl,
} from "./components/SkeletonLoader";
import PdfReportModal from "./components/PdfReportModal";
import { NotificationStatusBanner } from "./components/NotificationStatusBanner";

import { validateEnvVariables } from "./utils/envValidator";

const envCheck = validateEnvVariables();
if (!envCheck.isValid) {
  console.warn("Lütfen eksik .env ayarlarınızı tamamlayın!");
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

let messaging = null;
const getAppMessaging = async () => {
  if (messaging) return messaging;
  if (typeof window === "undefined") return null;
  try {
    const supported = await isSupported();
    if (supported && import.meta.env.VITE_FIREBASE_VAPID_KEY) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (e) {
    console.warn("Firebase Messaging desteği kontrol edilirken hata:", e);
  }
  return null;
};
// Arka planda ilk kontrol
if (typeof window !== "undefined" && import.meta.env.VITE_FIREBASE_VAPID_KEY) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn("Messaging anlık başlatılamadı:", e);
      }
    }
  }).catch(() => {});
}

const ensureServiceWorkerAndGetToken = async (msgInstance) => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Tarayıcınız Service Worker protokolünü desteklemiyor.");
  }

  // 1. Service Worker'ı kök kapsamda ('/') kontrol et ve başlat
  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  }

  // 2. Eğer servis çalışanı kurulum aşamasındaysa aktifleşene kadar bekle
  if (registration.installing || registration.waiting) {
    await new Promise((resolve) => {
      const sw = registration.installing || registration.waiting;
      if (!sw || sw.state === "activated") return resolve();
      const stateHandler = () => {
        if (sw.state === "activated") {
          sw.removeEventListener("statechange", stateHandler);
          resolve();
        }
      };
      sw.addEventListener("statechange", stateHandler);
      setTimeout(resolve, 2500);
    });
  }

  await navigator.serviceWorker.ready;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error("VAPID Key yapılandırması eksik.");
  }

  try {
    const currentToken = await getToken(msgInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (currentToken) {
      return { token: currentToken, isPushToken: true };
    }
  } catch (pushErr) {
    console.warn("FCM getToken ilk deneme uyarısı:", pushErr?.message || pushErr);

    const errStr = (pushErr?.message || "").toLowerCase();
    const isPushServiceErr =
      errStr.includes("push service error") ||
      errStr.includes("registration failed") ||
      errStr.includes("abort") ||
      pushErr?.name === "AbortError";

    if (isPushServiceErr) {
      // 1. Yeniden deneme: Servis çalışanını güncelle ve tekrar dene
      try {
        await registration.update().catch(() => {});
        const retryToken = await getToken(msgInstance, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });
        if (retryToken) {
          return { token: retryToken, isPushToken: true };
        }
      } catch (retryErr) {
        console.warn("FCM getToken yeniden deneme hatası:", retryErr?.message || retryErr);
      }

      // 2. Mobil tarayıcı push servisine bağlanamıyorsa (PWA standalone dışı Safari,
      // Google Play bağlantısı olmayan Android veya pil tasarrufu kısıtlaması):
      // Cihaz kaydını kesinlikle iptal etmeyip uygulama içi canlı alarm ve sirenler için cihazı bağla!
      const fallbackToken = `inapp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        token: fallbackToken,
        isPushToken: false,
        pushServiceUnavailable: true,
        originalError: pushErr?.message,
      };
    }

    throw pushErr;
  }

  return { token: null, isPushToken: false };
};

const getDeptKey = (deptStr) => {
  const map = {
    Boyahane: "dept_boyahane",
    Altyapı: "dept_altyapi",
    Dalgaduvar: "dept_dalgaduvar",
    Lazer: "dept_lazer",
    Güç: "dept_guc",
    "Kaynaklı imalat": "dept_kaynakli",
    "Dış alan": "dept_dis",
    "Bakım & Onarım": "dept_bakim",
  };
  return map[deptStr] || deptStr;
};
const DEPARTMENTS = [
  "Boyahane",
  "Altyapı",
  "Dalgaduvar",
  "Lazer",
  "Güç",
  "Kaynaklı imalat",
  "Dış alan",
  "Bakım & Onarım",
];

const normalizeDept = (d) => {
  if (!d) return "";
  return String(d)
    .trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/\s+/g, "");
};

const isSameDept = (d1, d2) => {
  if (!d1 || !d2) return false;
  return normalizeDept(d1) === normalizeDept(d2);
};

const isChief = (role) => {
  const r = (role || "").toLowerCase().trim();
  return r === "sef" || r === "şef" || r === "chief" || r === "birim_sefi" || r === "birim_şefi";
};

const COUNTRIES = [
  "Türkiye",
  "Almanya",
  "İngiltere",
  "Fransa",
  "İtalya",
  "İspanya",
  "Hollanda",
  "Belçika",
  "İsveç",
  "Polonya",
  "Romanya",
  "Bulgaristan",
  "Yunanistan",
  "Rusya",
  "ABD",
  "Kanada",
  "BAE",
  "Suudi Arabistan",
  "Katar",
  "Irak",
  "İran",
  "Azerbaycan",
  "Özbekistan",
  "Diğer",
];

const COUNTRY_FLAGS = {
  "Türkiye": "🇹🇷",
  "Almanya": "🇩🇪",
  "İngiltere": "🇬🇧",
  "Fransa": "🇫🇷",
  "İtalya": "🇮🇹",
  "İspanya": "🇪🇸",
  "Hollanda": "🇳🇱",
  "Belçika": "🇧🇪",
  "İsveç": "🇸🇪",
  "Polonya": "🇵🇱",
  "Romanya": "🇷🇴",
  "Bulgaristan": "🇧🇬",
  "Yunanistan": "🇬🇷",
  "Rusya": "🇷🇺",
  "ABD": "🇺🇸",
  "Kanada": "🇨🇦",
  "BAE": "🇦🇪",
  "Suudi Arabistan": "🇸🇦",
  "Katar": "🇶🇦",
  "Irak": "🇮🇶",
  "İran": "🇮🇷",
  "Azerbaycan": "🇦🇿",
  "Özbekistan": "🇺🇿",
  "Diğer": "🌐",
};

const PRIORITIES = {
  basit: {
    label_key: "pri_basit",
    multiplier: 1,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  orta: {
    label_key: "pri_orta",
    multiplier: 2,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300",
  },
  kritik: {
    label_key: "pri_kritik",
    multiplier: 5,
    color: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  },
};

const STATUS_INFO = {
  cozuldu: {
    label_key: "stat_cozuldu",
    color:
      "bg-green-100 text-green-800 border-green-500 dark:bg-green-950/50 dark:text-green-300 dark:border-green-600/50",
    icon: CheckCircle,
  },
  onay_bekliyor: {
    label_key: "stat_onay",
    color:
      "bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-600/50",
    icon: Clock,
  },
  acik: {
    label_key: "stat_acik",
    color:
      "bg-red-100 text-red-800 border-red-500 dark:bg-red-950/50 dark:text-red-300 dark:border-red-600/50",
    icon: AlertTriangle,
  },
  itiraz_edildi: {
    label_key: "stat_itiraz",
    color:
      "bg-orange-100 text-orange-800 border-orange-500 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-600/50",
    icon: AlertTriangle,
  },
  iptal: {
    label_key: "stat_iptal",
    color:
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-600",
    icon: XCircle,
  },
  kapatildi: {
    label_key: "stat_kapatildi",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600/50",
    icon: CheckCircle,
  },
};

let sharedAudioCtx = null;
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
};

// Seamless AudioContext unlock on first user gesture for iOS Safari & Android Chrome
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {}
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true, once: true });
  window.addEventListener("keydown", unlockAudio, { passive: true, once: true });
}

const playNotificationSound = (type = "chime") => {
  try {
    // Respect notification disabled preference
    if (
      typeof localStorage !== "undefined" &&
      (localStorage.getItem("isg_notifications_disabled") === "true" ||
        localStorage.getItem("isg_sound_alerts") === "false")
    ) {
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    if (type === "critical_alarm" || type === "emergency") {
      // Elegant industrial alert chime: 2-tone melodic double-pulse (clear, urgent, non-abrasive)
      // Pulse 1: 880Hz -> 1174Hz (0.14s)
      const osc1 = ctx.createOscillator();
      const oscHarm1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      oscHarm1.type = "triangle";

      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.07);

      oscHarm1.frequency.setValueAtTime(440, now);
      oscHarm1.frequency.exponentialRampToValueAtTime(587.33, now + 0.07);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.32, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain1);
      oscHarm1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      oscHarm1.start(now);
      osc1.stop(now + 0.14);
      oscHarm1.stop(now + 0.14);

      // Pulse 2: 987.77Hz -> 1318.5Hz (starts at now + 0.16s, lasts 0.28s)
      const t2 = now + 0.16;
      const osc2 = ctx.createOscillator();
      const oscHarm2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "sine";
      oscHarm2.type = "triangle";

      osc2.frequency.setValueAtTime(987.77, t2);
      osc2.frequency.exponentialRampToValueAtTime(1318.51, t2 + 0.08);

      oscHarm2.frequency.setValueAtTime(493.88, t2);
      oscHarm2.frequency.exponentialRampToValueAtTime(659.25, t2 + 0.08);

      gain2.gain.setValueAtTime(0, t2);
      gain2.gain.linearRampToValueAtTime(0.35, t2 + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.28);

      osc2.connect(gain2);
      oscHarm2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      oscHarm2.start(t2);
      osc2.stop(t2 + 0.28);
      oscHarm2.stop(t2 + 0.28);

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([180, 80, 220]);
      }
      return;
    }

    if (type === "urgent" || type === "alert") {
      // High-priority alert sound (two-tone warning)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Harmonic crystal chime: G5 (784Hz) -> C6 (1046.5Hz) with warm resonance
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08); // C6

      osc2.frequency.setValueAtTime(1567.98, now); // Harmonic G6
      osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.08); // Harmonic C7

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.28, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.58);
      osc2.stop(now + 0.58);
    }

    // Optional haptic vibration for mobile devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([150, 75, 150]);
    }
  } catch (err) {
    console.warn("Notification sound could not be played:", err);
  }
};

const triggerClientNotification = (title, options = {}) => {
  try {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("isg_notifications_disabled") === "true"
    ) {
      return;
    }
    // Play crystal clear notification sound immediately
    playNotificationSound(options.soundType || "chime");

    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && typeof reg.showNotification === "function") {
            reg.showNotification(title, {
              icon: "/adsmetal_logo.jpg",
              badge: "/adsmetal_logo.jpg",
              vibrate: [200, 100, 200, 100, 200],
              silent: false,
              ...options,
            });
          }
        })
        .catch(() => {});
      return;
    }

    try {
      new Notification(title, {
        icon: "/adsmetal_logo.jpg",
        silent: false,
        ...options,
      });
    } catch {
      // Direct Notification constructor not supported or blocked in mobile environment
    }
  } catch (err) {
    console.warn("Client notification failed silently:", err);
  }
};

const formatDate = (dateObj) => {
  return `${dateObj.getDate().toString().padStart(2, "0")}.${(dateObj.getMonth() + 1).toString().padStart(2, "0")}.${dateObj.getFullYear()}`;
};

const formatTime = (dateObj) => {
  return `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
};

const handleImageUpload = (file, callback) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_DIM = 800;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round(height * (MAX_DIM / width));
          width = MAX_DIM;
        } else {
          width = Math.round(width * (MAX_DIM / height));
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      // Aggressive compression for Firestore Base64 limits
      callback(canvas.toDataURL("image/jpeg", 0.5));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

const CompanyLogo = ({
  className = "",
  scale = "scale-100",
  theme = "blue",
}) => (
  <div
    className={`inline-flex items-center gap-2.5 p-1 rounded-xl ${className}`}
  >
    <div className={`flex items-center gap-2.5 ${scale} origin-center`}>
      <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-200 dark:border-gray-700 bg-white">
        <img
          src="/adsmetal_logo.jpg"
          alt="ADS Metal"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-baseline space-x-1 leading-none">
          <span className="text-gray-900 dark:text-white font-black text-xl tracking-tight">
            ADS
          </span>
          <span className="text-gray-700 dark:text-gray-300 font-bold text-base">
            Metal A.Ş.
          </span>
        </div>
        <span
          className={`text-[7px] font-extrabold text-white px-1 py-0.5 rounded tracking-wider uppercase mt-0.5 w-max ${theme === "orange" ? "bg-orange-600" : "bg-blue-800"}`}
        >
          Transformer Tanks & Fin Walls
        </span>
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

export const AppContext = React.createContext({
  lang: typeof window !== "undefined" ? localStorage.getItem("isg_lang") || "tr" : "tr",
  setLang: () => {},
  toggleLang: () => {},
  t: (k) => DICT["tr"]?.[k] || k,
  tasks: [],
  users: [],
  loadings: [],
  points: {},
  currentUser: null,
});

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  const fallbackLang =
    (typeof window !== "undefined" ? localStorage.getItem("isg_lang") : null) || "tr";
  if (!context) {
    return {
      lang: fallbackLang,
      setLang: () => {},
      toggleLang: () => {},
      t: (key) => DICT[fallbackLang]?.[key] || DICT["tr"]?.[key] || key,
      currentUser: null,
      tasks: [],
      users: [],
      loadings: [],
      points: {},
    };
  }
  if (!context.lang) {
    context.lang = fallbackLang;
  }
  if (!context.t) {
    context.t = (key) => DICT[context.lang]?.[key] || DICT["tr"]?.[key] || key;
  }
  return context;
};

export const useLanguage = () => {
  const ctx = useAppContext();
  const lang = ctx?.lang || (typeof window !== "undefined" ? localStorage.getItem("isg_lang") : null) || "tr";
  const t = ctx?.t || ((key) => DICT[lang]?.[key] || DICT["tr"]?.[key] || key);
  const setLang = ctx?.setLang || (() => {});
  const toggleLang = ctx?.toggleLang || (() => {});
  return { lang, t, setLang, toggleLang };
};

const ImageLightboxModal = () => {
  const ctx = useAppContext();

  const {
    currentUser,
    setCurrentUser,
    isFirebaseLoading,
    setIsFirebaseLoading,
    lang,
    setLang,
    darkMode,
    setDarkMode,
    users,
    setUsers,
    points,
    setPoints,
    pointsHistory,
    setPointsHistory,
    tasks,
    setTasks,
    pointLogs,
    setPointLogs,
    loadings,
    setLoadings,
    adminSystemMode,
    setAdminSystemMode,
    adminViewMode,
    setAdminViewMode,
    selectedAdminDept,
    setSelectedAdminDept,
    selectedAdminDate,
    setSelectedAdminDate,
    selectedYuklemeDate,
    setSelectedYuklemeDate,
    previewModalImg,
    setPreviewModalImg,
    previewModalTitle,
    setPreviewModalTitle,
    t,
    toggleLang,
    getLastFridayOfCurrentMonth,
    logout,
    createTask,
    updateTaskStatus,
    createLoading,
    startLoadingProcess,
    finishLoading,
    get24HourTonnage,
    notificationStatus,
    requestNotificationPermission,
    db,
  } = ctx;

  if (!previewModalImg) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-slide-up"
      onClick={() => setPreviewModalImg(null)}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button
            onClick={() => setPreviewModalImg(null)}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {previewModalTitle && (
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">
            {previewModalTitle}
          </div>
        )}
        <img
          loading="lazy"
          decoding="async"
          src={previewModalImg}
          alt={lang === "en" ? "Zoomed Photo" : "Büyütülmüş Fotoğraf"}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
        />
        <p className="text-white/70 text-xs mt-3 flex items-center">
          <Maximize2 className="w-3.5 h-3.5 mr-1" />{" "}
          {lang === "en"
            ? "Click on the image or the background to close"
            : "Kapatmak için görsele veya boşluğa tıklayabilirsiniz"}
        </p>
      </div>
    </div>
  );
};

const LoginScreen = () => {
  const ctx = useAppContext();

  const {
    currentUser,
    setCurrentUser,
    isFirebaseLoading,
    setIsFirebaseLoading,
    lang,
    setLang,
    darkMode,
    setDarkMode,
    users,
    setUsers,
    points,
    setPoints,
    pointsHistory,
    setPointsHistory,
    tasks,
    setTasks,
    loadings,
    setLoadings,
    adminSystemMode,
    setAdminSystemMode,
    adminViewMode,
    setAdminViewMode,
    selectedAdminDept,
    setSelectedAdminDept,
    selectedAdminDate,
    setSelectedAdminDate,
    selectedYuklemeDate,
    setSelectedYuklemeDate,
    previewModalImg,
    setPreviewModalImg,
    previewModalTitle,
    setPreviewModalTitle,
    t,
    toggleLang,
    getLastFridayOfCurrentMonth,
    logout,
    createTask,
    updateTaskStatus,
    createLoading,
    startLoadingProcess,
    finishLoading,
    get24HourTonnage,
    db,
    notificationStatus,
    requestNotificationPermission,
  } = ctx;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [registerDevice, setRegisterDevice] = useState(true);
  const [loginTheme, setLoginTheme] = useState("isg");
  const [welcomeState, setWelcomeState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer for security lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => setLoginErr(""), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0 || isSubmitting || welcomeState) return;
    setLoginErr("");
    setIsSubmitting(true);
    
    try {
      const cleanUsername = username.toLowerCase().trim();
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      let data;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON API response from server:", res.status, text.slice(0, 200));
        if (!res.ok) {
          throw new Error(`Sunucu hatası (${res.status}): Vercel backend API yanıt veremedi.`);
        }
        throw new Error("Sunucudan beklenmeyen yanıt alındı (Vercel API yerine statik sayfa döndü).");
      }

      if (!res.ok || !data.success) {
        if (data?.locked && data?.remainingSeconds) {
          setLockoutSeconds(data.remainingSeconds);
        }
        setLoginErr(data?.error || t("err_wrong_cred") || "Geçersiz kullanıcı adı veya şifre");
        setIsSubmitting(false);
        triggerHaptic("error");
        return;
      }

      // Successful login resets any local lockout state
      setLockoutSeconds(0);

      const account = data.user;
      
      if (loginTheme === "isg" && account.role === "yuklemeci") {
        setLoginErr(t("err_isg_module"));
        setIsSubmitting(false);
        triggerHaptic("error");
        return;
      }
      if (
        loginTheme === "yukleme" &&
        (account.role === "sef" || account.role === "mod" || account.role === "isg" || account.role === "isgci")
      ) {
        setLoginErr(t("err_yukleme_module"));
        setIsSubmitting(false);
        triggerHaptic("error");
        return;
      }

      // Enforce secure Firebase Auth persistence across browser refreshes for authenticated accounts
      if (data.firebaseToken) {
        try {
          await setPersistence(auth, browserLocalPersistence);
          await signInWithCustomToken(auth, data.firebaseToken);
        } catch (authErr) {
          // If Identity Platform (Firebase Auth) is not initialized in the Firebase console for this project,
          // ignore configuration-not-found to prevent uncaught console errors while maintaining server-backed session
          if (authErr?.code !== "auth/configuration-not-found") {
            console.warn("Firebase Auth notice:", authErr?.message || authErr);
          }
        }
      }

      if (rememberMe || account.role === "admin") {
        localStorage.setItem("isg_logged_in_user", account.id);
        if (data.token) {
          localStorage.setItem("isg_auth_token", data.token);
        }
      }
      
      if (account.role === "admin") {
        setAdminSystemMode(loginTheme);
      }
      
      // Giriş yapan hesabın bildirim kimliğini her zaman senkronize et (aynı birimden yeni hesap veya cihaz değişimi)
      localStorage.removeItem("isg_notifications_disabled");
      localStorage.setItem("isg_notification_device_owner", account.id);
      localStorage.setItem("isg_notification_role", account.role);
      localStorage.setItem("isg_notification_dept", account.dept || "");

      if (registerDevice || (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted")) {
        if ("Notification" in window && "serviceWorker" in navigator) {
          Notification.requestPermission().then(async (permission) => {
            console.log("Notification permission:", permission);
            if (
              permission === "granted" &&
              import.meta.env.VITE_FIREBASE_VAPID_KEY
            ) {
              try {
                const msgInstance = await getAppMessaging();
                if (!msgInstance) return;
                const { token } = await ensureServiceWorkerAndGetToken(msgInstance);
                if (token) {
                  localStorage.setItem("isg_device_fcm_token", token);
                  await setDoc(doc(db, "users", account.id), {
                    fcmToken: token,
                    fcmTokens: arrayUnion(token),
                    lastActive: new Date(),
                  }, { merge: true });
                }
              } catch (err) {
                console.warn("Otomatik FCM Token alımı ertelendi:", err?.message || err);
              }
            }
          }).catch(() => {});
        }
      }
      // Show welcome animation sequence before transitioning
      setWelcomeState({
        user: account,
        step: 0,
      });
      triggerHaptic("success");

      setTimeout(() => {
        setWelcomeState((prev) => (prev ? { ...prev, step: 1 } : null));
      }, 450);

      setTimeout(() => {
        setWelcomeState((prev) => (prev ? { ...prev, step: 2 } : null));
      }, 950);

      setTimeout(() => {
        setCurrentUser(account);
        setLoginErr("");
        setIsSubmitting(false);
        setWelcomeState(null);
      }, 1500);
    } catch (err) {
      console.error("Login failed:", err);
      setLoginErr(err?.message || "Giriş yapılırken sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
      setIsSubmitting(false);
      setWelcomeState(null);
      triggerHaptic("error");
    }
  };

  const isISG = loginTheme === "isg";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6 relative"
      style={{
        backgroundImage: "url('/ads-metal-anadolu-osb.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="w-full max-w-4xl flex justify-end items-center gap-3 z-40 mb-6 mt-2 px-2 md:px-0 md:absolute md:top-8 md:right-8 md:mt-0 flex-wrap">
        <PWAInstallButton variant="rounded" />
        <button
          onClick={() => {
            triggerHaptic("light");
            setDarkMode(!darkMode);
          }}
          className="group flex items-center justify-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-gray-800 dark:text-gray-100 hover:scale-105 transition-all duration-300 border border-white/50 dark:border-gray-700/50"
          title={darkMode ? (t("light_mode") || "Açık Mod") : (t("dark_mode") || "Koyu Mod")}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-500" />
          )}
          <span className="text-sm font-bold hidden sm:inline-block">
            {darkMode ? (t("light_mode") || "Açık Mod") : (t("dark_mode") || "Koyu Mod")}
          </span>
        </button>
        <div className="flex items-center bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-1 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 dark:border-gray-700/50">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              if (lang !== "tr") setLang("tr");
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              lang === "tr"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="Türkçe"
          >
            <span>🇹🇷</span>
            <span>TR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              if (lang !== "en") setLang("en");
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              lang === "en"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="English"
          >
            <span>🇬🇧</span>
            <span>EN</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl mb-8 flex space-x-1 border border-white/40 z-10">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setLoginTheme("isg");
          }}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${isISG ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"}`}
        >
          <ShieldAlert className="w-4 h-4 mr-2" /> {t("isg_tab")}
        </button>
        <button
          onClick={() => {
            triggerHaptic("selection");
            setLoginTheme("yukleme");
          }}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center ${!isISG ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"}`}
        >
          <Truck className="w-4 h-4 mr-2" /> {t("yukleme_tab")}
        </button>
      </div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up z-10 border border-white/20">
        <div
          className={`hidden md:flex flex-col justify-between w-1/2 p-8 lg:p-10 relative overflow-hidden transition-all duration-500 select-none ${
            isISG
              ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white border-r border-blue-500/20"
              : "bg-gradient-to-br from-slate-900 via-orange-950 to-slate-950 text-white border-r border-orange-500/20"
          }`}
        >
          {/* Background Ambient Glows & Grid Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          <div
            className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none ${
              isISG ? "bg-blue-500" : "bg-orange-500"
            }`}
          />
          <div
            className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none ${
              isISG ? "bg-cyan-500" : "bg-amber-500"
            }`}
          />

            {/* Top Badge: System Mode Indicator */}
          <div className="relative z-10 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm border ${
                isISG
                  ? "bg-blue-500/10 text-blue-300 border-blue-400/30"
                  : "bg-orange-500/10 text-orange-300 border-orange-400/30"
              }`}
            >
              {isISG ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t("isg_portal_title") || "İSG & Tertip Portalı"}</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t("sys_yukleme_title") || "Lojistik & Sevkiyat"}</span>
                </>
              )}
            </span>
            <span className="text-[11px] font-bold text-gray-400 tracking-wider">
              {lang === "tr" ? "KURUMSAL PORTAL" : "ENTERPRISE PORTAL"}
            </span>
          </div>

          {/* Center Brand Identity */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto py-6">
            {/* Logo Avatar with Glowing Rings */}
            <div className="relative mb-5 group">
              <div
                className={`absolute -inset-3 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity ${
                  isISG ? "bg-gradient-to-r from-blue-600 to-cyan-500" : "bg-gradient-to-r from-orange-600 to-amber-500"
                }`}
              />
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-3xl p-1.5 bg-gradient-to-b from-white/20 to-white/5 border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center overflow-hidden">
                <img
                  src="/adsmetal_logo.jpg"
                  alt="ADS Metal"
                  className="w-full h-full object-cover rounded-[18px]"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="flex items-baseline justify-center gap-1.5 text-white">
              <span className="text-3xl font-black tracking-tight drop-shadow-sm">
                ADS
              </span>
              <span className="text-2xl font-bold text-gray-200 tracking-tight">
                Metal A.Ş.
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold text-blue-300/80 dark:text-gray-400 tracking-[0.22em] mt-1 mb-4">
              Transformer Tanks & Fin Walls
            </p>

            {/* Main Title with Gradient */}
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              <span
                className={`bg-clip-text text-transparent bg-gradient-to-r ${
                  isISG
                    ? "from-white via-blue-100 to-cyan-300"
                    : "from-white via-orange-100 to-amber-300"
                }`}
              >
                {isISG ? t("sys_isg_title") : t("sys_yukleme_title")}
              </span>
              <span className="block text-base lg:text-lg font-bold text-gray-300 mt-1">
                {t("sys_management")}
              </span>
            </h1>

            {/* Feature Highlights Pills */}
            <div className="mt-5 flex flex-col gap-2 w-full max-w-xs text-left">
              {isISG ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 backdrop-blur-xs">
                    <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t("login_bullet_zero_accidents") || "Sıfır İş Kazası & Proaktif Denetim"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 backdrop-blur-xs">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{t("login_bullet_instant_tracking") || "Anlık İhlal & Termin Süresi Takibi"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 backdrop-blur-xs">
                    <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{t("login_bullet_dept_points") || "Departman Başarı & Teşvik Puanlama"}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 backdrop-blur-xs">
                    <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t("login_bullet_truck_tracking") || "Canlı Plaka, Şoför & Tır Takibi"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 backdrop-blur-xs">
                    <Scale className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>{t("login_bullet_tonnage_reports") || "Günlük Tonaj & Sevkiyat Raporları"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 backdrop-blur-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t("login_bullet_photo_delivery") || "Fotoğraflı Teslimat & Onay Zinciri"}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-gray-400 pt-4 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span>{t("factory_location") || "Anadolu OSB Fabrikası"}</span>
            </span>
            <span className="font-semibold text-gray-300">{t("safe_workplace") || "Güvenli Çalışma Alanı"}</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <div className="md:hidden text-center mb-6">
            <div className="relative inline-flex mb-3">
              <div
                className={`absolute -inset-2 rounded-2xl blur-lg opacity-60 ${
                  isISG ? "bg-blue-500/40" : "bg-orange-500/40"
                }`}
              />
              <div className="relative w-16 h-16 rounded-2xl p-1 bg-gradient-to-b from-white/20 to-white/5 border border-white/20 shadow-xl overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                <img
                  src="/adsmetal_logo.jpg"
                  alt="ADS Metal"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-xl font-black text-gray-900 dark:text-white">ADS</span>
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Metal A.Ş.</span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase mt-2 mb-1 border ${
                isISG
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40"
                  : "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/40"
              }`}
            >
              {isISG ? <ShieldCheck className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
              <span>{isISG ? t("sys_isg_title") : t("sys_yukleme_title")}</span>
            </div>
          </div>

          <div className="mb-6">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase mb-2 border ${
                isISG
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{t("secure_login_portal") || "GÜVENLİ GİRİŞ PORTALI"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1.5">
              {t("welcome") || "Hoş Geldiniz"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
              {t("login_desc") || "Sisteme devam etmek için hesap bilgilerinizi girin."}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {lockoutSeconds > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-3.5 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-sm animate-pulse">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold">{t("security_lockout_active") || "Güvenlik Kilidi Aktif"}</div>
                    <div className="text-xs font-normal text-amber-700 dark:text-amber-300">
                      {t("security_lockout_desc") || "Hatalı denemeler nedeniyle geçici kilit."}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-base font-bold bg-amber-200/80 dark:bg-amber-800/80 text-amber-950 dark:text-amber-100 px-3 py-1 rounded-xl shadow-inner">
                  {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, "0")}
                </span>
              </div>
            )}

            {loginErr && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center font-bold border border-red-200 dark:border-red-800/50 shadow-sm animate-shake">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-red-500" /> {loginErr}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {t("username") || "Kullanıcı Adı"}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("ph_username") || "Kullanıcı adınızı girin"}
                  className={`w-full border rounded-2xl pl-11 pr-4 py-3.5 outline-none transition-all font-semibold text-sm ${
                    isISG
                      ? "border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/15"
                      : "border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-orange-500/15"
                  }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {t("password") || "Şifre"}
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-2xl pl-11 pr-12 py-3.5 outline-none transition-all font-semibold text-sm ${
                    isISG
                      ? "border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/15"
                      : "border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/70 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-orange-500/15"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? (lang === "tr" ? "Şifreyi gizle" : "Hide password") : (lang === "tr" ? "Şifreyi göster" : "Show password")}
                >
                  <div className="p-1.5 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors">
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${
                      rememberMe
                        ? isISG
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-orange-600 border-orange-600 text-white shadow-sm"
                        : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/80 group-hover:border-gray-400"
                    }`}
                  >
                    {rememberMe && <CheckCircle className="w-3.5 h-3.5 fill-current" />}
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {t("remember_me") || "Oturumumu Açık Tut (Beni Hatırla)"}
                </span>
              </label>
            </div>

            {/* Interactive Device Notification Card */}
            <div
              onClick={() => setRegisterDevice(!registerDevice)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                registerDevice
                  ? isISG
                    ? "bg-blue-500/10 border-blue-500/40 shadow-sm"
                    : "bg-orange-500/10 border-orange-500/40 shadow-sm"
                  : "bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    registerDevice
                      ? isISG
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-orange-600 text-white shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-gray-800 dark:text-gray-100">
                      {t("register_device_for_notif") || "Bu Cihazı Bildirim İçin Kaydet"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        registerDevice
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {registerDevice ? (t("active") || "Aktif") : (t("recommended") || "Önerilen")}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {t("device_notif_hint") || "Giriş yaptığınız bu cihaza anlık sesli bildirimler iletilsin."}
                  </span>
                </div>
              </div>

              {/* Modern Toggle Switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  registerDevice
                    ? isISG
                      ? "bg-blue-600"
                      : "bg-orange-600"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    registerDevice ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={lockoutSeconds > 0 || isSubmitting || !!welcomeState}
              className={`w-full py-4 text-white rounded-2xl font-extrabold shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 text-base tracking-wide cursor-pointer active:scale-[0.98] ${
                lockoutSeconds > 0 || isSubmitting || !!welcomeState
                  ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70 shadow-none"
                  : isISG
                    ? "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45)] hover:shadow-[0_16px_32px_-6px_rgba(37,99,235,0.55)]"
                    : "bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-[0_12px_28px_-6px_rgba(234,88,12,0.45)] hover:shadow-[0_16px_32px_-6px_rgba(234,88,12,0.55)]"
              }`}
            >
              {lockoutSeconds > 0 ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span>
                    {(lang === "en" ? "Locked" : "Kilitli") + " (" + Math.floor(lockoutSeconds / 60) + ":" + String(lockoutSeconds % 60).padStart(2, "0") + ")"}
                  </span>
                </>
              ) : isSubmitting || welcomeState ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {welcomeState ? (t("logging_in") || "Giriş Yapılıyor...") : (t("verifying") || "Doğrulanıyor...")}
                  </span>
                </>
              ) : (
                <>
                  <span>{t("login_btn") || "Sisteme Giriş Yap"}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Bottom Security Trust Badge */}
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              <span>{t("ssl_security_badge") || "256-Bit SSL Uçtan Uca Güvenli Bağlantı"}</span>
            </div>
          </form>

          {/* Signature */}
          <div className="pt-4 text-center">
            <span className="text-xs italic font-light text-gray-400/50 dark:text-gray-500/40 select-none tracking-widest">
              by Gelkobilisim
            </span>
          </div>
        </div>
      </div>

      {/* Full-screen Welcome Animation Overlay */}
      <AnimatePresence>
        {welcomeState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md bg-gradient-to-b from-gray-900/95 via-gray-900/98 to-gray-950 text-white rounded-3xl p-8 border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.25)] flex flex-col items-center text-center overflow-hidden"
            >
              {/* Top ambient glow light */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Animated Logo with glowing ring */}
              <div className="relative mb-6">
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full blur-xl opacity-75 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-sky-400 shadow-2xl flex items-center justify-center overflow-hidden">
                  <img
                    src="/adsmetal_logo.jpg"
                    alt="ADS Metal"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-gray-900 animate-bounce">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Welcome Text */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>{t("ads_tracking_system") || "ADS TAKİP SİSTEMİ"}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                {t("welcome_exclamation") || "Hoş Geldiniz!"}
              </h2>

              <p className="text-base sm:text-lg font-bold text-gray-200 mb-1">
                {t("dear_salutation") || "Sayın"}{" "}
                <span className="text-blue-400 font-extrabold inline-block pb-1">
                  {welcomeState.user.name || welcomeState.user.username}
                </span>
              </p>

              {/* Role badge */}
              <div className="mt-1 mb-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white/5 border border-white/10 text-gray-200 shadow-xs">
                  {welcomeState.user.role === "admin" ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{t("role_admin") || "Sistem Yöneticisi"}</span>
                    </>
                  ) : (welcomeState.user.role === "mod" || welcomeState.user.role === "isg" || welcomeState.user.role === "isgci") ? (
                    <>
                      <HardHat className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{t("role_mod") || "İSG Uzmanı"}</span>
                    </>
                  ) : welcomeState.user.role === "sef" ? (
                    <>
                      <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>
                        {welcomeState.user.dept ? t(getDeptKey(welcomeState.user.dept)) + " " : ""}
                        {t("role_sef") || "Birim Şefi"}
                      </span>
                    </>
                  ) : welcomeState.user.role === "yuklemeci" ? (
                    <>
                      <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>{t("role_yuklemeci") || "Yükleme Sorumlusu"}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{t("role_guest") || "Personel / Yüklenici"}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Dynamic Step Text & Micro-spinner */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-300 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                  <span>
                    {welcomeState.step === 0 && (t("welcome_step_0") || "Kimlik doğrulandı, oturum açılıyor...")}
                    {welcomeState.step === 1 && (t("welcome_step_1") || "Çalışma alanı ve izinler hazırlanıyor...")}
                    {welcomeState.step === 2 && (t("welcome_step_2") || "Panele aktarılıyorsunuz...")}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-500 ease-out"
                    style={{
                      width:
                        welcomeState.step === 0
                          ? "35%"
                          : welcomeState.step === 1
                          ? "75%"
                          : "100%",
                    }}
                  />
                </div>

                {/* 3 Step Indicator Badges */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-semibold text-gray-400">
                  <span className={`inline-flex items-center justify-center gap-1.5 ${welcomeState.step >= 0 ? "text-emerald-400 font-bold" : ""}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("step_verification") || "Doğrulama"}</span>
                  </span>
                  <span className={`inline-flex items-center justify-center gap-1.5 ${welcomeState.step >= 1 ? "text-emerald-400 font-bold" : ""}`}>
                    {welcomeState.step >= 1 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                    )}
                    <span>{t("step_preparation") || "Hazırlık"}</span>
                  </span>
                  <span className={`inline-flex items-center justify-center gap-1.5 ${welcomeState.step >= 2 ? "text-blue-400 font-bold" : ""}`}>
                    {welcomeState.step >= 2 ? (
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                    )}
                    <span>{t("step_launching") || "Başlatılıyor"}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span>{t("ssl_login_badge") || "256-bit Güvenli Oturum Açma"}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnimatedView = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);
const MainLayout = ({ theme = "blue", children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useAppContext();

  const {
    currentUser,
    setCurrentUser,
    isFirebaseLoading,
    setIsFirebaseLoading,
    lang,
    setLang,
    darkMode,
    setDarkMode,
    users,
    setUsers,
    points,
    setPoints,
    pointsHistory,
    setPointsHistory,
    tasks,
    setTasks,
    loadings,
    setLoadings,
    adminSystemMode,
    setAdminSystemMode,
    adminViewMode,
    setAdminViewMode,
    selectedAdminDept,
    setSelectedAdminDept,
    selectedAdminDate,
    setSelectedAdminDate,
    selectedYuklemeDate,
    setSelectedYuklemeDate,
    previewModalImg,
    setPreviewModalImg,
    previewModalTitle,
    setPreviewModalTitle,
    t,
    toggleLang,
    getLastFridayOfCurrentMonth,
    logout,
    createTask,
    updateTaskStatus,
    createLoading,
    startLoadingProcess,
    finishLoading,
    get24HourTonnage,
    db,
    notificationStatus,
    requestNotificationPermission,
    recheckNotificationPermission,
    verifyAndSyncToken,
    showPdfReportModal,
    setShowPdfReportModal,
    soundAlerts,
    toggleSoundAlerts,
  } = ctx;

  let roleText = t(currentUser.role) || currentUser.role;
  if (
    currentUser.username === "agiradar" ||
    currentUser.username === "agiradarsahin"
  )
    roleText = lang === "en" ? "Developer Account" : "Geliştirici (Developer) Hesabı";
  else if (currentUser.role === "sef")
    roleText = `${t(getDeptKey(currentUser.dept))} ${lang === "en" ? "Unit" : "Birimi"}`;
  else if (currentUser.role === "yuklemeci") roleText = t("role_yuklemeci") || "Yükleme Sorumlusu";
  else if (currentUser.role === "yuklenici" || currentUser.role === "worker")
    roleText = t("role_guest") || "Yüklenici / Personel";
  else if (currentUser.role === "admin") roleText = t("role_admin") || "Sistem Yöneticisi";
  else if (currentUser.role === "mod" || currentUser.role === "isg" || currentUser.role === "isgci") roleText = t("role_mod") || "İSG Uzmanı";

  const [showDebug, setShowDebug] = useState(false);
  const [showNotifHistoryModal, setShowNotifHistoryModal] = useState(false);
  const [notifHistoryData, setNotifHistoryData] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Veritabanı sorgularının filtrelenmesi: Her kullanıcı YALNIZCA kendi birimine ait bildirimleri alır
  useEffect(() => {
    if (!currentUser) {
      setNotifHistoryData([]);
      setUnreadNotifCount(0);
      return;
    }

    setIsLoadingNotifs(true);
    let notifQuery;

    const isSpecialAdminOrMod =
      currentUser.role === "admin" ||
      currentUser.role === "mod" ||
      currentUser.role === "isg" ||
      currentUser.role === "isgci";

    if (!isSpecialAdminOrMod && currentUser.dept) {
      // Birim hesapları ve şefleri veritabanından yalnızca kendi birimine ait kayıtları çeker
      notifQuery = query(
        collection(db, "user_notifications"),
        where("dept", "==", currentUser.dept),
        limit(50),
      );
    } else {
      // Yönetici ve diğer roller için kullanıcı bazlı bildirim sorgusu
      notifQuery = query(
        collection(db, "user_notifications"),
        where("userId", "==", currentUser.id),
        limit(50),
      );
    }

    const unsub = onSnapshot(
      notifQuery,
      (snapshot) => {
        const rawDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Kesin birim izolasyon filtresi
        const unitFiltered = rawDocs.filter((notif) => {
          if (!isSpecialAdminOrMod && currentUser.dept) {
            return isSameDept(notif.dept, currentUser.dept);
          }
          if (isSpecialAdminOrMod) {
            // Yöneticiler ve İSG uzmanları ASLA yeni ihlal (NEW_TASK) bildirimi görmez
            return notif.userId === currentUser.id && notif.type !== "NEW_TASK";
          }
          return notif.userId === currentUser.id;
        });

        unitFiltered.sort((a, b) => {
          const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (Number(a.timestamp) || 0);
          const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (Number(b.timestamp) || 0);
          return tB - tA;
        });

        setNotifHistoryData(unitFiltered);
        setUnreadNotifCount(unitFiltered.filter((n) => !n.read).length);
        setIsLoadingNotifs(false);
      },
      (err) => {
        console.error("Unit notif history query error:", err);
        setIsLoadingNotifs(false);
      },
    );

    return () => unsub();
  }, [currentUser?.id, currentUser?.role, currentUser?.dept, db]);

  const toggleNotifReadStatus = async (id, currentReadStatus, e) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, "user_notifications", id), {
        read: !currentReadStatus,
      });
    } catch (e) {
      console.error(e);
    }
  };
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      const addFeedbackPromise = addDoc(collection(db, "feedbacks"), {
        text: feedbackText,
        userId: currentUser?.id || "Bilinmiyor",
        userName: currentUser?.name || "Bilinmiyor",
        userRole: currentUser?.role || "Bilinmiyor",
        userDept: currentUser?.dept || "",
        timestamp: Date.now(),
        status: "new",
      });

      await Promise.race([
        addFeedbackPromise,
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Bağlantı zaman aşımı. İnternetinizi kontrol edin."),
              ),
            8000,
          ),
        ),
      ]);

      setShowFeedbackModal(false);
      setFeedbackText("");
      triggerHaptic("success");
      toast.success("Geri bildiriminiz için teşekkürler! Başarıyla iletildi.");
    } catch (error) {
      console.error("Feedback error", error);
      triggerHaptic("error");
      toast.error(
        `Gönderilirken bir hata oluştu: ${error.message || "Bağlantı sorunu olabilir."}`,
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const [debugTab, setDebugTab] = useState("users");
  const [notifLogs, setNotifLogs] = useState([]);

  // Tools State
  const [testDept, setTestDept] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleTestNotification = async () => {
    if (!testDept) return;
    const token = localStorage.getItem("isg_auth_token") || "";
    setIsTesting(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : `Bearer ${import.meta.env.VITE_FIREBASE_API_KEY}`
        },
        body: JSON.stringify({
          type: "TEST_NOTIFICATION",
          payload: { dept: testDept },
        }),
      });
      const data = await res.json();
      alert(
        `Test bildirimi gönderildi!\nBaşarılı: ${data.sentCount}\nHatalı: ${data.failureCount}`,
      );
    } catch (error) {
      console.error(error);
      alert("Test gönderilirken hata oluştu.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleTokenCleanup = async () => {
    if (
      !confirm(
        "Tüm kayıtlı token'ları test edip geçersiz olanları temizlemek istediğinize emin misiniz?",
      )
    )
      return;
    const token = localStorage.getItem("isg_auth_token") || "";
    setIsCleaning(true);
    try {
      const res = await fetch("/api/cleanup-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Temizlik tamamlandı!\n\nToplam Test Edilen: ${data.totalTested}\nSilinen Geçersiz Token: ${data.removedCount}`,
        );
      } else {
        alert("Temizlik işlemi sırasında hata: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Temizlik işlemi başlatılamadı.");
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    if (showDebug && debugTab === "logs") {
      const q = query(
        collection(db, "notification_logs"),
        orderBy("timestamp", "desc"),
        limit(50),
      );
      const unsub = onSnapshot(q, (snap) => {
        setNotifLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [showDebug, debugTab, db]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 w-full font-sans text-gray-900 dark:text-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="scale-75 origin-left w-full">
            <CompanyLogo
              className="bg-transparent shadow-none !p-0"
              theme={theme}
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 truncate">
            {currentUser.name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate mt-0.5">
            {roleText}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
            {t("main_menu") || "Ana Menü"}
          </div>

          {(currentUser.role === "admin" ||
            currentUser.role === "yonetici" ||
            currentUser.username === "agiradar" ||
            currentUser.username === "agiradarsahin") && (
            <button
              onClick={() => {
                navigate("/");
                setAdminSystemMode("home");
                setSelectedAdminDept(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-all ${
                adminSystemMode === "home"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
              <span>{t("executive_hub") || "Genel Bakış & Ana Menü"}</span>
            </button>
          )}

          {currentUser.role !== "yuklemeci" && (
            <button
              onClick={() => {
                navigate("/isg");
                setAdminSystemMode("isg");
                setAdminViewMode("calendar");
                setSelectedAdminDept(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-colors ${adminSystemMode === "isg" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <ShieldAlert className="w-5 h-5 mr-3 shrink-0" />
              <span>{t("isg_tab") || "İSG Takip"}</span>
            </button>
          )}

          {(currentUser.role === "admin" ||
            currentUser.role === "yonetici" ||
            currentUser.role === "yuklemeci" ||
            currentUser.username === "agiradar" ||
            currentUser.username === "agiradarsahin") && (
            <button
              onClick={() => {
                navigate("/yukleme");
                setAdminSystemMode("yukleme");
                setAdminViewMode("calendar");
                setSelectedAdminDept(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-colors ${adminSystemMode === "yukleme" ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <Truck className="w-5 h-5 mr-3 shrink-0" />
              <span>{t("yukleme_tab") || "Yükleme İşlemleri"}</span>
            </button>
          )}

          {(currentUser.role === "admin" ||
            currentUser.role === "yonetici" ||
            currentUser.username === "agiradar" ||
            currentUser.username === "agiradarsahin") && (
            <>
              <button
                onClick={() => {
                  navigate("/leaderboard");
                  setAdminSystemMode("leaderboard");
                  setAdminViewMode("leaderboard");
                  setSelectedAdminDept(null);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-colors ${adminSystemMode === "leaderboard" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <TrendingUp className="w-5 h-5 mr-3 shrink-0" />
                <span>{t("leaderboard") || "Liderlik Tablosu"}</span>
              </button>

              <button
                onClick={() => {
                  navigate("/analysis");
                  setAdminSystemMode("analysis");
                  setAdminViewMode("analysis");
                  setSelectedAdminDept(null);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-colors ${adminSystemMode === "analysis" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Activity className="w-5 h-5 mr-3 shrink-0" />
                <span>{t("analysis_tab") || "Analiz & Birimler"}</span>
              </button>
            </>
          )}

          {(currentUser.role === "admin" ||
            currentUser.username === "agiradar" ||
            currentUser.username === "agiradarsahin") && (
            <button
              onClick={() => {
                navigate("/users");
                setAdminSystemMode("users");
                setAdminViewMode("users");
                setSelectedAdminDept(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-colors ${adminSystemMode === "users" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <Users className="w-5 h-5 mr-3 shrink-0" />
              <span>{t("btn_users") || "Kullanıcı Hesapları"}</span>
            </button>
          )}

          {(currentUser.role === "admin" ||
            currentUser.username === "agiradar" ||
            currentUser.username === "agiradarsahin") && (
            <button
              onClick={() => {
                navigate("/feedbacks");
                setAdminSystemMode("feedbacks");
                setAdminViewMode("feedbacks");
                setSelectedAdminDept(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 font-bold rounded-xl transition-colors ${adminSystemMode === "feedbacks" ? "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <MessageSquare className="w-5 h-5 mr-3 shrink-0" />
              <span>{t("incoming_notifications") || "Gelen Bildirimler"}</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
          {(currentUser.username === "agiradar" ||
            currentUser.username === "agiradarsahin") && (
            <button
              onClick={() => setShowDebug(true)}
              className="w-full flex items-center px-3 py-2.5 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 font-bold rounded-xl transition-colors text-sm"
            >
              <Activity className="w-4 h-4 mr-3 shrink-0" /> {t("debug_console") || "Debug Konsolu"}
            </button>
          )}
          <button
            onClick={() => {
              setShowFeedbackModal(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center px-3 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 font-bold rounded-xl transition-colors text-sm"
          >
            <MessageSquare className="w-5 h-5 mr-3 shrink-0" /> {t("feedback_btn") || "Geri Bildirim & Hata Bildir"}
          </button>
          <button
            onClick={() => {
              setShowNotifHistoryModal(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center px-3 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 font-bold rounded-xl transition-colors text-sm mt-2"
          >
            <Bell className="w-5 h-5 mr-3 shrink-0" /> {t("notification_history") || "Bildirim Geçmişi"}
          </button>
          <div className="w-full p-1 bg-gray-100/90 dark:bg-gray-800/90 rounded-2xl flex items-center justify-between border border-gray-200/80 dark:border-gray-700/80 mt-1 mb-1">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 pl-2.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{t("language_label") || "Dil / Language"}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  if (lang !== "tr") setLang("tr");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  lang === "tr"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Türkçe"
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  if (lang !== "en") setLang("en");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="English"
              >
                EN
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              setDarkMode(!darkMode);
            }}
            className="w-full flex items-center px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-xl transition-colors text-sm"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 mr-3 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 mr-3 shrink-0" />
            )}
            {darkMode ? (t("light_theme") || "Açık Tema") : (t("dark_theme") || "Koyu Tema")}
          </button>
          {notificationStatus !== "unsupported" && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                if (notificationStatus === "denied") {
                  recheckNotificationPermission();
                  return;
                }
                const isCurrentlyActive =
                  notificationStatus === "granted" &&
                  localStorage.getItem("isg_notifications_disabled") !== "true" &&
                  localStorage.getItem("isg_notification_device_owner") === currentUser?.id;
                if (isCurrentlyActive) {
                  localStorage.setItem("isg_notifications_disabled", "true");
                  const token = localStorage.getItem("isg_device_fcm_token");
                  if (currentUser?.id && token) {
                    updateDoc(doc(db, "users", currentUser.id), {
                      fcmTokens: arrayRemove(token),
                    }).catch(() => {});
                  }
                  toast.success(
                    lang === "en"
                      ? "Notifications silenced for this device."
                      : "Bu cihaz için bildirimler kapatıldı / sessize alındı."
                  );
                } else {
                  localStorage.removeItem("isg_notifications_disabled");
                  requestNotificationPermission();
                }
              }}
              className={`w-full flex items-center px-3 py-2.5 font-medium rounded-xl transition-colors text-sm ${
                notificationStatus === "denied"
                  ? "text-red-600 bg-red-50/80 dark:bg-red-950/40 border border-red-300 dark:border-red-800/60 dark:text-red-400"
                  : notificationStatus === "granted" &&
                    localStorage.getItem("isg_notifications_disabled") !== "true" &&
                    localStorage.getItem("isg_notification_device_owner") === currentUser?.id
                  ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  : "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
              }`}
            >
              {notificationStatus === "denied" ? (
                <>
                  <BellOff className="w-5 h-5 mr-3 shrink-0 text-red-600 dark:text-red-400 animate-pulse" />
                  <span className="truncate">{t("notifications_blocked") || "Bildirimler Engelli"}</span>
                  <span className="ml-auto text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold">
                    Pasif
                  </span>
                </>
              ) : notificationStatus === "granted" &&
              localStorage.getItem("isg_notifications_disabled") !== "true" &&
              localStorage.getItem("isg_notification_device_owner") === currentUser?.id ? (
                <>
                  <Bell className="w-5 h-5 mr-3 shrink-0 text-green-600 dark:text-green-400" />
                  <span>{t("notifications_on") || "Bildirimler Açık"}</span>
                  <span className="ml-auto text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">
                    Açık
                  </span>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5 mr-3 shrink-0 text-orange-500" />
                  <span>{t("notifications_enable") || "Bildirimleri Aç"}</span>
                  <span className="ml-auto text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">
                    Kapalı
                  </span>
                </>
              )}
            </button>
          )}
          <div className="mt-2 w-full">
            <PWAInstallButton />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 font-bold rounded-xl transition-colors mt-2 text-sm"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" /> {t("logout_btn") || t("logout") || "Çıkış Yap"}
          </button>
          <div className="pt-2 text-center">
            <span className="text-[10px] italic font-light text-gray-400/40 dark:text-gray-500/40 select-none tracking-widest">
              by Gelkobilisim
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (Glassmorphic) */}
        <header className="lg:hidden glass-header border-b border-gray-200/80 dark:border-gray-800/80 px-4 py-2.5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="scale-75 origin-left">
              <CompanyLogo
                className="bg-transparent shadow-none !p-0"
                theme={theme}
              />
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleLang}
              className="p-1.5 px-2 text-xs font-black text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1 border border-gray-200/60 dark:border-gray-700/60"
              title={lang === "tr" ? "Switch interface to English" : "Arayüzü Türkçe'ye çevir"}
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>{lang === "tr" ? "EN" : "TR"}</span>
            </button>
            <button
              onClick={toggleSoundAlerts}
              className={`p-2 rounded-lg transition-colors ${
                soundAlerts
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={soundAlerts ? (t("sound_alerts_on") || "Sesli Uyarılar: Açık") : (t("sound_alerts_off") || "Sesli Uyarılar: Kapalı")}
            >
              {soundAlerts ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setDarkMode(!darkMode);
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={t("change_theme") || "Tema"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              onClick={logout}
              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Header (Glassmorphic) */}
        <header className="hidden lg:flex glass-header border-b border-gray-200/80 dark:border-gray-800/80 px-6 py-2.5 items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                adminSystemMode === "yukleme"
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  adminSystemMode === "yukleme" ? "bg-orange-500" : "bg-blue-500"
                }`}
              ></span>
              {adminSystemMode === "yukleme"
                ? (t("yukleme_module_badge") || "Sevkiyat & Lojistik Modülü")
                : (t("isg_portal_badge") || "İSG & Kalite Portalı")}
            </span>
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("factory_header_sub") || "ADS Metal A.Ş. — Anadolu OSB"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer shadow-2xs"
              title={lang === "tr" ? "Switch interface to English" : "Arayüzü Türkçe'ye çevir"}
            >
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-extrabold">{lang === "tr" ? "English" : "Türkçe"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono font-bold">
                {lang === "tr" ? "EN" : "TR"}
              </span>
            </button>
            <div className="flex items-center gap-2 bg-gray-100/70 dark:bg-gray-800/70 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
              <span className="font-bold text-gray-800 dark:text-gray-100 truncate pb-0.5 max-w-[160px]">
                {currentUser?.name || t("user") || "Kullanıcı"}
              </span>
              <span className="text-[10px] text-gray-400 shrink-0">({roleText})</span>
            </div>
            <button
              onClick={toggleSoundAlerts}
              className={`p-2 rounded-xl transition-colors ${
                soundAlerts
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={
                soundAlerts
                  ? (t("sound_alerts_on") || "Sesli Uyarılar: Açık (Test sesi için tıklayın)")
                  : (t("sound_alerts_off") || "Sesli Uyarılar: Kapalı")
              }
            >
              {soundAlerts ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setDarkMode(!darkMode);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t("change_theme") || "Tema Değiştir"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full relative min-w-0 overflow-x-hidden flex flex-col justify-between">
          <div className="flex-1 w-full flex flex-col">
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              <NotificationStatusBanner
                notificationStatus={notificationStatus}
                isNotificationsDisabled={localStorage.getItem("isg_notifications_disabled") === "true"}
                currentUser={currentUser}
                onRecheckPermission={recheckNotificationPermission}
                onEnableNotifications={() => {
                  triggerHaptic("medium");
                  localStorage.removeItem("isg_notifications_disabled");
                  if (notificationStatus === "granted") {
                    if (currentUser && verifyAndSyncToken) {
                      verifyAndSyncToken(currentUser, true);
                    }
                    toast.success(
                      lang === "en"
                        ? "✅ Notifications activated for this device."
                        : "✅ Bildirimler bu cihaz için aktifleştirildi."
                    );
                  } else {
                    requestNotificationPermission();
                  }
                }}
                lang={lang}
                t={t}
              />
            </div>
            {children}
          </div>
          <footer className="w-full py-4 text-center shrink-0">
            <span className="text-xs italic font-light text-gray-400/40 dark:text-gray-500/40 select-none tracking-widest transition-opacity hover:opacity-80">
              by Gelkobilisim
            </span>
          </footer>
        </main>

        {showDebug && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">
              <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center min-w-0">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600 shrink-0" />
                  <span className="truncate">Geliştirici Konsolu (Debug)</span>
                </h3>
                <button
                  onClick={() => setShowDebug(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 dark:border-gray-700 mb-3 sm:mb-4 pb-2 overflow-x-auto hide-scrollbar shrink-0">
                <button
                  onClick={() => setDebugTab("users")}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${debugTab === "users" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  {t("debug_users") || "Kullanıcılar & Tokenlar"}
                </button>
                <button
                  onClick={() => setDebugTab("logs")}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center whitespace-nowrap ${debugTab === "logs" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 shrink-0" /> {t("debug_logs") || "Gönderim Hataları (Log)"}
                </button>
                <button
                  onClick={() => setDebugTab("tools")}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center whitespace-nowrap ${debugTab === "tools" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 shrink-0" /> {t("debug_tools") || "Test & Bakım"}
                </button>
              </div>

              <div className="overflow-y-auto pr-1 sm:pr-2 flex-1 min-h-0">
                {debugTab === "tools" ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center text-sm sm:text-base">
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 shrink-0" />
                        {t("debug_test_title") || "Birim Test Bildirimi"}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                        {t("debug_test_desc") || "Seçtiğiniz departmandaki şeflere anlık bir test bildirimi göndererek cihazlarının açık/aktif olup olmadığını test edebilirsiniz."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <select
                          className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={testDept}
                          onChange={(e) => setTestDept(e.target.value)}
                        >
                          <option value="">{t("debug_select_dept") || "Departman Seçin..."}</option>
                          <option value="all">{t("debug_all_depts") || "Tüm Departmanlar (Herkes)"}</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {t(getDeptKey(d)) || d}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playNotificationSound("chime");
                              triggerHaptic("success");
                            }}
                            title={lang === "en" ? "Play Notification Chime" : "Bildirim Zil Sesini Çal"}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs sm:text-sm shrink-0"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>{t("debug_test_sound") || "Sesi Test Et"}</span>
                          </button>
                          <button
                            onClick={handleTestNotification}
                            disabled={!testDept || isTesting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm text-xs sm:text-sm shrink-0"
                          >
                            {isTesting ? (t("debug_sending") || "Gönderiliyor...") : (t("debug_send") || "Gönder")}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center text-sm sm:text-base">
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500 shrink-0" />
                        {t("debug_cleanup_title") || "Ölü Token Temizliği"}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                        {t("debug_cleanup_desc") || "Uygulamayı silmiş veya bildirim iznini iptal etmiş kullanıcıların geçersiz token'larını test edip veritabanından siler. Bu işlem, hatalı gönderim loglarını azaltır."}
                      </p>
                      <button
                        onClick={handleTokenCleanup}
                        disabled={isCleaning}
                        className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-bold py-2.5 px-4 rounded-lg w-full flex justify-center items-center transition-colors border border-red-200 dark:border-red-800 text-xs sm:text-sm"
                      >
                        {isCleaning
                          ? (t("debug_cleaning") || "Temizleniyor...")
                          : (t("debug_cleanup_btn") || "Kayıtsız Cihazları (Ölü Token) Temizle")}
                      </button>
                    </div>
                  </div>
                ) : debugTab === "users" ? (
                  <>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-xl border border-purple-100 dark:border-purple-800 mb-3 sm:mb-4 text-xs sm:text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                      {t("debug_users_banner") || "Bu ekran, rapor atıldığında kimlere bildirim gideceğini anlamanız içindir. Bir şefe bildirim gitmesi için hem Departman eşleşmesi gereklidir hem de o cihazın Geçerli Bir Token'ı (Yeşil Işık) olmalıdır."}
                    </div>

                    {(() => {
                      const total = users.length;
                      const hasUserToken = (u) =>
                        (Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0) || !!u.fcmToken;
                      const active = users.filter(hasUserToken).length;
                      const totalDeviceTokens = users.reduce((acc, u) => {
                        if (Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0) {
                          return acc + u.fcmTokens.length;
                        }
                        return acc + (u.fcmToken ? 1 : 0);
                      }, 0);
                      const ratio =
                        total > 0 ? Math.round((active / total) * 100) : 0;
                      return (
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-3 sm:mb-4">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl flex flex-col items-center justify-center shadow-sm text-center">
                            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight truncate w-full">
                              {t("debug_accounts") || "Hesaplar"}
                            </span>
                            <span className="text-base sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                              {total}
                            </span>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2 sm:p-4 rounded-xl flex flex-col items-center justify-center shadow-sm text-center">
                            <span className="text-[10px] sm:text-xs md:text-sm text-green-600 dark:text-green-400 font-medium leading-tight truncate w-full">
                              {t("debug_active_users") || "Aktif Kullanıcı / Cihaz"}
                            </span>
                            <span className="text-base sm:text-2xl font-bold text-green-700 dark:text-green-300 mt-0.5">
                              {active} <span className="text-xs font-normal text-green-600">({totalDeviceTokens} {t("debug_devices") || "Cihaz"})</span>
                            </span>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 sm:p-4 rounded-xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden text-center">
                            <div
                              className="absolute inset-y-0 left-0 bg-blue-200 dark:bg-blue-900/50 transition-all duration-1000"
                              style={{ width: `${ratio}%` }}
                            ></div>
                            <span className="text-[10px] sm:text-xs md:text-sm text-blue-700 dark:text-blue-300 font-medium leading-tight relative z-10 drop-shadow-sm truncate w-full">
                              {t("debug_reg_ratio") || "Kayıt Oranı"}
                            </span>
                            <span className="text-base sm:text-2xl font-bold text-blue-800 dark:text-blue-200 relative z-10 drop-shadow-sm mt-0.5">
                              %{ratio}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2 sm:space-y-3">
                      {users.map((u) => {
                        const deviceCount = Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0
                          ? u.fcmTokens.length
                          : u.fcmToken ? 1 : 0;
                        return (
                        <div
                          key={u.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2.5 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm flex flex-wrap items-center gap-1">
                              <span>{u.name}</span>
                              <span className="text-[11px] font-normal text-gray-500 break-all">
                                (@{u.username})
                              </span>
                            </div>
                            <div className="text-xs mt-1.5 text-gray-600 dark:text-gray-400 flex flex-wrap gap-1 sm:gap-1.5 items-center">
                              <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium">
                                {t("debug_role") || "Rol"}: {u.role}
                              </span>
                              {u.dept && (
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium">
                                  {t("debug_unit") || "Birim"}: {t(getDeptKey(u.dept)) || u.dept}
                                </span>
                              )}
                              {u.lastPing && (
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium flex items-center">
                                  <Activity className="w-3 h-3 mr-1 shrink-0" />
                                  <span>
                                    {t("debug_last_ping") || "Son Ping"}:{" "}
                                    {u.lastPing?.toDate
                                      ? u.lastPing.toDate().toLocaleString(lang === "en" ? "en-US" : "tr-TR")
                                      : new Date(u.lastPing).toLocaleString(lang === "en" ? "en-US" : "tr-TR")}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center shrink-0 self-start sm:self-center">
                            {deviceCount > 0 ? (
                              <div className="flex items-center text-green-600 dark:text-green-400 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                                <span>{t("debug_token_active") || "Token Var"} {deviceCount > 1 ? `(${deviceCount} ${t("debug_devices") || "Cihaz"})` : ""}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-500 font-bold text-xs bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                                <XCircle className="w-3.5 h-3.5 mr-1 shrink-0" /> {t("debug_token_none") || "Cihaz Kayıtlı Değil"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {notifLogs.length === 0 ? (
                      <div className="text-center text-gray-500 p-8 border border-dashed rounded-xl border-gray-300 dark:border-gray-700 text-xs sm:text-sm">
                        {lang === "en" ? "No notification logs found." : "Kayıtlı log bulunamadı."}
                      </div>
                    ) : (
                      notifLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 gap-1">
                            <div className="font-bold flex items-center text-xs sm:text-sm text-gray-800 dark:text-gray-100 min-w-0">
                              {log.failureCount > 0 ? (
                                <AlertTriangle className="w-4 h-4 text-orange-500 mr-1.5 shrink-0" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500 mr-1.5 shrink-0" />
                              )}
                              <span className="truncate">{log.title}</span>
                            </div>
                            <div className="text-[11px] sm:text-xs text-gray-500 shrink-0">
                              {log.timestamp?.toDate
                                ? log.timestamp.toDate().toLocaleString(lang === "en" ? "en-US" : "tr-TR")
                                : ""}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium mb-2 sm:mb-3">
                            <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {lang === "en" ? "Target" : "Hedef"}: {t(getDeptKey(log.dept)) || log.dept}
                            </span>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                              {lang === "en" ? "Devices Found" : "Bulunan Cihaz"}: {log.targetCount}
                            </span>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded">
                              {lang === "en" ? "Success" : "Başarılı"}: {log.successCount}
                            </span>
                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded">
                              {lang === "en" ? "Failed" : "Hatalı"}: {log.failureCount}
                            </span>
                          </div>
                          {log.failureCount > 0 &&
                            log.failedDetails &&
                            log.failedDetails.length > 0 && (
                              <div className="bg-red-50 dark:bg-red-900/20 p-2.5 sm:p-3 rounded-lg border border-red-100 dark:border-red-800 text-[11px] text-red-800 dark:text-red-300 font-mono break-all">
                                {log.failedDetails.map((f, i) => (
                                  <div
                                    key={i}
                                    className="mb-1 border-b border-red-100 dark:border-red-900/50 pb-1 last:border-0 last:pb-0 last:mb-0"
                                  >
                                    <span className="font-bold">{lang === "en" ? "Error:" : "Hata:"}</span>{" "}
                                    {f.error} <br />
                                    <span className="text-[10px] opacity-75">
                                      Token: {f.token?.substring(0, 20)}...
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showNotifHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
              <div className="p-5 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                <h3 className="font-bold text-xl flex items-center">
                  <Bell className="w-6 h-6 mr-3" /> {t("notification_history") || "Bildirim Geçmişi"}
                </h3>
                <button
                  onClick={() => setShowNotifHistoryModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
                {isLoadingNotifs ? (
                  <div className="flex justify-center p-8">
                    <LoadingSpinner />
                  </div>
                ) : notifHistoryData.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    {t("no_notifications_yet") || "Henüz hiç bildiriminiz yok."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-center text-gray-400 dark:text-gray-500 mb-2">
                      {t("swipe_to_delete") || "Silmek için sağa veya sola kaydırın"}
                    </div>
                    <AnimatePresence mode="popLayout">
                      {notifHistoryData.map((notif) => (
                        <motion.div
                          key={notif.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.9,
                            transition: { duration: 0.2 },
                          }}
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.8}
                          onDragEnd={async (event, info) => {
                            if (info.offset.x > 100 || info.offset.x < -100) {
                              try {
                                await deleteDoc(
                                  doc(db, "user_notifications", notif.id),
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          onClick={(e) =>
                            toggleNotifReadStatus(notif.id, notif.read, e)
                          }
                          className={`p-4 rounded-2xl border transition-colors cursor-pointer shadow-sm group ${notif.read ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50"}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-start">
                              <button
                                onClick={(e) =>
                                  toggleNotifReadStatus(notif.id, notif.read, e)
                                }
                                className={`mr-3 mt-0.5 flex-shrink-0 transition-colors ${notif.read ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" : "text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"}`}
                                title={
                                  notif.read
                                    ? (t("mark_unread") || "Okunmadı olarak işaretle")
                                    : (t("mark_read") || "Okundu olarak işaretle")
                                }
                              >
                                {notif.read ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 shadow-sm border border-indigo-200 dark:border-indigo-800 animate-pulse"></div>
                                )}
                              </button>
                              <h4
                                className={`font-bold ${notif.read ? "text-gray-700 dark:text-gray-300" : "text-indigo-800 dark:text-indigo-300"}`}
                              >
                                {notif.title}
                              </h4>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 ml-3 mt-1 whitespace-nowrap">
                              {notif.timestamp?.toDate
                                ? notif.timestamp
                                    .toDate()
                                    .toLocaleString(lang === "en" ? "en-US" : "tr-TR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "numeric",
                                      month: "short",
                                    })
                                : (t("just_now") || "Şimdi")}
                            </span>
                          </div>
                          <p
                            className={`text-sm ml-8 ${notif.read ? "text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-200 font-medium"} leading-relaxed`}
                          >
                            {notif.body}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                <h3 className="font-bold text-xl flex items-center">
                  <Bug className="w-6 h-6 mr-3" /> {t("feedback_modal_title") || "Sorun Bildir / Geri Bildirim"}
                </h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form
                onSubmit={handleFeedbackSubmit}
                className="p-6 md:p-8 space-y-6"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                    {t("feedback_modal_prompt") || "Karşılaştığınız sorunu veya önerinizi yazın:"}
                  </label>
                  <textarea
                    required
                    rows="5"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                    placeholder={t("feedback_modal_placeholder") || "Uygulamada bir hata mı aldınız veya bir öneriniz mi var? Buraya detaylıca yazabilirsiniz..."}
                  ></textarea>
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 py-4 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="flex-1 py-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmittingFeedback ? (t("feedback_sending") || "Gönderiliyor...") : (t("debug_send") || "Gönder")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const YuklemeciDashboard = () => {
  const ctx = useAppContext();

  const {
    currentUser,
    setCurrentUser,
    isFirebaseLoading,
    setIsFirebaseLoading,
    lang,
    setLang,
    darkMode,
    setDarkMode,
    users,
    setUsers,
    points,
    setPoints,
    pointsHistory,
    setPointsHistory,
    tasks,
    setTasks,
    loadings,
    setLoadings,
    adminSystemMode,
    setAdminSystemMode,
    adminViewMode,
    setAdminViewMode,
    selectedAdminDept,
    setSelectedAdminDept,
    selectedAdminDate,
    setSelectedAdminDate,
    selectedYuklemeDate,
    setSelectedYuklemeDate,
    previewModalImg,
    setPreviewModalImg,
    previewModalTitle,
    setPreviewModalTitle,
    t,
    toggleLang,
    getLastFridayOfCurrentMonth,
    logout,
    createTask,
    updateTaskStatus,
    createLoading,
    startLoadingProcess,
    finishLoading,
    get24HourTonnage,
    db,
    notificationStatus,
    requestNotificationPermission,
    showPdfReportModal,
    setShowPdfReportModal,
  } = ctx;

  const [isCreating, setIsCreating] = useState(false);
  const [formState, setFormState] = useState({
    plaka: "",
    sofor: "",
    destCountry: "Türkiye",
    destLocation: "",
    destCompany: "",
    projectNo: "",
    tonnage: "",
    not: "",
  });
  const [imgPreview, setImgPreview] = useState(null);
  const [finishModal, setFinishModal] = useState({
    isOpen: false,
    loadId: null,
    note: "",
    imgPreview: null,
  });

  const activeLoadings = useMemo(
    () =>
      loadings.filter(
        (l) => l.status === "beklemede" || l.status === "yukleniyor",
      ),
    [loadings],
  );
  const tonnage24h = get24HourTonnage();

  const handleStartLoading = (e) => {
    e.preventDefault();
    if (!imgPreview) {
      toast.error(t("err_photo_required") || "Lütfen araç/yük fotoğrafını çekin veya yükleyin! Fotoğraf zorunludur.");
      triggerHaptic("error");
      return;
    }
    createLoading(
      formState.plaka,
      formState.sofor,
      formState.destCountry,
      formState.destLocation,
      formState.destCompany,
      formState.projectNo,
      formState.tonnage,
      formState.not,
      imgPreview,
    );
    setFormState({
      plaka: "",
      sofor: "",
      destCountry: "Türkiye",
      destLocation: "",
      destCompany: "",
      projectNo: "",
      tonnage: "",
      not: "",
    });
    setImgPreview(null);
    setIsCreating(false);
  };

  const handleFinishLoading = () => {
    if (!finishModal.imgPreview) {
      toast.error(t("err_photo_required") || "Lütfen yükleme tamamlama/bağlama fotoğrafı yükleyin! Fotoğraf zorunludur.");
      triggerHaptic("error");
      return;
    }
    finishLoading(finishModal.loadId, finishModal.note, finishModal.imgPreview);
    setFinishModal({ isOpen: false, loadId: null, note: "", imgPreview: null });
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-orange-50/30 dark:bg-transparent">
      <div className="bg-gradient-to-r from-orange-600 to-amber-700 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden mb-8 gap-4">
        <div className="z-10">
          <h1 className="text-3xl font-extrabold mb-2 flex items-center">
            <Truck className="w-8 h-8 mr-3" /> {t("yuk_title")}
          </h1>
          <p className="text-orange-100 font-medium">{t("yuk_desc")}</p>
        </div>
        <div className="z-10 flex flex-wrap items-center gap-3">
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center space-x-3">
            <div className="bg-white/10 dark:bg-white/15 p-2 rounded-xl">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-orange-200 tracking-wider">
                {t("tonnage_24h")}
              </p>
              <p className="text-2xl font-extrabold text-white flex items-baseline">
                <CountUp end={tonnage24h} decimals={1} />
                <span className="text-sm font-medium ml-1">
                  {t("unit_ton") || "Ton"}
                </span>
              </p>
            </div>
          </div>
        </div>
        <Package className="w-48 h-48 text-white opacity-10 absolute right-0 -bottom-10 z-0 transform -rotate-12 pointer-events-none" />
      </div>

      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full bg-white dark:bg-gray-800 border-2 border-dashed border-orange-300 dark:border-orange-500/40 hover:border-orange-500 dark:hover:border-orange-400 text-orange-700 dark:text-orange-400 py-6 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all flex justify-center items-center space-x-3 mb-8 group cursor-pointer"
        >
          <div className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 p-2 rounded-full group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-lg">{t("new_load_btn")}</span>
        </button>
      )}

      {isCreating && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-orange-100 dark:border-gray-700 mb-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center">
              <Truck className="w-6 h-6 mr-2 text-orange-500" />{" "}
              {t("load_form_title")}
            </h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setImgPreview(null);
                setFormState({
                  plaka: "",
                  sofor: "",
                  destCountry: "Türkiye",
                  destLocation: "",
                  destCompany: "",
                  projectNo: "",
                  tonnage: "",
                  not: "",
                });
              }}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleStartLoading} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("plate_no")}
                </label>
                <input
                  required
                  type="text"
                  value={formState.plaka}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      plaka: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("driver_name")}
                </label>
                <input
                  type="text"
                  value={formState.sofor}
                  onChange={(e) =>
                    setFormState({ ...formState, sofor: e.target.value })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("dest_country")}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <select
                    required
                    value={formState.destCountry}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        destCountry: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {getCountryName(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("dest_location")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    required
                    type="text"
                    value={formState.destLocation}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        destLocation: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
                    placeholder={t("ph_dest_loc") || "Örn: İstanbul / Dilovası"}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("dest_company")}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    required
                    type="text"
                    value={formState.destCompany}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        destCompany: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
                    placeholder={t("ph_dest_comp") || "Örn: ABB Trafo A.Ş."}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("project_no")}
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    required
                    type="text"
                    value={formState.projectNo}
                    onChange={(e) =>
                      setFormState({ ...formState, projectNo: e.target.value })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
                    placeholder={t("ph_proj_no") || "Örn: PRJ-2026-88"}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("tonnage")}
                </label>
                <div className="relative">
                  <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    required
                    type="number"
                    step="any"
                    value={formState.tonnage}
                    onChange={(e) =>
                      setFormState({ ...formState, tonnage: e.target.value })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3.5 py-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700 dark:text-orange-400"
                    placeholder={t("ph_tonnage") || "Örn: 24.5 (Ton)"}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center justify-between">
                <span>{t("cam_pre")}</span>
                <span className="text-xs font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                  Zorunlu Alan *
                </span>
              </label>
              <input
                type="file"
                id="preLoadCamera"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleImageUpload(e.target.files[0], setImgPreview);
                  e.target.value = null;
                }}
              />
              <label
                htmlFor="preLoadCamera"
                className={`w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed ${
                  imgPreview
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-red-300 dark:border-red-700/60 hover:border-orange-500"
                } rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-all group overflow-hidden`}
              >
                {imgPreview ? (
                  <div className="relative w-full h-full">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={imgPreview}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Fotoğraf Yüklendi
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t("cam_open")}</span>
                    <span className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">
                      {t("required_photo") || "Fotoğraf yüklemek zorunludur *"}
                    </span>
                  </>
                )}
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                {t("note_pre")}
              </label>
              <input
                type="text"
                value={formState.not}
                onChange={(e) =>
                  setFormState({ ...formState, not: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg"
            >
              {t("start_load_btn")}
            </button>
          </form>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" />{" "}
          {t("active_loads")} ({activeLoadings.length})
        </h2>
      </div>

      {activeLoadings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl text-center border border-gray-100 dark:border-gray-700 shadow-sm">
          <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
          <p className="font-bold text-xl text-gray-800 dark:text-gray-100">
            {t("no_active_loads")}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            {t("no_active_desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeLoadings.map((load) => (
            <div
              key={load.id}
              className={`bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col card-interactive status-rail ${
                load.status === "yukleniyor"
                  ? "status-rail-emerald"
                  : "status-rail-amber"
              }`}
            >
              <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  {/* Embossed Turkish Plate */}
                  <div className="shrink-0 flex items-center bg-gray-950 text-white rounded-xl border border-gray-900 dark:border-gray-600 shadow-xs overflow-hidden font-mono text-xs">
                    <div className="bg-blue-600 px-1.5 py-1.5 text-white font-extrabold text-[9px] flex items-center justify-center border-r border-blue-700 shrink-0 select-none">
                      TR
                    </div>
                    <span className="px-2.5 py-1 bg-white text-gray-950 dark:bg-gray-900 dark:text-white font-black tracking-wider uppercase whitespace-nowrap">
                      {load.plaka}
                    </span>
                  </div>

                  <div>
                    {load.status === "yukleniyor" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        Yükleniyor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        Beklemede
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    {t("entry_time")}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {load.createdAtTime}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col space-y-3">
                {load.sofor && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                    <span>{t("driver")}:</span>
                    <span className="text-gray-800 dark:text-gray-100 font-bold">
                      {load.sofor}
                    </span>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-orange-50/60 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">
                      {t("dest_country")}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {getCountryName(load.destCountry, lang) || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">
                      {t("dest_location")}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {load.destLocation || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">
                      {t("dest_company")}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {load.destCompany || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 font-bold block text-[10px]">
                      {t("tonnage")}
                    </span>
                    <span className="font-extrabold text-orange-700 dark:text-orange-400">
                      {load.tonnage ? `${load.tonnage} ${t("tonnage_unit") || "Ton"}` : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mt-auto">
                  <div
                    className="w-16 h-16 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 shrink-0 overflow-hidden relative group cursor-pointer"
                    onClick={() =>
                      load.preImgUrl && setPreviewModalImg(load.preImgUrl)
                    }
                  >
                    {load.preImgUrl ? (
                      <>
                        <img
                          loading="lazy"
                          decoding="async"
                          src={load.preImgUrl}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 mb-1" />
                        <span className="text-[8px] font-bold">
                          {t("no_photo")}
                        </span>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1 uppercase tracking-wider">
                      {t("pre_note_title")}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                      {load.preNote || t("no_note")}
                    </p>
                  </div>
                </div>
                {load.status === "beklemede" ? (
                  <button
                    onClick={() => startLoadingProcess(load.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center mt-2 transition-colors"
                  >
                    <Truck className="w-5 h-5 mr-2" /> {t("start_loading")}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setFinishModal({
                        isOpen: true,
                        loadId: load.id,
                        note: "",
                        imgPreview: null,
                      })
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center mt-2 transition-colors"
                  >
                    <CheckSquare className="w-5 h-5 mr-2" />{" "}
                    {t("finish_load_btn")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {finishModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 max-sm:p-0 max-sm:items-end">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl max-sm:rounded-b-none max-sm:rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">
            <div className="p-6 bg-green-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center">
                <Save className="w-6 h-6 mr-3" /> {t("finish_form_title")}
              </h3>
              <button
                onClick={() =>
                  setFinishModal({
                    isOpen: false,
                    loadId: null,
                    note: "",
                    imgPreview: null,
                  })
                }
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center justify-between">
                  <span>{t("cam_post")}</span>
                  <span className="text-xs font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                    Zorunlu Alan *
                  </span>
                </label>
                <input
                  type="file"
                  id="postLoadCamera"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    handleImageUpload(e.target.files[0], (img) =>
                      setFinishModal({ ...finishModal, imgPreview: img }),
                    );
                    e.target.value = null;
                  }}
                />
                <label
                  htmlFor="postLoadCamera"
                  className={`w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed ${
                    finishModal.imgPreview
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-red-300 dark:border-red-700/60 hover:border-green-500"
                  } rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-all group overflow-hidden`}
                >
                  {finishModal.imgPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={finishModal.imgPreview}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Fotoğraf Yüklendi
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t("cam_open")}</span>
                      <span className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">
                        {t("required_photo") || "Fotoğraf yüklemek zorunludur *"}
                      </span>
                    </>
                  )}
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("note_post")}
                </label>
                <input
                  type="text"
                  value={finishModal.note}
                  onChange={(e) =>
                    setFinishModal({ ...finishModal, note: e.target.value })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() =>
                    setFinishModal({
                      isOpen: false,
                      loadId: null,
                      note: "",
                      imgPreview: null,
                    })
                  }
                  className="flex-1 py-4 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleFinishLoading}
                  className="flex-1 py-4 font-bold text-white bg-green-600 rounded-xl shadow-lg"
                >
                  {t("close_job")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const YukleniciDashboard = () => {
  const ctx = useAppContext();
  const { t, createTask, lang = "tr" } = ctx || {};

  const [imgPreview, setImgPreview] = React.useState(null);
  const [formState, setFormState] = React.useState({
    dept: "Boyahane",
    priority: "yuksek",
    subject: "",
    desc: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.subject.trim()) {
      triggerHaptic("error");
      toast.error(t("err_fill_all") || "Lütfen gerekli alanları doldurun.");
      return;
    }
    createTask(
      formState.dept,
      formState.priority,
      formState.subject,
      formState.desc,
      24,
      imgPreview,
    );
    setFormState({
      dept: "Boyahane",
      priority: "yuksek",
      subject: "",
      desc: "",
    });
    setImgPreview(null);
    triggerHaptic("success");
    toast.success(t("success_created") || "İhlal kaydı oluşturuldu.");
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-extrabold mb-8 flex items-center text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-4">
          <ShieldAlert className="w-8 h-8 mr-3 text-red-500" />{" "}
          {t("create_violation") || "İhlal Kaydı Oluştur"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                {t("department") || "İlgili Birim"}
              </label>
              <select
                required
                value={formState.dept}
                onChange={(e) =>
                  setFormState({ ...formState, dept: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 dark:text-gray-100"
              >
                <option value="Boyahane">
                  {t("dept_boyahane") || "Boyahane"}
                </option>
                <option value="Altyapı">
                  {t("dept_altyapi") || "Altyapı"}
                </option>
                <option value="Dalgaduvar">
                  {t("dept_dalgaduvar") || "Dalgaduvar"}
                </option>
                <option value="Lazer">{t("dept_lazer") || "Lazer"}</option>
                <option value="Güç">{t("dept_guc") || "Güç"}</option>
                <option value="Kaynaklı imalat">
                  {t("dept_kaynakli") || "Kaynaklı imalat"}
                </option>
                <option value="Dış alan">{t("dept_dis") || "Dış alan"}</option>
                <option value="Bakım & Onarım">
                  {t("dept_bakim") || "Bakım & Onarım"}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                {t("priority") || "Öncelik Seviyesi"}
              </label>
              <select
                required
                value={formState.priority}
                onChange={(e) =>
                  setFormState({ ...formState, priority: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 dark:text-gray-100"
              >
                <option value="yuksek">{t("high") || "Yüksek"}</option>
                <option value="orta">{t("medium") || "Orta"}</option>
                <option value="dusuk">{t("low") || "Düşük"}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
              {t("subject") || "Konu"}
            </label>
            <input
              required
              type="text"
              value={formState.subject}
              onChange={(e) =>
                setFormState({ ...formState, subject: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100"
              placeholder={
                t("ph_subject") || "İhlal konusu (Örn: KKD Kullanımı)"
              }
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
              {t("description") || "Açıklama / İhlal Detayı"}
            </label>
            <textarea
              required
              rows="4"
              value={formState.desc}
              onChange={(e) =>
                setFormState({ ...formState, desc: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 dark:text-gray-100"
              placeholder={t("ph_desc") || "İhlal detayı..."}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
              {t("photo_evidence") || "Fotoğraf (İsteğe Bağlı)"}
            </label>
            <input
              type="file"
              id="yukleniciCameraInput"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImgPreview(reader.result);
                  reader.readAsDataURL(file);
                }
                e.target.value = null;
              }}
            />
            <label
              htmlFor="yukleniciCameraInput"
              className="w-full h-32 md:h-48 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden"
            >
              {imgPreview ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={imgPreview}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm mb-3 group-hover:scale-110">
                    <Camera className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {t("cam_open") || "Kamerayı Aç / Fotoğraf Seç"}
                  </span>
                </>
              )}
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-all text-lg flex items-center justify-center group"
          >
            <Upload className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
            {t("submit_btn") || "İhlali Bildir"}
          </button>
        </form>
      </div>
    </div>
  );
};
const ModDashboard = () => {
  const ctx = useAppContext();
  const {
    t,
    tasks = [],
    createTask,
    updateTaskStatus,
    lang = "tr",
    currentUser,
    setPreviewModalImg,
    setPreviewModalTitle,
    DEPARTMENTS: ctxDepts,
    getDeptKey: ctxGetDeptKey,
  } = ctx || {};

  const deptsList = ctxDepts || [
    "Boyahane",
    "Kaynaklı imalat",
    "Lazer",
    "Altyapı",
    "Güç",
    "KAYNAKHANE",
  ];
  const getDeptTranslation = (dept) => {
    if (ctxGetDeptKey && t) {
      return t(ctxGetDeptKey(dept)) || dept;
    }
    return dept;
  };

  // Tabs: 'create' (Yeni İhlal), 'review' (Onay Bekleyenler), 'tasks' (Saha İhlal Takibi)
  const [activeTab, setActiveTab] = React.useState("create");

  // Action Modal for Approving / Rejecting Reviews
  const [actionModal, setActionModal] = React.useState({
    isOpen: false,
    taskId: null,
    action: null,
    task: null,
  });
  const [modNote, setModNote] = React.useState("");

  // Create Form State
  const [imgPreview, setImgPreview] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formState, setFormState] = React.useState({
    dept: deptsList[0] || "Boyahane",
    priority: "yuksek",
    subject: "",
    desc: "",
    deadlineHours: 24,
  });
  const [isCustomDeadline, setIsCustomDeadline] = React.useState(false);

  // Review Tab Filter & Search
  const [reviewSearch, setReviewSearch] = React.useState("");
  const [reviewTypeFilter, setReviewTypeFilter] = React.useState("all"); // 'all' | 'onay_bekliyor' | 'itiraz_edildi'
  const [reviewLimit, setReviewLimit] = React.useState(10);
  const [isReviewPaginating, setIsReviewPaginating] = React.useState(false);

  // All Tasks Tab Filter & Search
  const [taskSearch, setTaskSearch] = React.useState("");
  const [taskDeptFilter, setTaskDeptFilter] = React.useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = React.useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = React.useState("all");
  const [taskLimit, setTaskLimit] = React.useState(12);
  const [isTaskPaginating, setIsTaskPaginating] = React.useState(false);

  // Quick Subject Templates for Fast 1-Tap Entry
  const QUICK_TEMPLATES = [
    { title: "Baret & KKD Eksikliği", titleEn: "Helmet & PPE Non-Compliance", priority: "yuksek", hours: 24 },
    { title: "Yangın Tüpü Önü Kapalı", titleEn: "Fire Extinguisher Blocked", priority: "kritik", hours: 4 },
    { title: "Düzensiz Malzeme İstifi", titleEn: "Disorganized Material Stacking", priority: "orta", hours: 24 },
    { title: "Kablo & Elektrik Tehlikesi", titleEn: "Electrical / Cable Hazard", priority: "kritik", hours: 2 },
    { title: "Yüksekte Emniyetsiz Çalışma", titleEn: "Unsafe Work at Height", priority: "kritik", hours: 2 },
    { title: "Forklift & Yaya Yolu İhlali", titleEn: "Forklift & Walkway Violation", priority: "yuksek", hours: 8 },
    { title: "Kaygan Zemin & Sıvı Sızıntısı", titleEn: "Slippery Floor & Fluid Leak", priority: "yuksek", hours: 4 },
    { title: "Makine Koruyucu Eksikliği", titleEn: "Missing Machine Safety Guard", priority: "kritik", hours: 4 },
  ];

  // Key KPI Calculations
  const pendingReviewTasks = React.useMemo(() => {
    return tasks
      .filter((t) => t.status === "onay_bekliyor" || t.status === "itiraz_edildi")
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [tasks]);

  const openTasks = React.useMemo(() => {
    return tasks.filter((t) => t.status === "acik");
  }, [tasks]);

  const criticalTasks = React.useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.priority === "kritik" || t.priority === "yuksek") &&
        t.status !== "kapatildi",
    );
  }, [tasks]);

  const resolvedTasks = React.useMemo(() => {
    return tasks.filter(
      (t) => t.status === "kapatildi" || t.status === "cozuldu",
    );
  }, [tasks]);

  // Filtered Review Tasks
  const filteredReviewTasks = React.useMemo(() => {
    return pendingReviewTasks.filter((task) => {
      if (reviewTypeFilter !== "all" && task.status !== reviewTypeFilter) {
        return false;
      }
      if (reviewSearch.trim()) {
        const query = reviewSearch.toLowerCase();
        const matchSubject = (task.subject || "").toLowerCase().includes(query);
        const matchDesc = (task.desc || "").toLowerCase().includes(query);
        const matchDept = (task.dept || "").toLowerCase().includes(query);
        const matchChief = (task.chiefNote || "").toLowerCase().includes(query);
        if (!matchSubject && !matchDesc && !matchDept && !matchChief) {
          return false;
        }
      }
      return true;
    });
  }, [pendingReviewTasks, reviewTypeFilter, reviewSearch]);

  // Filtered All Tasks
  const filteredAllTasks = React.useMemo(() => {
    return tasks
      .filter((task) => {
        if (taskDeptFilter !== "all" && task.dept !== taskDeptFilter) {
          return false;
        }
        if (taskStatusFilter !== "all") {
          if (taskStatusFilter === "cozuldu") {
            if (task.status !== "cozuldu" && task.status !== "kapatildi") return false;
          } else if (task.status !== taskStatusFilter) {
            return false;
          }
        }
        if (taskPriorityFilter !== "all" && task.priority !== taskPriorityFilter) {
          return false;
        }
        if (taskSearch.trim()) {
          const query = taskSearch.toLowerCase();
          const matchSubject = (task.subject || "").toLowerCase().includes(query);
          const matchDesc = (task.desc || "").toLowerCase().includes(query);
          const matchDept = (task.dept || "").toLowerCase().includes(query);
          if (!matchSubject && !matchDesc && !matchDept) return false;
        }
        return true;
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [tasks, taskDeptFilter, taskStatusFilter, taskPriorityFilter, taskSearch]);

  // Handlers
  const handleLoadMoreReview = () => {
    setIsReviewPaginating(true);
    setTimeout(() => {
      setReviewLimit((prev) => prev + 10);
      setIsReviewPaginating(false);
    }, 350);
  };

  const handleLoadMoreTasks = () => {
    setIsTaskPaginating(true);
    setTimeout(() => {
      setTaskLimit((prev) => prev + 12);
      setIsTaskPaginating(false);
    }, 350);
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.subject.trim()) {
      triggerHaptic("error");
      toast.error(t("err_fill_all") || "Lütfen bir ihlal konusu / başlığı girin.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTask(
        formState.dept,
        formState.priority,
        formState.subject.trim(),
        formState.desc.trim(),
        Number(formState.deadlineHours) || 24,
        imgPreview,
      );

      triggerHaptic("success");
      toast.success(
        lang === "en"
          ? "Safety violation reported successfully."
          : `İSG İhlal kaydı açıldı: "${formState.dept}" birimine bildirim iletildi.`,
      );

      setFormState({
        dept: formState.dept,
        priority: "yuksek",
        subject: "",
        desc: "",
        deadlineHours: 24,
      });
      setIsCustomDeadline(false);
      setImgPreview(null);
    } catch (err) {
      console.error("Create task error:", err);
      toast.error(lang === "en" ? "An error occurred while creating violation record." : "İhlal kaydı oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.taskId || !actionModal.action) return;

    const isApprove = actionModal.action === "approve";
    const isObjection = actionModal.task?.status === "itiraz_edildi";
    const newStatus = isApprove ? (isObjection ? "kapatildi" : "cozuldu") : "acik";

    try {
      await updateTaskStatus(
        actionModal.taskId,
        newStatus,
        "",
        "",
        modNote.trim(),
      );

      triggerHaptic(isApprove ? "success" : "warning");
      toast.success(
        isApprove
          ? (isObjection
              ? (lang === "en" ? "Objection accepted, violation cancelled." : "İtiraz kabul edildi, ihlal tutanağı iptal edildi.")
              : (lang === "en" ? "Violation closed and confirmed." : "İhlal çözümü onaylandı ve kayıt başarıyla kapatıldı."))
          : (lang === "en" ? "Response rejected, sent back to chief." : "Yanıt reddedildi, ihlal tekrar çözülmesi için birim şefine geri gönderildi."),
      );
    } catch (err) {
      console.error("Action submit error:", err);
      toast.error(lang === "en" ? "Action could not be performed." : "İşlem gerçekleştirilemedi.");
    } finally {
      setActionModal({ isOpen: false, taskId: null, action: null, task: null });
      setModNote("");
    }
  };

  // Target deadline calculation
  const targetDate = new Date(
    Date.now() + (Number(formState.deadlineHours) || 24) * 60 * 60 * 1000,
  );
  const formattedTargetDate = targetDate.toLocaleString(
    lang === "en" ? "en-US" : "tr-TR",
    {
      day: "numeric",
      month: "short",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8 animate-slide-up space-y-6">
      {/* 1. Executive Top Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700/80 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <HardHat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  {lang === "en"
                    ? "OHS Specialist Action Portal"
                    : "İSG Uzmanı Saha & Aksiyon Paneli"}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {lang === "en" ? "Live Inspection" : "Saha Denetimi Aktif"}
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl font-normal leading-relaxed">
                {lang === "en"
                  ? "Detect field hazards, assign timed violation tasks with automated scoring, and verify chief corrective actions."
                  : "Saha tehlike tespiti, terminli ihlal atamaları, şef çözüm/itiraz değerlendirmeleri ve canlı süreç takibi."}
              </p>
            </div>
          </div>

          {/* Quick Header CTA */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveTab("create");
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === "en" ? "New Inspection" : "Yeni İhlal Bildir"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Metrics Strip - 4 Balanced Cards, Equal Baseline & Height */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Pending Reviews */}
        <div
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("review");
            setReviewTypeFilter("all");
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[115px] flex flex-col justify-between ${
            activeTab === "review"
              ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-bold">
              {lang === "en" ? "Pending Reviews" : "Onay Bekleyenler"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none text-amber-600 dark:text-amber-400">
              <CountUp end={pendingReviewTasks.length} duration={600} />
            </p>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
            <span>{lang === "en" ? "Solutions & Objections" : "Şef çözümleri & itirazlar"}</span>
          </div>
        </div>

        {/* Metric 2: Open Field Tasks */}
        <div
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("tasks");
            setTaskStatusFilter("acik");
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[115px] flex flex-col justify-between ${
            activeTab === "tasks" && taskStatusFilter === "acik"
              ? "bg-blue-50/90 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-bold">
              {lang === "en" ? "Open Field Tasks" : "Açık Saha İhlalleri"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none text-blue-600 dark:text-blue-400">
              <CountUp end={openTasks.length} duration={600} />
            </p>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
            <span>{lang === "en" ? "Action pending by units" : "Birimlerin çözmesi gereken"}</span>
          </div>
        </div>

        {/* Metric 3: Critical & High Priority */}
        <div
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("tasks");
            setTaskPriorityFilter("kritik");
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[115px] flex flex-col justify-between ${
            activeTab === "tasks" && taskPriorityFilter === "kritik"
              ? "bg-red-50/90 dark:bg-red-950/30 border-red-300 dark:border-red-700 ring-2 ring-red-500/20 shadow-sm"
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-bold">
              {lang === "en" ? "Critical Risks" : "Acil & Kritik Risk"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none text-red-600 dark:text-red-400">
              <CountUp end={criticalTasks.length} duration={600} />
            </p>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
            <span>{lang === "en" ? "High & critical priority" : "Öncelikli müdahale"}</span>
          </div>
        </div>

        {/* Metric 4: Resolved & Closed */}
        <div
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("tasks");
            setTaskStatusFilter("cozuldu");
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer min-h-[115px] flex flex-col justify-between ${
            activeTab === "tasks" && taskStatusFilter === "cozuldu"
              ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-bold">
              {lang === "en" ? "Resolved Total" : "Giderilen İhlaller"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none text-emerald-600 dark:text-emerald-400">
              <CountUp end={resolvedTasks.length} duration={600} />
            </p>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
            <span>{lang === "en" ? "Confirmed closed tasks" : "Başarıyla kapatılanlar"}</span>
          </div>
        </div>
      </div>

      {/* 3. Modern Segmented Tab Navigation */}
      <div className="bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-2xl flex items-center gap-1 border border-gray-200/80 dark:border-gray-700/60 overflow-x-auto">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("create");
          }}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "create"
              ? "bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-black/5"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{lang === "en" ? "New Inspection" : "1. Yeni İhlal Bildir"}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("review");
          }}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer relative ${
            activeTab === "review"
              ? "bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-400 shadow-sm shadow-black/5"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span>{lang === "en" ? "Pending Reviews" : "2. Onay Bekleyenler"}</span>
          {pendingReviewTasks.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white animate-pulse">
              {pendingReviewTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("tasks");
          }}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "tasks"
              ? "bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm shadow-black/5"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <List className="w-4 h-4 shrink-0" />
          <span>{lang === "en" ? "Field Overview" : "3. Saha İhlal Takibi"}</span>
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
            ({tasks.length})
          </span>
        </button>
      </div>

      {/* 4. TAB 1: YENİ İHLAL BİLDİR (SAHA TESPİT FORMU) */}
      {activeTab === "create" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700/80 animate-slide-up space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/80 gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {lang === "en" ? "New Hazard / Violation Entry" : "Yeni Saha İhlal Tutanağı Düzenle"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === "en"
                  ? "Select target department, define priority and deadline, attach optional photo evidence."
                  : "İlgili departmanı seçin, öncelik ve termin süresini belirleyin, fotoğraf ile destekleyin."}
              </p>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {lang === "en" ? "Field Safety Protocol Active" : "İSG Saha Güvenlik Protokolü Devrede"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick 1-Tap Subject Templates */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                {lang === "en" ? "FAST TEMPLATES (1-TAP AUTOFILL)" : "HIZLI ŞABLONLAR (1-TIKLA DOLDUR)"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tmpl, idx) => {
                  const templateTitle = lang === "en" ? (tmpl.titleEn || tmpl.title) : tmpl.title;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setFormState((prev) => ({
                          ...prev,
                          subject: templateTitle,
                          priority: tmpl.priority,
                          deadlineHours: tmpl.hours,
                        }));
                        setIsCustomDeadline(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        formState.subject === templateTitle
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      {templateTitle}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department & Priority & Deadline Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Department */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  {lang === "en" ? "Target Department" : "Sorumlu Departman"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formState.dept}
                    onChange={(e) =>
                      setFormState({ ...formState, dept: e.target.value })
                    }
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {deptsList.map((dept) => (
                      <option key={dept} value={dept}>
                        {getDeptTranslation(dept)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Priority Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  {lang === "en" ? "Risk Level" : "Öncelik & Risk Seviyesi"} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "kritik", label: lang === "en" ? "Critical Risk" : "Kritik Risk", desc: lang === "en" ? "Immediate danger" : "Acil müdahale", color: "red" },
                    { key: "yuksek", label: lang === "en" ? "High Risk" : "Yüksek Risk", desc: lang === "en" ? "High hazard" : "Yüksek tehlike", color: "orange" },
                    { key: "orta", label: lang === "en" ? "Medium Risk" : "Orta Risk", desc: lang === "en" ? "Standard" : "Standart risk", color: "amber" },
                    { key: "dusuk", label: lang === "en" ? "Low Risk" : "Düşük Risk", desc: lang === "en" ? "Minor" : "Hafif ihlal", color: "blue" },
                  ].map((p) => {
                    const isSelected = formState.priority === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setFormState({ ...formState, priority: p.key });
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? p.color === "red"
                              ? "bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 ring-2 ring-red-500/20"
                              : p.color === "orange"
                                ? "bg-orange-50 dark:bg-orange-950/40 border-orange-400 dark:border-orange-700 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20"
                                : p.color === "amber"
                                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                                  : "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              p.color === "red"
                                ? "bg-red-500 animate-pulse"
                                : p.color === "orange"
                                ? "bg-orange-500"
                                : p.color === "amber"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                          />
                          <span>{p.label}</span>
                        </div>
                        <span className="text-[10px] opacity-70 font-medium">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Deadline Hours */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === "en" ? "Deadline (Hours)" : "Çözüm Termini"}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                    {formState.deadlineHours} {lang === "en" ? "hours" : "saat"}
                  </span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={
                      [1, 2, 4, 8, 12, 24, 48, 72, 168].includes(
                        Number(formState.deadlineHours),
                      ) && !isCustomDeadline
                        ? String(formState.deadlineHours)
                        : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomDeadline(true);
                      } else {
                        setIsCustomDeadline(false);
                        setFormState({
                          ...formState,
                          deadlineHours: Number(e.target.value),
                        });
                      }
                    }}
                    className="flex-1 px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="1">1 {lang === "en" ? "Hour (Emergency Stop)" : "Saat (Durdurma / Acil)"}</option>
                    <option value="2">2 {lang === "en" ? "Hours (Urgent Intervention)" : "Saat (Acil Müdahale)"}</option>
                    <option value="4">4 {lang === "en" ? "Hours (Half Shift)" : "Saat (Yarım Vardiya)"}</option>
                    <option value="8">8 {lang === "en" ? "Hours (Shift End)" : "Saat (Vardiya Sonu)"}</option>
                    <option value="12">12 {lang === "en" ? "Hours" : "Saat"}</option>
                    <option value="24">24 {lang === "en" ? "Hours (1 Day Standard)" : "Saat (1 Gün Standart)"}</option>
                    <option value="48">48 {lang === "en" ? "Hours (2 Days)" : "Saat (2 Gün)"}</option>
                    <option value="72">72 {lang === "en" ? "Hours (3 Days)" : "Saat (3 Gün)"}</option>
                    <option value="168">168 {lang === "en" ? "Hours (1 Week)" : "Saat (1 Hafta)"}</option>
                    <option value="custom">⚙️ {lang === "en" ? "Custom Duration..." : "Özel Süre Gir..."}</option>
                  </select>

                  {isCustomDeadline && (
                    <div className="flex items-center gap-1 w-28">
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={formState.deadlineHours}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setFormState({ ...formState, deadlineHours: val });
                        }}
                        className="w-full px-3 py-3.5 bg-white dark:bg-gray-900 border border-emerald-500 rounded-2xl text-center text-sm font-bold text-gray-900 dark:text-gray-100 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target Live Date Indicator */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{lang === "en" ? "Target Completion Time" : "Şefe Tanınan Son Teslim Zamanı"}:</strong>{" "}
                  <span className="font-bold underline ml-1">{formattedTargetDate}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {lang === "en" ? "Quick:" : "Hızlı Süre:"}
                </span>
                {[2, 4, 8, 24, 48].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setIsCustomDeadline(false);
                      setFormState({ ...formState, deadlineHours: h });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      Number(formState.deadlineHours) === h && !isCustomDeadline
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {h}{lang === "en" ? "h" : "s"}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                {lang === "en" ? "Subject / Hazard Title" : "İhlal Konusu / Başlık"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formState.subject}
                onChange={(e) =>
                  setFormState({ ...formState, subject: e.target.value })
                }
                placeholder={
                  lang === "en"
                    ? "e.g., Lack of Helmet in Welding Area"
                    : "Örn: Kaynakhane KKD Baret Kullanımı Eksikliği"
                }
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                {lang === "en" ? "Violation Details / Description" : "İhlal Detayı & Alınması Gereken Önlem"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formState.desc}
                onChange={(e) =>
                  setFormState({ ...formState, desc: e.target.value })
                }
                placeholder={
                  lang === "en"
                    ? "Describe the safety hazard observed on the field and the required action..."
                    : "Sahada tespit edilen tehlikeli durumu, risk faktörünü ve birim şefinden beklenen aksiyonu yazın..."
                }
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-y"
              />
            </div>

            {/* Photo Attachment Section */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                <span>
                  {lang === "en" ? "Field Evidence Photo" : "Saha Kanıt Fotoğrafı"}{" "}
                  <span className="text-gray-400 font-normal">({lang === "en" ? "Optional" : "İsteğe Bağlı"})</span>
                </span>
                {imgPreview && (
                  <button
                    type="button"
                    onClick={() => setImgPreview(null)}
                    className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "Remove Photo" : "Fotoğrafı Kaldır"}</span>
                  </button>
                )}
              </label>

              <input
                type="file"
                id="modCamera"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />

              {imgPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 max-h-72 flex items-center justify-center group">
                  <img
                    src={imgPreview}
                    alt="Saha Önizleme"
                    className="w-full h-64 object-cover cursor-zoom-in"
                    onClick={() => {
                      if (setPreviewModalImg) {
                        setPreviewModalImg(imgPreview);
                        if (setPreviewModalTitle) setPreviewModalTitle("Saha İhlal Fotoğrafı");
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label
                      htmlFor="modCamera"
                      className="px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {lang === "en" ? "Change Photo" : "Fotoğrafı Değiştir"}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (setPreviewModalImg) {
                          setPreviewModalImg(imgPreview);
                          if (setPreviewModalTitle) setPreviewModalTitle("Saha İhlal Fotoğrafı");
                        }
                      }}
                      className="px-4 py-2 bg-black/70 text-white rounded-xl text-xs font-bold shadow-md hover:bg-black transition-colors flex items-center gap-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Zoom" : "Büyüt"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="modCamera"
                  className="w-full h-40 bg-gray-50 dark:bg-gray-900/60 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {lang === "en" ? "Take Photo / Upload Evidence" : "Kamera ile Çek / Fotoğraf Yükle"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {lang === "en" ? "PNG, JPG or JPEG up to 10MB" : "PNG, JPG veya JPEG formatında"}
                  </span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{lang === "en" ? "Publishing Inspection Record..." : "İhlal Kaydı Yayınlanıyor..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{lang === "en" ? "Publish Violation & Send Alert" : "İhlal Kaydını Yayınla ve Birime Bildir"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. TAB 2: ONAY BEKLEYENLER (ŞEF YANITLARI & İTİRAZLAR) */}
      {activeTab === "review" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700/80 animate-slide-up space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/80 gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" />
                {lang === "en" ? "Responses Awaiting Review" : "İnceleme ve Onay Bekleyen Yanıtlar"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === "en"
                  ? "Evaluate corrected tasks submitted by department chiefs or review objections."
                  : "Birim şefleri tarafından çözülen ihlalleri kontrol edin ya da yapılan itirazları karara bağlayın."}
              </p>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl self-start md:self-auto">
              <button
                type="button"
                onClick={() => setReviewTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewTypeFilter === "all"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xs"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {lang === "en" ? "All" : "Tümü"} ({pendingReviewTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewTypeFilter("onay_bekliyor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewTypeFilter === "onay_bekliyor"
                    ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {lang === "en" ? "Solutions" : "Çözüm Sunulan"} (
                {pendingReviewTasks.filter((t) => t.status === "onay_bekliyor").length})
              </button>
              <button
                type="button"
                onClick={() => setReviewTypeFilter("itiraz_edildi")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewTypeFilter === "itiraz_edildi"
                    ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {lang === "en" ? "Objections" : "İtirazlar"} (
                {pendingReviewTasks.filter((t) => t.status === "itiraz_edildi").length})
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              placeholder={lang === "en" ? "Filter reviews by subject, department or note..." : "Onay bekleyenlerde konu, birim veya şef notu ara..."}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Reviews List */}
          {filteredReviewTasks.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700/80">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                {lang === "en" ? "No pending reviews right now!" : "Harika! Onay bekleyen hiçbir kayıt yok."}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                {lang === "en"
                  ? "When unit chiefs report completed corrective actions or submit objections, they will appear here instantly."
                  : "Birim şefleri saha çözümlerini bildirdiğinde veya gerekçeli itiraz sunduğunda burada listelenecektir."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredReviewTasks.slice(0, reviewLimit).map((task) => {
                const isObjection = task.status === "itiraz_edildi";
                const railBorder = isObjection
                  ? "border-l-4 border-l-red-500"
                  : "border-l-4 border-l-amber-500";

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-xs transition-all ${railBorder}`}
                  >
                    <div className="flex flex-col lg:flex-row gap-5 items-start justify-between">
                      {/* Left: Info & Notes */}
                      <div className="flex-1 space-y-3 w-full">
                        {/* Title and Metadata */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                isObjection
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {isObjection
                                ? (lang === "en" ? "Objected" : "İtiraz Edildi")
                                : (lang === "en" ? "Solution Submitted (Pending Review)" : "Çözüm Bildirildi (Onay Bekliyor)")}
                            </span>
                            <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                              {getDeptTranslation(task.dept)}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize">
                              {t(task.priority) || task.priority || "Normal"} {lang === "en" ? "Priority" : "Öncelik"}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">
                            {task.subject || (lang === "en" ? "Violation Notice" : "İhlal Bildirimi")}
                          </h3>
                        </div>

                        {/* Initial Violation Note */}
                        <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700/60 text-xs">
                          <p className="font-bold text-gray-500 dark:text-gray-400 mb-1">
                            {lang === "en" ? "Initial Inspector Note:" : "İlk Saha İhlal Notu:"}
                          </p>
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                            {task.desc || "-"}
                          </p>
                        </div>

                        {/* Chief Response Note */}
                        <div
                          className={`rounded-xl p-3.5 border text-xs ${
                            isObjection
                              ? "bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40"
                              : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40"
                          }`}
                        >
                          <p
                            className={`font-bold mb-1 ${
                              isObjection
                                ? "text-red-800 dark:text-red-300"
                                : "text-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            {isObjection
                              ? (lang === "en" ? "Chief Objection Justification:" : "Birim Şefi İtiraz Gerekçesi:")
                              : (lang === "en" ? "Chief Corrective Action Note:" : "Birim Şefi Çözüm Açıklaması:")}
                          </p>
                          <p className="text-gray-900 dark:text-gray-100 leading-relaxed font-semibold">
                            {task.chiefNote || (lang === "en" ? "No note provided." : "Açıklama notu girilmemiş.")}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Photos (Before & After) */}
                      <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto overflow-x-auto pb-1">
                        {task.imgUrl && (
                          <div className="w-32 sm:w-36 flex flex-col shrink-0">
                            <span className="text-[10px] font-extrabold uppercase text-red-600 dark:text-red-400 mb-1">
                              {lang === "en" ? "Before (Violation)" : "Öncesi (İhlal)"}
                            </span>
                            <div
                              onClick={() => {
                                if (setPreviewModalImg) {
                                  setPreviewModalImg(task.imgUrl);
                                  if (setPreviewModalTitle)
                                    setPreviewModalTitle(
                                      lang === "en"
                                        ? `Before - ${task.subject || "Violation"}`
                                        : `Öncesi - ${task.subject || "İhlal"}`,
                                    );
                                }
                              }}
                              className="relative group h-24 w-full rounded-xl overflow-hidden border border-red-200 dark:border-red-900/40 cursor-zoom-in bg-gray-100 dark:bg-gray-800 shadow-xs"
                            >
                              <img
                                src={task.imgUrl}
                                alt="Öncesi"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        )}

                        {task.afterImgUrl && (
                          <div className="w-32 sm:w-36 flex flex-col shrink-0">
                            <span
                              className={`text-[10px] font-extrabold uppercase mb-1 ${
                                isObjection
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {isObjection
                                ? (lang === "en" ? "Objection Photo" : "İtiraz Fotoğrafı")
                                : (lang === "en" ? "After (Solution)" : "Sonrası (Çözüm)")}
                            </span>
                            <div
                              onClick={() => {
                                if (setPreviewModalImg) {
                                  setPreviewModalImg(task.afterImgUrl);
                                  if (setPreviewModalTitle)
                                    setPreviewModalTitle(
                                      isObjection
                                        ? (lang === "en" ? "Objection Photo" : "İtiraz Fotoğrafı")
                                        : (lang === "en" ? "After - Solution" : "Sonrası - Çözüm"),
                                    );
                                }
                              }}
                              className={`relative group h-24 w-full rounded-xl overflow-hidden border cursor-zoom-in bg-gray-100 dark:bg-gray-800 shadow-xs ${
                                isObjection
                                  ? "border-red-200 dark:border-red-900/40"
                                  : "border-emerald-200 dark:border-emerald-900/40"
                              }`}
                            >
                              <img
                                src={task.afterImgUrl}
                                alt="Sonrası"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto lg:min-w-[140px] self-end lg:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("selection");
                            setActionModal({
                              isOpen: true,
                              taskId: task.id,
                              action: "approve",
                              task: task,
                            });
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isObjection
                              ? (lang === "en" ? "Approve Objection" : "İtirazı Onayla")
                              : (lang === "en" ? "Approve (Close)" : "Onayla (Kapat)")}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("selection");
                            setActionModal({
                              isOpen: true,
                              taskId: task.id,
                              action: "reject",
                              task: task,
                            });
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>
                            {isObjection
                              ? (lang === "en" ? "Reject Objection" : "İtirazı Reddet")
                              : (lang === "en" ? "Reject (Send Back)" : "Reddet (Geri Gönder)")}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More Review Button */}
              {filteredReviewTasks.length > reviewLimit && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMoreReview}
                    disabled={isReviewPaginating}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    {isReviewPaginating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{lang === "en" ? "Show More Pending Reviews" : "Daha Fazla Onay Kaydı Göster"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: SAHA İHLAL TAKİBİ (TÜM SAHA GÖREVLERİ & CANLI LİSTE) */}
      {activeTab === "tasks" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700/80 animate-slide-up space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/80 gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-500" />
                {lang === "en" ? "Field Violation Overview" : "Saha İhlalleri & Canlı Durum Takibi"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === "en"
                  ? "Track ongoing violation resolutions, overdue deadlines, and department compliance."
                  : "Sahada devam eden çözümleri, geciken süreleri ve birimlerin açık aksiyonlarını takip edin."}
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {filteredAllTasks.length} {lang === "en" ? "records found" : "kayıt listeleniyor"}
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder={lang === "en" ? "Search violations..." : "İhlal ara..."}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={taskDeptFilter}
                onChange={(e) => setTaskDeptFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden cursor-pointer"
              >
                <option value="all">{lang === "en" ? "All Departments" : "Tüm Birimler"}</option>
                {deptsList.map((d) => (
                  <option key={d} value={d}>
                    {getDeptTranslation(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden cursor-pointer"
              >
                <option value="all">{lang === "en" ? "All Statuses" : "Tüm Durumlar"}</option>
                <option value="acik">{lang === "en" ? "Open (Chiefs Working)" : "Açık (Çözüm Bekleniyor)"}</option>
                <option value="onay_bekliyor">{lang === "en" ? "Awaiting Review" : "Onay Bekliyor"}</option>
                <option value="itiraz_edildi">{lang === "en" ? "Objected" : "İtiraz Edildi"}</option>
                <option value="cozuldu">{lang === "en" ? "Closed / Resolved" : "Kapatıldı / Çözüldü"}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden cursor-pointer"
              >
                <option value="all">{lang === "en" ? "All Priorities" : "Tüm Öncelikler"}</option>
                <option value="kritik">{lang === "en" ? "Critical Risk" : "Kritik Risk"}</option>
                <option value="yuksek">{lang === "en" ? "High Risk" : "Yüksek Risk"}</option>
                <option value="orta">{lang === "en" ? "Medium Risk" : "Orta Risk"}</option>
                <option value="dusuk">{lang === "en" ? "Low Risk" : "Düşük Risk"}</option>
              </select>
            </div>
          </div>

          {/* Tasks Grid */}
          {filteredAllTasks.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700/80">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {lang === "en" ? "No matching field tasks found" : "Filtrelere uygun ihlal kaydı bulunamadı"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAllTasks.slice(0, taskLimit).map((task) => {
                const isClosed = task.status === "kapatildi" || task.status === "cozuldu";
                const isWaiting = task.status === "onay_bekliyor";
                const isObj = task.status === "itiraz_edildi";

                // Time math
                const createdTime = task.timestamp || Date.now();
                const deadlineMs = (task.deadlineHours || 24) * 60 * 60 * 1000;
                const endTime = createdTime + deadlineMs;
                const now = Date.now();
                const isOverdue = now > endTime && !isClosed;
                const diffHours = Math.abs(Math.round((endTime - now) / (1000 * 60 * 60)));

                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-4.5 shadow-xs hover:border-gray-300 dark:hover:border-gray-600 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                          {getDeptTranslation(task.dept)}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isClosed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : isWaiting
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : isObj
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                  : isOverdue
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}
                        >
                          {isClosed
                            ? (lang === "en" ? "Closed" : "Kapatıldı")
                            : isWaiting
                              ? (lang === "en" ? "Pending Review" : "Onay Bekliyor")
                              : isObj
                                ? (lang === "en" ? "Objected" : "İtiraz")
                                : isOverdue
                                  ? (lang === "en" ? "Overdue" : "Süre Aşıldı")
                                  : (lang === "en" ? "Open" : "Açık")}
                        </span>
                      </div>

                      {/* Subject */}
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
                        {task.subject || (lang === "en" ? "Violation Notice" : "İhlal Bildirimi")}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {task.desc || "-"}
                      </p>
                    </div>

                    {/* Photo Thumbnails Row */}
                    {(task.imgUrl || task.afterImgUrl) && (
                      <div className="flex items-center gap-2 pt-1">
                        {task.imgUrl && (
                          <div
                            onClick={() => {
                              if (setPreviewModalImg) {
                                setPreviewModalImg(task.imgUrl);
                                if (setPreviewModalTitle)
                                  setPreviewModalTitle(
                                    lang === "en"
                                      ? `Before - ${task.subject || "Violation"}`
                                      : `Öncesi - ${task.subject || "İhlal"}`,
                                  );
                              }
                            }}
                            className="relative h-14 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-zoom-in shrink-0"
                          >
                            <img
                              src={task.imgUrl}
                              alt="İhlal"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-bold">
                              {lang === "en" ? "Before" : "Öncesi"}
                            </span>
                          </div>
                        )}
                        {task.afterImgUrl && (
                          <div
                            onClick={() => {
                              if (setPreviewModalImg) {
                                setPreviewModalImg(task.afterImgUrl);
                                if (setPreviewModalTitle)
                                  setPreviewModalTitle(
                                    lang === "en"
                                      ? `After - ${task.subject || "Solution"}`
                                      : `Sonrası - ${task.subject || "Çözüm"}`,
                                  );
                              }
                            }}
                            className="relative h-14 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-zoom-in shrink-0"
                          >
                            <img
                              src={task.afterImgUrl}
                              alt="Çözüm"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-950/80 text-emerald-200 text-[9px] text-center font-bold">
                              {lang === "en" ? "After" : "Sonrası"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Metadata */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      <span>
                        {new Date(task.timestamp || Date.now()).toLocaleDateString(
                          lang === "en" ? "en-US" : "tr-TR",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                      <span>
                        {isClosed
                          ? (lang === "en" ? "Resolved" : "Giderildi")
                          : isOverdue
                            ? (lang === "en" ? `⚠️ ${diffHours}h overdue` : `⚠️ ${diffHours}s aşıldı`)
                            : (lang === "en" ? `⏱️ ${diffHours}h left` : `⏱️ ${diffHours}s kaldı`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Tasks Button */}
          {filteredAllTasks.length > taskLimit && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMoreTasks}
                disabled={isTaskPaginating}
                className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                {isTaskPaginating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{lang === "en" ? "Show More Field Violations" : "Daha Fazla Saha İhlali Göster"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Action Approval / Rejection Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {actionModal.action === "approve" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>{lang === "en" ? "Confirm & Close Task" : "Çözümü Onayla ve Kapat"}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>{lang === "en" ? "Reject & Return to Chief" : "Yanıtı Reddet (Geri Gönder)"}</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setActionModal({
                    isOpen: false,
                    taskId: null,
                    action: null,
                    task: null,
                  })
                }
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
              {actionModal.action === "approve"
                ? (lang === "en"
                    ? "The violation will be marked as resolved and closed. Department score will be adjusted accordingly."
                    : "İhlal kaydı başarıyla giderilmiş olarak kapatılacak ve puan telafisi tamamlanacaktır.")
                : (lang === "en"
                    ? "The task will be reopened and returned to the department chief for re-inspection and correction."
                    : "İhlal kaydı tekrar açık duruma getirilecek ve şefe yeniden aksiyon alması için geri yönlendirilecektir.")}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {lang === "en" ? "Specialist Feedback Note (Optional)" : "İSG Uzmanı Geri Bildirim Notu (İsteğe Bağlı)"}
                </label>
                <textarea
                  rows={3}
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  placeholder={
                    actionModal.action === "approve"
                      ? (lang === "en"
                          ? "e.g., Verified on site, measures are adequate."
                          : "Örn: Saha yerinde kontrol edildi, önlem yeterli görüldü.")
                      : (lang === "en"
                          ? "e.g., Still inadequate in photo, safety barrier required."
                          : "Örn: Fotoğrafta görülen alan hala yetersiz, bariyer yerleştirilmeli.")
                  }
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      isOpen: false,
                      taskId: null,
                      action: null,
                      task: null,
                    })
                  }
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {lang === "en" ? "Cancel" : "Vazgeç"}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                    actionModal.action === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  }`}
                >
                  {actionModal.action === "approve"
                    ? (lang === "en" ? "Confirm & Close" : "Onayla ve Kapat")
                    : (lang === "en" ? "Reject and Return" : "Reddet ve Geri Gönder")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-around shadow-lg">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("create");
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "create"
              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          }`}
        >
          <Plus className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">{lang === "en" ? "New Violation" : "Yeni İhlal"}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("review");
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === "review"
              ? "text-amber-600 dark:text-amber-400 font-extrabold"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          }`}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5 mb-0.5" />
            {pendingReviewTasks.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 rounded-full">
                {pendingReviewTasks.length}
              </span>
            )}
          </div>
          <span className="text-[11px]">{lang === "en" ? "Reviews" : "Onaylar"}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("tasks");
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "tasks"
              ? "text-blue-600 dark:text-blue-400 font-extrabold"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          }`}
        >
          <List className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">{lang === "en" ? "Field Tasks" : "Saha Takip"}</span>
        </button>
      </div>

      {/* Pad bottom for mobile */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
};

const SefDashboard = () => {
  const ctx = useAppContext();
  const {
    t,
    tasks,
    currentUser,
    updateTaskStatus,
    setPreviewModalImg,
    setPreviewModalTitle,
    lang = "tr",
  } = ctx || {};

  // Active view tab: "open" (Açık) | "pending" (Onay Bekleyenler) | "completed" (Düzeltilenler)
  const [activeTab, setActiveTab] = React.useState("open");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterPriority, setFilterPriority] = React.useState("all"); // "all" | "urgent"
  const [expandedTasks, setExpandedTasks] = React.useState({});

  // Action modal (Düzelttim or İtiraz)
  const [actionModal, setActionModal] = React.useState({
    isOpen: false,
    taskId: null,
    type: null, // "fix" | "object"
  });
  const [note, setNote] = React.useState("");
  const [afterImgPreview, setAfterImgPreview] = React.useState(null);

  // Pagination for tasks list
  const [sefiTasksLimit, setSefiTasksLimit] = React.useState(12);
  const [isSefiPaginating, setIsSefiPaginating] = React.useState(false);

  // Toggle expanded description
  const toggleTask = (id) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Switch tab with haptic feedback
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSefiTasksLimit(12);
    if (typeof triggerHaptic === "function") triggerHaptic("selection");
  };

  // Group and sort department tasks
  const { openTasks, pendingTasks, completedTasks, allDeptTasks } = React.useMemo(() => {
    const userDept = currentUser?.dept;
    const my = (tasks || [])
      .filter((task) => task && (!userDept || task.dept === userDept))
      .sort((a, b) => (Number(b?.timestamp) || 0) - (Number(a?.timestamp) || 0));

    const opens = my.filter(
      (t) => t && (t.status === "acik" || t.status === "itiraz_edildi"),
    );
    const pendings = my.filter((t) => t && t.status === "onay_bekliyor");
    const completeds = my.filter(
      (t) => t && t.status !== "acik" && t.status !== "itiraz_edildi" && t.status !== "onay_bekliyor",
    );

    return {
      openTasks: opens,
      pendingTasks: pendings,
      completedTasks: completeds,
      allDeptTasks: my,
    };
  }, [tasks, currentUser]);

  // Filter based on active tab, search query, and priority filter
  const displayTasks = React.useMemo(() => {
    let list = [];
    if (activeTab === "open") list = openTasks;
    else if (activeTab === "pending") list = pendingTasks;
    else list = completedTasks;

    if (filterPriority === "urgent") {
      list = list.filter((t) => t?.priority === "kritik" || t?.priority === "yuksek");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          (t.desc && t.desc.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q)) ||
          (t.locationDetail && t.locationDetail.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeTab, openTasks, pendingTasks, completedTasks, filterPriority, searchQuery]);

  // Load more tasks handler
  const handleLoadMoreSefiTasks = () => {
    setIsSefiPaginating(true);
    setTimeout(() => {
      setSefiTasksLimit((prev) => prev + 12);
      setIsSefiPaginating(false);
    }, 350);
  };

  // Format remaining deadline or overdue tag
  const formatTimeRemaining = (timestamp, deadlineHours) => {
    if (!timestamp || !deadlineHours) return null;
    const ts = Number(timestamp);
    const dh = Number(deadlineHours);
    if (isNaN(ts) || isNaN(dh)) return null;
    const deadline = ts + dh * 60 * 60 * 1000;
    const now = Date.now();
    const diff = deadline - now;
    if (diff < 0) {
      const h = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
          <Clock className="w-3.5 h-3.5 text-rose-500" />
          {h > 0
            ? (lang === "en" ? `${h}h overdue` : `${h} sa gecikti`)
            : (lang === "en" ? "Overdue" : "Gecikti")}
        </span>
      );
    } else {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {lang === "en" ? `${h}h ${m}m left` : `${h}s ${m}d kaldı`}
        </span>
      );
    }
  };

  // Format date display
  const formatDateStr = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Quick notes options to tap for speed
  const quickFixNotes = [
    lang === "en" ? "Protective guard / cover installed" : "Koruyucu donanım / kapak takıldı",
    lang === "en" ? "Area cleaned and organized" : "Saha temizlendi ve düzenlendi",
    lang === "en" ? "Staff warned on safety rules" : "Personele kural hatırlatması yapıldı",
    lang === "en" ? "Defect fixed and tested" : "Arıza giderildi ve kontrol edildi",
  ];

  const quickObjectNotes = [
    lang === "en" ? "This area is outside our unit scope" : "Bu alan birimimizin sorumluluğunda değildir",
    lang === "en" ? "Requires maintenance team action" : "Bakım/Onarım müdahalesi gerektirmektedir",
    lang === "en" ? "Equipment replacement ordered" : "Yeni ekipman sipariş edildi bekleniyor",
  ];

  // Submit action (Düzelttim or İtiraz)
  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (actionModal.type === "fix") {
      updateTaskStatus(
        actionModal.taskId,
        "onay_bekliyor",
        note,
        afterImgPreview,
        "",
      );
      if (typeof triggerHaptic === "function") triggerHaptic("success");
      toast.success(
        lang === "en"
          ? "Solution photo submitted! Awaiting safety specialist approval."
          : "Çözüm fotoğrafı iletildi! İSG Uzmanı onayı bekleniyor.",
      );
    } else if (actionModal.type === "object") {
      updateTaskStatus(actionModal.taskId, "itiraz_edildi", note, "", "");
      if (typeof triggerHaptic === "function") triggerHaptic("warning");
      toast.success(
        lang === "en"
          ? "Objection sent for specialist re-evaluation."
          : "İtirazınız İSG Uzmanı incelemesine gönderildi.",
      );
    }
    setActionModal({ isOpen: false, taskId: null, type: null });
    setNote("");
    setAfterImgPreview(null);
  };

  const deptKey = getDeptKey(currentUser?.dept || "");
  const deptTitle = (t && t(deptKey)) || currentUser?.dept || (lang === "en" ? "Unit" : "Birim");

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-6 overflow-x-hidden animate-slide-up">
      {/* Modern, Clean Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl border border-slate-700/50 mb-6">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              <HardHat className="w-3.5 h-3.5 text-blue-300" />
              <span>{deptTitle} {lang === "en" ? "Chief Dashboard" : "Birim Şefliği"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{deptTitle}</span>
              <span className="text-blue-400 text-lg sm:text-xl font-bold">
                {lang === "en" ? "Safety & Operations" : "İSG & Görev Takibi"}
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              {lang === "en"
                ? `Welcome, Chief ${currentUser?.name || currentUser?.username || ""}. You can easily monitor violations in your area, submit fixes with photos, and keep your department safe.`
                : `İyi çalışmalar, Sayın ${currentUser?.name || currentUser?.username || "Şefim"}. Biriminize ait saha ihlallerini buradan inceleyebilir, düzelttiğiniz durumları fotoğraflayarak onaya gönderebilirsiniz.`}
            </p>
          </div>

          {/* Quick Stat Pill Cards (Clicking them switches active tab!) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Open / Action Required */}
            <button
              onClick={() => handleTabChange("open")}
              type="button"
              className={`p-3 sm:p-4 rounded-2xl transition-all text-left border cursor-pointer ${
                activeTab === "open"
                  ? "bg-rose-500/20 border-rose-400/60 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  {lang === "en" ? "Action Req." : "Bekleyen"}
                </span>
                {openTasks.length > 0 ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {openTasks.length}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 font-medium">
                {openTasks.length === 0
                  ? (lang === "en" ? "All clear!" : "Hepsi temiz")
                  : (lang === "en" ? "Violations" : "Açık İhlal")}
              </div>
            </button>

            {/* Pending Approval */}
            <button
              onClick={() => handleTabChange("pending")}
              type="button"
              className={`p-3 sm:p-4 rounded-2xl transition-all text-left border cursor-pointer ${
                activeTab === "pending"
                  ? "bg-amber-500/20 border-amber-400/60 shadow-lg shadow-amber-950/40 ring-2 ring-amber-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  {lang === "en" ? "In Review" : "Onayda"}
                </span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {pendingTasks.length}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 font-medium">
                {lang === "en" ? "Under review" : "Uzman Bekliyor"}
              </div>
            </button>

            {/* Completed */}
            <button
              onClick={() => handleTabChange("completed")}
              type="button"
              className={`p-3 sm:p-4 rounded-2xl transition-all text-left border cursor-pointer ${
                activeTab === "completed"
                  ? "bg-emerald-500/20 border-emerald-400/60 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  {lang === "en" ? "Resolved" : "Çözülen"}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {completedTasks.length}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 font-medium">
                {lang === "en" ? "Completed" : "Kapatıldı"}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Smooth Tab Switcher + Quick Filter + Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto hide-scrollbar w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleTabChange("open")}
            className={`flex-1 md:flex-initial shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-w-fit ${
              activeTab === "open"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="shrink-0">
              <span className="sm:hidden">{lang === "en" ? "Open" : "Bekleyen"}</span>
              <span className="hidden sm:inline">{lang === "en" ? "Open Violations" : "Bekleyen İhlaller"}</span>
            </span>
            <span
              className={`shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs rounded-full font-black ${
                activeTab === "open"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {openTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("pending")}
            className={`flex-1 md:flex-initial shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-w-fit ${
              activeTab === "pending"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="shrink-0">
              <span className="sm:hidden">{lang === "en" ? "In Review" : "Onayda"}</span>
              <span className="hidden sm:inline">{lang === "en" ? "Pending Approval" : "Onay Bekleyenler"}</span>
            </span>
            <span
              className={`shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs rounded-full font-black ${
                activeTab === "pending"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {pendingTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("completed")}
            className={`flex-1 md:flex-initial shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-w-fit ${
              activeTab === "completed"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="shrink-0">
              <span className="sm:hidden">{lang === "en" ? "Resolved" : "Düzeltilen"}</span>
              <span className="hidden sm:inline">{lang === "en" ? "Resolved / History" : "Düzeltilenler / Geçmiş"}</span>
            </span>
            <span
              className={`shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs rounded-full font-black ${
                activeTab === "completed"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* Search & Quick Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "Search violations..." : "İhlal ara..."}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Urgent Filter Toggle */}
          <button
            type="button"
            onClick={() =>
              setFilterPriority((prev) => (prev === "urgent" ? "all" : "urgent"))
            }
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              filterPriority === "urgent"
                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "Urgent" : "Acil Olanlar"}</span>
          </button>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Empty State */}
        {displayTasks.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
            {activeTab === "open" ? (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {lang === "en"
                    ? "Great Job! No Open Violations"
                    : "Harika! Biriminizde Açık İhlal Yok"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  {lang === "en"
                    ? `There are currently no active safety violations for ${deptTitle}. Thank you for your commitment to safety standards!`
                    : `${deptTitle} bünyesinde şu an için bekleyen açık bir iş güvenliği ihlali bulunmamaktadır. Sıfır iş kazası hedefiyle özverili çalışmalarınız için teşekkür ederiz.`}
                </p>
              </>
            ) : activeTab === "pending" ? (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400 shadow-sm">
                  <Clock className="w-9 h-9 sm:w-11 sm:h-11" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {lang === "en"
                    ? "No Tasks Awaiting Approval"
                    : "Onay Bekleyen Kayıt Yok"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  {lang === "en"
                    ? "When you submit a solution photo for an open violation, it will be listed here until reviewed by the safety specialist."
                    : "Açık bir ihlali düzeltip fotoğrafını yüklediğinizde, İSG Uzmanı inceleyene kadar burada listelenecektir."}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-500 dark:text-slate-400 shadow-sm">
                  <List className="w-9 h-9 sm:w-11 sm:h-11" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {lang === "en"
                    ? "No Completed Records Yet"
                    : "Henüz Tamamlanan Kayıt Yok"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  {lang === "en"
                    ? "Corrected and approved violation history will appear here."
                    : "Düzeltilip uzman tarafından onaylanan geçmiş ihlaller burada arşivlenir."}
                </p>
              </>
            )}
          </div>
        )}

        {/* Display Tasks Cards */}
        {displayTasks.slice(0, sefiTasksLimit).map((task) => {
          const isExpanded = !!expandedTasks[task.id];
          const isUrgent = task.priority === "kritik" || task.priority === "yuksek";
          const priorityInfo = PRIORITIES[task.priority] || PRIORITIES["orta"];

          return (
            <div
              key={task.id}
              className={`group bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm transition-all duration-200 flex flex-col justify-between ${
                isUrgent
                  ? "border-rose-200 dark:border-rose-900/60 hover:shadow-rose-500/5 hover:border-rose-400"
                  : "border-slate-200 dark:border-slate-800 hover:border-blue-400/60 hover:shadow-md"
              }`}
            >
              <div>
                {/* Card Header: Badges & Remaining Time */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        task.priority === "kritik"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : task.priority === "orta"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          task.priority === "kritik"
                            ? "bg-rose-500 animate-pulse"
                            : task.priority === "orta"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <span>
                        {task.priority === "kritik"
                          ? (lang === "en" ? "Critical" : "Kritik")
                          : task.priority === "orta"
                          ? (lang === "en" ? "Medium" : "Orta")
                          : (lang === "en" ? "Low" : "Basit")}
                      </span>
                    </span>

                    {/* Status Badge */}
                    {task.status === "onay_bekliyor" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {lang === "en" ? "In Review" : "Onay Bekliyor"}
                      </span>
                    ) : task.status === "itiraz_edildi" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        {lang === "en" ? "Disputed" : "İtiraz Edildi"}
                      </span>
                    ) : task.status === "cozuldu" || task.status === "onaylandi" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {lang === "en" ? "Resolved" : "Düzeltildi"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {lang === "en" ? "Action Needed" : "Açık İhlal"}
                      </span>
                    )}
                  </div>

                  {/* Deadline countdown if open */}
                  {(task.status === "acik" || task.status === "itiraz_edildi") ? (
                    formatTimeRemaining(task.timestamp, task.deadlineHours)
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      {formatDateStr(task.timestamp)}
                    </span>
                  )}
                </div>

                {/* Subject & Location */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1.5">
                  {task.subject || (lang === "en" ? "Safety Violation" : "İSG Saha İhlali")}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateStr(task.timestamp)}
                  </span>
                  {(task.location || task.locationDetail) && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {task.location || task.locationDetail}
                    </span>
                  )}
                </div>

                {/* Images Preview Section */}
                {task.imgUrl && (
                  <div className="relative mb-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={task.imgUrl}
                      alt={task.subject || "İhlal Görseli"}
                      loading="lazy"
                      className="w-full h-44 object-cover cursor-zoom-in group-hover:scale-[1.01] transition-transform duration-300"
                      onClick={() => {
                        setPreviewModalImg(task.imgUrl);
                        setPreviewModalTitle(
                          task.subject || (lang === "en" ? "Violation Photo" : "İhlal Fotoğrafı")
                        );
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none">
                      <Eye className="w-3 h-3" />
                      <span>{lang === "en" ? "Inspect" : "Büyüt"}</span>
                    </div>

                    {/* Before / After indicator if fix photo exists */}
                    {task.afterImgUrl && (
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                        {lang === "en" ? "1. Violation Photo" : "1. İhlal Durumu"}
                      </div>
                    )}
                  </div>
                )}

                {/* Solution Photo (afterImgUrl) if present */}
                {task.afterImgUrl && (
                  <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {lang === "en" ? "Submitted Solution Photo:" : "Yüklenen Çözüm Fotoğrafı:"}
                      </span>
                    </div>
                    <img
                      src={task.afterImgUrl}
                      alt="Çözüm Fotoğrafı"
                      loading="lazy"
                      className="w-full h-36 object-cover rounded-lg border border-emerald-300/60 dark:border-emerald-700/60 cursor-zoom-in"
                      onClick={() => {
                        setPreviewModalImg(task.afterImgUrl);
                        setPreviewModalTitle(
                          lang === "en" ? "Fix Solution Proof" : "Düzeltme Çözüm Kanıtı"
                        );
                      }}
                    />
                  </div>
                )}

                {/* Description */}
                {task.desc && (
                  <div className="mb-3">
                    <p
                      className={`text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed ${
                        isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                      }`}
                    >
                      {task.desc}
                    </p>
                    {task.desc.length > 90 && (
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="text-blue-600 dark:text-blue-400 text-xs font-bold mt-1 inline-flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <span>
                          {isExpanded
                            ? (lang === "en" ? "Show less" : "Kısalt")
                            : (lang === "en" ? "Read full description" : "Devamını oku")}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Specialist / Inspector Note callout */}
                {(task.modNote || task.inspectorNote) && (
                  <div className="mb-3 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
                    <div className="font-bold flex items-center gap-1 mb-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{lang === "en" ? "Safety Specialist Note:" : "İSG Uzmanı Notu:"}</span>
                    </div>
                    <p className="font-medium">{task.modNote || task.inspectorNote}</p>
                  </div>
                )}

                {/* Chief Note */}
                {task.chiefNote && (
                  <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                      {lang === "en" ? "Your Solution Note:" : "Şef Çözüm Notunuz:"}
                    </div>
                    <p className="font-medium">{task.chiefNote}</p>
                  </div>
                )}
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {(task.status === "acik" || task.status === "itiraz_edildi") ? (
                  <div className="flex gap-2">
                    {/* Primary Button: "Düzelttim" */}
                    <button
                      type="button"
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          taskId: task.id,
                          type: "fix",
                        })
                      }
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{t("i_fixed_it") || (lang === "en" ? "I Fixed It" : "Düzelttim")}</span>
                    </button>

                    {/* Secondary Button: "İtiraz Et" */}
                    <button
                      type="button"
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          taskId: task.id,
                          type: "object",
                        })
                      }
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-300 dark:hover:border-rose-900/60 text-slate-600 dark:text-slate-400 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{t("object_btn") || (lang === "en" ? "Object" : "İtiraz Et")}</span>
                    </button>
                  </div>
                ) : task.status === "onay_bekliyor" ? (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 animate-spin-slow" />
                    <span>
                      {lang === "en"
                        ? "Submitted for safety specialist approval"
                        : "İSG Uzmanının onayı bekleniyor"}
                    </span>
                  </div>
                ) : (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {lang === "en"
                        ? "Successfully resolved & closed"
                        : "Başarıyla giderildi ve kapatıldı"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSefiPaginating && <TaskCardSkeleton count={2} />}
      </div>

      {/* Pagination Load More */}
      <div className="mt-8">
        <PaginationControl
          currentCount={sefiTasksLimit}
          totalCount={displayTasks.length}
          pageSize={12}
          isLoading={isSefiPaginating}
          onLoadMore={handleLoadMoreSefiTasks}
          label={t("load_more_tasks") || (lang === "en" ? "Load More Violations" : "Daha Fazla İhlal Göster")}
        />
      </div>

      {/* Action Modal (Düzelttim / İtiraz Et) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    actionModal.type === "fix"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {actionModal.type === "fix" ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                    {actionModal.type === "fix"
                      ? (lang === "en" ? "Report Solution" : "Düzeltmeyi Bildir")
                      : (lang === "en" ? "Object to Violation" : "İhlale İtiraz Et")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {actionModal.type === "fix"
                      ? (lang === "en"
                          ? "Take a photo of the resolved area to submit for approval."
                          : "Giderilen alanın fotoğrafını çekerek onaya iletin.")
                      : (lang === "en"
                          ? "Explain why this violation does not belong to your unit."
                          : "İtiraz gerekçenizi ve detayları belirtiniz.")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActionModal({ isOpen: false, taskId: null, type: null });
                  setNote("");
                  setAfterImgPreview(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleActionSubmit} className="space-y-4">
              {/* Photo Input (Required for Fix) */}
              {actionModal.type === "fix" && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {t("fix_photo") || (lang === "en" ? "Fix Proof Photo (Required)" : "Çözüm Fotoğrafı (Zorunlu)")} *
                  </label>
                  <input
                    type="file"
                    id="sefCamera"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0], setAfterImgPreview);
                      }
                      e.target.value = null;
                    }}
                  />

                  {afterImgPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 group">
                      <img
                        src={afterImgPreview}
                        alt="Çözüm Fotoğrafı"
                        className="w-full h-48 object-cover"
                      />
                      <label
                        htmlFor="sefCamera"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-bold text-xs cursor-pointer gap-2"
                      >
                        <RefreshCw className="w-6 h-6" />
                        <span>{lang === "en" ? "Retake Photo" : "Fotoğrafı Değiştir"}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setAfterImgPreview(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="sefCamera"
                      className="w-full h-44 bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 cursor-pointer transition-colors group p-4 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {t("open_camera") || (lang === "en" ? "Open Camera & Take Photo" : "Kamerayı Aç / Fotoğraf Çek")}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        {lang === "en" ? "Click to capture fix proof" : "Düzeltilen alanın net fotoğrafını yükleyin"}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  {lang === "en" ? "Quick Note Suggestions:" : "Hızlı Not Seçenekleri:"}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {(actionModal.type === "fix" ? quickFixNotes : quickObjectNotes).map((qNote, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNote((prev) => (prev ? `${prev}. ${qNote}` : qNote))}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-colors border border-slate-200 dark:border-slate-700 text-left"
                    >
                      + {qNote}
                    </button>
                  ))}
                </div>

                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  {t("note") || (lang === "en" ? "Explanation / Note" : "Açıklama / Not")} *
                </label>
                <textarea
                  required
                  rows="3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none"
                  placeholder={
                    actionModal.type === "fix"
                      ? (lang === "en"
                          ? "Briefly describe the corrective action taken..."
                          : "Yapılan düzeltmeyi kısaca açıklayınız (örn: Koruyucu kapak monte edildi)...")
                      : (lang === "en"
                          ? "Enter your reason for objection..."
                          : "İtiraz nedeninizi belirtiniz...")
                  }
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionModal.type === "fix" && !afterImgPreview}
                  className={`w-full font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                    actionModal.type === "fix"
                      ? afterImgPreview
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                        : "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {actionModal.type === "fix"
                      ? (lang === "en" ? "Submit Solution for Approval" : "Çözümü Onaya Gönder")
                      : (lang === "en" ? "Send Objection to Specialist" : "İtirazı Uzmana İlet")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


const FeedbacksAdmin = () => {
  const ctx = useAppContext();
  const { db, setAdminSystemMode, t, lang = "tr" } = ctx || {};
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "feedbacks"),
      orderBy("timestamp", "desc"),
      limit(100),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedbacks(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching feedbacks:", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [db]);

  const markAsRead = async (id, currentStatus) => {
    if (currentStatus === "read") return;
    try {
      await updateDoc(doc(db, "feedbacks", id), { status: "read" });
    } catch (e) {
      console.error("Update error", e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-slide-up">
      <div className="mb-4">
        <button
          onClick={() => {
            navigate("/");
            setAdminSystemMode("home");
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm transition-all shadow-sm group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("back_to_menu") || "Ana Menüye Dön"}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex items-center">
        <MessageSquare className="w-8 h-8 text-pink-500 mr-4" />
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
          {t("feedbacks_admin_title") || "Gelen Bildirimler & Hatalar"}
        </h2>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl text-center text-gray-500 shadow-sm">
          {t("no_feedbacks_admin") || "Henüz hiç geri bildirim veya hata raporu bulunmuyor."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="text-xs text-center text-gray-400 dark:text-gray-500 mb-2">
            Silmek için sağa veya sola kaydırın
          </div>
          <AnimatePresence mode="popLayout">
            {feedbacks.map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={async (event, info) => {
                  if (info.offset.x > 100 || info.offset.x < -100) {
                    try {
                      await deleteDoc(doc(db, "feedbacks", f.id));
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                onClick={() => markAsRead(f.id, f.status)}
                className={`p-5 rounded-2xl border transition-colors cursor-pointer ${f.status === "new" ? "bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-900/30" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {f.userName}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase">
                      {f.userRole}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">
                      {f.timestamp?.toDate
                        ? f.timestamp.toDate().toLocaleString("tr-TR")
                        : "Şimdi"}
                    </span>
                    {f.status === "new" && (
                      <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Yeni
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                  {f.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
const AdminDashboard = () => {
  const ctx = useAppContext();

  const {
    currentUser,
    setCurrentUser,
    isFirebaseLoading,
    setIsFirebaseLoading,
    lang,
    setLang,
    darkMode,
    setDarkMode,
    users,
    setUsers,
    points,
    setPoints,
    pointsHistory,
    setPointsHistory,
    tasks,
    setTasks,
    loadings,
    setLoadings,
    adminSystemMode,
    setAdminSystemMode,
    pointLogs,
    adminViewMode,
    setAdminViewMode,
    selectedAdminDept,
    setSelectedAdminDept,
    selectedAdminDate,
    setSelectedAdminDate,
    selectedYuklemeDate,
    setSelectedYuklemeDate,
    previewModalImg,
    setPreviewModalImg,
    previewModalTitle,
    setPreviewModalTitle,
    t,
    toggleLang,
    getLastFridayOfCurrentMonth,
    logout,
    createTask,
    updateTaskStatus,
    createLoading,
    startLoadingProcess,
    finishLoading,
    get24HourTonnage,
    db,
    notificationStatus,
    requestNotificationPermission,
    showPdfReportModal,
    setShowPdfReportModal,
  } = ctx;

  const navigate = useNavigate();
  const location = useLocation();

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "sef",
    dept: DEPARTMENTS[0],
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: "",
    password: "",
    name: "",
  });
  const [showUpdateUserModal, setShowUpdateUserModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteUserCountdown, setDeleteUserCountdown] = useState(5);

  const [accountTab, setAccountTab] = useState("isg");
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToEditModal, setUserToEditModal] = useState(null);

  const fetchLockedAccounts = useCallback(async () => {
    const token = localStorage.getItem("isg_auth_token");
    if (!token) return;
    setLoadingLocked(true);
    try {
      const res = await fetch("/api/admin/locked-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.success) {
        setLockedAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Kilitli hesaplar alınamadı:", err);
    } finally {
      setLoadingLocked(false);
    }
  }, []);

  const handleUnlockAccount = useCallback(async (usernameToUnlock) => {
    const token = localStorage.getItem("isg_auth_token");
    if (!token) return;
    try {
      const res = await fetch("/api/admin/unlock-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: usernameToUnlock }),
      });
      const data = await res.json();
      if (data && data.success) {
        triggerHaptic("success");
        toast.success(data.message || `"${usernameToUnlock}" kilidi kaldırıldı!`);
        fetchLockedAccounts();
      } else {
        triggerHaptic("error");
        toast.error(data?.error || "Hesap kilidi kaldırılamadı.");
      }
    } catch (err) {
      triggerHaptic("error");
      toast.error("Bağlantı hatası: Kilit açılamadı.");
    }
  }, [fetchLockedAccounts]);

  // Admin kullanıcı yönetimi sekmesindeyken kilitli hesapları düzenli kontrol et
  useEffect(() => {
    if (adminViewMode === "users" && currentUser?.role === "admin") {
      fetchLockedAccounts();
      const interval = setInterval(fetchLockedAccounts, 8000);
      return () => clearInterval(interval);
    }
  }, [adminViewMode, currentUser, fetchLockedAccounts]);
  const [isgCalendarView, setIsgCalendarView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const isgCalendarMonth = isgCalendarView.month;
  const isgCalendarYear = isgCalendarView.year;

  const [historyFilter, setHistoryFilter] = useState("1");
  const [pointLogsFilter, setPointLogsFilter] = useState("all");
  const [analysisFilter, setAnalysisFilter] = useState("month");
  const [selectedAnalysisDept, setSelectedAnalysisDept] = useState(null);
  const [expandedAnalysisTaskId, setExpandedAnalysisTaskId] = useState(null);
  const [analysisSubTab, setAnalysisSubTab] = useState("overview");
  const [analysisSearchQuery, setAnalysisSearchQuery] = useState("");
  const [analysisPriorityFilter, setAnalysisPriorityFilter] = useState("all");
  const [analysisStatusFilter, setAnalysisStatusFilter] = useState("all");
  const [analysisDeptFilter, setAnalysisDeptFilter] = useState("all");
  const [deptDetailSearch, setDeptDetailSearch] = useState("");
  const [deptDetailPriorityFilter, setDeptDetailPriorityFilter] = useState("all");
  const [deptDetailStatusFilter, setDeptDetailStatusFilter] = useState("all");
  const [adminDeptFilter, setAdminDeptFilter] = useState("all");
  const [expandedAdminTaskId, setExpandedAdminTaskId] = useState(null);

  const [isgAnaTab, setIsgAnaTab] = useState("tasks"); // "tasks" | "risk" | "calendar"
  const [isgSearchQuery, setIsgSearchQuery] = useState("");
  const [isgPriorityFilter, setIsgPriorityFilter] = useState("all");
  const [isgStatusFilter, setIsgStatusFilter] = useState("all");
  const [isgDeptFilter, setIsgDeptFilter] = useState("all");
  const [isgTimeFilter, setIsgTimeFilter] = useState("all");

  const [leaderboardTab, setLeaderboardTab] = useState("ranking"); // "ranking" | "logs" | "history"
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [leaderboardScoreFilter, setLeaderboardScoreFilter] = useState("all"); // "all" | "high" | "mid" | "low"
  const [leaderboardLogType, setLeaderboardLogType] = useState("all"); // "all" | "bonus" | "penalty"
  const [leaderboardLogSearch, setLeaderboardLogSearch] = useState("");

  const [adminTasksLimit, setAdminTasksLimit] = useState(12);
  const [isAdminTasksPaginating, setIsAdminTasksPaginating] = useState(false);
  const [adminLoadingsLimit, setAdminLoadingsLimit] = useState(15);
  const [isAdminLoadingsPaginating, setIsAdminLoadingsPaginating] = useState(false);

  useEffect(() => {
    setAdminTasksLimit(12);
  }, [
    adminDeptFilter,
    selectedAdminDept,
    selectedAdminDate,
    isgAnaTab,
    isgSearchQuery,
    isgPriorityFilter,
    isgStatusFilter,
    isgDeptFilter,
    isgTimeFilter,
  ]);

  useEffect(() => {
    setAdminLoadingsLimit(15);
  }, [selectedYuklemeDate]);

  const handleLoadMoreAdminTasks = () => {
    setIsAdminTasksPaginating(true);
    setTimeout(() => {
      setAdminTasksLimit((prev) => prev + 12);
      setIsAdminTasksPaginating(false);
    }, 400);
  };

  const handleLoadMoreAdminLoadings = () => {
    setIsAdminLoadingsPaginating(true);
    setTimeout(() => {
      setAdminLoadingsLimit((prev) => prev + 15);
      setIsAdminLoadingsPaginating(false);
    }, 400);
  };
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/analysis/")) {
      const dept = decodeURIComponent(path.split("/")[2]);
      if (dept) {
        setAdminSystemMode("analysis");
        setSelectedAnalysisDept(dept);
        setAnalysisFilter("all");
      }
    } else if (path === "/") {
      setAdminSystemMode("home");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    } else if (path === "/isg") {
      setAdminSystemMode("isg");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    } else if (path === "/yukleme") {
      setAdminSystemMode("yukleme");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    } else if (path === "/users") {
      setAdminSystemMode("users");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    } else if (path === "/leaderboard") {
      setAdminSystemMode("leaderboard");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    } else if (path === "/analysis") {
      setAdminSystemMode("analysis");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    } else if (path === "/feedbacks") {
      setAdminSystemMode("feedbacks");
      setSelectedAdminDept(null);
      setSelectedAnalysisDept(null);
    }
  }, [location.pathname, setAdminSystemMode]);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusDept, setBonusDept] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusType, setBonusType] = useState("add");
  const [bonusReason, setBonusReason] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(10);

  const [expandedLoadId, setExpandedLoadId] = useState(null);
  const [yuklemeAnaTab, setYuklemeAnaTab] = useState("list");
  const [yuklemeListFilter, setYuklemeListFilter] = useState("all");
  const [yuklemeSearchQuery, setYuklemeSearchQuery] = useState("");
  const [yuklemeStatusFilter, setYuklemeStatusFilter] = useState("all");
  const [yuklemeCalendarView, setYuklemeCalendarView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const yuklemeCalendarMonth = yuklemeCalendarView.month;
  const yuklemeCalendarYear = yuklemeCalendarView.year;
  const [selectedYuklemeCountry, setSelectedYuklemeCountry] = useState(null);
  const [selectedYuklemeCompany, setSelectedYuklemeCompany] = useState(null);

  useEffect(() => {
    let timer;
    if (showDeleteUserModal && deleteUserCountdown > 0) {
      timer = setTimeout(
        () => setDeleteUserCountdown(deleteUserCountdown - 1),
        1000,
      );
    }
    return () => clearTimeout(timer);
  }, [showDeleteUserModal, deleteUserCountdown]);

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

  // Deterministic ISG Calendar Month & Year handlers
  const handleIsgPrevMonth = useCallback(() => {
    setIsgCalendarView((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const handleIsgNextMonth = useCallback(() => {
    setIsgCalendarView((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const handleIsgToday = useCallback(() => {
    const now = new Date();
    setIsgCalendarView({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const handleIsgSelectMonth = useCallback((m) => {
    const monthNum = parseInt(m, 10);
    if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
      setIsgCalendarView((prev) => ({ ...prev, month: monthNum }));
    }
  }, []);

  const handleIsgSelectYear = useCallback((y) => {
    const yearNum = parseInt(y, 10);
    if (!isNaN(yearNum)) {
      setIsgCalendarView((prev) => ({ ...prev, year: yearNum }));
    }
  }, []);

  // Deterministic Yukleme Calendar Month & Year handlers
  const handleYuklemePrevMonth = useCallback(() => {
    setYuklemeCalendarView((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const handleYuklemeNextMonth = useCallback(() => {
    setYuklemeCalendarView((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const handleYuklemeToday = useCallback(() => {
    const now = new Date();
    setYuklemeCalendarView({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const handleYuklemeSelectMonth = useCallback((m) => {
    const monthNum = parseInt(m, 10);
    if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
      setYuklemeCalendarView((prev) => ({ ...prev, month: monthNum }));
    }
  }, []);

  const handleYuklemeSelectYear = useCallback((y) => {
    const yearNum = parseInt(y, 10);
    if (!isNaN(yearNum)) {
      setYuklemeCalendarView((prev) => ({ ...prev, year: yearNum }));
    }
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (users.find((u) => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      triggerHaptic("error");
      toast.error(t("err_username_taken") || "Bu kullanıcı adı zaten kullanımda!");
      return;
    }
    const finalRole = accountTab === "yukleme" ? "yuklemeci" : newUser.role;
    const finalDept = finalRole === "sef" ? newUser.dept : null;

    try {
      const token = localStorage.getItem("isg_auth_token");
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          role: finalRole,
          dept: finalDept,
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Kullanıcı oluşturulamadı.");
      }
      triggerHaptic("success");
      toast.success("Kullanıcı ve şifresi güvenli (bcrypt) olarak oluşturuldu.");
    } catch (apiErr) {
      console.warn("API create user error:", apiErr);
      const newUserId = Date.now().toString();
      const userObj = {
        name: newUser.name,
        username: newUser.username.toLowerCase().trim(),
        role: finalRole,
        id: newUserId,
        dept: finalDept,
      };
      await setDoc(doc(db, "users", newUserId), userObj);
      triggerHaptic("success");
      toast.success("Kullanıcı oluşturuldu.");
    }

    setNewUser({
      username: "",
      password: "",
      name: "",
      role: "sef",
      dept: DEPARTMENTS[0],
    });
    setShowAddUserModal(false);
  };

  const handleUpdateUserClick = (id) => {
    setUserToUpdate(id);
    setShowUpdateUserModal(true);
  };

  const confirmUpdateUser = async () => {
    if (
      !userToUpdate ||
      !editUserForm.username ||
      !editUserForm.name
    )
      return;

    try {
      const token = localStorage.getItem("isg_auth_token");
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userToUpdate,
          name: editUserForm.name,
          username: editUserForm.username,
          password: editUserForm.password,
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Güncelleme yapılamadı.");
      }
      toast.success("Kullanıcı bilgileri ve şifresi başarıyla güncellendi.");
    } catch (apiErr) {
      console.warn("API update user error:", apiErr);
      await updateDoc(doc(db, "users", userToUpdate), {
        username: editUserForm.username,
        name: editUserForm.name,
      });
      toast.success("Kullanıcı güncellendi.");
    }

    setShowUpdateUserModal(false);
    setUserToUpdate(null);
    setEditingUserId(null);
    setUserToEditModal(null);
  };

  const handleDeleteUserClick = (id) => {
    if (id === "1") return;
    setUserToDelete(id);
    setDeleteUserCountdown(5);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || deleteUserCountdown > 0) return;
    try {
      const token = localStorage.getItem("isg_auth_token");
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: userToDelete })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Kullanıcı silinemedi.");
      }
      triggerHaptic("heavy");
      toast.success("Kullanıcı başarıyla silindi.");
    } catch (apiErr) {
      console.warn("API delete user fallback:", apiErr);
      await deleteDoc(doc(db, "users", userToDelete)).catch(() => {});
      triggerHaptic("heavy");
      toast.success("Kullanıcı silindi.");
    }
    setShowDeleteUserModal(false);
    setUserToDelete(null);
  };

  const [deleteTarget, setDeleteTarget] = useState("isg");

  const handleCustomBonus = (dept) => {
    setBonusDept(dept);
    setBonusAmount("");
    setBonusType("add");
    setBonusReason("");
    setBonusModalOpen(true);
  };

  const submitCustomBonus = async () => {
    if (!bonusAmount || !bonusReason) {
      triggerHaptic("error");
      toast.error(t("err_fill_all") || "Lütfen tüm alanları doldurun.");
      return;
    }
    const num = parseInt(bonusAmount, 10);
    if (isNaN(num) || num <= 0) {
      triggerHaptic("error");
      toast.error(
        t("err_valid_bonus") || "Geçerli ve pozitif bir puan miktarı girin.",
      );
      return;
    }

    const finalNum = bonusType === "add" ? num : -num;
    const pointsRef = doc(db, "system", "points");
    await updateDoc(pointsRef, { [bonusDept]: increment(finalNum) });

    const logRef = doc(collection(db, "point_logs"));
    await setDoc(logRef, {
      id: logRef.id,
      dept: bonusDept,
      points: finalNum,
      reason: bonusReason,
      adminName: currentUser.name,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString("tr-TR"),
    });

    triggerHaptic("success");
    toast.success(
      bonusType === "add"
        ? `${bonusDept} birimine ${num} puan eklendi.`
        : `${bonusDept} biriminden ${num} puan düşüldü.`,
    );
    setBonusModalOpen(false);
  };

  const executeHistoryDelete = async () => {
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    let cutoff = 0;
    if (historyFilter === "1") cutoff = now - 1 * oneMonth;
    else if (historyFilter === "3") cutoff = now - 3 * oneMonth;
    else if (historyFilter === "6") cutoff = now - 6 * oneMonth;

    if (deleteTarget === "isg") {
      const tasksToDelete =
        cutoff === 0 ? tasks : tasks.filter((t) => t.timestamp <= cutoff);
      for (const t of tasksToDelete) {
        await deleteDoc(doc(db, "tasks", t.id));
      }
    } else if (deleteTarget === "yukleme") {
      const loadsToDelete =
        cutoff === 0 ? loadings : loadings.filter((l) => l.timestamp <= cutoff);
      for (const l of loadsToDelete) {
        await deleteDoc(doc(db, "loadings", l.id));
      }
    }

    triggerHaptic("heavy");
    toast.success("Seçilen geçmiş kayıtlar başarıyla temizlendi.");
    setShowDeleteModal(false);
    setDeleteCountdown(10);
  };

  const getRedTaskCount = useCallback(
    (deptName) => {
      return tasks.filter(
        (t) =>
          t.dept === deptName &&
          (t.status === "acik" || t.status === "itiraz_edildi"),
      ).length;
    },
    [tasks],
  );

  const sortedDeptsAdmin = useMemo(() => {
    const depts =
      currentUser.role === "sef" ? [currentUser.dept] : [...DEPARTMENTS];
    return depts.sort((a, b) => getRedTaskCount(b) - getRedTaskCount(a));
  }, [getRedTaskCount, currentUser]);

  const renderRightPanel = () => {
    const handleExportPDF = () => {
      // html2canvas (used by html2pdf) crashes with Tailwind v4 'oklch' colors.
      // The most robust solution is using the native browser print,
      // which natively supports all CSS and provides vector text in PDF.
      window.print();
    };

    if (adminSystemMode === "analysis") {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const startOfWeek =
        startOfDay -
        (now.getDay() === 0 ? 6 : now.getDay() - 1) * 24 * 60 * 60 * 1000;
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();
      const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

      let periodTasks = tasks;
      if (analysisFilter === "day")
        periodTasks = tasks.filter((t) => t.timestamp >= startOfDay);
      else if (analysisFilter === "week")
        periodTasks = tasks.filter((t) => t.timestamp >= startOfWeek);
      else if (analysisFilter === "month")
        periodTasks = tasks.filter((t) => t.timestamp >= startOfMonth);
      else if (analysisFilter === "year")
        periodTasks = tasks.filter((t) => t.timestamp >= startOfYear);

      const periodLabel =
        analysisFilter === "day"
          ? (t("filter_today") || "Bugün")
          : analysisFilter === "week"
            ? (t("filter_this_week") || "Bu Hafta")
            : analysisFilter === "month"
              ? (t("filter_this_month") || "Bu Ay")
              : analysisFilter === "year"
                ? (t("filter_yearly") || "Bu Yıl")
                : (t("filter_all") || "Tüm Zamanlar");

      // Key Metrics
      const totalViolations = periodTasks.length;
      const resolvedTasks = periodTasks.filter(
        (t) => t.status === "cozuldu" || t.status === "kapatildi",
      );
      const openTasks = periodTasks.filter(
        (t) => t.status !== "cozuldu" && t.status !== "kapatildi",
      );
      const resolvedCount = resolvedTasks.length;
      const openCount = openTasks.length;
      const resolveRate =
        totalViolations > 0
          ? Math.round((resolvedCount / totalViolations) * 100)
          : 100;

      // Priorities
      const highPriorityTasks = periodTasks.filter(
        (t) => t.priority === "yuksek" || t.priority === "kritik",
      );
      const medPriorityTasks = periodTasks.filter(
        (t) => t.priority === "orta",
      );
      const lowPriorityTasks = periodTasks.filter(
        (t) => t.priority === "basit" || !t.priority,
      );

      const highCount = highPriorityTasks.length;
      const medCount = medPriorityTasks.length;
      const lowCount = lowPriorityTasks.length;
      const highRate =
        totalViolations > 0 ? Math.round((highCount / totalViolations) * 100) : 0;
      const medRate =
        totalViolations > 0 ? Math.round((medCount / totalViolations) * 100) : 0;
      const lowRate =
        totalViolations > 0 ? Math.round((lowCount / totalViolations) * 100) : 0;

      // Department statistics
      const deptStats = DEPARTMENTS.map((dept) => {
        const dTasks = periodTasks.filter((t) => t.dept === dept);
        const dResolved = dTasks.filter(
          (t) => t.status === "cozuldu" || t.status === "kapatildi",
        ).length;
        const dOpen = dTasks.length - dResolved;
        const dHigh = dTasks.filter(
          (t) => t.priority === "yuksek" || t.priority === "kritik",
        ).length;
        const currentPoints = points[dept] ?? 100;
        return {
          name: dept,
          total: dTasks.length,
          resolved: dResolved,
          open: dOpen,
          high: dHigh,
          points: currentPoints,
          rate: dTasks.length > 0 ? Math.round((dResolved / dTasks.length) * 100) : 100,
        };
      }).sort((a, b) => b.total - a.total);

      const maxCount = deptStats.length > 0 ? deptStats[0].total : 0;
      const mostIssuesDept = deptStats.find((d) => d.total === maxCount && maxCount > 0);
      const leastIssuesDept = [...deptStats].sort((a, b) => a.total - b.total)[0];

      // Factory avg score
      const deptPointsList = DEPARTMENTS.map((d) => points[d] ?? 100);
      const avgScore =
        deptPointsList.length > 0
          ? Math.round(
              deptPointsList.reduce((a, b) => a + b, 0) / deptPointsList.length,
            )
          : 100;

      // Detailed View: Department Drill-Down
      if (selectedAnalysisDept) {
        const deptAllTasks = periodTasks.filter((t) => t.dept === selectedAnalysisDept);
        const deptResolvedCount = deptAllTasks.filter(
          (t) => t.status === "cozuldu" || t.status === "kapatildi",
        ).length;
        const deptOpenCount = deptAllTasks.length - deptResolvedCount;
        const deptHighCount = deptAllTasks.filter(
          (t) => t.priority === "yuksek" || t.priority === "kritik",
        ).length;
        const deptCurrentPoints = points[selectedAnalysisDept] ?? 100;

        const filteredDeptTasks = deptAllTasks
          .filter((task) => {
            if (
              deptDetailPriorityFilter === "yuksek" &&
              task.priority !== "yuksek" &&
              task.priority !== "kritik"
            )
              return false;
            if (deptDetailPriorityFilter === "orta" && task.priority !== "orta")
              return false;
            if (
              deptDetailPriorityFilter === "basit" &&
              task.priority !== "basit" &&
              task.priority
            )
              return false;

            const isTaskResolved =
              task.status === "cozuldu" || task.status === "kapatildi";
            if (deptDetailStatusFilter === "open" && isTaskResolved) return false;
            if (deptDetailStatusFilter === "resolved" && !isTaskResolved)
              return false;

            if (deptDetailSearch.trim()) {
              const q = deptDetailSearch.toLowerCase().trim();
              const matchSub = task.subject?.toLowerCase().includes(q);
              const matchDesc = task.desc?.toLowerCase().includes(q);
              const matchUser = task.createdBy?.toLowerCase().includes(q);
              if (!matchSub && !matchDesc && !matchUser) return false;
            }
            return true;
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        return (
          <div
            id="analysis-report-container"
            className="space-y-6 animate-slide-up print:p-0 print:space-y-4"
          >
            {/* Header: Department Drill-Down Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button
                  onClick={() => {
                    setSelectedAnalysisDept(null);
                    setDeptDetailSearch("");
                    setDeptDetailPriorityFilter("all");
                    setDeptDetailStatusFilter("all");
                  }}
                  className="mb-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors cursor-pointer group print:hidden"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{t("back_to_analysis") || "Tüm Analizlere Dön"}</span>
                </button>

                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                        {t(getDeptKey(selectedAnalysisDept))}
                      </h2>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                          deptCurrentPoints >= 90
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : deptCurrentPoints >= 70
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {deptCurrentPoints} İSG Puanı
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {periodLabel} dönemine ait birim ihlal detayları, tutanak geçmişi ve durum dökümü
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs print:hidden"
                  title="Sayfayı Yazdır"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    setShowPdfReportModal(true);
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer print:hidden"
                >
                  <FileText className="w-4 h-4" />
                  <span>Resmi Rapor (PDF)</span>
                </button>
              </div>
            </div>

            {/* Department Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setDeptDetailStatusFilter("all")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  deptDetailStatusFilter === "all"
                    ? "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Toplam İhlal</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-gray-100 mt-1">
                  {deptAllTasks.length}
                </p>
                <span className="text-[11px] text-gray-400 font-medium">Birim Tutanakları</span>
              </div>

              <div
                onClick={() => setDeptDetailStatusFilter("open")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  deptDetailStatusFilter === "open"
                    ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Açık Riskler</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                  {deptOpenCount}
                </p>
                <span className="text-[11px] text-gray-400 font-medium">Müdahale Bekleyen</span>
              </div>

              <div
                onClick={() => setDeptDetailStatusFilter("resolved")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  deptDetailStatusFilter === "resolved"
                    ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Çözülen İhlal</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                  {deptResolvedCount}
                </p>
                <span className="text-[11px] text-gray-400 font-medium">
                  {deptAllTasks.length > 0
                    ? `%{Math.round((deptResolvedCount / deptAllTasks.length) * 100)} Başarı`
                    : "%100 Başarı"}
                </span>
              </div>

              <div
                onClick={() => setDeptDetailPriorityFilter("yuksek")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  deptDetailPriorityFilter === "yuksek"
                    ? "bg-rose-50/80 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/20"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Yüksek Risk</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <p className="text-2xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
                  {deptHighCount}
                </p>
                <span className="text-[11px] text-gray-400 font-medium">Acil / Kritik</span>
              </div>
            </div>

            {/* Department Search & Filters Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-3.5 print:hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deptDetailSearch}
                    onChange={(e) => setDeptDetailSearch(e.target.value)}
                    placeholder="Tutanak ara (konu, açıklama, denetleyen)..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {deptDetailSearch && (
                    <button
                      onClick={() => setDeptDetailSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Priority Selector */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1 rounded-2xl border border-gray-200/80 dark:border-gray-600 shadow-inner flex-wrap gap-1">
                  {[
                    { id: "all", label: "Tümü" },
                    { id: "yuksek", label: "Yüksek" },
                    { id: "orta", label: "Orta" },
                    { id: "basit", label: "Basit" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setDeptDetailPriorityFilter(p.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        deptDetailPriorityFilter === p.id
                          ? "bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Department Tasks List */}
            {filteredDeptTasks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-base">
                  Filtrelere Uygun Tutanak Bulunamadı
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                  Arama kriterlerinizi değiştirerek veya filtreleri temizleyerek diğer tutanakları görüntüleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                {filteredDeptTasks.map((task) => {
                  const isExpanded = expandedAnalysisTaskId === task.id;
                  const isResolved =
                    task.status === "cozuldu" || task.status === "kapatildi";
                  const priorityMeta =
                    PRIORITIES[task.priority] || PRIORITIES["basit"];

                  return (
                    <div
                      key={task.id}
                      className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 shadow-xs ${
                        isExpanded
                          ? "border-indigo-300 dark:border-indigo-500/60 ring-2 ring-indigo-500/10 shadow-md"
                          : "border-gray-200/90 dark:border-gray-700/80 hover:border-indigo-200 dark:hover:border-indigo-600/50 hover:shadow-sm"
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${priorityMeta.color}`}
                            >
                              {t(priorityMeta.label_key) ||
                                (task.priority === "yuksek" || task.priority === "kritik"
                                  ? "Yüksek Öncelik"
                                  : task.priority === "orta"
                                    ? "Orta Öncelik"
                                    : "Basit Öncelik")}
                            </span>
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                                isResolved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              }`}
                            >
                              {isResolved ? "Çözüldü" : "Açık İhlal"}
                            </span>
                          </div>

                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center font-mono tabular-nums">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {new Date(task.timestamp).toLocaleDateString(
                              lang === "tr" ? "tr-TR" : "en-US",
                              { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>

                        <div
                          className="cursor-pointer"
                          onClick={() =>
                            setExpandedAnalysisTaskId(
                              isExpanded ? null : task.id,
                            )
                          }
                        >
                          <h4 className="text-base font-extrabold text-gray-900 dark:text-gray-100 flex items-start justify-between gap-2">
                            <span className="leading-snug">
                              {task.subject ||
                                (task.desc
                                  ? task.desc.substring(0, 50) + "..."
                                  : t("no_subject") || "İSG İhlal Tutanağı")}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                            )}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {task.desc}
                          </p>
                        </div>

                        {/* Expandable Photo & Inspection Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/80 animate-fade-in space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                              {task.desc}
                            </div>

                            {task.imgUrl && (
                              <div
                                className="relative group cursor-pointer overflow-hidden rounded-xl aspect-video bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                                onClick={() => setPreviewModalImg(task.imgUrl)}
                              >
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  src={task.imgUrl}
                                  alt="İhlal Fotoğrafı"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                                  <Maximize2 className="w-4 h-4" />
                                  <span>Büyük Görseli Aç</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                              <span className="flex items-center font-medium">
                                <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                Denetleyen: {task.createdBy || "İSG Uzmanı"}
                              </span>
                              {task.resolvedAt && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Çözüm: {new Date(task.resolvedAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      // Main Analysis View
      const filteredRecords = periodTasks
        .filter((task) => {
          if (
            analysisPriorityFilter === "yuksek" &&
            task.priority !== "yuksek" &&
            task.priority !== "kritik"
          )
            return false;
          if (analysisPriorityFilter === "orta" && task.priority !== "orta")
            return false;
          if (
            analysisPriorityFilter === "basit" &&
            task.priority !== "basit" &&
            task.priority
          )
            return false;

          const isTaskResolved =
            task.status === "cozuldu" || task.status === "kapatildi";
          if (analysisStatusFilter === "open" && isTaskResolved) return false;
          if (analysisStatusFilter === "resolved" && !isTaskResolved)
            return false;

          if (analysisDeptFilter !== "all" && task.dept !== analysisDeptFilter)
            return false;

          if (analysisSearchQuery.trim()) {
            const q = analysisSearchQuery.toLowerCase().trim();
            const matchSub = task.subject?.toLowerCase().includes(q);
            const matchDesc = task.desc?.toLowerCase().includes(q);
            const matchDept = task.dept?.toLowerCase().includes(q);
            const matchUser = task.createdBy?.toLowerCase().includes(q);
            if (!matchSub && !matchDesc && !matchDept && !matchUser)
              return false;
          }
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      return (
        <div
          id="analysis-report-container"
          className="space-y-6 animate-slide-up print:p-0 print:space-y-4"
        >
          {/* Executive Header & Action Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <button
                onClick={() => {
                  navigate("/");
                  setAdminSystemMode("home");
                  setSelectedAdminDept(null);
                  setSelectedAnalysisDept(null);
                }}
                className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 transition-colors cursor-pointer group print:hidden"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>{t("back_to_menu") || "Ana Menüye Dön"}</span>
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {t("module_analysis_title") || "Analiz & Yönetim Raporları"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    İhlal dağılımları, risk seviyeleri, birim trendleri ve resmi denetim raporları
                  </p>
                </div>
              </div>
            </div>

            {/* Timeframe & PDF Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto print:hidden">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Sayfayı Yazdır"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("medium");
                  setShowPdfReportModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                title="Resmi İSG ve Sevkiyat PDF Yönetim Raporu Oluşturucu"
              >
                <FileText className="w-4 h-4" />
                <span>Resmi Yönetim Raporu (PDF)</span>
              </button>
            </div>
          </div>

          {/* Timeframe & Sub-Navigation Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-3xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm print:hidden">
            {/* Timeframe Pills */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-600 shadow-inner overflow-x-auto gap-1">
              {[
                { id: "day", label: t("filter_today") || "Bugün" },
                { id: "week", label: t("filter_this_week") || "Bu Hafta" },
                { id: "month", label: t("filter_this_month") || "Bu Ay" },
                { id: "year", label: t("filter_yearly") || "Bu Yıl" },
                { id: "all", label: t("filter_all") || "Tümü" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    triggerHaptic("light");
                    setAnalysisFilter(filter.id);
                  }}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    analysisFilter === filter.id
                      ? "bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Segmented Sub-Tab Selector */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-600 shadow-inner overflow-x-auto gap-1">
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setAnalysisSubTab("overview");
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  analysisSubTab === "overview"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Birim Dağılımı</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setAnalysisSubTab("priorities");
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  analysisSubTab === "priorities"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Risk & Öncelik</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setAnalysisSubTab("records");
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  analysisSubTab === "records"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>İhlal Tutanakları ({totalViolations})</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => {
                triggerHaptic("light");
                setAnalysisSubTab("overview");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                analysisSubTab === "overview"
                  ? "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Toplam İhlal</span>
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-gray-100 mt-1">
                {totalViolations}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Kayıtlı İSG Tutanak</span>
            </div>

            <div
              onClick={() => {
                triggerHaptic("light");
                setAnalysisSubTab("records");
                setAnalysisStatusFilter("resolved");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                analysisSubTab === "records" && analysisStatusFilter === "resolved"
                  ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Çözülenler</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {resolvedCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">%{resolveRate} Başarı Oranı</span>
            </div>

            <div
              onClick={() => {
                triggerHaptic("light");
                setAnalysisSubTab("records");
                setAnalysisStatusFilter("open");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                analysisSubTab === "records" && analysisStatusFilter === "open"
                  ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Açık Riskler</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {openCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Müdahale Bekleyen</span>
            </div>

            <div
              onClick={() => {
                if (mostIssuesDept) {
                  triggerHaptic("medium");
                  setSelectedAnalysisDept(mostIssuesDept.name);
                }
              }}
              className="p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-rose-300 dark:hover:border-rose-700 shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>En Riskli Birim</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 truncate">
                {mostIssuesDept ? t(getDeptKey(mostIssuesDept.name)) : "Sıfır Risk"}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">
                {mostIssuesDept ? `${maxCount} İhlal Kaydı` : "Tüm Birimler Temiz"}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>İSG Skoru</span>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <p className="text-2xl font-black font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1">
                {avgScore}
                <span className="text-xs text-gray-400 font-bold ml-1">/100</span>
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Fabrika Ortalaması</span>
            </div>
          </div>

          {/* Dedicated Official PDF Report Center Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-base">
                  Resmi Denetim & Sevkiyat Rapor Merkezi
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 max-w-2xl leading-relaxed">
                  Fabrika saha İSG denetimleri, açık ve çözülen ihlaller, kantar tonaj dökümleri ve departman puanlarını içeren 2 sayfalık resmi yönetim raporunu buradan oluşturup indirebilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("medium");
                setShowPdfReportModal(true);
              }}
              className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Yönetim Raporunu Aç (PDF)</span>
            </button>
          </div>

          {/* Sub-Tab 1: Department Distribution & Overview */}
          {analysisSubTab === "overview" && (
            <div className="space-y-6">
              {totalViolations === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
                    <ShieldCheck className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                    Tebrikler! Seçilen Dönemde Sıfır İhlal Kaydı
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md">
                    Seçilen dönemde ({periodLabel}) herhangi bir iş güvenliği ihlali kaydedilmemiştir. Fabrika genelinde tüm birimler kurallara tam uyumlu çalıştı.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Sıfır Kaza & İhlal Standartları Karşılandı
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Insights Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/40 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                        <span>En Yüksek Risk Odağı</span>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-gray-100 truncate">
                        {mostIssuesDept ? t(getDeptKey(mostIssuesDept.name)) : "-"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Toplam {maxCount} İhlal</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {totalViolations > 0 ? `%{Math.round((maxCount / totalViolations) * 100)} Pay` : "%0"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                        <span>En Güvenli / Uyumlu Birim</span>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-gray-100 truncate">
                        {leastIssuesDept ? t(getDeptKey(leastIssuesDept.name)) : "-"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{leastIssuesDept?.total ?? 0} İhlal</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {leastIssuesDept?.points ?? 100} İSG Puanı
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
                        <span>Çözüm ve Kapatma Hızı</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                        %{resolveRate} Kapatma Oranı
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{resolvedCount} / {totalViolations} İhlal</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {openCount} Açık Risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts BarChart Card */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                          Birimler Arası İhlal Dağılımı ({periodLabel})
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Departman bazında tespit edilen iş güvenliği ihlal sayıları
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          En Çok İhlal
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          Aktif İhlal
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Sıfır İhlal
                        </span>
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto pb-2">
                      <div className="h-80 min-w-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={deptStats.map((item) => ({
                              name: t(getDeptKey(item.name)),
                              total: item.total,
                              resolved: item.resolved,
                              open: item.open,
                              fullName: item.name,
                            }))}
                            margin={{ top: 10, right: 10, left: -20, bottom: 60 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={darkMode ? "#374151" : "#F3F4F6"}
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: darkMode ? "#9CA3AF" : "#6B7280",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: darkMode ? "#9CA3AF" : "#6B7280",
                                fontSize: 11,
                              }}
                            />
                            <Tooltip
                              cursor={{ fill: darkMode ? "#1F2937" : "#F8FAFC" }}
                              contentStyle={{
                                backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                                borderRadius: "16px",
                                border: darkMode ? "1px solid #374151" : "1px solid #E5E7EB",
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                              }}
                              formatter={(value) => [value, "İhlal Sayısı"]}
                              labelStyle={{
                                color: darkMode ? "#F3F4F6" : "#111827",
                                fontWeight: 800,
                                marginBottom: "4px",
                              }}
                            />
                            <Bar
                              dataKey="total"
                              radius={[6, 6, 0, 0]}
                              onClick={(entry) => {
                                if (entry?.fullName) {
                                  setSelectedAnalysisDept(entry.fullName);
                                }
                              }}
                              className="cursor-pointer"
                            >
                              {deptStats.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.total === maxCount && maxCount > 0
                                      ? "#EF4444"
                                      : entry.total > 0
                                        ? "#6366F1"
                                        : "#10B981"
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Department Ranking & Comparison Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                          Birim Sıralaması & Detaylı Karşılaştırma
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Tüm fabrikadaki birimlerin risk oranları ve başarı durumları
                        </p>
                      </div>

                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {DEPARTMENTS.length} Birim
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {deptStats.map((item, index) => {
                        const isZero = item.total === 0;
                        const isHigh = item.total === maxCount && maxCount > 0;
                        const widthPct = maxCount > 0 ? (item.total / maxCount) * 100 : 0;

                        return (
                          <div
                            key={item.name}
                            onClick={() => setSelectedAnalysisDept(item.name)}
                            className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                  index === 0 && maxCount > 0
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                    : isZero
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                #{index + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-base font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {t(getDeptKey(item.name))}
                                  </span>
                                  <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      item.points >= 90
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : item.points >= 70
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                    }`}
                                  >
                                    {item.points} Puan
                                  </span>
                                </div>

                                {/* Progress meter */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 max-w-md overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      isZero
                                        ? "bg-emerald-500"
                                        : isHigh
                                          ? "bg-rose-500"
                                          : item.total <= 2
                                            ? "bg-amber-500"
                                            : "bg-indigo-500"
                                    }`}
                                    style={{ width: `${Math.max(widthPct, isZero ? 100 : 8)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right side stats & action */}
                            <div className="flex items-center justify-between md:justify-end gap-6 text-xs shrink-0">
                              <div className="text-left md:text-right">
                                <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100 font-mono tabular-nums block">
                                  {item.total} İhlal
                                </span>
                                <span className="text-gray-400 font-medium">
                                  {item.open} Açık · {item.resolved} Çözüldü
                                </span>
                              </div>

                              <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                                <span className="hidden sm:inline mr-1">Detay</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sub-Tab 2: Priorities & Risk Matrix */}
          {analysisSubTab === "priorities" && (
            <div className="space-y-6">
              {/* Severity Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Yüksek Öncelik */}
                <div
                  onClick={() => {
                    setAnalysisSubTab("records");
                    setAnalysisPriorityFilter("yuksek");
                  }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-rose-200/80 dark:border-rose-900/60 shadow-sm hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shadow-xs">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        3x Ceza Katsayısı
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-gray-900 dark:text-gray-100">
                      Yüksek Risk (Acil İSG)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Hayati tehlike, uzuv kaybı riski, yangın veya yüksekten düşme tehlikesi gibi acil müdahale gerektiren durumlar.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
                        {highCount}
                      </span>
                      <span className="text-xs text-gray-400 block mt-0.5">
                        %{highRate} Pay
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      Kayıtları Gör <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Orta Öncelik */}
                <div
                  onClick={() => {
                    setAnalysisSubTab("records");
                    setAnalysisPriorityFilter("orta");
                  }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-amber-200/80 dark:border-amber-900/60 shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shadow-xs">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        2x Ceza Katsayısı
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-gray-900 dark:text-gray-100">
                      Orta Risk (Önemli Uyarı)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      KKD eksikliği, nizami olmayan istifleme, makine koruyucu eksikliği veya geçici güvensiz davranışlar.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {medCount}
                      </span>
                      <span className="text-xs text-gray-400 block mt-0.5">
                        %{medRate} Pay
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      Kayıtları Gör <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Basit Öncelik */}
                <div
                  onClick={() => {
                    setAnalysisSubTab("records");
                    setAnalysisPriorityFilter("basit");
                  }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-blue-200/80 dark:border-blue-900/60 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shadow-xs">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        1x Ceza Katsayısı
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-gray-900 dark:text-gray-100">
                      Basit Risk (Tertip & Düzen)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Saha temizliği, malzeme dağınıklığı, uyarı levhası eksikliği veya genel düzen ile ilgili hafif durumlar.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400">
                        {lowCount}
                      </span>
                      <span className="text-xs text-gray-400 block mt-0.5">
                        %{lowRate} Pay
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Kayıtları Gör <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Distribution Gauge */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                      Risk Dağılım Ölçeği ({periodLabel})
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Toplam {totalViolations} ihlalin öncelik seviyelerine göre orantısal payı
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    Ağırlıklı Ceza Katsayısı: 3x · 2x · 1x
                  </span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-2xl h-4 overflow-hidden flex shadow-inner">
                  {highRate > 0 && (
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${highRate}%` }}
                      title={`Yüksek Risk: ${highCount} (${highRate}%)`}
                    />
                  )}
                  {medRate > 0 && (
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{ width: `${medRate}%` }}
                      title={`Orta Risk: ${medCount} (${medRate}%)`}
                    />
                  )}
                  {lowRate > 0 && (
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${lowRate}%` }}
                      title={`Basit Risk: ${lowCount} (${lowRate}%)`}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Yüksek Risk: {highCount} adet (%{highRate})
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Orta Risk: {medCount} adet (%{medRate})
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Basit Risk: {lowCount} adet (%{lowRate})
                  </span>
                </div>
              </div>

              {/* High Priority Urgent Action Panel */}
              {highPriorityTasks.length > 0 && (
                <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 border border-rose-200/80 dark:border-rose-900/60 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-rose-900 dark:text-rose-200 text-base">
                          Acil Müdahale Gerektiren Yüksek Riskli İhlaller
                        </h4>
                        <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                          Aşağıdaki maddeler derhal giderilmelidir ve 3x ceza katsayısına tabidir.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black px-3 py-1 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-full">
                      {highPriorityTasks.length} Tutanak
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {highPriorityTasks.slice(0, 6).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedAnalysisDept(task.dept)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                            {t(getDeptKey(task.dept))}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                            {new Date(task.timestamp).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                          {task.subject || task.desc}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {task.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 3: Full Detailed Incident Logs & Search */}
          {analysisSubTab === "records" && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-3.5 print:hidden">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={analysisSearchQuery}
                      onChange={(e) => setAnalysisSearchQuery(e.target.value)}
                      placeholder="Tutanaklarda ara (konu, açıklama, birim, denetleyen)..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {analysisSearchQuery && (
                      <button
                        onClick={() => setAnalysisSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Department Select Dropdown */}
                  <div className="w-full md:w-56 shrink-0">
                    <select
                      value={analysisDeptFilter}
                      onChange={(e) => setAnalysisDeptFilter(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    >
                      <option value="all">Tüm Birimler ({DEPARTMENTS.length})</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {t(getDeptKey(dept))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority & Status Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                  {/* Priority selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 mr-1">Öncelik:</span>
                    {[
                      { id: "all", label: "Tümü" },
                      { id: "yuksek", label: "Yüksek" },
                      { id: "orta", label: "Orta" },
                      { id: "basit", label: "Basit" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setAnalysisPriorityFilter(p.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          analysisPriorityFilter === p.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Status selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 mr-1">Durum:</span>
                    {[
                      { id: "all", label: "Tümü" },
                      { id: "open", label: "Açık Riskler" },
                      { id: "resolved", label: "Çözülenler" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setAnalysisStatusFilter(s.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          analysisStatusFilter === s.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Records Counter */}
              <div className="flex items-center justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold">
                  Toplam <span className="font-bold text-gray-800 dark:text-gray-200 font-mono tabular-nums">{filteredRecords.length}</span> tutanak listeleniyor
                </span>
                {(analysisSearchQuery ||
                  analysisPriorityFilter !== "all" ||
                  analysisStatusFilter !== "all" ||
                  analysisDeptFilter !== "all") && (
                  <button
                    onClick={() => {
                      setAnalysisSearchQuery("");
                      setAnalysisPriorityFilter("all");
                      setAnalysisStatusFilter("all");
                      setAnalysisDeptFilter("all");
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Filtreleri Sıfırla
                  </button>
                )}
              </div>

              {/* Incidents Cards Grid */}
              {filteredRecords.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5">
                    <List className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-base">
                    Filtrelere Uygun Tutanak Bulunamadı
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                    Arama kriterlerinizi değiştirerek veya filtreleri temizleyerek diğer tutanakları görüntüleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecords.map((task) => {
                    const isExpanded = expandedAnalysisTaskId === task.id;
                    const isResolved =
                      task.status === "cozuldu" || task.status === "kapatildi";
                    const priorityMeta =
                      PRIORITIES[task.priority] || PRIORITIES["basit"];

                    return (
                      <div
                        key={task.id}
                        className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 shadow-xs ${
                          isExpanded
                            ? "border-indigo-300 dark:border-indigo-500/60 ring-2 ring-indigo-500/10 shadow-md"
                            : "border-gray-200/90 dark:border-gray-700/80 hover:border-indigo-200 dark:hover:border-indigo-600/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${priorityMeta.color}`}
                              >
                                {t(priorityMeta.label_key) ||
                                  (task.priority === "yuksek" || task.priority === "kritik"
                                    ? "Yüksek"
                                    : task.priority === "orta"
                                      ? "Orta"
                                      : "Basit")}
                              </span>

                              <span
                                onClick={() => setSelectedAnalysisDept(task.dept)}
                                className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                title="Birim detaylarına git"
                              >
                                {t(getDeptKey(task.dept))}
                              </span>

                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                                  isResolved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                }`}
                              >
                                {isResolved ? "Çözüldü" : "Açık Risk"}
                              </span>
                            </div>

                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center font-mono tabular-nums shrink-0">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {new Date(task.timestamp).toLocaleDateString(
                                lang === "tr" ? "tr-TR" : "en-US",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          </div>

                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              setExpandedAnalysisTaskId(
                                isExpanded ? null : task.id,
                              )
                            }
                          >
                            <h4 className="text-base font-extrabold text-gray-900 dark:text-gray-100 flex items-start justify-between gap-2">
                              <span className="leading-snug">
                                {task.subject ||
                                  (task.desc
                                    ? task.desc.substring(0, 50) + "..."
                                    : t("no_subject") || "İSG İhlal Tutanağı")}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                              )}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.desc}
                            </p>
                          </div>

                          {/* Expandable Photo & Inspection Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/80 animate-fade-in space-y-3">
                              <div className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                {task.desc}
                              </div>

                              {task.imgUrl && (
                                <div
                                  className="relative group cursor-pointer overflow-hidden rounded-xl aspect-video bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                                  onClick={() => setPreviewModalImg(task.imgUrl)}
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    src={task.imgUrl}
                                    alt="İhlal Fotoğrafı"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Büyük Görseli Aç</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                                <span className="flex items-center font-medium">
                                  <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                  Denetleyen: {task.createdBy || "İSG Uzmanı"}
                                </span>
                                {task.resolvedAt && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Çözüm: {new Date(task.resolvedAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (adminSystemMode === "leaderboard") {
      const deptsList = Object.keys(points).filter(
        (key) => key !== "lastDailyBonus" && key !== "lastBonusTimestamp"
      );
      DEPARTMENTS.forEach((d) => {
        if (!deptsList.includes(d)) deptsList.push(d);
      });
      const sortedDepts = deptsList.sort((a, b) => (points[b] ?? 100) - (points[a] ?? 100));

      const topDept = sortedDepts[0] || DEPARTMENTS[0];
      const topDeptScore = points[topDept] ?? 100;
      const allScores = sortedDepts.map((d) => points[d] ?? 100);
      const avgScore =
        allScores.length > 0
          ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
          : "100.0";
      const cleanDepts = sortedDepts.filter((d) =>
        !tasks.some((t) => t.dept === d && (t.status === "acik" || t.status === "itiraz_edildi"))
      );
      const openIssueDepts = sortedDepts.filter((d) =>
        tasks.some((t) => t.dept === d && (t.status === "acik" || t.status === "itiraz_edildi"))
      );
      const cleanDeptCount = cleanDepts.length;
      const openIssueDeptCount = openIssueDepts.length;

      const executeResetAndSave = async () => {
        const now = new Date();
        const monthStr = `${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}`;

        const pointsToSave = {};
        Object.keys(points).forEach((k) => {
          if (k !== "lastDailyBonus" && k !== "lastBonusTimestamp")
            pointsToSave[k] = points[k];
        });

        const historyRef = doc(db, "system", "points_history");
        await setDoc(historyRef, { [monthStr]: pointsToSave }, { merge: true });

        const initialPoints = DEPARTMENTS.reduce((acc, dept) => {
          acc[dept] = 100;
          return acc;
        }, {});
        initialPoints.lastDailyBonus = points.lastDailyBonus;
        await updateDoc(doc(db, "system", "points"), initialPoints);
        setShowResetModal(false);
        setResetCountdown(10);
        triggerHaptic("heavy");
        toast.success(
          t("success_reset") ||
            "Geçmiş başarıyla kaydedildi ve tüm puanlar sıfırlandı!"
        );
      };

      // Filtered Departments for Tab 1
      const filteredDepts = sortedDepts.filter((dept) => {
        const hasOpenTasks = tasks.some(
          (t) => t.dept === dept && (t.status === "acik" || t.status === "itiraz_edildi")
        );
        if (leaderboardScoreFilter === "zero_open" && hasOpenTasks) return false;
        if (leaderboardScoreFilter === "has_open" && !hasOpenTasks) return false;

        if (leaderboardSearch.trim()) {
          const q = leaderboardSearch.toLowerCase().trim();
          const deptName = t(getDeptKey(dept)).toLowerCase();
          const rawDept = dept.toLowerCase();
          if (!deptName.includes(q) && !rawDept.includes(q)) return false;
        }
        return true;
      });

      // Filtered Point Logs for Tab 2
      const filteredPointLogs = (pointLogs || []).filter((log) => {
        if (pointLogsFilter !== "all") {
          const now = new Date();
          if (pointLogsFilter === "day") {
            const startOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            ).getTime();
            if (log.timestamp < startOfDay) return false;
          } else if (pointLogsFilter === "week") {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(now.setDate(diff)).setHours(0, 0, 0, 0);
            if (log.timestamp < startOfWeek) return false;
          } else if (pointLogsFilter === "month") {
            const startOfMonth = new Date(
              now.getFullYear(),
              now.getMonth(),
              1
            ).getTime();
            if (log.timestamp < startOfMonth) return false;
          }
        }

        if (leaderboardLogType === "bonus" && log.points < 0) return false;
        if (leaderboardLogType === "penalty" && log.points >= 0) return false;

        if (leaderboardLogSearch.trim()) {
          const q = leaderboardLogSearch.toLowerCase().trim();
          const matchReason = log.reason?.toLowerCase().includes(q);
          const matchAdmin = log.adminName?.toLowerCase().includes(q);
          const matchDept = log.dept?.toLowerCase().includes(q);
          if (!matchReason && !matchAdmin && !matchDept) return false;
        }

        return true;
      });

      return (
        <div className="space-y-6 animate-slide-up">
          {/* Executive Header & Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <button
                onClick={() => {
                  navigate("/");
                  setAdminSystemMode("home");
                  setSelectedAdminDept(null);
                  setSelectedAdminDate(null);
                }}
                className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>{t("back_to_menu") || "Ana Menüye Dön"}</span>
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {t("leaderboard") || "Liderlik Tablosu & Puan Sıralaması"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Birimlerin anlık İSG performans puanları, ceza ve ödül hareketleri ile ay sonu lig durumu
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Next Reset Pill & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl shrink-0">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    {t("next_reset") || "Puan Sıfırlama"}
                  </span>
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                    {getLastFridayOfCurrentMonth()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowResetModal(true);
                  setResetCountdown(10);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>{t("save_history") || "Sıfırla ve Geçmişe Kaydet"}</span>
              </button>

              {/* Segmented View Selector */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-600 w-full sm:w-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setLeaderboardTab("ranking")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    leaderboardTab === "ranking"
                      ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Sıralama Tablosu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardTab("logs")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    leaderboardTab === "logs"
                      ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Puan Hareketleri</span>
                  {pointLogs && pointLogs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-black">
                      {pointLogs.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardTab("history")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    leaderboardTab === "history"
                      ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Geçmiş Dönemler</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip - 4 Balanced Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Lider Birim */}
            <div
              onClick={() => {
                setLeaderboardTab("ranking");
                setLeaderboardScoreFilter("all");
                setLeaderboardSearch("");
              }}
              className="p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-amber-300 dark:hover:border-amber-700/80 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Lider Birim (#1)</span>
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 leading-none tabular-nums">
                  {topDeptScore} <span className="text-xs font-bold text-gray-400">Puan</span>
                </p>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate font-bold">{t(getDeptKey(topDept))}</span>
              </div>
            </div>

            {/* Card 2: Fabrika Ortalaması */}
            <div
              onClick={() => {
                setLeaderboardTab("ranking");
                setLeaderboardScoreFilter("all");
              }}
              className="p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-emerald-300 dark:hover:border-emerald-700/80 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Fabrika Ortalaması</span>
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
                  {avgScore} <span className="text-xs font-bold text-gray-400">/ 100</span>
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Genel Birimler Skoru</span>
              </div>
            </div>

            {/* Card 3: Açık İhlalsiz Birimler */}
            <div
              onClick={() => {
                setLeaderboardTab("ranking");
                setLeaderboardScoreFilter("zero_open");
              }}
              className="p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Açık İhlalsiz</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums">
                  {cleanDeptCount} <span className="text-xs font-bold text-gray-400">Birim</span>
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Bekleyen Açık İhlali Yok</span>
              </div>
            </div>

            {/* Card 4: Açık İhlalli Birimler */}
            <div
              onClick={() => {
                setLeaderboardTab("ranking");
                setLeaderboardScoreFilter("has_open");
              }}
              className="p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-rose-300 dark:hover:border-rose-700/80 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Açık İhlali Olan</span>
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 leading-none tabular-nums">
                  {openIssueDeptCount} <span className="text-xs font-bold text-gray-400">Birim</span>
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Müdahale Bekleyen İhlaller</span>
              </div>
            </div>
          </div>

          {/* TAB 1: SIRALAMA TABLOSU */}
          {leaderboardTab === "ranking" && (
            <div className="space-y-6">
              {/* Top 3 Podium (Podyum) Showcase */}
              {sortedDepts.length >= 3 && !leaderboardSearch && leaderboardScoreFilter === "all" && (
                <div className="bg-gradient-to-b from-slate-50 to-white dark:from-gray-800/80 dark:to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/80 shadow-sm">
                  <div className="text-center mb-6">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Ayın Zirve Yarışı
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                      Şampiyonluk Podyumu
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end max-w-4xl mx-auto pt-4">
                    {/* 2nd Place (Silver) */}
                    <div className="order-2 md:order-1 bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-md flex flex-col items-center text-center relative hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-800 font-black text-lg flex items-center justify-center shadow-md mb-3 -mt-9 border-2 border-white dark:border-gray-800">
                        🥈
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/70 px-2.5 py-0.5 rounded-full mb-1">
                        2. Sıra
                      </span>
                      <h4 className="font-black text-gray-900 dark:text-gray-100 text-base mb-1 truncate max-w-full">
                        {t(getDeptKey(sortedDepts[1]))}
                      </h4>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-300 tabular-nums">
                        <CountUp end={points[sortedDepts[1]] ?? 100} duration={600} /> <span className="text-xs font-bold text-gray-400">Puan</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCustomBonus(sortedDepts[1])}
                        className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Özel Puan
                      </button>
                    </div>

                    {/* 1st Place (Gold / Champion) */}
                    <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/80 via-yellow-50/40 to-white dark:from-amber-950/30 dark:via-yellow-950/10 dark:to-gray-800 rounded-3xl p-6 border-2 border-amber-400 dark:border-amber-600 shadow-xl flex flex-col items-center text-center relative hover:-translate-y-1.5 transition-transform ring-4 ring-amber-400/10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 -mt-12 border-4 border-white dark:border-gray-800">
                        🏆
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full mb-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-600" />
                        1. Sıra (Lider)
                      </span>
                      <h4 className="font-black text-gray-900 dark:text-gray-100 text-lg mb-1 truncate max-w-full">
                        {t(getDeptKey(sortedDepts[0]))}
                      </h4>
                      <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        <CountUp end={points[sortedDepts[0]] ?? 100} duration={700} /> <span className="text-sm font-bold text-gray-400">Puan</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCustomBonus(sortedDepts[0])}
                        className="mt-3 text-xs font-bold text-amber-800 dark:text-amber-200 hover:text-white py-1.5 px-4 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-600 dark:hover:bg-amber-600 transition-colors shadow-xs cursor-pointer"
                      >
                        Özel Puan Ekle
                      </button>
                    </div>

                    {/* 3rd Place (Bronze) */}
                    <div className="order-3 bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-amber-200/60 dark:border-amber-900/40 shadow-md flex flex-col items-center text-center relative hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-400 text-white font-black text-lg flex items-center justify-center shadow-md mb-3 -mt-9 border-2 border-white dark:border-gray-800">
                        🥉
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full mb-1">
                        3. Sıra
                      </span>
                      <h4 className="font-black text-gray-900 dark:text-gray-100 text-base mb-1 truncate max-w-full">
                        {t(getDeptKey(sortedDepts[2]))}
                      </h4>
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-400 tabular-nums">
                        <CountUp end={points[sortedDepts[2]] ?? 100} duration={600} /> <span className="text-xs font-bold text-gray-400">Puan</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCustomBonus(sortedDepts[2])}
                        className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                      >
                        Özel Puan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search & Score Filter Toolbar */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={leaderboardSearch}
                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                    placeholder="Birim adı ile filtrele..."
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                  {leaderboardSearch && (
                    <button
                      type="button"
                      onClick={() => setLeaderboardSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Score Filter Dropdown & Clear */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={leaderboardScoreFilter}
                    onChange={(e) => setLeaderboardScoreFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  >
                    <option value="all">Tüm Birimler ({sortedDepts.length})</option>
                    <option value="zero_open">Aktif İhlali Olmayanlar ({cleanDeptCount})</option>
                    <option value="has_open">Açık İhlali Bulunanlar ({openIssueDeptCount})</option>
                  </select>

                  {(leaderboardSearch || leaderboardScoreFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setLeaderboardSearch("");
                        setLeaderboardScoreFilter("all");
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Filtreyi Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Department Rankings List */}
              <div className="space-y-3">
                {filteredDepts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
                    <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h4 className="font-extrabold text-gray-800 dark:text-gray-100">
                      Birim Bulunamadı
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Arama kriterlerinize uygun departman bulunamadı.
                    </p>
                  </div>
                ) : (
                  filteredDepts.map((dept) => {
                    const originalRank = sortedDepts.indexOf(dept) + 1;
                    const deptScore = points[dept] ?? 100;
                    const openTaskCount = tasks.filter(
                      (t) => t.dept === dept && (t.status === "acik" || t.status === "itiraz_edildi")
                    ).length;

                    const isTop1 = originalRank === 1;
                    const isTop2 = originalRank === 2;
                    const isTop3 = originalRank === 3;

                    return (
                      <div
                        key={dept}
                        className={`bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md ${
                          isTop1
                            ? "border-amber-300 dark:border-amber-700/80 bg-gradient-to-r from-amber-50/40 via-white to-white dark:from-amber-950/10 dark:via-gray-800 dark:to-gray-800"
                            : "border-gray-200/90 dark:border-gray-700/80 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        {/* Left Info: Rank & Dept */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                              isTop1
                                ? "bg-amber-500 text-white shadow-amber-500/30"
                                : isTop2
                                  ? "bg-slate-400 text-white shadow-slate-400/30"
                                  : isTop3
                                    ? "bg-amber-700 text-white shadow-amber-700/30"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${originalRank}`}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-gray-900 dark:text-gray-100 text-base truncate">
                                {t(getDeptKey(dept))}
                              </h4>
                              {openTaskCount > 0 ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg border bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shrink-0 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  {openTaskCount} Açık İhlal
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shrink-0">
                                  Açık İhlal Yok
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
                                {openTaskCount > 0 ? (
                                  <b className="text-rose-600 dark:text-rose-400">{openTaskCount} Müdahale Bekleyen Tutanak</b>
                                ) : (
                                  <span className="text-slate-600 dark:text-slate-400 font-medium">Birim Sahası Temiz</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Info: Score & Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700/60">
                          <button
                            type="button"
                            onClick={() => handleCustomBonus(dept)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer shrink-0"
                          >
                            {t("custom_bonus") || "Özel Puan"}
                          </button>

                          <div className="text-right shrink-0">
                            <span className="text-2xl sm:text-3xl font-black tabular-nums text-slate-800 dark:text-slate-100">
                              <CountUp end={deptScore} duration={600} />
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                              {t("risk") || "Puan"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PUAN HAREKETLERİ */}
          {leaderboardTab === "logs" && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={leaderboardLogSearch}
                    onChange={(e) => setLeaderboardLogSearch(e.target.value)}
                    placeholder="İşlem sebebi, yönetici veya birim adı ara..."
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                  {leaderboardLogSearch && (
                    <button
                      type="button"
                      onClick={() => setLeaderboardLogSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Type Filter */}
                  <select
                    value={leaderboardLogType}
                    onChange={(e) => setLeaderboardLogType(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  >
                    <option value="all">Tüm İşlemler</option>
                    <option value="bonus">Yalnızca Bonuslar (+)</option>
                    <option value="penalty">Yalnızca Cezalar (-)</option>
                  </select>

                  {/* Timeframe Pills */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setPointLogsFilter("all")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pointLogsFilter === "all"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_all") || "Tümü"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointLogsFilter("day")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pointLogsFilter === "day"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_today") || "Bugün"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointLogsFilter("week")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pointLogsFilter === "week"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_this_week") || "Bu Hafta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointLogsFilter("month")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pointLogsFilter === "month"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_this_month") || "Bu Ay"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Stream */}
              <div className="space-y-3">
                {filteredPointLogs.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
                    <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h4 className="font-extrabold text-gray-800 dark:text-gray-100">
                      Puan Hareketi Bulunmuyor
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Seçilen zaman dilimine veya filtrelere uygun puan hareketi kaydı bulunamadı.
                    </p>
                  </div>
                ) : (
                  filteredPointLogs.map((log) => {
                    const isPositive = log.points >= 0;

                    return (
                      <div
                        key={log.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                              isPositive
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-gray-900 dark:text-gray-100 text-sm">
                                {t(getDeptKey(log.dept))}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                {log.adminName || "Sistem"}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {log.dateStr}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                              "{log.reason}"
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 self-end sm:self-center">
                          <span
                            className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl shadow-xs tabular-nums flex items-center gap-1 ${
                              isPositive
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            }`}
                          >
                            {isPositive ? `+${log.points}` : log.points} Puan
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GEÇMİŞ DÖNEMLER */}
          {leaderboardTab === "history" && (
            <div className="space-y-4">
              {!pointsHistory || Object.keys(pointsHistory).length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <History className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-lg">
                    Geçmiş Dönem Kaydı Bulunmuyor
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-md mx-auto">
                    Ay sonunda sağ üstteki <b>"Sıfırla ve Geçmişe Kaydet"</b> butonuna tıkladığınızda dönemin puan sıralaması ve şampiyon birim kalıcı olarak buraya kaydedilecektir.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(pointsHistory)
                    .sort()
                    .reverse()
                    .map((monthKey) => {
                      const mPoints = pointsHistory[monthKey];
                      const mSorted = Object.keys(mPoints)
                        .filter(
                          (k) =>
                            k !== "lastDailyBonus" && k !== "lastBonusTimestamp"
                        )
                        .sort((a, b) => mPoints[b] - mPoints[a]);

                      const winnerDept = mSorted[0];
                      const winnerScore = mPoints[winnerDept];

                      return (
                        <div
                          key={monthKey}
                          className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              <h4 className="font-black text-gray-900 dark:text-gray-100 text-base">
                                {monthKey} Dönemi Sonuçları
                              </h4>
                            </div>

                            {winnerDept && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-black text-amber-800 dark:text-amber-300">
                                <span>🏆 Dönem Şampiyonu:</span>
                                <b>{t(getDeptKey(winnerDept))} ({winnerScore} Puan)</b>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {mSorted.map((d, i) => (
                              <div
                                key={d}
                                className={`p-3 rounded-2xl border flex flex-col justify-between ${
                                  i === 0
                                    ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200"
                                    : i === 1
                                      ? "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                                      : i === 2
                                        ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200"
                                        : "bg-gray-50/70 dark:bg-gray-900/40 border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span>#{i + 1}</span>
                                  {i === 0 && <span>🥇</span>}
                                  {i === 1 && <span>🥈</span>}
                                  {i === 2 && <span>🥉</span>}
                                </div>
                                <h5 className="font-extrabold text-xs truncate mt-1">
                                  {t(getDeptKey(d))}
                                </h5>
                                <p className="font-black text-sm mt-1 tabular-nums">
                                  {mPoints[d]} <span className="text-[10px] font-normal text-gray-400">p</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Reset Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-6 bg-orange-600 text-white flex justify-between items-center">
                  <h3 className="font-bold text-xl flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-2" />{" "}
                    {t("are_you_sure") || "Emin misiniz?"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetCountdown(10);
                    }}
                    className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 md:p-8 text-center space-y-6">
                  <TrendingUp className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                      {t("save_history_title") || "Puanları Sıfırla ve Kaydet"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t("save_history_desc") ||
                        "Geçerli ayın puan durumu geçmişe kaydedilecek ve tüm departmanların puanları yeniden 100 olarak sıfırlanacaktır."}
                    </p>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(false);
                        setResetCountdown(10);
                      }}
                      className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={executeResetAndSave}
                      disabled={resetCountdown > 0}
                      className={`flex-1 py-4 font-bold rounded-xl shadow-md cursor-pointer ${
                        resetCountdown > 0
                          ? "bg-orange-200 text-orange-500 cursor-not-allowed"
                          : "bg-orange-600 text-white hover:bg-orange-700"
                      }`}
                    >
                      {resetCountdown > 0
                        ? `${t("wait")} (${resetCountdown}s)`
                        : t("save_btn_confirm") || "Sıfırla ve Kaydet"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (adminViewMode === "users" || adminSystemMode === "users") {
      const chiefsCount = users.filter((u) => u.role === "sef").length;
      const modsCount = users.filter((u) => u.role === "mod").length;
      const loadersCount = users.filter((u) => u.role === "yuklemeci").length;
      const adminsCount = users.filter((u) => u.role === "admin").length;
      const lockedCount = lockedAccounts.filter((a) => a.isLocked).length;

      const filteredUsers = users.filter((u) => {
        if (userRoleFilter === "sef" && u.role !== "sef") return false;
        if (userRoleFilter === "mod" && u.role !== "mod") return false;
        if (userRoleFilter === "yuklemeci" && u.role !== "yuklemeci") return false;
        if (userRoleFilter === "admin" && u.role !== "admin") return false;

        if (userSearchQuery.trim()) {
          const q = userSearchQuery.toLowerCase().trim();
          const matchName = u.name?.toLowerCase().includes(q);
          const matchUsername = u.username?.toLowerCase().includes(q);
          const matchDept = u.dept?.toLowerCase().includes(q);
          const matchRole = u.role?.toLowerCase().includes(q);
          if (!matchName && !matchUsername && !matchDept && !matchRole) return false;
        }

        return true;
      });

      const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
          return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
      };

      const getRoleMeta = (role, dept) => {
        switch (role) {
          case "sef":
            return {
              title: "Birim Şefi",
              sub: dept ? t(getDeptKey(dept)) : "Genel",
              color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
              grad: "from-blue-600 to-indigo-600",
            };
          case "mod":
            return {
              title: "İSG Uzmanı",
              sub: "Saha Denetim & İtiraz",
              color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
              grad: "from-emerald-600 to-teal-600",
            };
          case "admin":
            return {
              title: "Sistem Yöneticisi",
              sub: "Tam Yetki & Yönetim",
              color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
              grad: "from-purple-600 to-pink-600",
            };
          case "yuklemeci":
            return {
              title: "Yükleme Sorumlusu",
              sub: "Sevkiyat & Tır",
              color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
              grad: "from-amber-500 to-orange-600",
            };
          default:
            return {
              title: role || "Personel",
              sub: dept || "Saha",
              color: "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
              grad: "from-slate-600 to-gray-700",
            };
        }
      };

      const canEdit =
        currentUser?.role === "admin" ||
        currentUser?.username === "agiradar" ||
        currentUser?.username === "agiradarsahin";

      return (
        <div className="space-y-6 animate-slide-up">
          {/* Header & Main Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                  {t("user_management") || "Kullanıcı & Şef Hesapları"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Birim şefleri, İSG uzmanı, yüklemeci ve yönetici hesaplarının merkezi yönetimi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={fetchLockedAccounts}
                disabled={loadingLocked}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Kilit durumlarını yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLocked ? "animate-spin text-blue-600" : ""}`} />
                <span className="hidden sm:inline">Güvenlik Kontrolü</span>
              </button>

              <button
                onClick={() => {
                  setNewUser({
                    username: "",
                    password: "",
                    name: "",
                    role: "sef",
                    dept: DEPARTMENTS[0],
                  });
                  setShowAddUserModal(true);
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Yeni Hesap Tanımla</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => setUserRoleFilter("all")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${userRoleFilter === "all" ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"}`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Toplam</span>
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                {users.length}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Kayıtlı Kullanıcı</span>
            </div>

            <div
              onClick={() => setUserRoleFilter("sef")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${userRoleFilter === "sef" ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"}`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Şefler</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {chiefsCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Birim Yetkilisi</span>
            </div>

            <div
              onClick={() => setUserRoleFilter("mod")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${userRoleFilter === "mod" ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"}`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>İSG Uzmanı</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {modsCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Saha Denetim</span>
            </div>

            <div
              onClick={() => setUserRoleFilter("yuklemeci")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${userRoleFilter === "yuklemeci" ? "bg-orange-50/80 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 ring-2 ring-orange-500/20" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"}`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Yükleme</span>
                <Truck className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                {loadersCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Sevkiyat Ekibi</span>
            </div>

            <div
              className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border transition-all shadow-sm ${lockedCount > 0 ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80"}`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Güvenlik</span>
                <Lock className={`w-3.5 h-3.5 ${lockedCount > 0 ? "text-red-500" : "text-emerald-500"}`} />
              </div>
              <p className={`text-2xl font-black mt-1 ${lockedCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {lockedCount > 0 ? `${lockedCount} Kilit` : "Güvende"}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">
                {lockedCount > 0 ? "İşlem Bekliyor" : "Şüpheli Giriş Yok"}
              </span>
            </div>
          </div>

          {/* Locked Accounts Alert Banner (Displays only if there are active locks) */}
          {lockedCount > 0 && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-red-900 dark:text-red-200 text-sm sm:text-base flex items-center gap-2">
                    Güvenlik Kilidi Devrede ({lockedCount} Hesap Kilitli)
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Hatalı şifre denemeleri sebebiyle otomatik kilitlenen hesapların kilidini buradan anında kaldırabilirsiniz.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {lockedAccounts.filter((a) => a.isLocked).map((acc) => (
                  <div
                    key={acc.username}
                    className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
                        @{acc.username}
                      </span>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {Math.floor(acc.remainingSeconds / 60)}:
                          {String(acc.remainingSeconds % 60).padStart(2, "0")} kaldı
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                        <span className="text-gray-400 font-normal">{acc.failedCount} Hata</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnlockAccount(acc.username)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Kilidi Aç</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Search & Role Tabs Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="İsim, kullanıcı adı (@) veya departman ara..."
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setUserRoleFilter("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${userRoleFilter === "all" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                Tümü ({users.length})
              </button>
              <button
                onClick={() => setUserRoleFilter("sef")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${userRoleFilter === "sef" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                Şefler ({chiefsCount})
              </button>
              <button
                onClick={() => setUserRoleFilter("mod")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${userRoleFilter === "mod" ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                İSG ({modsCount})
              </button>
              <button
                onClick={() => setUserRoleFilter("yuklemeci")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${userRoleFilter === "yuklemeci" ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                Yükleme ({loadersCount})
              </button>
              <button
                onClick={() => setUserRoleFilter("admin")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${userRoleFilter === "admin" ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-xs" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                Yönetici ({adminsCount})
              </button>
            </div>
          </div>

          {/* User Directory Cards Grid */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700/80 shadow-sm space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-400">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-lg">
                Kullanıcı Bulunamadı
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Aradığınız arama kriterine veya seçtiğiniz role uygun kayıtlı kullanıcı bulunmuyor.
              </p>
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Aramayı Temizle
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((u) => {
                const roleMeta = getRoleMeta(u.role, u.dept);
                const lockedInfo = lockedAccounts.find(
                  (a) => a.username.toLowerCase() === u.username.toLowerCase(),
                );
                const isLocked = lockedInfo?.isLocked;
                const isCurrentUser = currentUser?.id === u.id;

                return (
                  <div
                    key={u.id}
                    className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md ${isLocked ? "border-red-300 dark:border-red-900 bg-red-50/20 dark:bg-red-950/10" : "border-gray-100 dark:border-gray-700/80 hover:border-blue-400/40 dark:hover:border-blue-500/40"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${roleMeta.grad} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0`}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-gray-900 dark:text-gray-100 text-base truncate pb-0.5">
                              {u.name}
                            </h4>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase shrink-0">
                                Siz
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            @{u.username}
                          </p>
                        </div>
                      </div>

                      {/* Security Status Indicator */}
                      <div className="shrink-0">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-nowrap">
                            <Lock className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
                            <span>Kilitli</span>
                          </span>
                        ) : lockedInfo && lockedInfo.failedCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{lockedInfo.failedCount} Hata</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role & Department info bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-xl border shrink-0 ${roleMeta.color}`}
                        >
                          {roleMeta.title}
                        </span>
                        {roleMeta.sub && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px]">
                            {roleMeta.sub}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLocked && (
                          <button
                            type="button"
                            onClick={() => handleUnlockAccount(u.username)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 transition-colors cursor-pointer"
                            title="Hesap Kilidini Aç"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToEditModal(u);
                              setEditUserForm({
                                name: u.name || "",
                                username: u.username || "",
                                password: "",
                              });
                            }}
                            className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                            title="Düzenle & Şifre Güncelle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {u.id !== "1" && canEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUserClick(u.id)}
                            className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                            title="Hesabı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal 1: Yeni Hesap Tanımlama (Add User Modal) */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-up space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                        Yeni Hesap Tanımla
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Yetkili şef, İSG uzmanı veya yüklemeci kaydı oluşturun
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Mehmet Demir"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Kullanıcı Adı (@)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: mehmetd"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Giriş Şifresi
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Güçlü şifre belirleyin"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Sistem Yetkisi / Rolü
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="sef">Birim Şefi (İSG Departman Şefi)</option>
                      <option value="mod">İSG Uzmanı (Saha Denetim & İtiraz Onayı)</option>
                      <option value="yuklemeci">Yükleme Sorumlusu (Sevkiyat & Tır)</option>
                      <option value="admin">Sistem Yöneticisi (Admin)</option>
                    </select>
                  </div>

                  {newUser.role === "sef" && (
                    <div className="animate-slide-up">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Sorumlu Olduğu Departman
                      </label>
                      <select
                        value={newUser.dept}
                        onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {t(getDeptKey(d))}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-sm transition-colors cursor-pointer"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      Hesabı Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 2: Hesap Düzenleme & Şifre Değiştirme Modal */}
          {userToEditModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-up space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                        Hesabı Düzenle
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{userToEditModal.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserToEditModal(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Kullanıcı Adı (@)
                    </label>
                    <input
                      type="text"
                      value={editUserForm.username}
                      onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Yeni Şifre Belirle
                    </label>
                    <input
                      type="text"
                      placeholder="Değiştirmek istemiyorsanız boş bırakın"
                      value={editUserForm.password}
                      onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Şifreyi güncellemek için yeni bir şifre girin. Boş bırakırsanız mevcut şifre korunur.
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setUserToEditModal(null)}
                      className="px-5 py-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-sm transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setUserToUpdate(userToEditModal.id);
                        confirmUpdateUser();
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-purple-500/25 transition-all cursor-pointer"
                    >
                      Güncelle ve Kaydet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    const renderLoadingList = (listToRender) => {
      const paginatedLoads = listToRender.slice(0, adminLoadingsLimit);
      return (
        <div className="space-y-3.5">
          {listToRender.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3.5">
                <Truck className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-base">
                {t("no_records") || "Kayıtlı Sevkiyat Bulunamadı"}
              </h4>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                Arama kriterlerinize veya seçilen döneme uygun araç yükleme kaydı bulunmuyor.
              </p>
            </div>
          ) : (
            <>
              {paginatedLoads.map((load) => {
                const isExpanded = expandedLoadId === load.id;
                const countryFlag = COUNTRY_FLAGS[load.destCountry] || "🌐";
                const isFinished = load.status === "tamamlandi";
                const isLoadingNow = load.status === "yukleniyor";

                return (
                  <div
                    key={load.id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? "border-orange-300 dark:border-orange-500/60 ring-2 ring-orange-500/10 shadow-md"
                        : "border-gray-200/90 dark:border-gray-700/80 hover:border-orange-200 dark:hover:border-orange-600/50 shadow-xs hover:shadow-sm"
                    }`}
                  >
                    {/* Main Row */}
                    <div
                      onClick={() => setExpandedLoadId(isExpanded ? null : load.id)}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 cursor-pointer select-none"
                    >
                      {/* Left: Plate Badge + Destination Info */}
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        {/* Embossed Turkish Plate */}
                        <div className="shrink-0 flex items-center bg-gray-950 text-white rounded-xl border border-gray-900 dark:border-gray-600 shadow-xs overflow-hidden font-mono text-xs sm:text-sm">
                          <div className="bg-blue-600 px-1.5 py-2 text-white font-extrabold text-[9px] flex items-center justify-center border-r border-blue-700 shrink-0">
                            TR
                          </div>
                          <span className="px-2.5 sm:px-3 py-1.5 bg-white text-gray-950 dark:bg-gray-900 dark:text-white font-black tracking-wider uppercase whitespace-nowrap">
                            {load.plaka || "34 ADS 01"}
                          </span>
                        </div>

                        {/* Destination & Company details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-base font-extrabold text-gray-900 dark:text-gray-100 truncate pb-0.5"
                              title={load.destCompany}
                            >
                              {load.destCompany || "Alıcı Belirtilmedi"}
                            </span>
                            {load.projectNo && (
                              <span className="text-[11px] font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 px-2 py-0.5 rounded-md shrink-0">
                                #{load.projectNo}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300 shrink-0">
                              <span className="text-base leading-none shrink-0">{countryFlag}</span>
                              <span>{getCountryName(load.destCountry, lang) || "Türkiye"}</span>
                            </span>
                            {load.destLocation && (
                              <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 shrink-0">
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                                <span className="truncate max-w-[160px]">{load.destLocation}</span>
                              </span>
                            )}
                            {load.sofor && (
                              <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 shrink-0">
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                                <span className="truncate max-w-[140px]">{load.sofor}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Tonnage, Status, Time, Chevron */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-700/70">
                        {/* Tonnage Pill */}
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3 py-1.5 rounded-xl">
                            <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-sm font-black text-amber-900 dark:text-amber-200">
                              {load.tonnage ? parseFloat(load.tonnage).toLocaleString("tr-TR") : "-"}
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                              {t("unit_ton") || "Ton"}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          {isLoadingNow ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
                              {t("status_yukleniyor") || "Yükleniyor"}
                            </span>
                          ) : isFinished ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              {t("status_tamamlandi") || "Sevk Edildi"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              {t("status_beklemede") || "Beklemede"}
                            </span>
                          )}
                        </div>

                        {/* Chevron */}
                        <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center text-gray-400 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-orange-600" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Logistics Dossier */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700/70 p-5 md:p-6 bg-gray-50/70 dark:bg-gray-900/40 space-y-5 animate-slide-up">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200/80 dark:border-gray-700/80">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                            <h4 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                              {t("shipment_dossier_title") || "Sevkiyat Dosyası & Saha Tutanakları"}
                            </h4>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span>{load.createdAtDate}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                            <span className="shrink-0">Giriş: {load.createdAtTime || "-"}</span>
                            {load.finishedAtTime && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                  Çıkış: {load.finishedAtTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 4-Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                              {t("dest_country") || "Varış Ülkesi"}
                            </span>
                            <span className="font-extrabold text-gray-900 dark:text-gray-100 text-sm mt-0.5 flex items-center gap-1.5 truncate">
                              <span>{countryFlag}</span>
                              <span className="truncate">{getCountryName(load.destCountry, lang) || "Türkiye"}</span>
                            </span>
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                              {t("dest_location") || "Şehir / Bölge"}
                            </span>
                            <span className="font-extrabold text-gray-900 dark:text-gray-100 text-sm mt-0.5 truncate block">
                              {load.destLocation || "-"}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                              {t("driver_name") || "Sorumlu Şoför"}
                            </span>
                            <span className="font-extrabold text-gray-900 dark:text-gray-100 text-sm mt-0.5 truncate block">
                              {load.sofor || "Belirtilmemiş"}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                              {t("tonnage") || "Net Tonaj"}
                            </span>
                            <span className="font-black text-orange-600 dark:text-orange-400 text-sm mt-0.5 truncate block">
                              {load.tonnage ? `${parseFloat(load.tonnage).toLocaleString("tr-TR")} Ton` : "-"}
                            </span>
                          </div>
                        </div>

                        {/* Side by Side Inspection Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Pre-load Photo & Note */}
                          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                                  {t("pre_load_check") || "Yükleme Öncesi Kontrol (Boş Kasa)"}
                                </span>
                                {load.preImgUrl && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                    Kayıtlı
                                  </span>
                                )}
                              </div>

                              {load.preImgUrl ? (
                                <div
                                  className="relative group cursor-pointer overflow-hidden rounded-xl mb-3 aspect-video bg-gray-100 dark:bg-gray-900"
                                  onClick={() => setPreviewModalImg(load.preImgUrl)}
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    src={load.preImgUrl}
                                    alt="Yükleme Öncesi"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Büyüt</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="aspect-video bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 text-xs mb-3">
                                  <ImageIcon className="w-6 h-6 mb-1 text-gray-300 dark:text-gray-600" />
                                  <span>{t("no_photo") || "Fotoğraf Yok"}</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300">
                              <span className="font-bold text-[10px] uppercase text-gray-400 block mb-0.5">
                                Giriş Notu:
                              </span>
                              <p className="italic">
                                {load.preNote ? `"${load.preNote}"` : "Özel bir not belirtilmedi."}
                              </p>
                            </div>
                          </div>

                          {/* Post-load Photo & Note */}
                          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  {t("post_load_check") || "Yükleme & Emniyet Kontrolü"}
                                </span>
                                {load.postImgUrl && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
                                    Onaylı
                                  </span>
                                )}
                              </div>

                              {load.postImgUrl ? (
                                <div
                                  className="relative group cursor-pointer overflow-hidden rounded-xl mb-3 aspect-video bg-gray-100 dark:bg-gray-900"
                                  onClick={() => setPreviewModalImg(load.postImgUrl)}
                                >
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    src={load.postImgUrl}
                                    alt="Yükleme Sonrası"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Büyüt</span>
                                  </div>
                                </div>
                              ) : isLoadingNow ? (
                                <div className="aspect-video bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-dashed border-amber-200 dark:border-amber-800/60 flex flex-col items-center justify-center text-amber-700 dark:text-amber-400 text-xs mb-3 p-4 text-center">
                                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping mb-2" />
                                  <span className="font-bold">Yükleme Devam Ediyor</span>
                                  <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
                                    Bağlama ve brandalama tamamlandığında çıkış fotoğrafı yüklenecektir.
                                  </span>
                                </div>
                              ) : (
                                <div className="aspect-video bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 text-xs mb-3">
                                  <Clock className="w-6 h-6 mb-1 text-gray-300 dark:text-gray-600" />
                                  <span>Henüz yükleme başlamadı</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300">
                              <span className="font-bold text-[10px] uppercase text-gray-400 block mb-0.5">
                                Çıkış / Emniyet Notu:
                              </span>
                              <p className="italic">
                                {load.postNote ? `"${load.postNote}"` : isFinished ? "Yük güvenli şekilde bağlandı ve sevk edildi." : "Henüz çıkış yapılmadı."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isAdminLoadingsPaginating && <ShipmentCardSkeleton count={2} />}
              <PaginationControl
                currentCount={adminLoadingsLimit}
                totalCount={listToRender.length}
                pageSize={15}
                isLoading={isAdminLoadingsPaginating}
                onLoadMore={handleLoadMoreAdminLoadings}
                label={t("load_more_shipments") || "Daha Fazla Sevkiyat Göster"}
              />
            </>
          )}
        </div>
      );
    };

    if (adminSystemMode === "yukleme") {
      if (selectedYuklemeDate) {
        const dateLoadings = loadings.filter(
          (l) => l.createdAtDate === selectedYuklemeDate,
        );
        const dateTotalTonnage = dateLoadings.reduce(
          (acc, l) => acc + (parseFloat(l.tonnage) || 0),
          0,
        );
        const dateCompleted = dateLoadings.filter((l) => l.status === "tamamlandi").length;
        const dateActive = dateLoadings.filter((l) => l.status === "yukleniyor" || l.status === "beklemede").length;

        return (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700/80 pb-6 mb-6">
                <div>
                  <button
                    onClick={() => setSelectedYuklemeDate(null)}
                    className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 transition-colors cursor-pointer group"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>{t("return_back") || "Tüm Sevkiyatlara Dön"}</span>
                  </button>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                    <CalendarDays className="w-6 h-6 text-orange-500" />
                    <span>{selectedYuklemeDate} Günlük Sevkiyat Özeti</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Bu tarihte fabrikadan çıkışı yapılan araçlar ve yükleme tutanakları
                  </p>
                </div>

                <button
                  onClick={() => setSelectedYuklemeDate(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Kapat
                </button>
              </div>

              {/* Day KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/80">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Toplam Araç
                  </span>
                  <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                    {dateLoadings.length}
                  </p>
                  <span className="text-[11px] text-gray-400">Sevkiyat Kaydı</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    Toplam Tonaj
                  </span>
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                    {dateTotalTonnage.toLocaleString("tr-TR")} <span className="text-sm font-bold">Ton</span>
                  </p>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">Net Yük</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Tamamlanan
                  </span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {dateCompleted}
                  </p>
                  <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Sevk Edildi</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                    İşlemde / Bekleyen
                  </span>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {dateActive}
                  </p>
                  <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80">Rampa Durumu</span>
                </div>
              </div>
            </div>

            {renderLoadingList(dateLoadings)}
          </div>
        );
      }

      const totalTonnageAll = loadings.reduce(
        (acc, l) => acc + (parseFloat(l.tonnage) || 0),
        0,
      );
      const activeLoadingsCount = loadings.filter(
        (l) => l.status === "yukleniyor" || l.status === "beklemede",
      ).length;
      const completedLoadingsCount = loadings.filter(
        (l) => l.status === "tamamlandi",
      ).length;
      const tonnage24h = get24HourTonnage ? get24HourTonnage() : 0;

      // Analysis calculations
      const countryStats = {};
      const companyStats = {};
      loadings.forEach((load) => {
        const tVal = parseFloat(load.tonnage) || 0;
        const cName = load.destCountry || "Türkiye";
        const compName = load.destCompany || "Belirsiz";

        if (!countryStats[cName]) countryStats[cName] = { count: 0, ton: 0 };
        countryStats[cName].count += 1;
        countryStats[cName].ton += tVal;

        if (!companyStats[compName])
          companyStats[compName] = { count: 0, ton: 0 };
        companyStats[compName].count += 1;
        companyStats[compName].ton += tVal;
      });
      const sortedCountries = Object.keys(countryStats).sort(
        (a, b) => countryStats[b].ton - countryStats[a].ton,
      );
      const sortedCompanies = Object.keys(companyStats).sort(
        (a, b) => companyStats[b].ton - companyStats[a].ton,
      );

      const topCountry = sortedCountries[0] || null;
      const topCompany = sortedCompanies[0] || null;
      const avgTonnagePerTruck =
        loadings.length > 0
          ? (totalTonnageAll / loadings.length).toFixed(1)
          : "0.0";

      const currDate = new Date();
      const currentMonth = yuklemeCalendarMonth;
      const currentYear = yuklemeCalendarYear;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1;
      const dayNames =
        lang === "tr"
          ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const monthNames =
        lang === "tr"
          ? [
              "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
              "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ]
          : [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
      const loadingsByDate = {};
      loadings.forEach((l) => {
        if (!loadingsByDate[l.createdAtDate])
          loadingsByDate[l.createdAtDate] = [];
        loadingsByDate[l.createdAtDate].push(l);
      });

      // Filtered list for 'list' tab
      const filteredListLoadings = loadings.filter((l) => {
        // Search query
        if (yuklemeSearchQuery.trim()) {
          const q = yuklemeSearchQuery.toLowerCase().trim();
          const matchPlaka = l.plaka?.toLowerCase().includes(q);
          const matchCompany = l.destCompany?.toLowerCase().includes(q);
          const matchSofor = l.sofor?.toLowerCase().includes(q);
          const matchLocation = l.destLocation?.toLowerCase().includes(q);
          const matchCountry = l.destCountry?.toLowerCase().includes(q);
          const matchProject = l.projectNo?.toLowerCase().includes(q);
          if (
            !matchPlaka &&
            !matchCompany &&
            !matchSofor &&
            !matchLocation &&
            !matchCountry &&
            !matchProject
          ) {
            return false;
          }
        }
        // Status filter
        if (yuklemeStatusFilter !== "all" && l.status !== yuklemeStatusFilter) {
          return false;
        }
        // Date period filter
        if (yuklemeListFilter !== "all") {
          const now = new Date();
          if (yuklemeListFilter === "day") {
            const startOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            ).getTime();
            if ((l.timestamp || l.createdAtTimestamp || 0) < startOfDay) return false;
          } else if (yuklemeListFilter === "week") {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(now.setDate(diff)).setHours(
              0,
              0,
              0,
              0,
            );
            if ((l.timestamp || l.createdAtTimestamp || 0) < startOfWeek) return false;
          } else if (yuklemeListFilter === "month") {
            const startOfMonth = new Date(
              now.getFullYear(),
              now.getMonth(),
              1,
            ).getTime();
            if ((l.timestamp || l.createdAtTimestamp || 0) < startOfMonth) return false;
          }
        }
        return true;
      });

      const filteredTotalTonnage = filteredListLoadings.reduce(
        (sum, l) => sum + (parseFloat(l.tonnage) || 0),
        0,
      );

      return (
        <div className="space-y-6 animate-slide-up">
          {/* Header & Main Navigation Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <button
                onClick={() => {
                  navigate("/");
                  setAdminSystemMode("home");
                }}
                className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>{t("back_to_menu") || "Ana Menüye Dön"}</span>
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {t("module_yukleme_title") || "Yükleme & Sevkiyat Takibi"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Fabrika tır çıkışları, tonaj analizleri, sevkiyat takvimi ve lojistik tutanakları
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented View Selector */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-600 w-full sm:w-auto shadow-inner">
              <button
                onClick={() => {
                  setYuklemeAnaTab("list");
                  setSelectedYuklemeCountry(null);
                  setSelectedYuklemeCompany(null);
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  yuklemeAnaTab === "list"
                    ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Sevkiyat Listesi</span>
              </button>
              <button
                onClick={() => {
                  setYuklemeAnaTab("analysis");
                  setSelectedYuklemeCountry(null);
                  setSelectedYuklemeCompany(null);
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  yuklemeAnaTab === "analysis"
                    ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sevkiyat Analizi</span>
              </button>
              <button
                onClick={() => {
                  setYuklemeAnaTab("calendar");
                  setSelectedYuklemeCountry(null);
                  setSelectedYuklemeCompany(null);
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  yuklemeAnaTab === "calendar"
                    ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Takvim Görünümü</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => {
                setYuklemeAnaTab("list");
                setYuklemeStatusFilter("all");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                yuklemeAnaTab === "list" && yuklemeStatusFilter === "all"
                  ? "bg-orange-50/80 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Toplam</span>
                <Truck className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                {loadings.length}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Kayıtlı Araç</span>
            </div>

            <div
              onClick={() => {
                setYuklemeAnaTab("list");
                setYuklemeStatusFilter("yukleniyor");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                yuklemeAnaTab === "list" && yuklemeStatusFilter === "yukleniyor"
                  ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Sahada İşlemde</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {activeLoadingsCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Yükleme / Beklemede</span>
            </div>

            <div
              onClick={() => {
                setYuklemeAnaTab("list");
                setYuklemeStatusFilter("tamamlandi");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                yuklemeAnaTab === "list" && yuklemeStatusFilter === "tamamlandi"
                  ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Tamamlanan</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {completedLoadingsCount}
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Sevk Edildi</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Toplam Tonaj</span>
                <Scale className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 truncate">
                {totalTonnageAll.toLocaleString("tr-TR")} <span className="text-xs font-bold">Ton</span>
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Genel Toplam</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Son 24 Saat</span>
                <Clock className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 truncate">
                {tonnage24h} <span className="text-xs font-bold">Ton</span>
              </p>
              <span className="text-[11px] text-gray-400 font-medium">Günlük Çıkış</span>
            </div>
          </div>

          {/* TAB 1: LIST VIEW */}
          {yuklemeAnaTab === "list" && (
            <div className="space-y-4">
              {/* Search and Filters Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={yuklemeSearchQuery}
                    onChange={(e) => setYuklemeSearchQuery(e.target.value)}
                    placeholder={
                      t("search_shipments_ph") ||
                      "Plaka, firma adı, şoför, proje no veya rota ara..."
                    }
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  />
                  {yuklemeSearchQuery && (
                    <button
                      onClick={() => setYuklemeSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <select
                    value={yuklemeStatusFilter}
                    onChange={(e) => setYuklemeStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="yukleniyor">Yükleniyor</option>
                    <option value="beklemede">Beklemede</option>
                    <option value="tamamlandi">Tamamlandı</option>
                  </select>

                  {/* Date Period Filter */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1 rounded-xl">
                    <button
                      onClick={() => setYuklemeListFilter("all")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        yuklemeListFilter === "all"
                          ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_all") || "Tümü"}
                    </button>
                    <button
                      onClick={() => setYuklemeListFilter("day")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        yuklemeListFilter === "day"
                          ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_day") || "Bugün"}
                    </button>
                    <button
                      onClick={() => setYuklemeListFilter("week")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        yuklemeListFilter === "week"
                          ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_week") || "Bu Hafta"}
                    </button>
                    <button
                      onClick={() => setYuklemeListFilter("month")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        yuklemeListFilter === "month"
                          ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_month") || "Bu Ay"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Results Summary */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2 font-medium">
                <span>
                  <b>{filteredListLoadings.length}</b> sevkiyat kaydı listeleniyor
                </span>
                <span>
                  Toplam:{" "}
                  <b className="text-orange-600 dark:text-orange-400 font-extrabold">
                    {filteredTotalTonnage.toLocaleString("tr-TR")} Ton
                  </b>
                </span>
              </div>

              {/* Render List */}
              {renderLoadingList(filteredListLoadings)}
            </div>
          )}

          {/* TAB 2: ANALYSIS VIEW */}
          {yuklemeAnaTab === "analysis" &&
            (selectedYuklemeCountry || selectedYuklemeCompany ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <button
                      onClick={() => {
                        setSelectedYuklemeCountry(null);
                        setSelectedYuklemeCompany(null);
                      }}
                      className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 transition-colors cursor-pointer group"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span>{t("return_back") || "Tüm Analiz Tablosuna Dön"}</span>
                    </button>
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {selectedYuklemeCountry ? (
                        <>
                          <span className="text-2xl">
                            {COUNTRY_FLAGS[selectedYuklemeCountry] || "🌐"}
                          </span>
                          <span>
                            {selectedYuklemeCountry} {t("shipments_title") || "Sevkiyatları"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-5 h-5 text-orange-500" />
                          <span>
                            {selectedYuklemeCompany} {t("shipments_title") || "Sevkiyatları"}
                          </span>
                        </>
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1.5 rounded-xl border border-orange-200/80 dark:border-orange-800/60">
                      {selectedYuklemeCountry
                        ? `${countryStats[selectedYuklemeCountry]?.ton.toLocaleString("tr-TR") || 0} Ton`
                        : `${companyStats[selectedYuklemeCompany]?.ton.toLocaleString("tr-TR") || 0} Ton`}
                    </span>
                  </div>
                </div>

                {renderLoadingList(
                  loadings.filter((l) =>
                    selectedYuklemeCountry
                      ? l.destCountry === selectedYuklemeCountry
                      : l.destCompany === selectedYuklemeCompany,
                  ),
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Executive Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="truncate">{t("top_export_country") || "En Fazla Sevk Edilen Ülke"}</span>
                      <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                    </div>
                    {topCountry ? (
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl leading-none shrink-0">
                            {COUNTRY_FLAGS[topCountry] || "🌐"}
                          </span>
                          <span className="text-lg font-black text-gray-900 dark:text-gray-100 truncate pb-0.5">
                            {topCountry}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
                          <span>{countryStats[topCountry].ton.toLocaleString("tr-TR")} Ton</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                          <span>{countryStats[topCountry].count} Sevkiyat</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">-</p>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="truncate">{t("top_client_company") || "En Yüksek Sevk Alan Firma"}</span>
                      <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                    </div>
                    {topCompany ? (
                      <div>
                        <span className="text-lg font-black text-gray-900 dark:text-gray-100 truncate block pb-0.5" title={topCompany}>
                          {topCompany}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
                          <span>{companyStats[topCompany].ton.toLocaleString("tr-TR")} Ton</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                          <span>{companyStats[topCompany].count} Sevkiyat</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">-</p>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="truncate">{t("avg_tonnage_per_truck") || "Tır Başına Ort. Tonaj"}</span>
                      <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 inline-block pb-0.5">
                        {avgTonnagePerTruck} <span className="text-sm font-bold">Ton</span>
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        Tüm tamamlanan ve aktif araçlar ortalaması
                      </p>
                    </div>
                  </div>
                </div>

                {/* Country Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span>{t("shipments_by_country") || "Ülkelere Göre Dağılım"}</span>
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">
                      Filtrelemek için ülkeye tıklayın
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {sortedCountries.map((c) => {
                      const sharePct = totalTonnageAll > 0
                        ? Math.min(100, Math.round((countryStats[c].ton / totalTonnageAll) * 100))
                        : 0;
                      return (
                        <div
                          key={c}
                          onClick={() => setSelectedYuklemeCountry(c)}
                          className="p-4 rounded-2xl bg-gray-50/70 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/80 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl shrink-0">
                                {COUNTRY_FLAGS[c] || "🌐"}
                              </span>
                              <span className="font-extrabold text-gray-900 dark:text-gray-100 truncate text-sm">
                                {c}
                              </span>
                            </div>
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400 shrink-0">
                              {countryStats[c].ton.toLocaleString("tr-TR")} Ton
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                            <span>{countryStats[c].count} Sevkiyat</span>
                            <span>%{sharePct} Pay</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Company Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-orange-500" />
                      <span>{t("shipments_by_company") || "Firmalara Göre Sevkiyatlar"}</span>
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">
                      Filtrelemek için firmaya tıklayın
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {sortedCompanies.map((c) => {
                      const sharePct = totalTonnageAll > 0
                        ? Math.min(100, Math.round((companyStats[c].ton / totalTonnageAll) * 100))
                        : 0;
                      return (
                        <div
                          key={c}
                          onClick={() => setSelectedYuklemeCompany(c)}
                          className="p-4 rounded-2xl bg-gray-50/70 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/80 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="font-extrabold text-gray-900 dark:text-gray-100 truncate text-sm flex-1 mr-2"
                              title={c}
                            >
                              {c}
                            </span>
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400 shrink-0">
                              {companyStats[c].ton.toLocaleString("tr-TR")} Ton
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                            <span>{companyStats[c].count} Sevkiyat</span>
                            <span>%{sharePct} Pay</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

          {/* TAB 3: CALENDAR VIEW */}
          {yuklemeAnaTab === "calendar" && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 space-y-6">
              {/* Calendar Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 rounded-2xl p-1 gap-1 border border-gray-200/80 dark:border-gray-600 shadow-inner">
                    <select
                      value={currentMonth}
                      onChange={(e) => handleYuklemeSelectMonth(e.target.value)}
                      className="bg-transparent font-black text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-xl cursor-pointer outline-none hover:bg-white dark:hover:bg-gray-600 transition-colors"
                    >
                      {monthNames.map((name, idx) => (
                        <option
                          key={idx}
                          value={idx}
                          className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        >
                          {name}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400 font-bold">/</span>
                    <select
                      value={currentYear}
                      onChange={(e) => handleYuklemeSelectYear(e.target.value)}
                      className="bg-transparent font-black text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-xl cursor-pointer outline-none hover:bg-white dark:hover:bg-gray-600 transition-colors"
                    >
                      {Array.from({ length: 12 }, (_, i) => 2022 + i).map((y) => (
                        <option
                          key={y}
                          value={y}
                          className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        >
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-700/80 rounded-2xl p-1 shadow-inner border border-gray-200/80 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={handleYuklemePrevMonth}
                    className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all text-gray-700 dark:text-gray-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Önceki Ay"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Önceki</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleYuklemeToday}
                    className="px-3.5 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {t("filter_today") || "Bugün"}
                  </button>
                  <button
                    type="button"
                    onClick={handleYuklemeNextMonth}
                    className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all text-gray-700 dark:text-gray-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Sonraki Ay"
                  >
                    <span className="hidden sm:inline">Sonraki</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Names Row */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-18 md:h-24 rounded-2xl bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/40 opacity-40"
                  />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const formattedDateForCell = `${dayNum.toString().padStart(2, "0")}.${(currentMonth + 1).toString().padStart(2, "0")}.${currentYear}`;
                  const isToday =
                    dayNum === currDate.getDate() &&
                    currentMonth === currDate.getMonth() &&
                    currentYear === currDate.getFullYear();
                  const dayLoadings = loadingsByDate[formattedDateForCell] || [];
                  const dayTotalTon = dayLoadings.reduce(
                    (acc, l) => acc + (parseFloat(l.tonnage) || 0),
                    0,
                  );

                  return (
                    <div
                      key={dayNum}
                      onClick={() =>
                        dayLoadings.length > 0 &&
                        setSelectedYuklemeDate(formattedDateForCell)
                      }
                      className={`h-18 md:h-24 rounded-2xl border p-2 flex flex-col items-center justify-between transition-all select-none ${
                        isToday
                          ? "bg-orange-50/80 dark:bg-orange-950/30 border-orange-400 dark:border-orange-600 ring-2 ring-orange-500/20 shadow-sm"
                          : dayLoadings.length > 0
                            ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800/80 opacity-80"
                      }`}
                    >
                      <span
                        className={`text-xs md:text-sm font-black ${
                          isToday
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {dayNum}
                      </span>

                      {dayLoadings.length > 0 ? (
                        <div className="flex flex-col items-center w-full gap-0.5">
                          <span className="text-[10px] font-extrabold text-white bg-orange-500 px-2 py-0.5 rounded-full shadow-xs truncate w-full text-center">
                            {dayLoadings.length} Tır
                          </span>
                          <span className="hidden md:inline text-[9px] font-bold text-gray-500 dark:text-gray-400">
                            {dayTotalTon.toFixed(1)} Ton
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (adminSystemMode === "isg") {
      const now = Date.now();
      const currDate = new Date();
      const currentMonth = isgCalendarMonth;
      const currentYear = isgCalendarYear;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1;
      const dayNames =
        lang === "tr"
          ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const monthNames =
        lang === "tr"
          ? [
              "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
              "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ]
          : [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];

      // Calendar tasks map
      const tasksByDate = {};
      tasks.forEach((t) => {
        if (t.createdAt) {
          if (!tasksByDate[t.createdAt]) tasksByDate[t.createdAt] = [];
          tasksByDate[t.createdAt].push(t);
        }
      });

      // Quick Key Metrics
      const totalViolations = tasks.length;
      const openViolations = tasks.filter((t) => t.status === "acik").length;
      const highRiskViolations = tasks.filter(
        (t) => t.priority === "kritik" || t.priority === "yuksek"
      ).length;
      const resolvedViolations = tasks.filter(
        (t) => t.status === "cozuldu" || t.status === "onaylandi"
      ).length;
      const deptScores = DEPARTMENTS.map((d) => points[d] ?? 100);
      const avgSafetyScore =
        deptScores.length > 0
          ? Math.round(deptScores.reduce((a, b) => a + b, 0) / deptScores.length)
          : 100;

      // Filtered Tasks for Tab 1 (Saha Denetimleri)
      const filteredTasks = tasks.filter((task) => {
        // Selected Date filter if any
        if (selectedAdminDate && task.createdAt !== selectedAdminDate) {
          return false;
        }

        // Search Query
        if (isgSearchQuery.trim()) {
          const q = isgSearchQuery.toLowerCase().trim();
          const matchSubject = task.subject?.toLowerCase().includes(q);
          const matchDesc = task.desc?.toLowerCase().includes(q);
          const matchDept = task.dept?.toLowerCase().includes(q);
          const matchChief = task.chiefNote?.toLowerCase().includes(q);
          const matchInspector = (task.inspectorName || task.user)?.toLowerCase().includes(q);
          if (!matchSubject && !matchDesc && !matchDept && !matchChief && !matchInspector) {
            return false;
          }
        }

        // Department filter
        if (isgDeptFilter !== "all" && task.dept !== isgDeptFilter) {
          return false;
        }

        // Status filter
        if (isgStatusFilter !== "all") {
          if (isgStatusFilter === "cozuldu") {
            if (task.status !== "cozuldu" && task.status !== "onaylandi") return false;
          } else if (isgStatusFilter === "itiraz") {
            if (task.status !== "itiraz" && task.status !== "itiraz_edildi") return false;
          } else if (task.status !== isgStatusFilter) {
            return false;
          }
        }

        // Priority filter
        if (isgPriorityFilter !== "all") {
          if (isgPriorityFilter === "yuksek") {
            if (task.priority !== "yuksek" && task.priority !== "kritik") return false;
          } else if (task.priority !== isgPriorityFilter) {
            return false;
          }
        }

        // Timeframe filter
        if (isgTimeFilter !== "all") {
          const nowTime = new Date();
          const startOfDay = new Date(
            nowTime.getFullYear(),
            nowTime.getMonth(),
            nowTime.getDate()
          ).getTime();
          const startOfWeek =
            startOfDay -
            (nowTime.getDay() === 0 ? 6 : nowTime.getDay() - 1) * 24 * 60 * 60 * 1000;
          const startOfMonth = new Date(
            nowTime.getFullYear(),
            nowTime.getMonth(),
            1
          ).getTime();

          const taskTime = task.timestamp || task.createdAtTimestamp || 0;
          if (isgTimeFilter === "day" && taskTime < startOfDay) return false;
          if (isgTimeFilter === "week" && taskTime < startOfWeek) return false;
          if (isgTimeFilter === "month" && taskTime < startOfMonth) return false;
        }

        return true;
      });

      const paginatedTasks = filteredTasks.slice(0, adminTasksLimit);

      // Selected Department details for Drill-Down in Tab 2
      const selectedDeptTasks = selectedAdminDept
        ? tasks.filter((t) => t.dept === selectedAdminDept)
        : [];
      const selectedDeptResolved = selectedDeptTasks.filter(
        (t) => t.status === "cozuldu" || t.status === "onaylandi"
      ).length;
      const selectedDeptOpen = selectedDeptTasks.filter(
        (t) => t.status === "acik"
      ).length;
      const selectedDeptCritical = selectedDeptTasks.filter(
        (t) => t.priority === "kritik" || t.priority === "yuksek"
      ).length;
      const selectedDeptScore = selectedAdminDept ? (points[selectedAdminDept] ?? 100) : 100;

      // Filtered selected department tasks
      const filteredDeptTasks = selectedDeptTasks.filter((task) => {
        if (adminDeptFilter !== "all") {
          const nowTime = new Date();
          const startOfDay = new Date(
            nowTime.getFullYear(),
            nowTime.getMonth(),
            nowTime.getDate()
          ).getTime();
          const startOfWeek =
            startOfDay -
            (nowTime.getDay() === 0 ? 6 : nowTime.getDay() - 1) * 24 * 60 * 60 * 1000;
          const startOfMonth = new Date(
            nowTime.getFullYear(),
            nowTime.getMonth(),
            1
          ).getTime();

          const taskTime = task.timestamp || task.createdAtTimestamp || 0;
          if (adminDeptFilter === "day" && taskTime < startOfDay) return false;
          if (adminDeptFilter === "week" && taskTime < startOfWeek) return false;
          if (adminDeptFilter === "month" && taskTime < startOfMonth) return false;
        }
        return true;
      });

      // Tasks for selected date from calendar
      const selectedDateTasks = selectedAdminDate
        ? (tasksByDate[selectedAdminDate] || [])
        : [];

      return (
        <div className="space-y-6 animate-slide-up">
          {/* Header & Main Navigation Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <button
                onClick={() => {
                  navigate("/");
                  setAdminSystemMode("home");
                  setSelectedAdminDept(null);
                  setSelectedAdminDate(null);
                }}
                className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>{t("back_to_menu") || "Ana Menüye Dön"}</span>
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {t("isg_tab") || "İSG & Saha Tertip Denetimleri"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Saha güvenlik denetimleri, birim risk puanları, acil aksiyon takibi ve denetim takvimi
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Next Reset Pill & Segmented Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl shrink-0">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                    {t("next_reset") || "Puan Sıfırlama"}
                  </span>
                  <span className="text-xs font-black text-blue-950 dark:text-blue-200">
                    {getLastFridayOfCurrentMonth()}
                  </span>
                </div>
              </div>

              {/* Segmented View Selector */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-600 w-full sm:w-auto shadow-inner">
                <button
                  onClick={() => {
                    setIsgAnaTab("tasks");
                    setSelectedAdminDept(null);
                    setSelectedAdminDate(null);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isgAnaTab === "tasks"
                      ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Saha Denetimleri</span>
                </button>
                <button
                  onClick={() => {
                    setIsgAnaTab("risk");
                    setSelectedAdminDate(null);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isgAnaTab === "risk"
                      ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Birim Risk Haritası</span>
                </button>
                <button
                  onClick={() => {
                    setIsgAnaTab("calendar");
                    setSelectedAdminDept(null);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isgAnaTab === "calendar"
                      ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Denetim Takvimi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip - 4 Balanced Cards, Equal Baseline & Height */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Toplam */}
            <div
              onClick={() => {
                setIsgAnaTab("tasks");
                setIsgStatusFilter("all");
                setIsgPriorityFilter("all");
                setSelectedAdminDept(null);
                setSelectedAdminDate(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                isgAnaTab === "tasks" && isgStatusFilter === "all" && isgPriorityFilter === "all" && !selectedAdminDept
                  ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Toplam</span>
                <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-none tabular-nums">
                  {totalViolations}
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Saha Tutanağı</span>
              </div>
            </div>

            {/* 2. Açık & Bekleyen */}
            <div
              onClick={() => {
                setIsgAnaTab("tasks");
                setIsgStatusFilter("acik");
                setIsgPriorityFilter("all");
                setSelectedAdminDept(null);
                setSelectedAdminDate(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                isgAnaTab === "tasks" && isgStatusFilter === "acik"
                  ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Açık & Bekleyen</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 leading-none tabular-nums">
                  {openViolations}
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Müdahale Bekleyen</span>
              </div>
            </div>

            {/* 3. Acil Risk */}
            <div
              onClick={() => {
                setIsgAnaTab("tasks");
                setIsgPriorityFilter("yuksek");
                setIsgStatusFilter("all");
                setSelectedAdminDept(null);
                setSelectedAdminDate(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                isgAnaTab === "tasks" && isgPriorityFilter === "yuksek"
                  ? "bg-red-50/80 dark:bg-red-950/20 border-red-300 dark:border-red-800 ring-2 ring-red-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Acil Risk</span>
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 leading-none tabular-nums">
                  {highRiskViolations}
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Kritik / Yüksek</span>
              </div>
            </div>

            {/* 4. Giderilen */}
            <div
              onClick={() => {
                setIsgAnaTab("tasks");
                setIsgStatusFilter("cozuldu");
                setIsgPriorityFilter("all");
                setSelectedAdminDept(null);
                setSelectedAdminDate(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                isgAnaTab === "tasks" && isgStatusFilter === "cozuldu"
                  ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider h-5 gap-1.5">
                <span className="truncate">Giderilen</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
                  {resolvedViolations}
                </p>
              </div>
              <div className="text-[11px] text-gray-400 font-medium truncate">
                <span>Çözülen İhlal</span>
              </div>
            </div>
          </div>

          {/* TAB 1: SAHA DENETİMLERİ (LİSTE & TUTANAKLAR) */}
          {isgAnaTab === "tasks" && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={isgSearchQuery}
                    onChange={(e) => setIsgSearchQuery(e.target.value)}
                    placeholder="İhlal konusu, açıklama, şef notu, denetmen veya birim ara..."
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                  {isgSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setIsgSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Department Filter */}
                  <select
                    value={isgDeptFilter}
                    onChange={(e) => setIsgDeptFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  >
                    <option value="all">Tüm Birimler</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {t(getDeptKey(d))}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={isgStatusFilter}
                    onChange={(e) => setIsgStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="acik">Açık / Bekleyen</option>
                    <option value="onay_bekliyor">Onay Bekliyor</option>
                    <option value="cozuldu">Çözüldü & Onaylandı</option>
                    <option value="itiraz">İtiraz Edildi</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={isgPriorityFilter}
                    onChange={(e) => setIsgPriorityFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  >
                    <option value="all">Tüm Öncelikler</option>
                    <option value="yuksek">Kritik & Yüksek</option>
                    <option value="orta">Orta Öncelik</option>
                    <option value="basit">Basit Risk</option>
                  </select>

                  {/* Timeframe Pills */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsgTimeFilter("all")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isgTimeFilter === "all"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_all") || "Tümü"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsgTimeFilter("day")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isgTimeFilter === "day"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_day") || "Bugün"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsgTimeFilter("week")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isgTimeFilter === "week"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_week") || "Bu Hafta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsgTimeFilter("month")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isgTimeFilter === "month"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {t("filter_month") || "Bu Ay"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Indicators & Date Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    <b>{filteredTasks.length}</b> adet saha denetim kaydı listeleniyor
                  </span>
                  {selectedAdminDate && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg font-bold">
                      <Calendar className="w-3 h-3" />
                      Tarih: {selectedAdminDate}
                      <button
                        onClick={() => setSelectedAdminDate(null)}
                        className="hover:text-blue-950 dark:hover:text-white cursor-pointer ml-1"
                        title="Tarih filtresini kaldır"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                {(isgSearchQuery || isgDeptFilter !== "all" || isgStatusFilter !== "all" || isgPriorityFilter !== "all" || isgTimeFilter !== "all" || selectedAdminDate) && (
                  <button
                    onClick={() => {
                      setIsgSearchQuery("");
                      setIsgDeptFilter("all");
                      setIsgStatusFilter("all");
                      setIsgPriorityFilter("all");
                      setIsgTimeFilter("all");
                      setSelectedAdminDate(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>

              {/* Task Cards List */}
              {filteredTasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-base">
                    Saha Denetim Kaydı Bulunamadı
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                    Seçilen kriterlere veya arama sorgunuza uygun iş sağlığı ve saha güvenlik tutanağı bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {paginatedTasks.map((task) => {
                    const isExpanded = expandedAdminTaskId === task.id;
                    const statusDef = STATUS_INFO[task.status] || STATUS_INFO["acik"];
                    const StatusIcon = statusDef?.icon || AlertTriangle;
                    const priorityDef = PRIORITIES[task.priority] || PRIORITIES["basit"];

                    const isUrgent = task.priority === "kritik" || task.priority === "yuksek";
                    const isResolved = task.status === "cozuldu" || task.status === "onaylandi";
                    const railClass = isResolved
                      ? "status-rail-emerald"
                      : isUrgent
                        ? "status-rail-red"
                        : "status-rail-amber";

                    return (
                      <TimerWrapper key={task.id}>
                        {(nowTime) => {
                          let timeWarning = null;
                          let isGlowing = false;

                          if (task.status === "acik") {
                            const deadlineMs =
                              (task.timestamp || task.createdAtTimestamp || 0) +
                              (task.deadlineHours || 24) * 60 * 60 * 1000;
                            const diff = deadlineMs - nowTime;

                            if (diff <= 0) {
                              const lateMs = Math.abs(diff);
                              const lateHours = Math.floor(lateMs / (1000 * 60 * 60));
                              const lateMins = Math.floor((lateMs % (1000 * 60 * 60)) / (1000 * 60));
                              timeWarning = (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  {lateHours > 0 ? `${lateHours} sa ` : ""}
                                  {lateMins} dk gecikti!
                                </span>
                              );
                              isGlowing = true;
                            } else {
                              const leftHours = Math.floor(diff / (1000 * 60 * 60));
                              const leftMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                              const isCriticalTime = diff < 30 * 60 * 1000;
                              timeWarning = (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                                  isCriticalTime
                                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 animate-pulse border border-red-200"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700/80 dark:text-gray-300"
                                }`}>
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  {leftHours > 0 ? `${leftHours} saat ` : ""}
                                  {leftMins} dk kaldı
                                </span>
                              );
                            }
                          }

                          return (
                            <div
                              className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all overflow-hidden status-rail ${railClass} ${
                                isGlowing
                                  ? "border-red-300 dark:border-red-700 ring-2 ring-red-500/20 shadow-md"
                                  : isExpanded
                                    ? "border-blue-300 dark:border-blue-600/60 ring-2 ring-blue-500/10 shadow-md"
                                    : "border-gray-200/90 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs hover:shadow-sm"
                              }`}
                            >
                              {/* Main Card Header */}
                              <div
                                onClick={() =>
                                  setExpandedAdminTaskId(isExpanded ? null : task.id)
                                }
                                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 cursor-pointer select-none"
                              >
                                {/* Left Info */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Department Tag */}
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 shrink-0">
                                      <Building2 className="w-3 h-3" />
                                      {t(getDeptKey(task.dept))}
                                    </span>

                                    {/* Priority Badge */}
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${priorityDef.color} shrink-0`}>
                                      {t(priorityDef.label_key)} {t("risk") || "Risk"}
                                    </span>

                                    {/* Status Badge */}
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${statusDef.color.split(" ").slice(0, 2).join(" ")} shrink-0`}>
                                      <StatusIcon className="w-3 h-3" />
                                      {t(statusDef.label_key)}
                                    </span>

                                    {/* Submission Date */}
                                    <span className="text-[11px] text-gray-400 font-medium ml-1">
                                      {task.createdAt} {task.createdAtTime ? `• ${task.createdAtTime}` : ""}
                                    </span>
                                  </div>

                                  {/* Subject / Title */}
                                  <h4 className="text-base font-extrabold text-gray-900 dark:text-gray-100 truncate pr-4">
                                    {task.subject || task.desc || "Saha Güvenlik Tutanak Kaydı"}
                                  </h4>

                                  {/* Subtext info */}
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {task.desc || "Açıklama belirtilmedi."}
                                  </p>
                                </div>

                                {/* Right Side: Time Warning, Inspector & Chevron */}
                                <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-700/70">
                                  {timeWarning}

                                  {(task.inspectorName || task.user) && (
                                    <span className="hidden sm:inline-block text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 px-2.5 py-1 rounded-lg font-medium">
                                      Denetmen: <b>{task.inspectorName || task.user}</b>
                                    </span>
                                  )}

                                  <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center text-gray-400 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? "rotate-180 text-blue-600" : ""
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Dossier: Side-by-Side Photos & Notes */}
                              {isExpanded && (
                                <div className="border-t border-gray-100 dark:border-gray-700/70 p-5 md:p-6 bg-gray-50/70 dark:bg-gray-900/40 space-y-4 animate-slide-up">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Before Photo & Inspector Note */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          {t("before") || "Öncesi — Tespit Anı"}
                                        </span>
                                      </div>

                                      {task.imgUrl ? (
                                        <div
                                          onClick={() => setPreviewModalImg(task.imgUrl)}
                                          className="relative group cursor-pointer overflow-hidden rounded-xl bg-black/5 aspect-video flex items-center justify-center"
                                        >
                                          <img
                                            src={task.imgUrl}
                                            alt="İSG Öncesi Fotoğraf"
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                                            <Maximize2 className="w-4 h-4" />
                                            <span>Fotoğrafı Büyüt</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-700/60 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                                          {t("no_photo") || "Öncesi fotoğrafı yüklenmedi"}
                                        </div>
                                      )}

                                      <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60">
                                        <span className="font-bold text-gray-500 block mb-0.5">Tespit Detayı:</span>
                                        {task.desc || "Detaylı açıklama bulunmuyor."}
                                      </div>
                                    </div>

                                    {/* After Photo & Chief Resolution Note */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          {t("solution_after") || "Sonrası — Çözüm & Düzeltme"}
                                        </span>
                                      </div>

                                      {task.afterImgUrl ? (
                                        <div
                                          onClick={() => setPreviewModalImg(task.afterImgUrl)}
                                          className="relative group cursor-pointer overflow-hidden rounded-xl bg-black/5 aspect-video flex items-center justify-center"
                                        >
                                          <img
                                            src={task.afterImgUrl}
                                            alt="İSG Çözüm Fotoğrafı"
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                                            <Maximize2 className="w-4 h-4" />
                                            <span>Fotoğrafı Büyüt</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-700/60 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                                          {task.status === "cozuldu" || task.status === "onay_bekliyor"
                                            ? "Çözüm fotoğrafı bulunmuyor"
                                            : "Henüz düzeltme aksiyonu alınmadı"}
                                        </div>
                                      )}

                                      <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60">
                                        <span className="font-bold text-gray-500 block mb-0.5">Şef Aksiyon Notu:</span>
                                        {task.chiefNote ? `"${task.chiefNote}"` : "Henüz bir şef notu girilmedi."}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Appeal Reason if any */}
                                  {task.appealReason && (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-extrabold block">Birim İtiraz Gerekçesi:</span>
                                        <span>"{task.appealReason}"</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      </TimerWrapper>
                    );
                  })}

                  {/* Pagination Control */}
                  {isAdminTasksPaginating && <TaskCardSkeleton count={2} />}
                  <PaginationControl
                    currentCount={adminTasksLimit}
                    totalCount={filteredTasks.length}
                    pageSize={12}
                    isLoading={isAdminTasksPaginating}
                    onLoadMore={handleLoadMoreAdminTasks}
                    label={t("load_more_tasks") || "Daha Fazla İhlal Göster"}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BİRİM RİSK HARİTASI & SKORLAR */}
          {isgAnaTab === "risk" && (
            <div className="space-y-6">
              {/* If a department is selected (Drilldown View) */}
              {selectedAdminDept ? (
                <div className="space-y-4 animate-slide-up">
                  {/* Department Drill-Down Banner */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <button
                        onClick={() => setSelectedAdminDept(null)}
                        className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Tüm Birimlere Geri Dön
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                            {t(getDeptKey(selectedAdminDept))} İSG Performansı
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Departmana ait güncel denetim kayıtları ve risk puanı dökümü
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                          Birim Puanı
                        </span>
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {selectedDeptScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Mini KPIs for Department */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                      <span className="text-xs font-bold text-gray-400 uppercase">Toplam Tutanak</span>
                      <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                        {selectedDeptTasks.length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Giderilen</span>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                        {selectedDeptResolved}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                      <span className="text-xs font-bold text-amber-500 uppercase">Açık Risk</span>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                        {selectedDeptOpen}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-xs">
                      <span className="text-xs font-bold text-red-500 uppercase">Kritik Sorun</span>
                      <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 tabular-nums">
                        {selectedDeptCritical}
                      </p>
                    </div>
                  </div>

                  {/* Department Tasks List */}
                  {filteredDeptTasks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-700/80">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">Bu Birimde Açık İhlal Bulunmuyor</h4>
                      <p className="text-xs text-gray-400 mt-1">Birim İSG kurallarına tam uyum göstermektedir.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDeptTasks.map((task) => {
                        const statusDef = STATUS_INFO[task.status] || STATUS_INFO["acik"];
                        const StatusIcon = statusDef?.icon || AlertTriangle;
                        const priorityDef = PRIORITIES[task.priority] || PRIORITIES["basit"];
                        const isExpanded = expandedAdminTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                          >
                            <div
                              onClick={() => setExpandedAdminTaskId(isExpanded ? null : task.id)}
                              className="flex justify-between items-center cursor-pointer select-none"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${priorityDef.color}`}>
                                    {t(priorityDef.label_key)}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${statusDef.color.split(" ").slice(0, 2).join(" ")}`}>
                                    <StatusIcon className="w-3 h-3 inline mr-1" />
                                    {t(statusDef.label_key)}
                                  </span>
                                  <span className="text-[11px] text-gray-400">{task.createdAt}</span>
                                </div>
                                <h5 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                                  {task.subject || task.desc}
                                </h5>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180 text-blue-600" : ""}`} />
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-slide-up">
                                <div>
                                  <span className="font-bold text-gray-500 block mb-1">Öncesi (Tespit):</span>
                                  {task.imgUrl && (
                                    <img
                                      src={task.imgUrl}
                                      alt="Öncesi"
                                      onClick={() => setPreviewModalImg(task.imgUrl)}
                                      className="rounded-xl h-36 w-full object-cover mb-2 cursor-pointer"
                                    />
                                  )}
                                  <p className="text-gray-700 dark:text-gray-300">{task.desc}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-gray-500 block mb-1">Sonrası (Çözüm):</span>
                                  {task.afterImgUrl && (
                                    <img
                                      src={task.afterImgUrl}
                                      alt="Sonrası"
                                      onClick={() => setPreviewModalImg(task.afterImgUrl)}
                                      className="rounded-xl h-36 w-full object-cover mb-2 cursor-pointer"
                                    />
                                  )}
                                  <p className="text-gray-700 dark:text-gray-300 italic">{task.chiefNote ? `"${task.chiefNote}"` : "Not girilmedi."}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Department Cards Grid */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 font-medium">
                    <span>Tüm fabrika birimlerinin güvenlik skoru ve açık risk dağılımı</span>
                    <span>{sortedDeptsAdmin.length} birim izleniyor</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedDeptsAdmin.map((dept, index) => {
                      const redCount = getRedTaskCount(dept);
                      const deptScore = points[dept] ?? 100;
                      const deptTasksCount = tasks.filter((t) => t.dept === dept).length;
                      const deptResolvedCount = tasks.filter(
                        (t) => t.dept === dept && (t.status === "cozuldu" || t.status === "onaylandi")
                      ).length;

                      return (
                        <div
                          key={dept}
                          className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
                        >
                          <div className="space-y-3">
                            {/* Card Top: Rank and Score */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                #{index + 1} Sıralama
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xl font-black tabular-nums text-slate-800 dark:text-slate-100">
                                  {deptScore}
                                </span>
                                <span className="text-xs font-bold text-gray-400">Puan</span>
                              </div>
                            </div>

                            {/* Department Name */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <h4 className="font-extrabold text-base text-gray-900 dark:text-gray-100 truncate">
                                {t(getDeptKey(dept))}
                              </h4>
                            </div>

                            {/* Score Progress Bar */}
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 bg-slate-500 dark:bg-slate-400"
                                style={{ width: `${Math.min(100, Math.max(0, deptScore))}%` }}
                              />
                            </div>

                            {/* Status Pill */}
                            <div>
                              {redCount > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                  {redCount} Açık Sorun
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  Sıfır Sorun • Güvenli
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Footer: Resolution Ratio & Drill-down Button */}
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                              <b>{deptResolvedCount}</b> / {deptTasksCount} Çözüldü
                            </span>
                            <button
                              onClick={() => {
                                setSelectedAdminDept(dept);
                                setAdminDeptFilter("all");
                                triggerHaptic("light");
                              }}
                              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                            >
                              <span>İncele</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DENETİM TAKVİMİ */}
          {isgAnaTab === "calendar" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-6 md:p-8 animate-slide-up">
                {/* Calendar Header with Selectors */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700/80 rounded-2xl p-1 gap-1 border border-gray-200/80 dark:border-gray-600 shadow-inner">
                      <select
                        value={currentMonth}
                        onChange={(e) => handleIsgSelectMonth(e.target.value)}
                        className="bg-transparent font-black text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-xl cursor-pointer outline-none hover:bg-white dark:hover:bg-gray-600 transition-colors"
                      >
                        {monthNames.map((name, idx) => (
                          <option key={idx} value={idx} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                            {name}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-bold">/</span>
                      <select
                        value={currentYear}
                        onChange={(e) => handleIsgSelectYear(e.target.value)}
                        className="bg-transparent font-black text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-xl cursor-pointer outline-none hover:bg-white dark:hover:bg-gray-600 transition-colors"
                      >
                        {Array.from({ length: 12 }, (_, i) => 2022 + i).map((y) => (
                          <option key={y} value={y} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-700/80 rounded-2xl p-1 shadow-inner border border-gray-200/80 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={handleIsgPrevMonth}
                      className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all text-gray-700 dark:text-gray-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="Önceki Ay"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Önceki</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleIsgToday}
                      className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      {t("filter_today") || "Bugün"}
                    </button>
                    <button
                      type="button"
                      onClick={handleIsgNextMonth}
                      className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all text-gray-700 dark:text-gray-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="Sonraki Ay"
                    >
                      <span className="hidden sm:inline">Sonraki</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Names */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2.5">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="h-18 md:h-24 rounded-2xl bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/40 opacity-40"
                    />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const formattedDateForCell = `${dayNum.toString().padStart(2, "0")}.${(currentMonth + 1).toString().padStart(2, "0")}.${currentYear}`;
                    const isToday =
                      dayNum === currDate.getDate() &&
                      currentMonth === currDate.getMonth() &&
                      currentYear === currDate.getFullYear();
                    const dayTasks = tasksByDate[formattedDateForCell] || [];
                    const hasOpenOrCritical = dayTasks.some(
                      (t) => t.status === "acik" || t.priority === "kritik" || t.priority === "yuksek"
                    );
                    const isSelected = selectedAdminDate === formattedDateForCell;

                    return (
                      <div
                        key={dayNum}
                        onClick={() => {
                          if (dayTasks.length > 0) {
                            setSelectedAdminDate(isSelected ? null : formattedDateForCell);
                            triggerHaptic("light");
                          }
                        }}
                        className={`h-18 md:h-24 rounded-2xl border p-2 flex flex-col items-center justify-between transition-all select-none ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.02]"
                            : isToday
                              ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-sm"
                              : dayTasks.length > 0
                                ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                                : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800/80 opacity-80"
                        }`}
                      >
                        <span
                          className={`text-xs md:text-sm font-black ${
                            isToday
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {dayNum}
                        </span>

                        {dayTasks.length > 0 ? (
                          <div className="flex flex-col items-center w-full gap-0.5">
                            <span className={`text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full shadow-xs truncate w-full text-center ${
                              hasOpenOrCritical ? "bg-red-500" : "bg-blue-600"
                            }`}>
                              {dayTasks.length} Tutanak
                            </span>
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Inspector Drawer if date is clicked */}
              {selectedAdminDate && selectedDateTasks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-blue-200 dark:border-blue-800/70 space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                        {selectedAdminDate} Tarihli Saha Denetimleri ({selectedDateTasks.length} Tutanak)
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedAdminDate(null)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Kapat
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDateTasks.map((task) => {
                      const priorityDef = PRIORITIES[task.priority] || PRIORITIES["basit"];
                      const statusDef = STATUS_INFO[task.status] || STATUS_INFO["acik"];
                      return (
                        <div
                          key={task.id}
                          className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {t(getDeptKey(task.dept))}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${priorityDef.color}`}>
                              {t(priorityDef.label_key)}
                            </span>
                          </div>
                          <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                            {task.subject || task.desc}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                            <span>Durum: <b>{t(statusDef.label_key)}</b></span>
                            {task.imgUrl && (
                              <button
                                onClick={() => setPreviewModalImg(task.imgUrl)}
                                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                              >
                                Fotoğrafı Gör
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (adminSystemMode === "home") {
    const displayName = currentUser?.name ? currentUser.name.trim() : (currentUser?.username || "Yönetici");
    const firstName = displayName.split(" ")[0];
    const openTasksCount = tasks.filter((t) => t.status === "acik").length;
    const resolvedTasksCount = tasks.filter((t) => t.status === "cozuldu").length;
    const tonnage24 = get24HourTonnage ? get24HourTonnage() : 0;
    const todayLoadsCount = loadings.filter((l) => {
      const now = new Date();
      const todayStr = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
      return l.date === todayStr || l.createdAt === todayStr;
    }).length;

    const todayDateFormatted = new Date().toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8 animate-slide-up space-y-6 md:space-y-8">
        {/* Executive Welcome Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-slate-700/60">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>ADS Metal A.Ş. — {t("role_admin") || "Sistem Yöneticisi"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white flex flex-wrap items-baseline gap-x-3.5 gap-y-2 overflow-visible tracking-normal py-1">
                <span className="inline-block">
                  {t("welcome_manager_title") || "Hoş Geldin,"}
                </span>
                <span className="inline-block text-cyan-300 dark:text-cyan-300 drop-shadow-sm font-black overflow-visible leading-relaxed pb-1">
                  {firstName}
                </span>
                <span className="inline-block animate-bounce select-none self-center text-3xl sm:text-4xl shrink-0">
                  👋
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                {t("portal_selection_desc") ||
                  "Fabrika genelindeki operasyonları, İSG denetimlerini veya sevkiyat durumunu incelemek için bir modül seçin."}
              </p>

              <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{todayDateFormatted}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
                  {t("executive_kpi_open") || "Açık İhlal"}
                </span>
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {openTasksCount > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${openTasksCount > 0 ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                </span>
              </div>
              <p
                className={`text-2xl font-black mt-1 ${openTasksCount > 0 ? "text-red-400" : "text-emerald-400"}`}
              >
                {openTasksCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {openTasksCount > 0 ? "İnceleme Bekliyor" : "Tüm Birimler Temiz"}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
                  {t("executive_kpi_resolved") || "Onay Bekleyen"}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {resolvedTasksCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Şef Çözümü Gönderildi
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
                  {t("executive_kpi_tonnage") || "Son 24s Sevkiyat"}
                </span>
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {tonnage24} <span className="text-sm font-semibold">Ton</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Bugün {todayLoadsCount} Araç
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
                  {t("next_reset") || "Puan Sıfırlama"}
                </span>
                <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
              <p className="text-lg font-black text-purple-300 mt-2 truncate">
                {getLastFridayOfCurrentMonth()}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Ay Sonu Sıfırlama
              </p>
            </div>
          </div>
        </div>

        {/* Modules Grid - Clear Options */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                {t("portal_selection_title") || "Operasyonel Modüller"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Gitmek istediğiniz yönetim alanına tıklayın
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: İSG & Saha Tertip Denetimi */}
            <div
              onClick={() => {
                navigate("/isg");
                setAdminSystemMode("isg");
                setAdminViewMode("calendar");
                setSelectedAdminDept(null);
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      openTasksCount > 0
                        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    {openTasksCount > 0 ? `${openTasksCount} Açık İhlal` : "Sorunsuz"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {t("module_isg_title") || "İSG & Saha Tertip Denetimi"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {t("module_isg_desc") ||
                    "Fabrika saha denetimleri, departman risk haritası, gün bazlı İSG takvimi ve ihlal onayları."}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-sm font-bold text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-all">
                <span>{t("btn_go_to_module") || "Modüle Git"}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Yükleme & Sevkiyat Takibi */}
            <div
              onClick={() => {
                navigate("/yukleme");
                setAdminSystemMode("yukleme");
                setAdminViewMode("calendar");
                setSelectedAdminDept(null);
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                    <Truck className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {tonnage24} Ton (Son 24s)
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t("module_yukleme_title") || "Yükleme & Sevkiyat Takibi"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {t("module_yukleme_desc") ||
                    "Tır ve araç yüklemeleri, 24 saatlik tonaj takipleri, sevkiyat takvimi ve lojistik kayıtları."}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-all">
                <span>{t("btn_go_to_module") || "Modüle Git"}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Liderlik Tablosu & Puanlar */}
            <div
              onClick={() => {
                navigate("/leaderboard");
                setAdminSystemMode("leaderboard");
                setAdminViewMode("leaderboard");
                setSelectedAdminDept(null);
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Aylık Sıralama
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t("module_leaderboard_title") || "Liderlik Tablosu & Puanlar"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {t("module_leaderboard_desc") ||
                    "Bölümler arası güvenlik puan sıralaması, ceza ve bonus puan geçmişi, aylık lig durumu."}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-all">
                <span>{t("btn_go_to_module") || "Modüle Git"}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Analiz & Yönetim Raporları */}
            <div
              onClick={() => {
                navigate("/analysis");
                setAdminSystemMode("analysis");
                setAdminViewMode("analysis");
                setSelectedAdminDept(null);
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                    <Activity className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    Grafikler & Trendler
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t("module_analysis_title") || "Analiz & Yönetim Raporları"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {t("module_analysis_desc") ||
                    "İhlal kategorileri analizi, sıklık grafikleri, trendler ve departman karşılaştırmaları."}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-all">
                <span>{t("btn_go_to_module") || "Modüle Git"}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* Card 5: Kullanıcı & Şef Hesapları */}
            <div
              onClick={() => {
                navigate("/users");
                setAdminSystemMode("users");
                setAdminViewMode("users");
                setSelectedAdminDept(null);
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {users.length} Kayıtlı Kullanıcı
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {t("module_users_title") || "Kullanıcı & Şef Hesapları"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {t("module_users_desc") ||
                    "Birim şefleri, İSG uzmanı ve yüklemeci hesapları, yeni kullanıcı kaydı ve şifre yönetimi."}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-sm font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-all">
                <span>{t("btn_go_to_module") || "Modüle Git"}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* Card 6: Gelen Bildirimler & Talepler */}
            <div
              onClick={() => {
                navigate("/feedbacks");
                setAdminSystemMode("feedbacks");
                setAdminViewMode("feedbacks");
                setSelectedAdminDept(null);
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl hover:border-pink-500/50 dark:hover:border-pink-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
                    Gelen Kutusu
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  {t("module_feedbacks_title") || "Gelen Bildirimler & Talepler"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {t("module_feedbacks_desc") ||
                    "Saha personeli ve şeflerden gelen geri bildirimler, hata bildirimleri ve öneriler."}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-sm font-bold text-pink-600 dark:text-pink-400 group-hover:translate-x-1 transition-all">
                <span>{t("btn_go_to_module") || "Modüle Git"}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
      {/* Top Breadcrumb Navigation: Return to Executive Hub */}
      <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            navigate("/");
            setAdminSystemMode("home");
            setSelectedAdminDept(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-bold text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-blue-600 dark:text-blue-400" />
          <span>{t("back_to_menu") || "Ana Menüye Dön"}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
            Aktif Modül:
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 uppercase">
            {adminSystemMode === "isg"
              ? "İSG & Saha Tertip"
              : adminSystemMode === "yukleme"
                ? "Yükleme & Sevkiyat"
                : adminSystemMode === "leaderboard"
                  ? "Liderlik Tablosu"
                  : adminSystemMode === "analysis"
                    ? "Analiz & Rapor"
                    : adminSystemMode === "users"
                      ? "Kullanıcı Yönetimi"
                      : adminSystemMode}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          {renderRightPanel()}
        </div>
      </div>

      {currentUser.username === "agiradar" &&
        (adminSystemMode === "isg" || adminSystemMode === "yukleme") && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center mb-2">
                  <AlertTriangle className="w-6 h-6 mr-2" />{" "}
                  {adminSystemMode === "isg"
                    ? "İSG Geçmişini Sil"
                    : "Sevkiyat Geçmişini Sil"}
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {adminSystemMode === "isg"
                    ? "Seçilen tarihten önceki İSG kayıtları silinecektir."
                    : "Seçilen tarihten önceki sevkiyat kayıtları silinecektir."}
                </p>
              </div>
              <div className="flex w-full md:w-auto space-x-3 items-center">
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="flex-1 md:w-48 border border-red-200 rounded-xl p-3 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <option value="1">{t("month_1")}</option>
                  <option value="3">{t("month_3")}</option>
                  <option value="6">{t("month_6")}</option>
                  <option value="all">{t("month_all")}</option>
                </select>
                <button
                  onClick={() => {
                    setDeleteTarget(adminSystemMode);
                    setShowDeleteModal(true);
                    setDeleteCountdown(10);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md whitespace-nowrap"
                >
                  {t("delete_btn")}
                </button>
              </div>
            </div>
          </div>
        )}

      {bonusModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-600" /> Özel Puan:{" "}
                {bonusDept}
              </h3>
              <button
                onClick={() => setBonusModalOpen(false)}
                className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("action_type") || "İşlem Türü"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBonusType("add")}
                    className={`py-3 rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer ${bonusType === "add" ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 border-2 border-green-500" : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-2 border-transparent"}`}
                  >
                    <Plus className="w-5 h-5 mr-1" /> Puan Ekle
                  </button>
                  <button
                    onClick={() => setBonusType("subtract")}
                    className={`py-3 rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer ${bonusType === "subtract" ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-2 border-red-500" : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-2 border-transparent"}`}
                  >
                    <ArrowDownRight className="w-5 h-5 mr-1" /> Puan Düş
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  {t("amount") || "Miktar"}
                </label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder={t("ph_bonus_amt") || "Örn: 10"}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Açıklama / Sebep
                </label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder={t("ph_bonus_reason") || "Neden puan veriliyor?"}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setBonusModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t("cancel") || "İptal"}
              </button>
              <button
                onClick={submitCustomBonus}
                className={`flex-1 py-3 font-bold rounded-xl text-white shadow-md transition-colors ${bonusType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {t("save_btn") || "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
              Hesabı Güncelle
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Kullanıcı bilgilerini güncellemek istediğinize emin misiniz?
              Yanlış değişiklikler yetkili hesapların erişimini etkileyebilir.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowUpdateUserModal(false);
                  setUserToUpdate(null);
                }}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={confirmUpdateUser}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                Onayla ve Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              Kullanıcıyı Sil
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Bu hesabı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem
              geri alınamaz.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setUserToDelete(null);
                }}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleteUserCountdown > 0}
                className={`px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors ${deleteUserCountdown > 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
              >
                {deleteUserCountdown > 0
                  ? `Sil (${deleteUserCountdown})`
                  : "Evet, Kalıcı Olarak Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 bg-red-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center">
                <ShieldAlert className="w-6 h-6 mr-2" /> {t("are_you_sure")}
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteCountdown(10);
                }}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 md:p-8 text-center space-y-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {t("are_you_sure")}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {historyFilter === "all"
                    ? t("del_warn_all")
                    : `${t("del_warn_1")} ${historyFilter} ${t("del_warn_2")}`}{" "}
                  <b className="text-red-600">{t("del_warn_end")}</b>
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteCountdown(10);
                  }}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={executeHistoryDelete}
                  disabled={deleteCountdown > 0}
                  className={`flex-1 py-4 font-bold rounded-xl shadow-md ${deleteCountdown > 0 ? "bg-red-200 text-red-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
                >
                  {deleteCountdown > 0
                    ? `${t("wait")} (${deleteCountdown}s)`
                    : t("perm_delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Bilinmiyor";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return `Az önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
};

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

const MemoFeedbacksAdmin = React.memo(FeedbacksAdmin);
const MemoAdminDashboard = React.memo(AdminDashboard);
const MemoModDashboard = React.memo(ModDashboard);
const MemoSefDashboard = React.memo(SefDashboard);
const MemoYuklemeciDashboard = React.memo(YuklemeciDashboard);
const MemoYukleniciDashboard = React.memo(YukleniciDashboard);
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem("isg_lang") || "tr");
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("isg_dark");
      if (saved !== null) {
        return saved === "true";
      }
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add("dark");
        if (document.body) document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        if (document.body) document.body.classList.remove("dark");
      }
      localStorage.setItem("isg_dark", String(darkMode));
    } catch (e) {
      console.error("Dark mode sync error:", e);
    }
  }, [darkMode]);

  const [users, setUsers] = useState([]);
  const [points, setPoints] = useState({});
  const [pointsHistory, setPointsHistory] = useState({});
  const [tasks, setTasks] = useState([]);
  const [pointLogs, setPointLogs] = useState([]);
  const [loadings, setLoadings] = useState([]);

  const [adminSystemMode, setAdminSystemMode] = useState("home");
  const [adminViewMode, setAdminViewMode] = useState("list");
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);

  const [notificationStatus, setNotificationStatus] = useState(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const lastActiveRecordedRef = useRef(0);
  const sessionVerifiedRef = useRef(false);
  const bonusRunningRef = useRef(false);
  const previousTasksRef = useRef([]);

  const handleSnapErr = useCallback((err) => {
    if (err?.code === "permission-denied") {
      console.warn("Firestore snapshot access pending permission or session refresh:", err?.message || err);
    } else {
      console.error("Firestore snapshot error:", err);
    }
    setIsFirebaseLoading(false);
  }, []);
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const now = Date.now();
      // Throttle: only update Firestore at most once every 15 minutes to prevent burning Firestore write quota
      if (now - lastActiveRecordedRef.current > 15 * 60 * 1000) {
        lastActiveRecordedRef.current = now;
        try {
          updateDoc(doc(db, "users", currentUser.id), { lastActive: new Date() }).catch(() => {});
        } catch (e) {}
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" })
        .then((status) => {
          status.onchange = function () {
            setNotificationStatus(this.state);
            if (this.state === "granted") {
              setToastMessage({
                type: "success",
                message:
                  'Bildirim izni verildi! Lütfen ayarlar menüsünden "Bildirimleri Aç" butonuna tıklayarak cihazınızı kaydedin.',
              });
            } else if (this.state === "denied") {
              setToastMessage({
                type: "error",
                message: "Bildirim izinleri engellendi.",
              });
            }
          };
        })
        .catch(() => {});
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (isRegisteringDevice) return;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setToastMessage({
        type: "error",
        message: "Tarayıcınız web anlık bildirimlerini desteklemiyor.",
      });
      return;
    }

    // iOS Safari PWA Standalone kontrolü
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia?.('(display-mode: standalone)')?.matches;
    if (isIOSDevice && !isStandalone) {
      setToastMessage({
        type: "error",
        message: "Apple (iOS) cihazlarda bildirim alabilmek için Safari'de 'Paylaş' simgesine basıp 'Ana Ekrana Ekle' dedikten sonra uygulamayı ana ekrandan açmalısınız.",
      });
      return;
    }

    if (Notification.permission === "denied") {
      setToastMessage({
        type: "error",
        message:
          "Bildirimler tarayıcı ayarlarından engellenmiş. Lütfen adres çubuğundaki kilit (🔒) ikonuna tıklayıp bildirimlere izin verin.",
      });
      return;
    }

    setIsRegisteringDevice(true);
    setToastMessage(null);
    try {
      // Timeout wrapper for requestPermission to prevent hanging on mobile/iOS
      const requestPermissionWithTimeout = new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new Error(
                "İzin isteği zaman aşımına uğradı. Lütfen tarayıcı ayarlarınızdan bildirim izinlerini manuel kontrol edin.",
              ),
            ),
          12000,
        );

        Notification.requestPermission()
          .then((permission) => {
            clearTimeout(timer);
            resolve(permission);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });

      const permission = await requestPermissionWithTimeout;
      setNotificationStatus(permission);

      if (permission === "granted" && currentUser) {
        const msgInstance = await getAppMessaging();
        if (!msgInstance) {
          throw new Error("Tarayıcınızın bildirim altyapısı bu oturumda başlatılamadı. Gizli sekme veya engelli ayarları kontrol edin.");
        }

        const { token, isPushToken, pushServiceUnavailable } = await ensureServiceWorkerAndGetToken(msgInstance);

        if (token) {
          localStorage.setItem("isg_device_fcm_token", token);
          localStorage.setItem("isg_notification_device_owner", currentUser.id);
          localStorage.setItem("isg_notification_role", currentUser.role);
          localStorage.setItem("isg_notification_dept", currentUser.dept || "");
          localStorage.removeItem("isg_notifications_disabled");

          await updateDoc(doc(db, "users", currentUser.id), {
            fcmToken: token,
            fcmTokens: arrayUnion(token),
            lastActive: new Date(),
          }).catch(async () => {
            await setDoc(doc(db, "users", currentUser.id), {
              fcmToken: token,
              fcmTokens: arrayUnion(token),
              lastActive: new Date(),
            }, { merge: true }).catch(() => {});
          });

          if (isPushToken) {
            setToastMessage({
              type: "success",
              message:
                "Bildirimler başarıyla açıldı! Artık bu cihaza bildirim gelecek.",
            });
            toast.success("Bildirimler başarıyla açıldı! Cihaz sisteme kaydedildi.");
          } else {
            setToastMessage({
              type: "success",
              message:
                "Cihazınız başarıyla kaydedildi! Canlı sesli sirenler ve uygulama içi bildirimler aktif edildi.",
            });
            toast.success(
              "Cihaz kaydedildi! Canlı sesli sirenler ve uygulama bildirimleri aktif.",
              { duration: 6000 }
            );
          }
          setShowNotifPrompt(false);
        } else {
          setToastMessage({
            type: "error",
            message: "Token alınamadı. Cihazınız veya tarayıcınız bu protokolü desteklemiyor olabilir.",
          });
        }
      } else if (permission === "denied") {
        setToastMessage({
          type: "error",
          message:
            "Bildirimler reddedildi. Lütfen cihaz/tarayıcı ayarlarınızdan bu site için bildirimlere izin verin.",
        });
      }
    } catch (err) {
      console.error("Bildirim izni/token alınamadı:", err);
      let errMsg = err?.message || "Tarayıcı izinlerini kontrol edin.";
      const errStr = (err?.message || "").toLowerCase();
      if (errStr.includes("push service error") || errStr.includes("registration failed")) {
        errMsg = "Mobil tarayıcı arka plan push servisi yanıt vermedi. Uygulama içi sesli sirenler aktif edildi; arka plan için 'Ana Ekrana Ekle' yapabilirsiniz.";
        if (currentUser) {
          const fallbackToken = `inapp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          localStorage.setItem("isg_device_fcm_token", fallbackToken);
          localStorage.setItem("isg_notification_device_owner", currentUser.id);
          localStorage.setItem("isg_notification_role", currentUser.role);
          localStorage.setItem("isg_notification_dept", currentUser.dept || "");
          localStorage.removeItem("isg_notifications_disabled");
          setDoc(doc(db, "users", currentUser.id), {
            fcmToken: fallbackToken,
            fcmTokens: arrayUnion(fallbackToken),
            lastActive: new Date(),
          }, { merge: true }).catch(() => {});
          setShowNotifPrompt(false);
          toast.success("Cihaz kaydedildi! Canlı sesli sirenler ve bildirimler aktif.");
        }
      } else if (err?.code === "messaging/permission-blocked" || errStr.includes("permission")) {
        errMsg = "Bildirim izni tarayıcı tarafından engellendi. Adres çubuğundaki kilit simgesinden izin verin.";
      } else if (err?.code === "messaging/unsupported-browser") {
        errMsg = "Kullandığınız tarayıcı Push bildirim protokolünü desteklemiyor.";
      }
      setToastMessage({
        type: "error",
        message: `Kayıt sırasında hata oluştu: ${errMsg}`,
      });
    } finally {
      setIsRegisteringDevice(false);
    }
  }, [isRegisteringDevice, currentUser]);

  const verifyAndSyncToken = useCallback(async (userObj, force = false) => {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      Notification.permission !== "granted" ||
      !userObj
    )
      return;

    try {
      const syncKey = `isg_token_synced_${userObj.id}`;
      const lastSync = sessionStorage.getItem(syncKey);
      const now = Date.now();
      // Throttle background syncs to at most once every 4 hours unless forced
      if (!force && lastSync && now - Number(lastSync) < 4 * 60 * 60 * 1000) {
        return;
      }

      const msgInstance = await getAppMessaging();
      if (!msgInstance) return;

      const { token } = await ensureServiceWorkerAndGetToken(msgInstance);

      if (token) {
        sessionStorage.setItem(syncKey, String(Date.now()));
        localStorage.setItem("isg_device_fcm_token", token);
        localStorage.setItem("isg_notification_device_owner", userObj.id);
        localStorage.setItem("isg_notification_role", userObj.role);
        localStorage.setItem("isg_notification_dept", userObj.dept || "");

        const existingTokens = Array.isArray(userObj.fcmTokens) ? userObj.fcmTokens : [];
        if (!existingTokens.includes(token) || userObj.fcmToken !== token) {
          console.log("Token sync/registration detected, updating Firestore with multi-device array...");
          await setDoc(doc(db, "users", userObj.id), {
            fcmToken: token,
            fcmTokens: arrayUnion(token),
            lastActive: new Date(),
          }, { merge: true });
          console.log("Token updated successfully for user:", userObj.username);
        }
      }
    } catch (error) {
      console.warn("Token verification sync notice:", error?.message || error);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || notificationStatus !== "granted") return;

    // Initial sync (non-forced, respects 4h throttle)
    verifyAndSyncToken(currentUser);

    // Sync on tab focus (visibilitychange) throttled
    let lastTabFocusCheck = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        // Ignore rapid tab switching under 10 minutes
        if (now - lastTabFocusCheck > 10 * 60 * 1000) {
          lastTabFocusCheck = now;
          verifyAndSyncToken(currentUser);
        }
      }
    };

    // Periodic sync (every 6 hours) to catch expired tokens in long-lived sessions
    const syncInterval = setInterval(
      () => {
        verifyAndSyncToken(currentUser, true);
      },
      6 * 60 * 60 * 1000,
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for Service Worker messages (e.g., token refresh requests)
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === "TOKEN_REFRESH_REQUIRED") {
        console.log(
          "Service Worker requested token refresh, running background sync...",
        );
        verifyAndSyncToken(currentUser, true);
      }
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
      clearInterval(syncInterval);
    };
  }, [currentUser, notificationStatus, verifyAndSyncToken]);

  const [selectedAdminDept, setSelectedAdminDept] = useState(null);
  const [selectedAdminDate, setSelectedAdminDate] = useState(null);
  const [selectedYuklemeDate, setSelectedYuklemeDate] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (showLogoutModal && logoutCountdown > 0) {
      timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showLogoutModal, logoutCountdown]);

  // Full-screen Image Modal Viewer
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [previewModalTitle, setPreviewModalTitle] = useState("");

  // Optional Sound Alerts (Defaults to enabled)
  const [soundAlerts, setSoundAlerts] = useState(() => {
    return localStorage.getItem("isg_sound_alerts") !== "false";
  });

  const toggleSoundAlerts = useCallback(() => {
    triggerHaptic("light");
    setSoundAlerts((prev) => {
      const next = !prev;
      localStorage.setItem("isg_sound_alerts", next ? "true" : "false");
      setTimeout(() => {
        if (next) {
          playNotificationSound("critical_alarm");
          toast.success(
            lang === "tr"
              ? "🔊 Sesli uyarılar açıldı (Örnek ses çalındı)"
              : "🔊 Sound alerts enabled (Sample played)",
            { id: "sound-toggle" },
          );
        } else {
          toast(
            lang === "tr"
              ? "🔇 Sesli uyarılar sessize alındı"
              : "🔇 Sound alerts muted",
            { id: "sound-toggle" },
          );
        }
      }, 0);
      return next;
    });
  }, [lang]);

  const t = useCallback((key) => DICT[lang][key] || key, [lang]);

  const toggleLang = useCallback(() => {
    triggerHaptic("light");
    const newLang = lang === "tr" ? "en" : "tr";
    setLang(newLang);
    localStorage.setItem("isg_lang", newLang);
  }, [lang]);

  useEffect(() => {
    let unsubMessage = () => {};
    if (messaging) {
      try {
        unsubMessage = onMessage(messaging, (payload) => {
          console.log("Ön planda mesaj alındı: ", payload);
          if (payload?.notification?.title) {
            triggerClientNotification(payload.notification.title, {
              body: payload.notification.body || "",
              icon: "/adsmetal_logo.jpg",
            });
          }
        });
      } catch (err) {
        console.error("onMessage init error", err);
      }
    }

    // Firebase Auth session persistence listener specifically for admin roles
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userSnap.exists()) {
            const adminData = { id: userSnap.id, ...userSnap.data() };
            if (adminData.role === "admin") {
              setCurrentUser((prev) => {
                if (!prev || prev.id === adminData.id) return adminData;
                return prev;
              });
              localStorage.setItem("isg_logged_in_user", adminData.id);
            }
          }
        } catch (authErr) {
          console.error("Firebase Auth admin session restore error:", authErr);
        }
      }
    });

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => doc.data());
        if (usersData.length === 0) {
          const defaultAdmin = {
            id: "1",
            username: "agiradar",
            role: "admin",
            name: "Ağır Adar",
            dept: null,
          };
          setDoc(doc(db, "users", "1"), defaultAdmin).catch(() => {});
          setUsers([defaultAdmin]);
        } else {
          setUsers(usersData);

          const savedUserId = localStorage.getItem("isg_logged_in_user");
          const savedAuthToken = localStorage.getItem("isg_auth_token");
          const authUser = auth.currentUser;
          const targetUserId = (authUser && authUser.uid) || savedUserId;
          if (targetUserId) {
            const autoUser = usersData.find((u) => u.id === targetUserId);
            if (autoUser) {
              // SECURITY: Session restoration requires a valid cryptographic JWT token.
              // If token is missing, prevent auto-login to eliminate localStorage spoofing.
              if (!savedAuthToken) {
                localStorage.removeItem("isg_logged_in_user");
                localStorage.removeItem("isg_auth_token");
                setCurrentUser(null);
                return;
              }

              // Verify session security with backend
              if (!sessionVerifiedRef.current) {
                sessionVerifiedRef.current = true;
                fetch("/api/verify-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: autoUser.id, token: savedAuthToken }),
                })
                  .then((res) => res.json())
                  .then((verifyData) => {
                    if (verifyData && verifyData.valid === false) {
                      localStorage.removeItem("isg_logged_in_user");
                      localStorage.removeItem("isg_auth_token");
                      setCurrentUser(null);
                    } else if (verifyData && verifyData.token) {
                      localStorage.setItem("isg_auth_token", verifyData.token);
                      if (verifyData.user) {
                        setCurrentUser(verifyData.user);
                      }
                    }
                  })
                  .catch(() => {});
              }
              setCurrentUser((prev) => {
                if (prev && prev.id === autoUser.id) {
                  if (
                    prev.name === autoUser.name &&
                    prev.username === autoUser.username &&
                    prev.role === autoUser.role &&
                    prev.dept === autoUser.dept &&
                    prev.fcmToken === autoUser.fcmToken &&
                    JSON.stringify(prev.fcmTokens) === JSON.stringify(autoUser.fcmTokens)
                  ) {
                    return prev;
                  }
                }
                return autoUser;
              });
              if (
                localStorage.getItem("isg_notification_device_owner") ===
                autoUser.id
              ) {
                localStorage.setItem("isg_notification_role", autoUser.role);
                localStorage.setItem(
                  "isg_notification_dept",
                  autoUser.dept || "",
                );
              }
            }
          }
        }
        setIsFirebaseLoading(false);
      },
      (err) => {
        setIsFirebaseLoading(false);
        handleSnapErr(err);
      },
    );

    return () => {
      unsubAuth();
      unsubMessage();
      unsubUsers();
    };
  }, []);

  // Heavy data collections (tasks, loadings, points) are only subscribed when an authenticated user is active.
  // Full historical data is maintained for complete analytics and reports, while Firestore's persistent
  // IndexedDB cache serves cached records with 0 reads upon reload.
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setLoadings([]);
      return;
    }

    const unsubPoints = onSnapshot(
      doc(db, "system", "points"),
      (docSnap) => {
        if (docSnap.exists()) {
          setPoints(docSnap.data());
        } else {
          const initialPoints = DEPARTMENTS.reduce((acc, dept) => {
            acc[dept] = 100;
            return acc;
          }, {});
          setDoc(doc(db, "system", "points"), initialPoints).catch(() => {});
          setPoints(initialPoints);
        }
      },
      handleSnapErr,
    );

    // Limit personal point log records to recent 50 to conserve reads (not used in analytics)
    const unsubPointLogs = onSnapshot(
      query(
        collection(db, "point_logs"),
        orderBy("timestamp", "desc"),
        limit(50),
      ),
      (snapshot) => {
        const logsData = snapshot.docs.map((doc) => doc.data());
        logsData.sort((a, b) => b.timestamp - a.timestamp);
        setPointLogs(logsData);
      },
      handleSnapErr,
    );

    // All tasks are retained in full without pagination so all analytics, charts, and reports remain 100% accurate
    const unsubTasks = onSnapshot(
      collection(db, "tasks"),
      (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        tasksData.sort((a, b) => (Number(b?.timestamp) || 0) - (Number(a?.timestamp) || 0));

        const prevTasks = previousTasksRef.current;
        if (prevTasks && prevTasks.length > 0) {
          try {
            // Aktif kullanıcı yoksa veya bildirimler kapatıldıysa ses ve toast kesinlikle tetiklenmez
            if (
              !currentUser ||
              localStorage.getItem("isg_notifications_disabled") === "true"
            ) {
              previousTasksRef.current = tasksData;
              setTasks(tasksData);
              return;
            }

            const activeRole =
              currentUser.role || localStorage.getItem("isg_notification_role");
            const activeDept =
              currentUser.dept || localStorage.getItem("isg_notification_dept");
            const localLang = localStorage.getItem("isg_lang") || "tr";

            tasksData.forEach((newTask) => {
              const oldTask = prevTasks.find((t) => t.id === newTask.id);
              if (!oldTask) {
                // Kural: Yeni ihlal bildirimleri YALNIZCA o birimin şefine/hesaplarına gider.
                // Yönetici ve İSG Uzmanına ihlal oluşturulurken bildirim KESİNLİKLE gitmez.
                const isAdminOrMod =
                  currentUser.role === "admin" ||
                  currentUser.role === "mod" ||
                  currentUser.role === "isg" ||
                  currentUser.role === "isgci" ||
                  currentUser.role === "yuklemeci";

                if (isAdminOrMod) {
                  return;
                }

                const isTargetUser =
                  isSameDept(currentUser.dept || activeDept, newTask.dept);
                  if (isTargetUser) {
                    const isCritical =
                      newTask.priority === "kritik" ||
                      newTask.priority === "yuksek" ||
                      (newTask.subject &&
                        (newTask.subject.toLowerCase().includes("yangın") ||
                          newTask.subject.toLowerCase().includes("acil") ||
                          newTask.subject.toLowerCase().includes("patlama") ||
                          newTask.subject.toLowerCase().includes("gaz") ||
                          newTask.subject.toLowerCase().includes("çökme")));

                    if (isCritical) {
                      // 1. Play the crisp, distinct industrial critical alarm chime
                      playNotificationSound("critical_alarm");

                      // 2. High-visibility open-screen emergency toast (deferred to avoid render collision)
                      setTimeout(() => {
                        toast.custom(
                          (t) => (
                            <div
                              className={`${
                                t.visible ? "animate-slide-down" : "animate-fade-out"
                              } max-w-md w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl rounded-2xl p-4 flex items-center space-x-3 border-2 border-red-300 pointer-events-auto`}
                            >
                              <div className="p-2.5 bg-white/20 rounded-xl animate-pulse shrink-0">
                                <AlertTriangle className="w-6 h-6 text-yellow-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
                                  🚨 Acil / Kritik İSG Bildirimi!
                                </p>
                                <p className="text-xs text-red-100 font-medium truncate mt-0.5">
                                  <span className="font-bold underline">{newTask.dept}:</span>{" "}
                                  {newTask.subject || newTask.desc || "Acil müdahale gerektiren durum."}
                                </p>
                              </div>
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ),
                          { duration: 9000, id: `critical-toast-${newTask.id}` }
                        );
                      }, 0);

                      // 3. System notification
                      triggerClientNotification(
                        localLang === "tr"
                          ? "🚨 KRİTİK İSG İHLALİ!"
                          : "🚨 CRITICAL OHS ALERT!",
                        {
                          body: `${newTask.dept}: ${newTask.subject || newTask.desc || "Acil müdahale gerektiren durum."}`,
                          tag: `critical-task-${newTask.id}`,
                          soundType: "critical_alarm",
                        },
                      );
                    } else {
                      triggerClientNotification(
                        localLang === "tr" ? "Yeni İSG İhlali" : "New OHS Violation",
                        {
                          body: newTask.desc || newTask.subject || "Yeni bir ihlal kaydı açıldı.",
                          tag: `new-task-${newTask.id}`,
                        },
                      );
                    }
                  }
                } else if (oldTask.status !== newTask.status) {
                  const isTargetAdmin =
                    activeRole === "admin" ||
                    activeRole === "mod" ||
                    activeRole === "isg" ||
                    activeRole === "isgci";
                  const isTargetChief =
                    isChief(activeRole) && isSameDept(activeDept, newTask.dept);

                  let title = "";
                  let body = "";
                  if ((newTask.status === "cozuldu" || newTask.status === "onay_bekliyor") && isTargetAdmin) {
                    title =
                      localLang === "tr"
                        ? "İhlal Çözüldü (Onay Bekliyor)"
                        : "Violation Resolved (Pending Review)";
                    body = `${newTask.dept} departmanı bir ihlali giderdi ve onay bekliyor.`;
                  } else if (
                    newTask.status === "itiraz_edildi" &&
                    isTargetAdmin
                  ) {
                    title =
                      localLang === "tr"
                        ? "İhlale İtiraz Edildi"
                        : "Violation Objected";
                    body = `${newTask.dept} departmanı bir ihlale itiraz etti.`;
                  } else if ((newTask.status === "kapatildi" || newTask.status === "cozuldu") && isTargetChief) {
                    title =
                      localLang === "tr"
                        ? "İhlal Kaydı Kapatıldı"
                        : "Violation Closed";
                    body = `${newTask.dept} departmanındaki bir ihlal çözümü onaylandı ve kapatıldı.`;
                  } else if (
                    newTask.status === "acik" &&
                    (oldTask.status === "cozuldu" || oldTask.status === "onay_bekliyor" || oldTask.status === "itiraz_edildi") &&
                    isTargetChief
                  ) {
                    title =
                      localLang === "tr"
                        ? "Aksiyon / Çözüm Reddedildi"
                        : "Solution Rejected";
                    body = `İSG Uzmanı aksiyonunuzu reddetti, ihlal tekrar açıldı.`;
                  }

                  if (title && body) {
                    triggerClientNotification(title, {
                      body,
                      tag: `status-${newTask.id}-${newTask.status}`,
                    });
                  }
                }
              });
          } catch (notifErr) {
            console.warn("Background notification check error:", notifErr);
          }
        }
        previousTasksRef.current = tasksData;
        setTasks(tasksData);
      },
      handleSnapErr,
    );

    const unsubPointsHistory = onSnapshot(
      doc(db, "system", "points_history"),
      (docSnap) => {
        if (docSnap.exists()) {
          setPointsHistory(docSnap.data());
        }
      },
      handleSnapErr,
    );

    // All shipments/loadings are retained in full so daily, 24-hr tonnage, and all shipment reports remain 100% accurate
    const unsubLoadings = onSnapshot(
      collection(db, "loadings"),
      (snapshot) => {
        const loadingData = snapshot.docs.map((doc) => doc.data());
        loadingData.sort((a, b) => b.timestamp - a.timestamp);
        setLoadings(loadingData);
      },
      handleSnapErr,
    );

    return () => {
      unsubPoints();
      unsubTasks();
      unsubLoadings();
      unsubPointsHistory();
      unsubPointLogs();
    };
  }, [currentUser?.id, currentUser?.role, currentUser?.dept]);

  useEffect(() => {
    if (
      isFirebaseLoading ||
      !currentUser ||
      currentUser.role !== "admin" ||
      bonusRunningRef.current ||
      !points ||
      Object.keys(points).length === 0
    )
      return;

    const checkDailyBonus = async () => {
      bonusRunningRef.current = true;
      try {
        const today = new Date();
        const formattedToday = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;

        if (points.lastDailyBonus === formattedToday) return; // Prevent double distribution on same day

        // Güvenlik: Farklı saat dilimindeki veya cihaz saatleri yanlış olan iki kullanıcının
        // birbirini tetikleyerek sonsuz bir "puan ekleme" döngüsüne (ping-pong) girmesini engeller.
        // Eğer son 12 saat içinde herhangi biri tarafından bonus dağıtılmışsa işlemi durdur.
        const lastTimestamp = points.lastBonusTimestamp || 0;
        const twelveHours = 12 * 60 * 60 * 1000;
        if (Date.now() - lastTimestamp < twelveHours) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedYesterday = `${yesterday.getDate().toString().padStart(2, "0")}.${(yesterday.getMonth() + 1).toString().padStart(2, "0")}.${yesterday.getFullYear()}`;

        const yesterdaysTasks = tasks.filter(
          (t) => t.createdAt === formattedYesterday,
        );
        const deptsWithTasks = new Set(yesterdaysTasks.map((t) => t.dept));

        let distributed = 0;
        const updates = {};

        DEPARTMENTS.forEach((dept) => {
          if (!deptsWithTasks.has(dept)) {
            updates[dept] = increment(20);
            distributed++;
          }
        });

        updates.lastDailyBonus = formattedToday;
        updates.lastBonusTimestamp = Date.now();

        const pointsRef = doc(db, "system", "points");
        await updateDoc(pointsRef, updates);

        DEPARTMENTS.forEach(async (dept) => {
          if (!deptsWithTasks.has(dept)) {
            try {
              await addDoc(collection(db, "point_logs"), {
                id:
                  Date.now().toString() +
                  Math.random().toString(36).substring(7),
                dept: dept,
                points: 20,
                reason: "Günlük İhlalsizlik Bonusu (Otomatik)",
                adminName: "Sistem",
                dateStr: formattedToday,
                timestamp: Date.now(),
              });
            } catch (e) {
              console.error(e);
            }
          }
        });

        console.log(
          `Otomatik Günlük Bonus Dağıtıldı: ${distributed} birime 20 puan eklendi.`,
        );
      } catch (err) {
        if (err?.code === "permission-denied") {
          console.warn("Otomatik bonus dağıtımı yetkilendirme bekleniyor:", err?.message || err);
        } else {
          console.error("Otomatik bonus dağıtımı hatası:", err);
        }
      } finally {
        bonusRunningRef.current = false;
      }
    };
    checkDailyBonus();
  }, [isFirebaseLoading, currentUser?.role, points?.lastDailyBonus, points?.lastBonusTimestamp, tasks]);

  const getLastFridayOfCurrentMonth = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    while (d.getDay() !== 5) {
      d.setDate(d.getDate() - 1);
    }

    // Eğer bugünün tarihi, bu ayın son Cuma gününü geçmişse; bir sonraki ayın son Cumasını hesapla
    if (today > d) {
      d.setMonth(d.getMonth() + 2);
      d.setDate(0);
      while (d.getDay() !== 5) {
        d.setDate(d.getDate() - 1);
      }
    }

    return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [lang]);

  const logout = useCallback(() => {
    triggerHaptic("medium");
    setShowLogoutModal(true);
    setLogoutCountdown(0);
  }, []);

  const executeLogout = useCallback(async (disableNotifications) => {
    triggerHaptic("heavy");
    const activeUserId = currentUser?.id || localStorage.getItem("isg_logged_in_user");
    const deviceFcmToken = localStorage.getItem("isg_device_fcm_token");

    // FCM token aboneliğini kullanıcı çıkış yaptığında Firestore üzerinden KESİNLİKLE sil
    if (activeUserId) {
      try {
        const userDocRef = doc(db, "users", activeUserId);
        const updates = {};
        if (deviceFcmToken) {
          updates.fcmTokens = arrayRemove(deviceFcmToken);
        }
        if (currentUser?.fcmToken === deviceFcmToken || !deviceFcmToken) {
          const remainingTokens = (currentUser?.fcmTokens || []).filter(
            (t) => t !== deviceFcmToken,
          );
          if (remainingTokens.length > 0) {
            updates.fcmToken = remainingTokens[0];
          } else {
            updates.fcmToken = deleteField();
          }
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(userDocRef, updates).catch(() => {});
        }
      } catch (e) {
        console.warn("FCM Token Firestore silme hatası:", e);
      }
    }

    // Backend endpoint'ini de çağırarak Firebase Admin ile tüm kullanıcı kayıtlarından bu cihazın tokenını temizle
    if (deviceFcmToken || activeUserId) {
      try {
        await fetch("/api/token/disable-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: deviceFcmToken, userId: activeUserId }),
        }).catch(() => {});
      } catch (e) {}
    }

    if (disableNotifications) {
      // 1. Bu cihaz için bildirimleri kesin olarak kapat ve yerel kayıtları temizle
      localStorage.setItem("isg_notifications_disabled", "true");
      localStorage.removeItem("isg_notification_device_owner");
      localStorage.removeItem("isg_notification_role");
      localStorage.removeItem("isg_notification_dept");
      localStorage.removeItem("isg_device_fcm_token");

      // 2. Tarayıcı push bildirim aboneliğini sonlandır
      try {
        const msgInstance = await getAppMessaging();
        if (msgInstance) {
          await deleteToken(msgInstance).catch(() => {});
        }
      } catch (e) {
        console.warn("Tarayıcı FCM token iptal hatası:", e);
      }

      // 3. Varsa açık bildirimleri temizle
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.getNotifications().then((notifs) => {
            notifs.forEach((n) => n.close());
          });
        }).catch(() => {});
      }

      toast.success(
        lang === "en"
          ? "Notifications disabled and logged out."
          : "Bildirimler kapatıldı ve çıkış yapıldı."
      );
    } else {
      localStorage.removeItem("isg_device_fcm_token");
      toast.success(
        lang === "en" ? "Logged out successfully." : "Çıkış yapıldı."
      );
    }

    try {
      await signOut(auth).catch(() => {});
    } catch (e) {
      console.error("Firebase Auth signOut error:", e);
    }
    setCurrentUser(null);
    setSelectedAdminDept(null);
    setSelectedAdminDate(null);
    setAdminViewMode("list");
    setAdminSystemMode("isg");
    localStorage.removeItem("isg_logged_in_user");
    localStorage.removeItem("isg_auth_token");
    setShowLogoutModal(false);
  }, [currentUser, lang]);

  const createTask = useCallback(
    async (dept, priority, subject, desc, deadlineHours, imgUrl) => {
      const taskId = Date.now().toString();
      const taskDeadline = deadlineHours || 24;

      // Determine initial infraction penalty based on priority level
      const normPri = (priority || "").toLowerCase();
      let infractionPenalty = 10;
      let priorityCode = "A";
      let priorityLabel = "Normal";

      if (
        normPri.includes("c") ||
        normPri.includes("kritik") ||
        normPri === "yuksek" ||
        normPri === "high"
      ) {
        infractionPenalty = 20;
        priorityCode = "C";
        priorityLabel = "Kritik";
      } else if (
        normPri.includes("b") ||
        normPri === "orta" ||
        normPri === "medium"
      ) {
        infractionPenalty = 15;
        priorityCode = "B";
        priorityLabel = "Yüksek Risk";
      }

      const newTask = {
        id: taskId,
        dept,
        priority,
        level: priorityCode,
        subject,
        desc,
        status: "acik",
        createdAt: formatDate(new Date()),
        timestamp: Date.now(),
        deadlineHours: taskDeadline,
        imgUrl: imgUrl || "",
        modNote: "",
        initialPenalty: infractionPenalty,
      };
      await setDoc(doc(db, "tasks", taskId), newTask);
      triggerHaptic("success");

      // 1. İHLAL OLUŞTUĞUNDA DEPARTMANDAN EKSİ PUAN DÜŞÜLÜR
      if (dept && infractionPenalty > 0) {
        try {
          const pointsRef = doc(db, "system", "points");
          await updateDoc(pointsRef, {
            [dept]: increment(-infractionPenalty),
          });

          await addDoc(collection(db, "point_logs"), {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            dept: dept,
            points: -infractionPenalty,
            reason: `Yeni İSG İhlali Tespiti (${priorityCode} Seviye - ${priorityLabel})`,
            adminName: "Sistem (İSG İhlal)",
            dateStr: new Date().toLocaleString("tr-TR"),
            timestamp: Date.now(),
            taskId: taskId,
          });
        } catch (e) {
          console.error("İhlal puan kesintisi hatası:", e);
        }
      }

      // API Notification trigger
      const currentToken = localStorage.getItem("isg_auth_token") || "";
      fetch("/api/notify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": currentToken ? `Bearer ${currentToken}` : `Bearer ${import.meta.env.VITE_FIREBASE_API_KEY}`
        },
        body: JSON.stringify({
          type: "NEW_TASK",
          payload: {
            dept,
            subject,
            desc,
            lang: localStorage.getItem("isg_lang") || "tr",
          },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.failureCount > 0) {
            console.warn(`Bildirim iletiminde bazı cihazlara ulaşılamadı (${data.failureCount} başarısız). Sistem ölü tokenları temizledi.`);
          }
        })
        .catch((err) => console.error("API notify error:", err));
    },
    [],
  );

  const updateTaskStatus = useCallback(
    async (id, newStatus, chiefNote = "", afterImgUrl = "", modNote = "") => {
      const taskRef = doc(db, "tasks", id);

      try {
        const taskSnap = await getDoc(taskRef);
        let dept = "";
        let oldStatus = "";

        if (taskSnap.exists()) {
          const taskData = taskSnap.data();
          dept = taskData.dept || "";
          oldStatus = taskData.status || "";

          // Puan sistemi mantığı:
          // 1. İhlal giderildiğinde / çözüldüğünde (onay_bekliyor veya acik durumundan cozuldu/kapatildi durumuna):
          const isResolution =
            (newStatus === "cozuldu" || (newStatus === "kapatildi" && oldStatus !== "itiraz_edildi")) &&
            oldStatus !== "cozuldu" &&
            oldStatus !== "kapatildi";

          if (isResolution) {
            const now = Date.now();
            const createdAt = taskData.timestamp || now;
            const deadlineHours = taskData.deadlineHours || 24;
            const diffMs = Math.max(0, now - createdAt);
            const diffHours = diffMs / (1000 * 60 * 60);

            // Determine priority baseline
            const normPri = (taskData.priority || taskData.level || "").toLowerCase();
            let baseRecovery = 10;
            let priorityCode = "A";
            if (
              normPri.includes("c") ||
              normPri.includes("kritik") ||
              normPri === "yuksek" ||
              normPri === "high"
            ) {
              baseRecovery = 20;
              priorityCode = "C";
            } else if (
              normPri.includes("b") ||
              normPri === "orta" ||
              normPri === "medium"
            ) {
              baseRecovery = 15;
              priorityCode = "B";
            }

            const initialPenalty = taskData.initialPenalty || baseRecovery;

            if (diffHours <= deadlineHours) {
              // ZAMANINDA ÇÖZÜM:
              // Hızlı çözülse dahi +10 bonus kaldırıldı. Departman ihlal cezasını her halükarda çeker.
              // Süre aşılmadığı için ek çarpanlı gecikme cezası uygulanmaz.
              await addDoc(collection(db, "point_logs"), {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                dept: dept,
                points: 0,
                reason: `Zamanında İhlal Çözümü: Verilen ${deadlineHours} saatlik termin süresi içinde (${Math.round(diffHours)} sa) giderildi. Ek gecikme cezası uygulanmadı.`,
                adminName: "Sistem (Zamanında Çözüm)",
                dateStr: new Date().toLocaleString("tr-TR"),
                timestamp: Date.now(),
                taskId: id,
              });
            } else {
              // GEÇ ÇÖZÜLDÜ (SÜRE AŞIMI - ÇARPANLI EKSİ PUAN KESİNTİSİ)
              // Verilen süre aşılmış! Sürenin aşılma oranına göre katlanan çarpanlı ek ceza puanı kesilir:
              const lateRatio = diffHours / deadlineHours;
              let lateMultiplier = 1.5;

              if (lateRatio >= 3) {
                lateMultiplier = 3.0;
              } else if (lateRatio >= 2) {
                lateMultiplier = 2.5;
              } else if (lateRatio >= 1.5) {
                lateMultiplier = 2.0;
              } else {
                lateMultiplier = 1.5;
              }

              const latePenalty = Math.round(initialPenalty * lateMultiplier);

              const pointsRef = doc(db, "system", "points");
              await updateDoc(pointsRef, {
                [dept]: increment(-latePenalty),
              });

              await addDoc(collection(db, "point_logs"), {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                dept: dept,
                points: -latePenalty,
                reason: `Gecikmeli İhlal Çözümü: Verilen ${deadlineHours} saatlik termin süresi aşılarak ${Math.round(diffHours)} saatte tamamlandı (${lateMultiplier}x Çarpanlı Süre Aşımı Cezası: -${latePenalty} Puan)`,
                adminName: "Sistem (Süre Aşımı Cezası)",
                dateStr: new Date().toLocaleString("tr-TR"),
                timestamp: Date.now(),
                taskId: id,
              });
            }
          }

          // 2. Haksız ihlal itirazı kabul edildiğinde ("kapatildi"):
          if (newStatus === "kapatildi" && oldStatus === "itiraz_edildi") {
            const initialPenalty = taskData.initialPenalty || 15;
            const pointsRef = doc(db, "system", "points");
            await updateDoc(pointsRef, {
              [dept]: increment(initialPenalty),
            });

            await addDoc(collection(db, "point_logs"), {
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              dept: dept,
              points: initialPenalty,
              reason: `İtiraz Kabul Edildi: İhlal tutanağı iptal edildi (+${initialPenalty} ceza puanı iadesi)`,
              adminName: "Yönetim (İtiraz Onayı)",
              dateStr: new Date().toLocaleString("tr-TR"),
              timestamp: Date.now(),
              taskId: id,
            });
          }
        }

        const updates = { status: newStatus };
        if (chiefNote) updates.chiefNote = chiefNote;
        if (afterImgUrl) updates.afterImgUrl = afterImgUrl;
        if (modNote) updates.modNote = modNote;
        if (newStatus === "cozuldu" || newStatus === "kapatildi") updates.resolvedTimestamp = Date.now();

        await updateDoc(taskRef, updates);
        triggerHaptic("success");

        // Notification trigger
        if (
          dept &&
          (newStatus === "cozuldu" ||
            newStatus === "itiraz_edildi" ||
            newStatus === "kapatildi" ||
            newStatus === "onay_bekliyor" ||
            newStatus === "acik")
        ) {
          const currentToken = localStorage.getItem("isg_auth_token") || "";
          fetch("/api/notify", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": currentToken ? `Bearer ${currentToken}` : `Bearer ${import.meta.env.VITE_FIREBASE_API_KEY}`
            },
            body: JSON.stringify({
              type: "STATUS_CHANGE",
              payload: {
                dept,
                newStatus,
                oldStatus,
                lang: localStorage.getItem("isg_lang") || "tr",
              },
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data && data.failureCount > 0) {
                console.warn(`Bildirim iletiminde bazı cihazlara ulaşılamadı (${data.failureCount} başarısız). Sistem ölü tokenları temizledi.`);
              }
            })
            .catch((err) => console.error("API notify error:", err));
        }
      } catch (e) {}
    },
    [],
  );

  const createLoading = useCallback(
    async (
      plaka,
      sofor,
      destCountry,
      destLocation,
      destCompany,
      projectNo,
      tonnage,
      not,
      imgUrl,
    ) => {
      if (!imgUrl) {
        toast.error("Yükleme kaydı için araç/yük fotoğrafı zorunludur!");
        return;
      }
      const loadId = Date.now().toString();
      const newLoad = {
        id: loadId,
        plaka,
        sofor,
        destCountry: destCountry || "",
        destLocation: destLocation || "",
        destCompany: destCompany || "",
        projectNo: projectNo || "",
        tonnage: tonnage || "",
        preNote: not,
        preImgUrl: imgUrl || "",
        status: "beklemede",
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        createdAtDate: formatDate(new Date()),
        createdAtTime: formatTime(new Date()),
        timestamp: Date.now(),
        postImgUrl: "",
        postNote: "",
        finishedAtTime: "",
      };
      await setDoc(doc(db, "loadings", loadId), newLoad);
      triggerHaptic("success");
    },
    [currentUser],
  );

  const startLoadingProcess = useCallback(async (loadId) => {
    triggerHaptic("medium");
    const loadRef = doc(db, "loadings", loadId);
    await updateDoc(loadRef, {
      status: "yukleniyor",
    });
  }, []);

  const finishLoading = useCallback(async (loadId, postNot, postImgUrl) => {
    if (!postImgUrl) {
      triggerHaptic("error");
      toast.error("Yüklemeyi tamamlamak için bitiş/bağlama fotoğrafı zorunludur!");
      return;
    }
    const loadRef = doc(db, "loadings", loadId);
    await updateDoc(loadRef, {
      status: "tamamlandi",
      postNote: postNot,
      postImgUrl: postImgUrl || "",
      finishedAtTime: formatTime(new Date()),
    });
    triggerHaptic("success");
  }, []);

  // 24 Hour Tonnage Analytics Calculation
  const get24HourTonnage = useCallback(() => {
    const past24h = Date.now() - 24 * 60 * 60 * 1000;
    return loadings
      .filter((l) => l.timestamp >= past24h)
      .reduce((total, load) => {
        const val = parseFloat(load.tonnage) || 0;
        return total + val;
      }, 0);
  }, [loadings]);

  // Full Screen Image Modal Lightbox Component

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    const isNotificationActiveForUser =
      notificationStatus === "granted" &&
      localStorage.getItem("isg_notification_device_owner") === currentUser?.id;
    const hasAnyToken =
      (Array.isArray(currentUser?.fcmTokens) &&
        currentUser.fcmTokens.length > 0) ||
      !!currentUser?.fcmToken;
    if (
      currentUser &&
      currentUser.role !== "yuklemeci" &&
      (!hasAnyToken || !isNotificationActiveForUser)
    ) {
      const dismissed = sessionStorage.getItem("isg_notif_prompt_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowNotifPrompt(true), 1500);
        return () => clearTimeout(timer);
      }
    } else {
      setShowNotifPrompt(false);
    }
  }, [currentUser, notificationStatus]);

  const handleDismissNotifPrompt = () => {
    sessionStorage.setItem("isg_notif_prompt_dismissed", "true");
    setShowNotifPrompt(false);
  };

  const recheckNotificationPermission = useCallback(async () => {
    triggerHaptic("medium");
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      toast.error(lang === "en" ? "Notifications not supported" : "Tarayıcınız bildirimleri desteklemiyor.");
      return;
    }
    const currentPerm = Notification.permission;
    setNotificationStatus(currentPerm);
    if (currentPerm === "granted") {
      localStorage.removeItem("isg_notifications_disabled");
      if (currentUser) {
        await verifyAndSyncToken(currentUser, true);
      }
      playNotificationSound("task_assigned");
      toast.success(
        lang === "en"
          ? "✅ Notifications are now ACTIVE! Connected to device."
          : "✅ Bildirimler AKTİF! Cihaz başarıyla bağlandı."
      );
    } else if (currentPerm === "denied") {
      toast.error(
        lang === "en"
          ? "❌ Permission still blocked in browser settings. Please click lock icon (🔒) in address bar to allow notifications."
          : "❌ Bildirim izni halen tarayıcı ayarlarından engelli. Lütfen adres çubuğundaki kilit (🔒) simgesinden izin verip tekrar deneyin."
      );
    } else {
      requestNotificationPermission();
    }
  }, [currentUser, lang, requestNotificationPermission, verifyAndSyncToken]);

  const contextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      isFirebaseLoading,
      setIsFirebaseLoading,
      lang,
      setLang,
      darkMode,
      setDarkMode,
      users,
      setUsers,
      points,
      setPoints,
      pointsHistory,
      setPointsHistory,
      tasks,
      setTasks,
      loadings,
      setLoadings,
      adminSystemMode,
      setAdminSystemMode,
      adminViewMode,
      setAdminViewMode,
      selectedAdminDept,
      setSelectedAdminDept,
      selectedAdminDate,
      setSelectedAdminDate,
      selectedYuklemeDate,
      setSelectedYuklemeDate,
      previewModalImg,
      setPreviewModalImg,
      previewModalTitle,
      setPreviewModalTitle,
      t,
      toggleLang,
      getLastFridayOfCurrentMonth,
      logout,
      createTask,
      updateTaskStatus,
      createLoading,
      startLoadingProcess,
      finishLoading,
      get24HourTonnage,
      db,
      notificationStatus,
      requestNotificationPermission,
      recheckNotificationPermission,
      verifyAndSyncToken,
      showPdfReportModal,
      setShowPdfReportModal,
      soundAlerts,
      toggleSoundAlerts,
      DEPARTMENTS,
      getDeptKey,
    }),
    [
      currentUser,
      isFirebaseLoading,
      lang,
      darkMode,
      users,
      points,
      pointsHistory,
      tasks,
      loadings,
      adminSystemMode,
      adminViewMode,
      selectedAdminDept,
      selectedAdminDate,
      selectedYuklemeDate,
      previewModalImg,
      previewModalTitle,
      t,
      toggleLang,
      getLastFridayOfCurrentMonth,
      logout,
      createTask,
      updateTaskStatus,
      createLoading,
      startLoadingProcess,
      finishLoading,
      get24HourTonnage,
      notificationStatus,
      requestNotificationPermission,
      recheckNotificationPermission,
      verifyAndSyncToken,
      showPdfReportModal,
      soundAlerts,
      toggleSoundAlerts,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 w-full">
        <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

        <ImageLightboxModal />
        <OfflineIndicator />

        {toastMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-up max-w-sm w-full px-4">
            <div
              className={`p-4 rounded-xl shadow-2xl flex items-start sm:items-center ${toastMessage.type === "error" ? "bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-700" : "bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700"}`}
            >
              {toastMessage.type === "error" ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <p
                className={`text-sm font-bold flex-1 ${toastMessage.type === "error" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}
              >
                {toastMessage.message}
              </p>
              <button
                onClick={() => setToastMessage(null)}
                className={`ml-3 shrink-0 p-1 rounded-lg ${toastMessage.type === "error" ? "hover:bg-red-100 dark:hover:bg-red-800/50 text-red-500" : "hover:bg-green-100 dark:hover:bg-green-800/50 text-green-500"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {!envCheck.isValid && (
          <div className="bg-red-600 text-white px-4 py-3 shadow-md z-[110] relative text-sm font-medium">
            <div className="max-w-7xl mx-auto flex items-start sm:items-center">
              <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong className="block mb-1">
                  Sistem Yapılandırma Hatası (.env)
                </strong>
                <ul className="list-disc pl-5 space-y-1">
                  {envCheck.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {isFirebaseLoading ? (
          <LoadingSpinner
            message={t("loading_server") || "Sistem Yükleniyor..."}
          />
        ) : (
          <>
            {showNotifPrompt && (
              <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl animate-slide-up text-center border border-gray-100 dark:border-gray-700">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Bell className="w-10 h-10 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                    Bildirimleri Aktifleştirin
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    Yeni İSG ihlalleri, görev atamaları ve anlık durum
                    güncellemelerinden haberdar olmak için bu cihazı sisteme
                    kaydetmeniz gerekmektedir.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        requestNotificationPermission();
                      }}
                      disabled={isRegisteringDevice}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isRegisteringDevice
                        ? "Kayıt Yapılıyor..."
                        : "Evet, Cihazımı Kaydet"}
                    </button>
                    <button
                      onClick={handleDismissNotifPrompt}
                      className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold py-3.5 px-4 rounded-xl transition-colors"
                    >
                      Daha Sonra
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Routes>
              <Route
                path="/login"
                element={
                  !currentUser ? <LoginScreen /> : <Navigate to="/" replace />
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <>
                      <MainLayout
                        theme={
                          currentUser?.role === "yuklemeci" ? "orange" : "blue"
                        }
                      >
                        {currentUser &&
                          currentUser.role !== "yuklemeci" &&
                          (!((Array.isArray(currentUser.fcmTokens) && currentUser.fcmTokens.length > 0) || currentUser.fcmToken) ||
                            !(
                              notificationStatus === "granted" &&
                              localStorage.getItem(
                                "isg_notification_device_owner",
                              ) === currentUser?.id
                            )) && (
                            <div className="bg-red-600 text-white px-4 py-3 flex flex-col sm:flex-row justify-between items-center text-sm font-medium shadow-md rounded-2xl mb-4">
                              <div className="flex items-start sm:items-center mb-3 sm:mb-0 max-w-4xl">
                                <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5 sm:mt-0" />
                                <span>
                                  <strong>
                                    {t("device_not_registered_title") || "Cihazınız bildirim sistemine kayıtlı değil!"}
                                  </strong>{" "}
                                  <br className="sm:hidden" />
                                  {t("device_not_registered_desc") || "Bildirimleri (yeni görevler, ihlaller vb.) anında alabilmek için bu cihazı sisteme kaydetmeniz gerekmektedir."}{" "}
                                  <span className="hidden sm:inline">
                                    {lang === "en"
                                      ? "How to register? Click the button and grant browser permission."
                                      : "Nasıl kayıt olurum? Yandaki butona tıklayıp tarayıcınızdan izin verin."}
                                  </span>
                                </span>
                              </div>
                              <button
                                onClick={requestNotificationPermission}
                                disabled={isRegisteringDevice}
                                className="bg-white text-red-600 px-4 py-2 sm:py-1.5 rounded-lg font-bold shadow-sm hover:bg-gray-100 transition-colors whitespace-nowrap w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isRegisteringDevice
                                  ? (t("registering") || "Kaydediliyor...")
                                  : (t("register_device_btn") || "Cihazı Şimdi Kaydet")}
                              </button>
                            </div>
                          )}
                        <div className="flex-1 w-full flex">
                          {(currentUser?.role === "admin" ||
                            currentUser?.role === "yonetici" ||
                            currentUser?.username === "agiradar" ||
                            currentUser?.username === "agiradarsahin") &&
                          adminSystemMode === "feedbacks" ? (
                            <MemoFeedbacksAdmin />
                          ) : currentUser?.role === "admin" ||
                            currentUser?.role === "yonetici" ||
                            currentUser?.username === "agiradar" ||
                            currentUser?.username === "agiradarsahin" ? (
                            <MemoAdminDashboard />
                          ) : null}
                          {(currentUser?.role === "mod" ||
                            currentUser?.role === "isg" ||
                            currentUser?.role === "isgci") && (
                            <MemoModDashboard />
                          )}
                          {currentUser?.role === "sef" && <MemoSefDashboard />}
                          {currentUser?.role === "yuklemeci" && (
                            <MemoYuklemeciDashboard />
                          )}
                          {(currentUser?.role === "yuklenici" ||
                            currentUser?.role === "worker") && (
                            <MemoYukleniciDashboard />
                          )}
                        </div>
                      </MainLayout>

                      {showLogoutModal && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                              <LogOut className="w-6 h-6 mr-2 text-red-500" />
                              {t("logout")}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                              {t("logout_confirm_desc") ||
                                "Çıkış yapmak üzeresiniz. Lütfen bildirim tercihinizle birlikte nasıl çıkış yapmak istediğinizi seçin."}
                            </p>
                            <div className="flex flex-col space-y-3">
                              <button
                                onClick={() => executeLogout(false)}
                                className="w-full py-3 rounded-xl font-bold flex justify-center items-center transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                              >
                                {t("logout_only") || "Sadece Çıkış Yap"}
                              </button>
                              <button
                                onClick={() => executeLogout(true)}
                                className="w-full py-3 rounded-xl font-bold shadow-md flex justify-center items-center transition-colors bg-red-600 text-white hover:bg-red-700 cursor-pointer gap-2"
                              >
                                <BellOff className="w-5 h-5 shrink-0" />
                                {t("logout_and_disable_notif") || "Bildirimleri Kapatıp Çıkış Yap"}
                              </button>
                              <button
                                onClick={() => setShowLogoutModal(false)}
                                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium cursor-pointer"
                              >
                                {t("cancel")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <PdfReportModal
                        isOpen={showPdfReportModal}
                        onClose={() => setShowPdfReportModal(false)}
                        tasks={tasks}
                        loadings={loadings}
                        departments={DEPARTMENTS}
                        currentUser={currentUser}
                        points={points}
                        lang={lang}
                        t={t}
                      />
                    </>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </>
        )}
      </div>
    </AppContext.Provider>
  );
}
