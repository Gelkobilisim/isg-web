import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({
  message = "Sistem Yükleniyor...",
  inline = false,
}) => {
  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="relative flex items-center justify-center mb-3">
          <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin absolute" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm animate-pulse tracking-wide">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white w-full z-[100] fixed inset-0 p-6 select-none"
    >
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 p-2 shadow-2xl mb-4 border border-white/10 flex items-center justify-center">
          <img
            src="/adsmetal_logo.jpg"
            alt="ADS Metal Logo"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white mb-1">
          ADS Metal A.Ş.
        </h1>
        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-6">
          İSG ve Sevkiyat Yönetim Portalı
        </p>

        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin absolute" />
        </div>

        <p className="text-slate-300 font-semibold text-sm tracking-wide">
          {message}
        </p>
        <span className="text-[11px] text-slate-400 mt-1">
          Güvenli fabrika veri bağlantısı kuruluyor...
        </span>
      </div>
    </div>
  );
};
