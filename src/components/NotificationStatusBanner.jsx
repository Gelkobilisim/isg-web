import React, { useState } from "react";
import { BellOff, AlertTriangle, RotateCcw, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

export const NotificationStatusBanner = ({
  notificationStatus,
  isNotificationsDisabled,
  currentUser,
  onRecheckPermission,
  onEnableNotifications,
  lang = "tr",
  t,
}) => {
  const [showHelpSteps, setShowHelpSteps] = useState(false);

  // If user is a contractor/worker (or no user), don't show
  if (!currentUser || currentUser.role === "yuklemeci") {
    return null;
  }

  // CASE 1: Browser Notification Permission is Denied (Pasif / Engelli)
  if (notificationStatus === "denied") {
    return (
      <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white rounded-2xl shadow-lg border border-red-400/40 p-4 sm:p-5 mb-5 animate-slide-down">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0 mt-0.5 sm:mt-0 ring-2 ring-white/30">
              <BellOff className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-black text-sm sm:text-base tracking-wide uppercase">
                  {t?.("notif_status_denied_title") ||
                    (lang === "en"
                      ? "Notification Settings: PASSIVE (Permission Blocked)"
                      : "Bildirim Ayarları: PASİF (Tarayıcı İzni Reddedildi)")}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black/30 text-amber-200 border border-amber-300/40">
                  {t?.("notif_status_passive_badge") || (lang === "en" ? "Passive (Blocked)" : "Pasif (Engelli)")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 font-medium leading-relaxed max-w-3xl">
                {t?.("notif_status_denied_desc") ||
                  (lang === "en"
                    ? "Browser notification permission has been denied. Field alerts, urgent hazards, and approvals cannot reach this device."
                    : "Tarayıcınız üzerinden bildirim izinleri reddedildiği için saha ihlalleri, acil uyarılar ve onay bildirimleri bu cihazda pasiftir.")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowHelpSteps(!showHelpSteps)}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{lang === "en" ? "How to Fix?" : "Nasıl Açılır?"}</span>
              {showHelpSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onRecheckPermission}
              className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>{t?.("notif_recheck_btn") || (lang === "en" ? "Re-check Permission" : "İzni Yeniden Tara")}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Step-by-Step Guide on How to Enable */}
        {showHelpSteps && (
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-black/15 p-3.5 rounded-xl">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-red-700 font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span>
                {lang === "en"
                  ? "Click the lock (🔒) or site settings icon in the browser address bar."
                  : "Adres çubuğundaki kilit (🔒) veya site ayarları simgesine tıklayın."}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-red-700 font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span>
                {lang === "en"
                  ? "Change Notifications setting from 'Block' to 'Allow'."
                  : "Bildirimler (Notifications) iznini 'Engellendi' yerine 'İzin Ver' yapın."}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-red-700 font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span>
                {lang === "en"
                  ? "Click 'Re-check Permission' button above to activate."
                  : "Yukarıdaki 'İzni Yeniden Tara' butonuna basarak aktifleştirin."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CASE 2: Notifications are manually silenced for this device
  if (isNotificationsDisabled) {
    return (
      <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 shadow-xs animate-slide-down">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-300 shrink-0">
            <BellOff className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">
                {lang === "en" ? "Device Notifications are Silenced" : "Bu Cihaz İçin Bildirimler Pasif (Sessizde)"}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                {lang === "en" ? "Passive" : "Pasif"}
              </span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
              {lang === "en"
                ? "You will not receive live sound alerts or popups on this device."
                : "Yeni bir ihlal veya onay durumunda bu cihaza anlık sesli ve görsel bildirim gelmeyecektir."}
            </p>
          </div>
        </div>
        <button
          onClick={onEnableNotifications}
          className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          {lang === "en" ? "Turn On Notifications" : "Bildirimleri Şimdi Aç"}
        </button>
      </div>
    );
  }

  return null;
};
