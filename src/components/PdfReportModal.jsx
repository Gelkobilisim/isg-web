import React, { useState, useMemo, useRef } from "react";
import {
  FileText,
  Download,
  Printer,
  X,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Truck,
  ShieldAlert,
  Building2,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  PackageCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

const ADS_LOGO_BASE64 =
  "data:image/jpeg;base64,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";

export default function PdfReportModal({
  isOpen,
  onClose,
  tasks = [],
  loadings = [],
  departments = [],
  currentUser = {},
  points = {},
}) {
  const [reportType, setReportType] = useState("isg"); // "isg", "yukleme", "combined"
  const [dateRange, setDateRange] = useState("30"); // "7", "30", "month", "all"
  const [selectedDept, setSelectedDept] = useState("all");
  const [activePreviewPage, setActivePreviewPage] = useState(1);
  const [previewScale, setPreviewScale] = useState("fit"); // "fit", "full"
  const [isGenerating, setIsGenerating] = useState(false);

  // Dedicated refs for the unscaled export container
  const exportPage1Ref = useRef(null);
  const exportPage2Ref = useRef(null);

  // Date Filtering Logic
  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    const now = Date.now();

    if (dateRange === "7") {
      const past7 = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((t) => {
        const time = t.timestamp?.toDate ? t.timestamp.toDate().getTime() : new Date(t.timestamp || t.date).getTime();
        return time >= past7;
      });
    } else if (dateRange === "30") {
      const past30 = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((t) => {
        const time = t.timestamp?.toDate ? t.timestamp.toDate().getTime() : new Date(t.timestamp || t.date).getTime();
        return time >= past30;
      });
    } else if (dateRange === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      list = list.filter((t) => {
        const time = t.timestamp?.toDate ? t.timestamp.toDate().getTime() : new Date(t.timestamp || t.date).getTime();
        return time >= startOfMonth.getTime();
      });
    }

    if (selectedDept !== "all") {
      list = list.filter((t) => t.dept === selectedDept);
    }

    return list.sort((a, b) => {
      const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || a.date).getTime();
      const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || b.date).getTime();
      return tB - tA;
    });
  }, [tasks, dateRange, selectedDept]);

  const filteredLoadings = useMemo(() => {
    let list = [...loadings];
    const now = Date.now();

    if (dateRange === "7") {
      const past7 = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((l) => (l.timestamp || 0) >= past7);
    } else if (dateRange === "30") {
      const past30 = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((l) => (l.timestamp || 0) >= past30);
    } else if (dateRange === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      list = list.filter((l) => (l.timestamp || 0) >= startOfMonth.getTime());
    }

    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [loadings, dateRange]);

  // Statistics Calculations
  const isgStats = useMemo(() => {
    const total = filteredTasks.length;
    const resolved = filteredTasks.filter(
      (t) => t.status === "cozuldu" || t.status === "kapatildi",
    ).length;
    const open = filteredTasks.filter((t) => t.status === "acik").length;
    const objected = filteredTasks.filter(
      (t) => t.status === "itiraz_edildi",
    ).length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    const criticalC = filteredTasks.filter((t) => t.level === "C").length;
    const moderateB = filteredTasks.filter((t) => t.level === "B").length;
    const lowA = filteredTasks.filter((t) => t.level === "A").length;

    // Departmental breakdown
    const deptStats = departments.map((d) => {
      const dTasks = filteredTasks.filter((t) => t.dept === d);
      const dTotal = dTasks.length;
      const dResolved = dTasks.filter(
        (t) => t.status === "cozuldu" || t.status === "kapatildi",
      ).length;
      const dOpen = dTasks.filter((t) => t.status === "acik").length;
      const dRate = dTotal > 0 ? Math.round((dResolved / dTotal) * 100) : 100;
      return {
        dept: d,
        total: dTotal,
        resolved: dResolved,
        open: dOpen,
        rate: dRate,
        score: points[d] ?? 100,
      };
    });

    return {
      total,
      resolved,
      open,
      objected,
      rate,
      criticalC,
      moderateB,
      lowA,
      deptStats,
    };
  }, [filteredTasks, departments, points]);

  // Comprehensive Shipping & Logistics Analytics
  const loadingStats = useMemo(() => {
    const total = filteredLoadings.length;
    const completed = filteredLoadings.filter(
      (l) => l.status === "tamamlandi",
    ).length;
    const inProgress = total - completed;
    const totalTonnage = filteredLoadings.reduce((sum, l) => {
      return sum + (parseFloat(l.tonnage) || 0);
    }, 0);

    // Group by destination country/region
    const countryMap = {};
    filteredLoadings.forEach((l) => {
      const c = l.destCountry && l.destCountry.trim() !== "" ? l.destCountry : "Türkiye";
      if (!countryMap[c]) {
        countryMap[c] = {
          country: c,
          total: 0,
          completed: 0,
          inProgress: 0,
          tonnage: 0,
          locations: new Set(),
          companies: new Set(),
        };
      }
      countryMap[c].total += 1;
      if (l.status === "tamamlandi") {
        countryMap[c].completed += 1;
      } else {
        countryMap[c].inProgress += 1;
      }
      countryMap[c].tonnage += parseFloat(l.tonnage) || 0;
      if (l.destLocation) countryMap[c].locations.add(l.destLocation);
      if (l.destCompany) countryMap[c].companies.add(l.destCompany);
    });

    const countryList = Object.values(countryMap)
      .map((item) => ({
        ...item,
        tonnage: Math.round(item.tonnage * 100) / 100,
        avgTonnage:
          item.total > 0 ? (item.tonnage / item.total).toFixed(1) : "0.0",
        share:
          totalTonnage > 0
            ? Math.round((item.tonnage / totalTonnage) * 100)
            : 0,
        companyCount: item.companies.size,
        locationCount: item.locations.size,
      }))
      .sort((a, b) => b.tonnage - a.tonnage);

    const avgVehicleTonnage =
      total > 0 ? (totalTonnage / total).toFixed(1) : "0.0";

    const topDest = countryList[0] || {
      country: "-",
      tonnage: 0,
      total: 0,
      share: 0,
    };

    return {
      total,
      completed,
      inProgress,
      totalTonnage: Math.round(totalTonnage * 100) / 100,
      avgVehicleTonnage,
      countryList,
      topDest,
    };
  }, [filteredLoadings]);

  const reportDateStr = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const reportTimeStr = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const reportRefPrefix =
    reportType === "yukleme"
      ? "ADS-SEVK"
      : reportType === "isg"
        ? "ADS-ISG"
        : "ADS-GNL";
  const reportRefNo = `${reportRefPrefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const bestDept = isgStats.deptStats.reduce(
    (prev, cur) => (cur.score > prev.score ? cur : prev),
    isgStats.deptStats[0] || { dept: "-", score: 100 },
  );
  const alertDept = isgStats.deptStats.reduce(
    (prev, cur) => (cur.open > prev.open ? cur : prev),
    isgStats.deptStats[0] || { dept: "-", open: 0 },
  );

  // High-Resolution 2-Page A4 PDF Downloader
  const handleDownloadPdf = async () => {
    if (!exportPage1Ref.current || !exportPage2Ref.current) return;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // 1. Capture Page 1
      const img1Data = await toPng(exportPage1Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: 794,
        height: 1123,
      });
      pdf.addImage(img1Data, "PNG", 0, 0, 210, 297, undefined, "FAST");

      // 2. Add Page 2 and Capture
      pdf.addPage("a4", "portrait");
      const img2Data = await toPng(exportPage2Ref.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: 794,
        height: 1123,
      });
      pdf.addImage(img2Data, "PNG", 0, 0, 210, 297, undefined, "FAST");

      const dateStr = new Date().toISOString().split("T")[0];
      const typeStr =
        reportType === "isg"
          ? "ISG_Yonetim_Raporu"
          : reportType === "yukleme"
            ? "Sevkiyat_Lojistik_Raporu"
            : "Fabrika_Genel_Raporu";

      pdf.save(`ADS_Metal_${typeStr}_${dateStr}.pdf`);
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      alert("PDF belgesi oluşturulurken bir hata meydana geldi: " + (err?.message || err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Render Page 1 Content Template
  const renderPage1Content = () => (
    <div
      style={{
        width: "794px",
        minWidth: "794px",
        maxWidth: "794px",
        height: "1123px",
        minHeight: "1123px",
        maxHeight: "1123px",
        padding: "36px 42px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* 1. Official Header */}
        <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "14px", marginBottom: "16px" }}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3.5">
              <img
                src={ADS_LOGO_BASE64}
                alt="ADS Metal Logo"
                style={{
                  width: "56px",
                  height: "56px",
                  objectFit: "contain",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: "1px solid #e2e8f0",
                }}
              />
              <div>
                <h1 className="text-xl font-black tracking-tight text-blue-950 uppercase leading-none">
                  ADS METAL SANAYİ VE TİCARET A.Ş.
                </h1>
                <p className="text-[11px] text-gray-600 font-bold tracking-wider uppercase mt-1">
                  Transformer Tanks & Fin Walls Production Facility
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {reportType === "yukleme"
                    ? "Lojistik, Sevkiyat ve Depo Yönetim Sistemi • ISO 9001:2015 & Sevk Standartları"
                    : reportType === "isg"
                      ? "İş Sağlığı, Güvenliği ve Saha Denetim Sistemi • ISO 45001 & 9001"
                      : "İSG & Lojistik Entegre Fabrika Yönetim Sistemi • ISO 45001 & 9001"}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="inline-block bg-blue-50 border border-blue-200 px-3 py-1 rounded-md text-blue-950 font-bold mb-1">
                {reportRefNo}
              </div>
              <div className="text-gray-700 text-[11px] font-medium">
                Tarih: <strong>{reportDateStr}</strong> - {reportTimeStr}
              </div>
              <div className="text-gray-600 text-[11px]">
                Yetkili: <strong>{currentUser.name || currentUser.username || "Admin"}</strong> ({currentUser.role || "Yönetim"})
              </div>
            </div>
          </div>

          {/* Scope Details Bar */}
          <div className="mt-3 pt-2.5 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-700">
            <div>
              <strong>Rapor Kapsamı:</strong>{" "}
              {reportType === "yukleme"
                ? "Lojistik, Ağır Sanayi Sevkiyatı ve Tonaj Dağılımı"
                : reportType === "isg"
                  ? "İSG ve Saha Güvenlik Denetimi"
                  : "Fabrika Genel İSG ve Sevkiyat Özeti"}
            </div>
            <div>
              <strong>Dönem:</strong>{" "}
              {dateRange === "7"
                ? "Son 7 Gün"
                : dateRange === "30"
                  ? "Son 30 Gün"
                  : dateRange === "month"
                    ? "Cari Ay"
                    : "Tüm Kayıtlar"}
            </div>
            <div>
              <strong>Operasyon Tipi:</strong>{" "}
              {reportType === "yukleme"
                ? "Yurtiçi & İhracat Seferleri"
                : selectedDept === "all"
                  ? "Tüm Fabrika Geneli"
                  : selectedDept}
            </div>
          </div>
        </div>

        {/* 2. Banner */}
        <div
          style={{
            background:
              reportType === "yukleme"
                ? "linear-gradient(90deg, #0f766e 0%, #115e59 100%)"
                : "linear-gradient(90deg, #1e3a8a 0%, #1e1b4b 100%)",
            color: "#ffffff",
            padding: "10px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="flex items-center space-x-2">
            {reportType === "yukleme" ? (
              <Truck className="w-5 h-5 text-emerald-300" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            )}
            <span className="font-extrabold text-sm tracking-wide uppercase">
              {reportType === "yukleme"
                ? "LOJİSTİK SEVKİYAT, ARAÇ VE TONAJ YÖNETİM RAPORU"
                : reportType === "isg"
                  ? "İŞ SAĞLIĞI VE GÜVENLİĞİ DENETİM & İHLAL FAALİYET RAPORU"
                  : "FABRİKA GENEL İSG & SEVKİYAT FAALİYET RAPORU"}
            </span>
          </div>
          <span className="text-[10px] bg-white/20 font-bold px-2 py-0.5 rounded tracking-widest uppercase">
            YÖNETİCİ ÖZETİ
          </span>
        </div>

        {/* 3. KPI Metrics Cards */}
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            {/* Card 1 */}
            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px" }}>
              <span className="text-[11px] text-gray-500 font-bold block uppercase tracking-wider">
                {reportType === "yukleme" ? "Sevk Edilen Araç" : "Toplam İhlal"}
              </span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">
                {reportType === "yukleme" ? loadingStats.total : isgStats.total}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                {reportType === "yukleme" ? "Tır / Kamyon" : "Adet Tespit"}
              </span>
            </div>

            {/* Card 2 */}
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px" }}>
              <span className="text-[11px] text-green-700 font-bold block uppercase tracking-wider">
                {reportType === "yukleme" ? "Tamamlanan Sefer" : "Çözülen / Kapalı"}
              </span>
              <span className="text-2xl font-black text-green-800 mt-1 block">
                {reportType === "yukleme" ? loadingStats.completed : isgStats.resolved}
              </span>
              <span className="text-[10px] text-green-600 mt-0.5 block">
                {reportType === "yukleme" ? "Yola Çıkan Araç" : "İşlem Başarılı"}
              </span>
            </div>

            {/* Card 3 */}
            <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px" }}>
              <span className="text-[11px] text-amber-700 font-bold block uppercase tracking-wider">
                {reportType === "yukleme" ? "Rampada / Yüklenen" : "Açık / Devam Eden"}
              </span>
              <span className="text-2xl font-black text-amber-800 mt-1 block">
                {reportType === "yukleme" ? loadingStats.inProgress : isgStats.open}
              </span>
              <span className="text-[10px] text-amber-600 mt-0.5 block">
                {reportType === "yukleme" ? "Aktif Yükleme" : "Aksiyon Gerektirir"}
              </span>
            </div>

            {/* Card 4 */}
            <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px" }}>
              <span className="text-[11px] text-blue-700 font-bold block uppercase tracking-wider">
                {reportType === "yukleme" ? "Toplam Brüt Tonaj" : "Çözüm Başarısı"}
              </span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {reportType === "yukleme" ? `${loadingStats.totalTonnage} T` : `%${isgStats.rate}`}
              </span>
              <span className="text-[10px] text-blue-600 mt-0.5 block">
                {reportType === "yukleme" ? "Sevk Edilen Hacim" : "Hedef: %90+"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Middle Matrix Table: Dedicated for Shipping or OHS */}
        {reportType === "yukleme" ? (
          /* SEVKİYAT ÖZEL TABLOSU: Hedef Lokasyon & Ülke Bazlı Sevkiyat / Tonaj Analizi */
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                Hedef Ülke ve Bölge Bazlı Sevkiyat / Tonaj Dağılımı
              </h3>
              <span className="text-[10px] text-gray-500 font-semibold">
                Toplam Sevk Hacmi: {loadingStats.totalTonnage} Ton
              </span>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead style={{ backgroundColor: "#f1f5f9", color: "#334155", borderBottom: "1px solid #cbd5e1" }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "bold" }}>Varış Ülkesi / Bölge</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Sefer Sayısı</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Toplam Tonaj</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Araç Başı Ort.</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Tamamlanan</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Hacim Payı</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>Sevk Durumu</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStats.countryList.length > 0 ? (
                    loadingStats.countryList.slice(0, 7).map((item, idx) => (
                      <tr
                        key={item.country}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <td style={{ padding: "7px 12px", fontWeight: "700", color: "#0f172a" }}>
                          {item.country}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "600" }}>
                          {item.total} Sefer
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "800", color: "#0f766e" }}>
                          {item.tonnage} Ton
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "600", color: "#475569" }}>
                          {item.avgTonnage} Ton/Tır
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "700", color: "#166534" }}>
                          {item.completed} / {item.total}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "800", color: "#1e3a8a" }}>
                          %{item.share}
                        </td>
                        <td style={{ padding: "7px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              backgroundColor: item.inProgress > 0 ? "#fef3c7" : "#dcfce7",
                              color: item.inProgress > 0 ? "#92400e" : "#166534",
                              fontSize: "9px",
                              fontWeight: "800",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              display: "inline-block",
                            }}
                          >
                            {item.inProgress > 0 ? "YÜKLEMEDE" : "SEVK EDİLDİ"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ padding: "18px", textAlign: "center", color: "#94a3b8" }}>
                        Seçilen tarih aralığında sevkiyat hareketi bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* İSG TABLOSU: Birim Bazlı İSG Risk ve Güvenlik Performansı */
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Birim Bazlı İSG Risk ve Güvenlik Performansı
              </h3>
              <span className="text-[10px] text-gray-500">
                Standart Puan Başlangıcı: 100
              </span>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead style={{ backgroundColor: "#f1f5f9", color: "#334155", borderBottom: "1px solid #cbd5e1" }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "bold" }}>Birim / Departman</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Toplam İhlal</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Çözülen</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Açık</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Başarı Oranı</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: "bold" }}>Mevcut Puan</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>Durum / Seviye</th>
                  </tr>
                </thead>
                <tbody>
                  {isgStats.deptStats.map((d, idx) => {
                    let badgeBg = "#dcfce7";
                    let badgeText = "#166534";
                    let badgeLabel = "GÜVENLİ";

                    if (d.open > 2 || d.rate < 60) {
                      badgeBg = "#fee2e2";
                      badgeText = "#991b1b";
                      badgeLabel = "YÜKSEK RİSK";
                    } else if (d.open > 0 || d.rate < 85) {
                      badgeBg = "#fef3c7";
                      badgeText = "#92400e";
                      badgeLabel = "DİKKAT";
                    }

                    return (
                      <tr
                        key={d.dept}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <td style={{ padding: "7px 12px", fontWeight: "700", color: "#0f172a" }}>
                          {d.dept}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "600" }}>
                          {d.total}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "600", color: "#166534" }}>
                          {d.resolved}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "600", color: "#b45309" }}>
                          {d.open}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "700" }}>
                          %{d.rate}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "800", color: "#1e3a8a" }}>
                          {d.score} P
                        </td>
                        <td style={{ padding: "7px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              backgroundColor: badgeBg,
                              color: badgeText,
                              fontSize: "9px",
                              fontWeight: "800",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              display: "inline-block",
                            }}
                          >
                            {badgeLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Executive Highlights Box (Dedicated per report type) */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "12px 16px",
          }}
        >
          <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wide mb-1 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-blue-900" />
            {reportType === "yukleme"
              ? "Sevkiyat Operasyon Değerlendirmesi & Lojistik Özeti"
              : "Yönetici Değerlendirme & Güvenlik Özeti"}
          </h4>
          {reportType === "yukleme" ? (
            <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-700 leading-relaxed mt-1">
              <div>
                <p>
                  • Dönem içerisinde <strong>{loadingStats.total} adet</strong> araç ile toplam <strong>{loadingStats.totalTonnage} Ton</strong> brüt sevkiyat yapılmıştır.
                </p>
                <p className="mt-0.5">
                  • En yüksek hacimli sevkiyat rotası: <strong>{loadingStats.topDest.country}</strong> (%{loadingStats.topDest.share} pay, {loadingStats.topDest.tonnage} Ton).
                </p>
              </div>
              <div>
                <p>
                  • Araç başı ortalama yükleme: <strong>{loadingStats.avgVehicleTonnage} Ton</strong> olarak gerçekleşmiştir.
                </p>
                <p className="mt-0.5">
                  • Tamamlanan sevk: <strong>{loadingStats.completed}</strong> araç, rampada/aktif yükleme: <strong>{loadingStats.inProgress}</strong> araç.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-700 leading-relaxed mt-1">
              <div>
                <p>
                  • Fabrika genelinde ortalama çözüm başarısı <strong>%{isgStats.rate}</strong> olarak gerçekleşmiştir.
                </p>
                <p className="mt-0.5">
                  • En yüksek güvenlik puanına sahip birim: <strong>{bestDept.dept}</strong> ({bestDept.score} Puan).
                </p>
              </div>
              <div>
                <p>
                  • Öncelikli aksiyon bekleyen birim: <strong>{alertDept.dept}</strong> ({alertDept.open} adet açık ihlal).
                </p>
                <p className="mt-0.5">
                  • Kritik (C-Seviye) ihlaller: <strong>{isgStats.criticalC}</strong> adet, Orta (B): <strong>{isgStats.moderateB}</strong> adet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page 1 Bottom Footer */}
      <div
        style={{
          borderTop: "1px solid #cbd5e1",
          paddingTop: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "10px",
          color: "#64748b",
        }}
      >
        <div>
          ADS Metal Sanayi ve Ticaret A.Ş. • {reportType === "yukleme" ? "Sevkiyat ve Depo Takip Sistemi" : "Kalite ve İSG Yönetim Sistemi"} • Form: {reportType === "yukleme" ? "ADS-LJK-018/R1" : "ADS-FRM-042/R2"}
        </div>
        <div className="font-bold text-gray-700">Sayfa 1 / 2</div>
      </div>
    </div>
  );

  // Render Page 2 Content Template
  const renderPage2Content = () => (
    <div
      style={{
        width: "794px",
        minWidth: "794px",
        maxWidth: "794px",
        height: "1123px",
        minHeight: "1123px",
        maxHeight: "1123px",
        padding: "36px 42px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* Compact Page 2 Header */}
        <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "10px", marginBottom: "14px" }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <img
                src={ADS_LOGO_BASE64}
                alt="ADS Metal Logo"
                style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "contain",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              />
              <div>
                <span className="text-sm font-black text-blue-950 uppercase tracking-tight block leading-none">
                  ADS METAL SANAYİ VE TİCARET A.Ş.
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {reportType === "yukleme"
                    ? "Sevkiyat ve Araç Hareket Tutanakları • İrsaliye & Çıkış Onayı (Ek-1)"
                    : "Denetim Tutanakları & Resmi Onay Belgesi (Ek-1)"}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-gray-600">
              <span>Rapor No: <strong>{reportRefNo}</strong></span> • <span>Tarih: <strong>{reportDateStr}</strong></span>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            {reportType === "yukleme"
              ? "Detaylı Sevkiyat ve Araç Hareket Listesi (Son Seferler)"
              : "Detaylı Saha İhlal & Güvenlik Tutanakları (Son Kayıtlar)"}
          </h3>
          <span className="text-[10px] text-gray-500">
            Resmi İnceleme Listesi (İlk 10 Kayıt)
          </span>
        </div>

        {/* Detailed Table */}
        <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
            <thead style={{ backgroundColor: "#f1f5f9", color: "#334155", borderBottom: "1px solid #cbd5e1" }}>
              <tr>
                <th style={{ padding: "8px 6px", textAlign: "center", width: "32px", fontWeight: "bold" }}>No</th>
                <th style={{ padding: "8px 8px", textAlign: "left", width: "80px", fontWeight: "bold" }}>
                  {reportType === "yukleme" ? "Sevk Tarihi" : "Tarih"}
                </th>
                <th style={{ padding: "8px 8px", textAlign: "left", width: "115px", fontWeight: "bold" }}>
                  {reportType === "yukleme" ? "Plaka / Şoför" : "Birim / Bölüm"}
                </th>
                <th style={{ padding: "8px 6px", textAlign: "center", width: "65px", fontWeight: "bold" }}>
                  {reportType === "yukleme" ? "Brüt Tonaj" : "Seviye"}
                </th>
                <th style={{ padding: "8px 8px", textAlign: "left", fontWeight: "bold" }}>
                  {reportType === "yukleme" ? "Varış Lokasyonu & Alıcı Firma" : "Uygunsuzluk / İhlal Tanımı"}
                </th>
                <th style={{ padding: "8px 8px", textAlign: "center", width: "95px", fontWeight: "bold" }}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {reportType === "yukleme"
                ? filteredLoadings.slice(0, 10).map((l, i) => (
                    <tr
                      key={l.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        height: "36px",
                      }}
                    >
                      <td style={{ padding: "6px", textAlign: "center", fontWeight: "600", color: "#64748b" }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#334155" }}>{l.date || "-"}</td>
                      <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0f172a" }}>
                        {l.plaka} <span className="block text-[9px] font-normal text-gray-500">{l.sofor || "-"}</span>
                      </td>
                      <td style={{ padding: "6px", textAlign: "center", fontWeight: "800", color: "#0f766e" }}>
                        {l.tonnage ? `${l.tonnage} T` : "-"}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#334155" }}>
                        <span className="font-semibold text-gray-900">{l.destCountry || "Türkiye"}</span> / {l.destLocation || "-"}
                        {l.destCompany ? ` (${l.destCompany})` : ""}
                        {l.projectNo ? <span className="block text-[9px] text-gray-500">Prj: {l.projectNo}</span> : null}
                      </td>
                      <td style={{ padding: "6px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: l.status === "tamamlandi" ? "#dcfce7" : "#ffedd5",
                            color: l.status === "tamamlandi" ? "#166534" : "#9a3412",
                            fontSize: "9px",
                            fontWeight: "800",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            display: "inline-block",
                          }}
                        >
                          {l.status === "tamamlandi" ? "TAMAMLANDI" : "YÜKLENİYOR"}
                        </span>
                      </td>
                    </tr>
                  ))
                : filteredTasks.slice(0, 10).map((t, i) => {
                    let statusBg = "#f1f5f9";
                    let statusColor = "#334155";
                    let statusText = "AÇIK";

                    if (t.status === "kapatildi" || t.status === "cozuldu") {
                      statusBg = "#dcfce7";
                      statusColor = "#166534";
                      statusText = t.status === "kapatildi" ? "KAPATILDI" : "ÇÖZÜLDÜ";
                    } else if (t.status === "itiraz_edildi") {
                      statusBg = "#f3e8ff";
                      statusColor = "#6b21a8";
                      statusText = "İTİRAZ";
                    } else if (t.status === "acik") {
                      statusBg = "#fee2e2";
                      statusColor = "#991b1b";
                      statusText = "AÇIK (BEKLİYOR)";
                    }

                    return (
                      <tr
                        key={t.id}
                        style={{
                          backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                          height: "36px",
                        }}
                      >
                        <td style={{ padding: "6px", textAlign: "center", fontWeight: "600", color: "#64748b" }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: "6px 8px", color: "#334155", whiteSpace: "nowrap" }}>
                          {t.date || "-"}
                        </td>
                        <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0f172a" }}>
                          {t.dept}
                        </td>
                        <td style={{ padding: "6px", textAlign: "center" }}>
                          <span
                            style={{
                              backgroundColor: t.level === "C" ? "#dc2626" : t.level === "B" ? "#f59e0b" : "#3b82f6",
                              color: "#ffffff",
                              fontSize: "9px",
                              fontWeight: "800",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {t.level || "A"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            color: "#334155",
                            maxWidth: "280px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={t.desc}
                        >
                          {t.desc || "Belirtilmemiş"}
                        </td>
                        <td style={{ padding: "6px", textAlign: "center" }}>
                          <span
                            style={{
                              backgroundColor: statusBg,
                              color: statusColor,
                              fontSize: "9px",
                              fontWeight: "800",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              display: "inline-block",
                            }}
                          >
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

              {((reportType === "yukleme" && filteredLoadings.length === 0) ||
                (reportType !== "yukleme" && filteredTasks.length === 0)) && (
                <tr>
                  <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                    Seçilen tarih aralığında kayıtlı veri bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Statutory Regulatory Notes (Conditioned by Report Type) */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "10px",
            color: "#475569",
            lineHeight: "1.4",
            marginBottom: "20px",
          }}
        >
          {reportType === "yukleme" ? (
            <>
              <strong>Yasal ve İdari Bildirim:</strong> İşbu sevkiyat ve lojistik raporu, Karayolları Taşıma
              Yönetmeliği, fabrika kantar tartım kayıtları ve sevk irsaliyeleri esas alınarak düzenlenmiştir.
              Araç yükleme emniyeti, yük sabitleme (lashing), gabari ve dingil ağırlığı kontrolleri sevkiyat
              sorumluları nezaretinde yapılarak sevk onayı verilmiştir.
            </>
          ) : (
            <>
              <strong>Yasal ve İdari Bildirim:</strong> İşbu rapor, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu
              ile ADS Metal San. ve Tic. A.Ş. İç Yönetmeliği uyarınca dijital veri tabanı kayıtlarından derlenmiştir.
              Açık durumda bulunan uygunsuzlukların belirlenen yasal ve operasyonel süreler içerisinde giderilmesi
              ilgili birim amirlerinin sorumluluğundadır.
            </>
          )}
        </div>

        {/* 3-Party Corporate Signatures & Approvals (Conditioned by Report Type) */}
        <div style={{ marginTop: "10px" }}>
          <div className="grid grid-cols-3 gap-5 text-center">
            {/* 1. Preparer */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "14px 10px",
                backgroundColor: "#f8fafc",
              }}
            >
              <span className="text-[11px] font-black text-gray-900 block uppercase tracking-wider">
                {reportType === "yukleme" ? "Sevkiyat Sorumlusu" : "Raporu Hazırlayan"}
              </span>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                {currentUser.name || currentUser.username || "Sistem Yetkilisi"}
              </span>
              <span className="text-[9px] text-gray-400 block mb-6">
                {reportType === "yukleme"
                  ? "(Kantar & Yükleme Kontrol)"
                  : "(İSG / Saha Denetim Sorumlusu)"}
              </span>
              <div style={{ borderBottom: "1px dashed #94a3b8", width: "130px", margin: "0 auto 4px" }}></div>
              <span className="text-[9px] text-gray-400 italic">İmza / Kaşe</span>
            </div>

            {/* 2. Unit Supervisor */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "14px 10px",
                backgroundColor: "#f8fafc",
              }}
            >
              <span className="text-[11px] font-black text-gray-900 block uppercase tracking-wider">
                {reportType === "yukleme" ? "Lojistik & Depo Şefi" : "Birim / Saha Şefi"}
              </span>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                {reportType === "yukleme"
                  ? "Saha Lojistik Koordinasyonu"
                  : selectedDept === "all"
                    ? "İlgili Bölüm Şefleri"
                    : `${selectedDept} Şefi`}
              </span>
              <span className="text-[9px] text-gray-400 block mb-6">
                {reportType === "yukleme"
                  ? "(Araç Sevkiyat Koordinasyonu)"
                  : "(Üretim & İmalat Koordinasyonu)"}
              </span>
              <div style={{ borderBottom: "1px dashed #94a3b8", width: "130px", margin: "0 auto 4px" }}></div>
              <span className="text-[9px] text-gray-400 italic">İmza / Tarih</span>
            </div>

            {/* 3. Factory Director */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "14px 10px",
                backgroundColor: "#f8fafc",
              }}
            >
              <span className="text-[11px] font-black text-gray-900 block uppercase tracking-wider">
                Fabrika Müdürü
              </span>
              <span className="text-[10px] text-gray-600 block mt-0.5">
                Genel Fabrika Yönetimi
              </span>
              <span className="text-[9px] text-gray-400 block mb-6">
                (Onay & İcra Kurulu)
              </span>
              <div style={{ borderBottom: "1px dashed #94a3b8", width: "130px", margin: "0 auto 4px" }}></div>
              <span className="text-[9px] text-gray-400 italic">Resmi Kaşe / Onay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2 Bottom Footer */}
      <div
        style={{
          borderTop: "1px solid #cbd5e1",
          paddingTop: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "10px",
          color: "#64748b",
        }}
      >
        <div>
          {reportType === "yukleme"
            ? "Bu belge ADS Metal Sevkiyat ve Lojistik Yönetim Sistemi üzerinden resmi olarak onaylanmıştır."
            : "Bu belge ADS Metal İş Sağlığı ve Güvenliği Sistemi üzerinden elektronik olarak onaylanmıştır."}
        </div>
        <div className="font-bold text-gray-700">Sayfa 2 / 2</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-6xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Top Header & Action Bar */}
        <div className="p-3 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/60 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {reportType === "yukleme"
                  ? "Resmi Lojistik & Sevkiyat Yönetim Raporu (2 Sayfa A4 PDF)"
                  : "Resmi Yönetim & Denetim Raporu (2 Sayfa A4 PDF)"}
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              İndir butonuna bastığınızda seçilen rapora özel veriler ve yetkili imzaları tek bir PDF dosyasında hazırlanır.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-xl shadow-md transition-all text-xs sm:text-sm cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF Hazırlanıyor...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF İndir (2 Sayfa Tam)</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="hidden md:flex items-center space-x-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold px-3 py-2 rounded-xl text-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & View Controls */}
        <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-xl p-2 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="yukleme">🚚 Sevkiyat ve Lojistik Raporu</option>
              <option value="isg">🛡️ İSG ve İhlal Faaliyet Raporu</option>
              <option value="combined">🏭 Genel Fabrika Performans Raporu</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="7">Son 7 Gün (Haftalık Özet)</option>
              <option value="30">Son 30 Gün (Aylık Özet)</option>
              <option value="month">Bu Ayın 1'inden Bugüne</option>
              <option value="all">Tüm Kayıtlar</option>
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={reportType === "yukleme"}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="all">
                {reportType === "yukleme" ? "Tüm Sevkiyat Rotaları" : "Tüm Departmanlar (Fabrika Geneli)"}
              </option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Page Preview Navigation Tabs */}
          <div className="flex items-center space-x-2 border-t md:border-t-0 pt-2 md:pt-0 border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
              <button
                onClick={() => setActivePreviewPage(1)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activePreviewPage === 1 ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-gray-900"}`}
              >
                Sayfa 1 (Özet)
              </button>
              <button
                onClick={() => setActivePreviewPage(2)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activePreviewPage === 2 ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-gray-900"}`}
              >
                Sayfa 2 (İmzalar)
              </button>
            </div>

            <button
              onClick={() => setPreviewScale(previewScale === "fit" ? "full" : "fit")}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium flex items-center space-x-1"
              title="Mobil Önizleme Boyutu"
            >
              {previewScale === "fit" ? (
                <>
                  <ZoomIn className="w-4 h-4" />
                  <span className="hidden sm:inline">%100</span>
                </>
              ) : (
                <>
                  <ZoomOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sığdır</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Area (For viewing on screen) */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-6 bg-slate-200 dark:bg-slate-950 flex flex-col items-center">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 font-medium flex items-center space-x-1">
            <span>Önizleme: Sayfa {activePreviewPage} / 2</span>
            <span>• "PDF İndir" butonuna bastığınızda iki sayfa da birlikte indirilir.</span>
          </div>

          <div
            className={`transition-all duration-200 origin-top flex flex-col items-center space-y-6 ${
              previewScale === "fit" ? "max-sm:scale-[0.45] max-sm:-mb-[620px] sm:max-md:scale-[0.72] sm:max-md:-mb-[310px]" : "scale-100"
            }`}
          >
            {/* Visual Preview */}
            <div className="shadow-2xl rounded-sm overflow-hidden">
              {activePreviewPage === 1 ? renderPage1Content() : renderPage2Content()}
            </div>
          </div>
        </div>

        {/* ================= OFFSCREEN EXPORT CONTAINER ================= */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-9999px",
            top: "0px",
            width: "794px",
            minWidth: "794px",
            maxWidth: "794px",
            zIndex: -999,
            pointerEvents: "none",
            opacity: 1,
            display: "block",
          }}
        >
          <div ref={exportPage1Ref} style={{ width: "794px", height: "1123px", overflow: "hidden" }}>
            {renderPage1Content()}
          </div>
          <div ref={exportPage2Ref} style={{ width: "794px", height: "1123px", overflow: "hidden" }}>
            {renderPage2Content()}
          </div>
        </div>
      </div>
    </div>
  );
}
