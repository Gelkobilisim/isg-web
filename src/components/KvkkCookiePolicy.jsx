import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Cookie,
  Camera,
  FileText,
  Lock,
  CheckCircle2,
  X,
  AlertTriangle,
  Scale,
  Info,
  SlidersHorizontal,
  Check,
  Printer,
  Search,
  Building2,
  UserCheck,
} from "lucide-react";

/**
 * T.C. Anayasası Madde 20, 6698 Sayılı KVKK ve 6331 Sayılı İSG Kanunu Uyarınca
 * Kapsamlı Gizlilik, Saha Fotoğraflandırma ve Veri İşleme Politikası Açılır Penceresi
 */
export const KvkkCookieModal = ({ isOpen, onClose, lang = "tr", initialTab = "kvkk" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Çerez Tercihleri State'i
  const [cookiePrefs, setCookiePrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("isg_kvkk_cookie_preferences");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      essential: true, // Zorunlu - Kapatılamaz
      notifications: true, // FCM Push bildirimleri
      preferences: true, // Dil, Karanlık Mod vb.
    };
  });

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, notifications: true, preferences: true };
    localStorage.setItem("isg_kvkk_cookie_accepted", "true");
    localStorage.setItem("isg_kvkk_accepted_date", new Date().toISOString());
    localStorage.setItem("isg_kvkk_cookie_preferences", JSON.stringify(allAccepted));
    setCookiePrefs(allAccepted);
    onClose();
  };

  const handleSavePreferences = () => {
    localStorage.setItem("isg_kvkk_cookie_accepted", "true");
    localStorage.setItem("isg_kvkk_accepted_date", new Date().toISOString());
    localStorage.setItem("isg_kvkk_cookie_preferences", JSON.stringify(cookiePrefs));
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText =
      lang === "en"
        ? "ADS Metal A.Ş. OHS Portal - Privacy & KVKK Data Processing Summary: In compliance with Turkish Constitution Art. 20, Law No. 6698 (KVKK) and Law No. 6331 (OHS), field photos and essential cookies are processed strictly for occupational safety and legal compliance. By using this system, users accept these terms."
        : "ADS Metal A.Ş. İSG Portalı - Gizlilik, KVKK ve Saha Fotoğraflandırma Özeti: T.C. Anayasası Md. 20, 6698 sayılı KVKK ve 6331 sayılı İSG Kanunu uyarınca; saha fotoğrafları ve zorunlu çerezler yalnızca iş güvenliğini sağlamak ve kaza risklerini önlemek amacıyla işlenir. Sistemi kullanan tüm personel bu şartları kabul etmiş sayılır.";
    navigator.clipboard?.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-5 animate-fade-in"
    >
      <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700/80 flex items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-gray-850 dark:via-gray-800 dark:to-gray-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 dark:text-gray-100 text-base sm:text-lg tracking-tight">
                  {lang === "en"
                    ? "Legal Compliance, Privacy & Cookie Policy"
                    : "Gizlilik, KVKK & Veri İşleme Politikası"}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                <span>T.C. Anayasası Md. 20</span>
                <span>•</span>
                <span>6698 Sayılı KVKK</span>
                <span>•</span>
                <span>6331 Sayılı İSG Kanunu</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title={lang === "en" ? "Print Policy" : "Politikayı Yazdır"}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors hidden sm:flex cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title={lang === "en" ? "Close" : "Kapat"}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/90 dark:bg-gray-900/60 p-2 sm:px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <button
              onClick={() => setActiveTab("kvkk")}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "kvkk"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-200 dark:border-gray-700"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/40 dark:hover:bg-gray-800/40"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === "en" ? "KVKK & Constitution" : "KVKK & Anayasa"}</span>
            </button>

            <button
              onClick={() => setActiveTab("photos")}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "photos"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-200 dark:border-gray-700"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/40 dark:hover:bg-gray-800/40"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{lang === "en" ? "Field Photos & OHS Law" : "Saha Fotoğrafları (İSG)"}</span>
            </button>

            <button
              onClick={() => setActiveTab("cookies")}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "cookies"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-200 dark:border-gray-700"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/40 dark:hover:bg-gray-800/40"
              }`}
            >
              <Cookie className="w-4 h-4" />
              <span>{lang === "en" ? "Essential Cookies" : "Zorunlu Çerezler"}</span>
            </button>

            <button
              onClick={() => setActiveTab("terms")}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "terms"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-200 dark:border-gray-700"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/40 dark:hover:bg-gray-800/40"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{lang === "en" ? "Terms & Consent" : "Kullanım Şartları"}</span>
            </button>
          </div>

          <div className="relative shrink-0 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "Search policy..." : "Mevzuatta ara..."}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-5 leading-relaxed">
          {/* TAB 1: KVKK & T.C. ANAYASASI */}
          {activeTab === "kvkk" && (
            <div className="space-y-4">
              <div className="bg-blue-50/80 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 flex items-start gap-3.5 text-blue-950 dark:text-blue-200">
                <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm">
                    {lang === "en"
                      ? "Constitutional Guarantee and Statutory Basis"
                      : "T.C. Anayasası Md. 20 ve 6698 Sayılı KVKK Kapsamında Aydınlatma"}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    <strong>T.C. Anayasası Madde 20/3</strong> gereğince; <em>“Herkes, kendisiyle ilgili kişisel verilerin korunmasını isteme hakkına sahiptir. Kişisel veriler, ancak kanunda öngörülen hallerde veya kişinin açık rızasıyla işlenebilir.”</em> Bu sistemdeki veri işleme faaliyetleri <strong>6331 sayılı İş Sağlığı ve Güvenliği Kanunu</strong> ve <strong>4857 sayılı İş Kanunu</strong>’nun amir hükümleri uyarınca kanuni zorunluluk kapsamında yürütülmektedir.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  1. Veri Sorumlusu Kimliği
                </h4>
                <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca veri sorumlusu;{" "}
                  <strong>ADS Metal A.Ş.</strong> (Anadolu Organize Sanayi Bölgesi - Ankara) tüzel kişiliğidir.
                  İşletme bünyesindeki tüm kişisel veri işleme faaliyetleri yasal mevzuat sınırları içerisinde, kurumsal gizlilik prensiplerine tam riayet edilerek sürdürülür.
                </p>
              </div>

              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  2. İşlenen Kişisel Veri Kategorileri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
                    <strong className="block text-gray-900 dark:text-gray-100 font-bold mb-0.5">
                      👤 Kimlik ve Yetki Bilgileri
                    </strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">
                      Ad, soyad, kullanıcı adı, fabrika görev departmanı (Kaynak, Boya, Montaj, Bakım vb.) ve rol yetkisi (Şef, İSG Uzmanı, Admin, Yüklemeci).
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
                    <strong className="block text-gray-900 dark:text-gray-100 font-bold mb-0.5">
                      📸 Saha Görsel Kayıtları
                    </strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">
                      İş sağlığı ve güvenliği saha denetimlerinde tespit edilen uygunsuzluk, ramak kala durumu, KKD eksikliği ve aksiyon çözüm fotoğrafları.
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
                    <strong className="block text-gray-900 dark:text-gray-100 font-bold mb-0.5">
                      🚚 Lojistik & Sevkiyat Bilgileri
                    </strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">
                      Sevkiyat şoför adı, araç plaka numarası, yükleme tonajı, ürün palet durumları ve araç bağlama emniyet kontrol fotoğrafları.
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
                    <strong className="block text-gray-900 dark:text-gray-100 font-bold mb-0.5">
                      🔐 İşlem ve Donanım Güvenliği
                    </strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">
                      Şifreli JWT oturum belirteçleri, IP adresleri, son erişim saatleri ve cihaz bazlı anlık acil durum FCM push bildirim donanım anahtarları.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  3. Hukuki Sebepler ve Yasal Dayanaklar (KVKK Md. 5/2)
                </h4>
                <p className="mb-2">
                  Verileriniz, KVKK'nın 5. maddesinin 2. fıkrası uyarınca <strong>açık rıza aranmaksızın</strong> aşağıdaki kanuni gerekçelerle işlenmektedir:
                </p>
                <ul className="space-y-1.5 list-disc pl-5 text-gray-600 dark:text-gray-300">
                  <li>
                    <strong>Kanunlarda Açıkça Öngörülmesi (Md. 5/2-a):</strong> 6331 sayılı İş Sağlığı ve Güvenliği Kanunu, 4857 sayılı İş Kanunu ve ilgili iş güvenliği yönetmelikleri.
                  </li>
                  <li>
                    <strong>Hukuki Yükümlülüğün Yerine Getirilmesi (Md. 5/2-ç):</strong> İşverenin iş yerinde iş sağlığını gözetme, tehlikeleri denetleme, kazaları önleme ve resmi denetim kayıtlarını muhafaza etme zorunluluğu.
                  </li>
                  <li>
                    <strong>Meşru Menfaat (Md. 5/2-f):</strong> Çalışanların can ve uzuv bütünlüğünü korumak, fabrika üretim emniyetini sağlamak ve olası maddi/manevi zararları engellemek.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  4. Veri Sahibinin Hakları (KVKK Md. 11)
                </h4>
                <p>
                  KVKK'nın 11. maddesi gereğince tüm çalışanlar ve kullanıcılar; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme haklarına sahiptir. Şirket İSG ve İnsan Kaynakları birimine yazılı başvuru ile bu haklar her zaman kullanılabilir.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SAHA FOTOĞRAFLARI & İSG KANUNU (DAVAYA KARŞI KORUMA) */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <div className="bg-amber-50/90 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3.5 text-amber-950 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm">
                    {lang === "en"
                      ? "Field Photos & Privacy Shield under OHS Law"
                      : "Saha Fotoğrafları, Mahremiyet Güvencesi ve Hukuki Sorumluluk Kalkanı"}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-95">
                    Bu sistemde yer alan saha fotoğrafları <strong>asla kişisel teşhir, sosyal medya veya ticari amaçla çekilmez ve paylaşılamaz</strong>. Fotoğraflar yalnızca <strong>6331 sayılı İSG Kanunu</strong> çerçevesinde olası iş kazalarının önüne geçmek, can güvenliğini sağlamak ve tehlikeli fiziksel durumları tespit edip gidermek amacıyla işlenir.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Fotoğraflar Neden Çekiliyor? (Yasal Zorunluluk)
                </h4>
                <p className="mb-2">
                  İşyerinde meydana gelebilecek kazaların adli ve cezai sorumluluğu doğrudan işverene ve birim yöneticilerine aittir. Kanunun emredici hükümleri şunlardır:
                </p>
                <div className="space-y-2">
                  <blockquote className="p-3 bg-gray-50 dark:bg-gray-800/70 rounded-xl border-l-4 border-blue-600 text-xs italic">
                    <strong>6331 Sayılı İSG Kanunu Madde 4:</strong> “İşveren, çalışanların işle ilgili sağlık ve güvenliğini sağlamakla yükümlü olup; mesleki risklerin önlenmesi, eğitim ve bilgi verilmesi dâhil her türlü tedbirin alınması, organizasyonun yapılması, gerekli araç ve gereçlerin sağlanması ve mevcut durumun iyileştirilmesi için denetim yapar.”
                  </blockquote>
                  <blockquote className="p-3 bg-gray-50 dark:bg-gray-800/70 rounded-xl border-l-4 border-amber-500 text-xs italic">
                    <strong>6331 Sayılı İSG Kanunu Madde 10:</strong> “İşveren, iş sağlığı ve güvenliği yönünden risk değerlendirmesi yapmak veya yaptırmakla, tespit edilen risk ve tehlikeleri kayıt altına alıp önleyici tedbir geliştirmekle yükümlüdür.”
                  </blockquote>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/70 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3">
                <h5 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Fotoğraflandırma Standartları ve Çalışan Koruma İlkeleri:
                </h5>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Odak Noktası Tehlike ve Ekipmandır:</strong> Fotoğraf çekilirken şahsın yüzü veya özel hayatı değil; makine muhafazası, baret/yelek eksikliği, hatalı istif, yangın riski veya düzeltilen emniyetli ortam kadraja alınır.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Biyometrik Veri İşlenmez:</strong> Saha fotoğrafları yüz tanıma, biyometrik tarama veya yapay zeka ile şahıs profilleme işlemlerine kesinlikle tabi tutulmaz.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Kapalı Devre Güvenli Saklama:</strong> Tüm görseller şifrelenmiş kurumsal bulut sunucularında saklanır. Yalnızca yetkili İSG uzmanı, ilgili bölüm şefi ve fabrika üst yönetimi erişimine açıktır.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Gerekçeli İtiraz ve Düzeltme Mekanizması:</strong> İhlal kaydının veya fotoğrafın gerçeği yansıtmadığını veya haksız olduğunu değerlendiren birim şefi/çalışan, sistem üzerinden itirazda bulunabilir. İtiraz İSG kurulu tarafından incelenir ve hatalı kayıtlar silinir.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Scale className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <p>
                  ⚖️ <strong>Yasal Beyan:</strong> Yargıtay ve KVKK Kurulu emsal kararları uyarınca; iş ortamında can güvenliğini temin etmek ve kaza risklerini önlemek maksadıyla yapılan denetimsel görüntülemeler hukuka uygundur ve özel hayatın ihlali olarak nitelendirilemez. Fabrika sahasında bulunan tüm çalışan ve yükleniciler, bu sistemi kullanarak İSG denetim sürecini peşinen kabul etmiş sayılır.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ZORUNLU ÇEREZLER VE TERCİHLER */}
          {activeTab === "cookies" && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3.5 text-emerald-950 dark:text-emerald-200">
                <Cookie className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm">
                    {lang === "en"
                      ? "Zero Marketing Cookies & Technical Necessity Guarantee"
                      : "Pazarlama ve Takip Çerezi Yoktur — Yalnızca Zorunlu Teknik Çerezler"}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-95">
                    Bu web portalında kullanıcıları takip eden, reklam gösteren veya 3. şahıslara profil bilgisi aktaran hiçbir pazarlama çerezi kullanılmamaktadır. Yalnızca oturum güvenliği, anlık İSG ihlal bildirimleri ve arayüz tercihleri için gerekli teknik yerel anahtarlar (LocalStorage & Session) kullanılır.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  Kullanılan Çerezler ve Depolama Anahtarları
                </h4>

                <div className="space-y-2.5">
                  {/* Zorunlu Çerez */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          isg_auth_token & isg_logged_in_user
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          Zorunlu / Güvenlik
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                        Oturum açma güvenliğini, şifrelenmiş JWT anahtarını ve yetkisiz kişilerin fabrika verilerine erişimini engellemek için teknik olarak mecburidir. Kapatılamaz.
                      </p>
                    </div>
                    <div className="shrink-0 pt-1">
                      <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                        Her Zaman Aktif
                      </span>
                    </div>
                  </div>

                  {/* İSG Bildirim Çerezi */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          isg_device_fcm_token & isg_notification_device_owner
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          İSG Can Güvenliği Bildirimi
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                        Fabrika sahasında acil kaza, tehlike veya bölüm şefine atanan görevlerin telefonunuza sesli push bildirim olarak anında düşmesini sağlayan cihaz kimliğidir.
                      </p>
                    </div>
                    <div className="shrink-0 pt-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cookiePrefs.notifications}
                          onChange={(e) =>
                            setCookiePrefs((prev) => ({ ...prev, notifications: e.target.checked }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Arayüz Çerezleri */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-gray-700 dark:text-gray-300 text-xs">
                          isg_dark, isg_lang, isg_sound_alerts
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Kullanıcı Tercihleri
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                        Karanlık mod (Dark mode), Türkçe/İngilizce dil ve sesli alarm tercihlerinizin cihazınızda hatırlanmasını sağlar.
                      </p>
                    </div>
                    <div className="shrink-0 pt-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cookiePrefs.preferences}
                          onChange={(e) =>
                            setCookiePrefs((prev) => ({ ...prev, preferences: e.target.checked }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KULLANIM ŞARTLARI VE KABUL BEYANI */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-gray-800/70 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80">
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Sistem Kullanım Şartları ve Sorumluluk Taahhütnamesi
                </h4>
                <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                  ADS Metal İş Sağlığı, Güvenliği ve Lojistik Yönetim Sistemi'ni (“Portal”) kullanan tüm çalışanlar, şefler, mühendisler ve yüklenici personeller aşağıdaki kurallara ve yasal yükümlülüklere uymayı taahhüt eder:
                </p>

                <ol className="list-decimal pl-5 space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Gerçeğe Uygun Veri ve Fotoğraf Bildirimi:</strong> İSG ihlali, düzeltici aksiyon veya sevkiyat kaydı oluştururken yanıltıcı, montajlanmış, şahsi husumete dayalı veya gerçeğe aykırı veri/fotoğraf girilemez. Haksız ceza veya kasıtlı bildirim tespiti halinde idari ve disiplin cezası uygulanır.
                  </li>
                  <li>
                    <strong>Hesap ve Cihaz Güvenliği:</strong> Kullanıcı adı ve şifre kişiye özeldir; başkasına devredilemez. Ortak telefon veya fabrika tableti kullanıldığında vardiya sonunda oturum kapatılmalıdır.
                  </li>
                  <li>
                    <strong>Ticari Sır ve Fabrika Mahremiyeti:</strong> Portalda yer alan üretim hatları, kalıplar, sevkiyat tonajları ve saha fotoğrafları şirketin ticari sırrıdır; şirket dışına sızdırılamaz, sosyal medyada paylaşılamaz.
                  </li>
                  <li>
                    <strong>Kabul Beyanı ve Yasal Hüküm:</strong> Sisteme giriş yapan veya kullanan tüm personeller; işbu Kullanım Şartları'nı, KVKK Aydınlatma Metni'ni, 6331 sayılı İSG Kanunu uyarınca yapılan fotoğraflandırmayı ve Zorunlu Çerez Politikasını peşinen ve gayrikabili rücu kabul etmiş sayılır.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700/80 bg-gray-50/90 dark:bg-gray-850 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-center sm:text-left">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>T.C. Anayasası Md. 20, 6698 Sayılı KVKK ve 6331 Sayılı İSGK güvencesindedir.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kopyalandı</span>
                </>
              ) : (
                <span>Özeti Kopyala</span>
              )}
            </button>

            {activeTab === "cookies" ? (
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tercihleri Kaydet</span>
              </button>
            ) : (
              <button
                onClick={handleAcceptAll}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === "en" ? "I Accept & Acknowledge" : "Okudum, Kabul Ediyorum"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * İlk Girişte Açılan Şık Çerez Onay Modalı / Barı
 * Kullanıcı tercihlerini yönetebilir veya tümünü kabul edip devam edebilir.
 */
export const KvkkCookieBanner = ({ onOpenModal, lang = "tr" }) => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const [cookiePrefs, setCookiePrefs] = useState({
    essential: true,
    notifications: true,
    preferences: true,
  });

  useEffect(() => {
    const isAccepted = localStorage.getItem("isg_kvkk_cookie_accepted");
    if (!isAccepted) {
      // Sayfa yüklendikten hemen sonra şık bir animasyonla belirsin
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, notifications: true, preferences: true };
    localStorage.setItem("isg_kvkk_cookie_accepted", "true");
    localStorage.setItem("isg_kvkk_accepted_date", new Date().toISOString());
    localStorage.setItem("isg_kvkk_cookie_preferences", JSON.stringify(allAccepted));
    setVisible(false);
  };

  const handleAcceptCustom = () => {
    localStorage.setItem("isg_kvkk_cookie_accepted", "true");
    localStorage.setItem("isg_kvkk_accepted_date", new Date().toISOString());
    localStorage.setItem("isg_kvkk_cookie_preferences", JSON.stringify(cookiePrefs));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Çerez ve Gizlilik Onayı"
      className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 z-[100] max-w-4xl mx-auto animate-slide-up"
    >
      <div className="bg-white/95 dark:bg-gray-850/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-gray-200 dark:border-gray-700/80 text-gray-800 dark:text-gray-100">
        <div className="flex flex-col gap-4">
          {/* Main Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">
                    {lang === "en"
                      ? "Cookie Notice, KVKK & Safety Compliance"
                      : "Çerez Kullanımı, KVKK & Saha Fotoğraflandırma Bildirimi"}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                    T.C. Anayasası Md. 20 & 6331 İSGK
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Bu portalda oturum güvenliği ve anlık acil bildirimler için yalnızca <strong>zorunlu teknik çerezler</strong> kullanılır (reklam çerezi yoktur). <strong>6331 sayılı İSG Kanunu</strong> gereğince saha fotoğrafları can güvenliği ve kaza önleme yasal yükümlülüğü kapsamında işlenir. Sistemi kullanarak bu şartları kabul etmiş sayılırsınız.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setShowPreferences(!showPreferences)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-1 md:flex-initial text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showPreferences ? "Kapat" : "Tercihler"}</span>
              </button>

              <button
                type="button"
                onClick={onOpenModal}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-1 md:flex-initial text-center cursor-pointer"
              >
                {lang === "en" ? "Full Policy" : "Aydınlatma Metni"}
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25 transition-all text-xs flex-1 md:flex-initial text-center cursor-pointer active:scale-95 whitespace-nowrap"
              >
                {lang === "en" ? "Accept All & Continue" : "Tümünü Kabul Et"}
              </button>
            </div>
          </div>

          {/* Preferences Drawer */}
          {showPreferences && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700/80 animate-fade-in space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Zorunlu Çerezler */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-gray-900 dark:text-gray-100">Zorunlu Güvenlik</span>
                    <span className="text-[10px] text-gray-500">JWT ve Oturum Anahtarları</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                    Zorunlu
                  </span>
                </div>

                {/* 2. İSG Bildirimleri */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-gray-900 dark:text-gray-100">İSG Bildirimleri</span>
                    <span className="text-[10px] text-gray-500">Acil FCM Push Bildirimi</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookiePrefs.notifications}
                    onChange={(e) =>
                      setCookiePrefs((p) => ({ ...p, notifications: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* 3. Arayüz & Dil */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-gray-900 dark:text-gray-100">Arayüz Tercihleri</span>
                    <span className="text-[10px] text-gray-500">Tema ve Ses Ayarları</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cookiePrefs.preferences}
                    onChange={(e) =>
                      setCookiePrefs((p) => ({ ...p, preferences: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAcceptCustom}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-bold transition-all cursor-pointer"
                >
                  Seçilen Tercihleri Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
