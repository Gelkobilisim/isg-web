import React from 'react';
import { AlertTriangle, RefreshCw, Send, CheckCircle } from 'lucide-react';
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "isg-web-6363.firebaseapp.com",
  projectId: "isg-web-6363",
  storageBucket: "isg-web-6363.firebasestorage.app",
  messagingSenderId: "821576627724",
  appId: "1:821576627724:web:5941a738ff70940599a029"
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      feedbackText: '',
      isSubmitting: false,
      submitted: false,
      showFeedback: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!this.state.feedbackText.trim()) return;

    this.setState({ isSubmitting: true });
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      const savedUserId = localStorage.getItem('isg_logged_in_user') || 'Bilinmiyor';

      await addDoc(collection(db, "feedbacks"), {
          text: "[SİSTEM ÇÖKME RAPORU]\n" + this.state.feedbackText + "\n\nHata Detayı: " + this.state.error?.message,
          userId: savedUserId,
          userRole: localStorage.getItem('isg_notification_role') || 'Bilinmiyor',
          userDept: localStorage.getItem('isg_notification_dept') || 'Bilinmiyor',
          timestamp: Date.now(),
          status: 'new'
      });
      this.setState({ submitted: true, isSubmitting: false });
    } catch (err) {
      console.error("Geri bildirim gönderilemedi:", err);
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-sans">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Beklenmeyen Bir Hata Oluştu</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Uygulama yüklenirken veya çalışırken teknik bir sorun meydana geldi. Lütfen sayfayı yenilemeyi deneyin.
            </p>
            
            <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center mb-4"
            >
                <RefreshCw className="w-5 h-5 mr-2" /> Sayfayı Yenile
            </button>

            {!this.state.showFeedback && !this.state.submitted && (
                <button
                    onClick={() => this.setState({ showFeedback: true })}
                    className="text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline decoration-gray-300 dark:decoration-gray-600 transition-colors"
                >
                    Sorunu Bildir (Hata Raporu Gönder)
                </button>
            )}

            {this.state.showFeedback && !this.state.submitted && (
                <form onSubmit={this.handleFeedbackSubmit} className="text-left mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Hata Raporu (Ne yaparken oldu?)</label>
                    <textarea 
                        required
                        value={this.state.feedbackText}
                        onChange={(e) => this.setState({ feedbackText: e.target.value })}
                        rows="3"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 dark:text-gray-100 mb-3"
                        placeholder="Örn: Kamerayı açmaya çalışırken sayfa çöktü..."
                    ></textarea>
                    <button 
                        type="submit"
                        disabled={this.state.isSubmitting}
                        className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                        {this.state.isSubmitting ? 'Gönderiliyor...' : <><Send className="w-4 h-4 mr-2" /> Raporu Gönder</>}
                    </button>
                </form>
            )}

            {this.state.submitted && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col items-center animate-fade-in">
                    <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 text-center">Raporunuz yöneticilere iletildi. Teşekkür ederiz!</p>
                </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
