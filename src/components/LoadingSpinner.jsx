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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md w-full z-[100] fixed inset-0">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin shadow-lg shadow-blue-500/10"></div>
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-b-indigo-500 rounded-full animate-spin absolute [animation-direction:reverse]"></div>
      </div>
      <p className="text-gray-700 dark:text-gray-200 font-extrabold text-base tracking-wide animate-pulse">
        {message}
      </p>
      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Lütfen bekleyin...
      </span>
    </div>
  );
};
