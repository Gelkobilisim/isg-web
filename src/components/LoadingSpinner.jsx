import React from 'react';

export const LoadingSpinner = ({ message = "Sistem Yükleniyor..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 w-full z-[100] fixed inset-0">
       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6 shadow-sm"></div>
       <p className="text-gray-600 dark:text-gray-300 font-bold animate-pulse text-lg tracking-wide">{message}</p>
    </div>
  );
};
