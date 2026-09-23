import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bug,
  Send,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029",
};

/**
 * Production-ready React ErrorBoundary component.
 * Catches runtime errors in child components and displays a clean, user-friendly
 * recovery interface instead of an unhandled blank white screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
      feedbackText: '',
      isSubmittingFeedback: false,
      feedbackSubmitted: false,
      showFeedbackForm: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught an unhandled UI runtime error:", error, errorInfo);

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        console.error("[ErrorBoundary] Failed to execute onError callback:", err);
      }
    }
  }

  resetErrorBoundary = () => {
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (err) {
        console.error("[ErrorBoundary] Failed to execute onReset callback:", err);
      }
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
      feedbackText: '',
      isSubmittingFeedback: false,
      feedbackSubmitted: false,
      showFeedbackForm: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#/';
    this.resetErrorBoundary();
  };

  handleClearCacheAndReload = () => {
    try {
      sessionStorage.clear();
      // Keep vital auth if possible, but clear transient states
      const user = localStorage.getItem('isg_logged_in_user');
      const pass = localStorage.getItem('isg_logged_in_pass');
      const lang = localStorage.getItem('isg_lang');
      const dark = localStorage.getItem('isg_dark_mode');

      localStorage.clear();

      if (user) localStorage.setItem('isg_logged_in_user', user);
      if (pass) localStorage.setItem('isg_logged_in_pass', pass);
      if (lang) localStorage.setItem('isg_lang', lang);
      if (dark) localStorage.setItem('isg_dark_mode', dark);
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    window.location.reload();
  };

  handleCopyDetails = () => {
    const errorDetails = `=== HATA BİLGİSİ ===
Hata: ${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Bilinmeyen hata'}
Konum: ${window.location.href}
Zaman: ${new Date().toISOString()}
Kullanıcı Ajanı: ${navigator.userAgent}

=== YIĞIN İZİ (STACK TRACE) ===
${this.state.error?.stack || 'Yığın izi yok'}

=== BİLEŞEN YIĞINI (COMPONENT STACK) ===
${this.state.errorInfo?.componentStack || 'Bileşen yığını yok'}`;

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch((err) => {
      console.error("Detaylar panoya kopyalanamadı:", err);
    });
  };

  handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!this.state.feedbackText.trim()) return;

    this.setState({ isSubmittingFeedback: true });
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);

      const savedUserId = localStorage.getItem('isg_logged_in_user') || 'Bilinmiyor';
      const userRole = localStorage.getItem('isg_notification_role') || 'Bilinmiyor';
      const userDept = localStorage.getItem('isg_notification_dept') || 'Bilinmiyor';

      const feedbackData = {
        text: `[SİSTEM HATA RAPORU]\nKullanıcı Açıklaması: ${this.state.feedbackText}\n\nHata: ${this.state.error?.message || 'Yok'}\nYığın: ${this.state.error?.stack ? this.state.error.stack.substring(0, 500) : 'Yok'}`,
        userId: savedUserId,
        userRole,
        userDept,
        url: window.location.href,
        timestamp: Date.now(),
        status: 'new',
        type: 'crash_report',
      };

      const addPromise = addDoc(collection(db, "feedbacks"), feedbackData);
      await Promise.race([
        addPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Zaman aşımı oluştu.")), 7000)
        ),
      ]);

      this.setState({ feedbackSubmitted: true, isSubmittingFeedback: false });
    } catch (err) {
      console.error("Hata raporu gönderilemedi:", err);
      this.setState({ isSubmittingFeedback: false });
    }
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback prop override
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            resetErrorBoundary: this.resetErrorBoundary,
          });
        }
        return this.props.fallback;
      }

      const isDarkMode =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('isg_dark_mode') === 'true';

      const isEn = localStorage.getItem('isg_lang') === 'en';

      return (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 select-text ${
          isDarkMode ? 'dark bg-gray-950 text-gray-100' : 'bg-gradient-to-br from-slate-50 via-gray-100 to-blue-50 text-gray-900'
        }`}>
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10 relative overflow-hidden animate-fade-in">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-rose-500" />

            {/* Error header & badge */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left mb-6">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
                  <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>

              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900/40 mb-2">
                  <Bug className="w-3.5 h-3.5" />
                  <span>{isEn ? "UI Runtime Error" : "Kullanıcı Arayüzü Hatası"}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {isEn ? "Something went wrong" : "Beklenmeyen Bir Hata Oluştu"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  {isEn
                    ? "An unexpected issue occurred while rendering this page. Your data is safe. You can reload or return to the main dashboard."
                    : "Sayfa görüntülenirken beklenmeyen bir durum meydana geldi. Verileriniz güvendedir. Sayfayı yenileyebilir veya ana panele dönebilirsiniz."}
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isEn ? "Reload Page" : "Sayfayı Yenile"}</span>
              </button>

              <button
                type="button"
                onClick={this.resetErrorBoundary}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-blue-500" />
                <span>{isEn ? "Try Again (Retry)" : "Yeniden Dene"}</span>
              </button>
            </div>

            {/* Secondary Utility Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2 pb-4 border-b border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isEn ? "Go to Dashboard" : "Ana Sayfaya Dön"}</span>
              </button>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="inline-flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                title={isEn ? "Clear cache and fresh restart" : "Önbelleği temizle ve sıfırdan aç"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isEn ? "Clear Cache & Restart" : "Önbelleği Temizle & Başlat"}</span>
              </button>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showFeedbackForm: !prev.showFeedbackForm }))}
                className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isEn ? "Report Issue" : "Sorunu Bildir"}</span>
              </button>
            </div>

            {/* Collapsible Technical Details for Diagnostics */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-gray-400" />
                  {isEn ? "Technical Error Details" : "Teknik Hata Detayları"}
                </span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-left font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-red-600 dark:text-red-400 font-bold truncate max-w-[80%]">
                      {this.state.error?.name || 'Error'}: {this.state.error?.message}
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyDetails}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer shadow-sm"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {isEn ? "Copied" : "Kopyalandı"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isEn ? "Copy Details" : "Kopyala"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed break-all scrollbar-thin">
                    {this.state.error?.stack && (
                      <div>
                        <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Stack:
                        </div>
                        <pre className="whitespace-pre-wrap font-mono">{this.state.error.stack}</pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Component Stack:
                        </div>
                        <pre className="whitespace-pre-wrap font-mono">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Crash Report Form */}
            {this.state.showFeedbackForm && !this.state.feedbackSubmitted && (
              <form onSubmit={this.handleFeedbackSubmit} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-left animate-fade-in">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isEn ? "What were you doing when this happened?" : "Hata oluştuğunda ne yapıyordunuz?"}
                </label>
                <textarea
                  required
                  rows={2}
                  value={this.state.feedbackText}
                  onChange={(e) => this.setState({ feedbackText: e.target.value })}
                  placeholder={
                    isEn
                      ? "e.g. Trying to upload an image or submit a form..."
                      : "Örn: Fotoğraf yüklerken veya form gönderirken kapandı..."
                  }
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-gray-750 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2.5 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => this.setState({ showFeedbackForm: false })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {isEn ? "Cancel" : "Vazgeç"}
                  </button>
                  <button
                    type="submit"
                    disabled={this.state.isSubmittingFeedback || !this.state.feedbackText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    {this.state.isSubmittingFeedback ? (
                      <span>{isEn ? "Sending..." : "Gönderiliyor..."}</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isEn ? "Send Report" : "Raporu Gönder"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {this.state.feedbackSubmitted && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>
                  {isEn
                    ? "Thank you! Your crash report has been forwarded to the system administrators."
                    : "Teşekkürler! Hata raporunuz sistem yöneticilerine iletildi."}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component wrapper for wrapping specific components with an ErrorBoundary.
 */
export function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  const ComponentWithErrorBoundary = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  ComponentWithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
