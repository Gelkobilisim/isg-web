import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, MoreVertical, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallButton = ({ className, variant = 'default' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // If we can't install and it's not a known mobile device, we can still show a generic guide or just hide it.
  // We'll show the button if it's installable OR if it's a mobile device (so we can show the manual instructions).
  // Even if not mobile, we can show it, but the guide will default to standard browser instructions.
  const isMobile = isIOS || isAndroid;
  if (!isInstallable && !isMobile) {
      return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowGuide(true);
    }
  };

  const baseClass = className || (variant === 'rounded' 
    ? "group flex items-center justify-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-gray-800 dark:text-gray-100 hover:scale-105 transition-all duration-300 border border-white/50 dark:border-gray-700/50"
    : "flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors w-full sm:w-auto");

  return (
    <>
      <button onClick={handleClick} className={baseClass}>
        <Download className={variant === 'rounded' ? "w-5 h-5 text-green-500 group-hover:-translate-y-0.5 transition-transform" : "w-4 h-4"} />
        <span className={variant === 'rounded' ? "text-sm font-bold hidden sm:inline-block" : ""}>
          Ana Ekrana Ekle
        </span>
      </button>

      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setShowGuide(false)}
          >
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <Smartphone className="w-6 h-6 text-indigo-500" />
                      Uygulamayı Kur
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Daha hızlı erişim için ana ekrana ekleyin.
                    </p>
                  </div>
                  <button onClick={() => setShowGuide(false)} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {isIOS ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                        <Share className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-snug">
                        Tarayıcınızın alt menüsündeki <strong className="text-blue-600 dark:text-blue-400">Paylaş</strong> butonuna dokunun.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl shrink-0">
                        <PlusSquare className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-snug">
                        Aşağı kaydırıp <strong className="text-gray-900 dark:text-white">Ana Ekrana Ekle</strong> (Add to Home Screen) seçeneğini seçin.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl shrink-0">
                        <MoreVertical className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-snug">
                        Tarayıcınızın sağ üst köşesindeki <strong className="text-gray-900 dark:text-white">Seçenekler (3 nokta)</strong> menüsüne dokunun.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl shrink-0">
                        <Download className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-snug">
                        Menüden <strong className="text-green-600 dark:text-green-400">Ana Ekrana Ekle</strong> veya <strong className="text-green-600 dark:text-green-400">Uygulamayı Yükle</strong> seçeneğine dokunun.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-6 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-4 rounded-2xl transition-colors shadow-lg"
                >
                  Anladım
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
