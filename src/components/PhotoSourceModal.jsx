import React, { useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  X,
  UploadCloud,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

/**
 * Compresses an image file down to maxDim and exports a base64 JPEG
 * Safe for Firestore (< 1MB document limit) and ensures rapid uploading
 */
export const compressImageFile = (file, maxDim = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    // If file is not an image
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image"));
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round(height * (maxDim / width));
              width = maxDim;
            } else {
              width = Math.round(width * (maxDim / height));
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG data URL
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          // Fallback to raw base64 if canvas processing fails
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const PhotoSourceModal = ({
  isOpen,
  onClose,
  onPhotoSelected,
  title,
  subtitle,
  lang = "tr",
}) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImageFile(file, 1200, 0.75);
      onPhotoSelected(compressed);
      onClose();
    } catch (err) {
      console.error("Image processing error:", err);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImageFile(file, 1200, 0.75);
      onPhotoSelected(compressed);
      onClose();
    } catch (err) {
      console.error("Drop image error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const isEn = lang === "en";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Hidden native inputs: one for Camera (capture="environment"), one for Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className="w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Mobile Swipe Handle */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-gray-100 dark:border-gray-700/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {title || (isEn ? "Select Photo Source" : "Fotoğraf Kaynağını Seçin")}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-10">
              {subtitle ||
                (isEn
                  ? "Choose how you want to attach the field evidence photo."
                  : "Saha tespit tutanağı için fotoğrafı nasıl eklemek istersiniz?")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Options */}
        <div className="p-5 sm:p-6 space-y-3.5">
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {isEn ? "Optimizing & Compressing Photo..." : "Fotoğraf Optimize Ediliyor..."}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isEn ? "Resizing for rapid upload" : "Hızlı yükleme için boyut ayarlanıyor"}
              </p>
            </div>
          ) : (
            <>
              {/* Option 1: CAMERA */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full text-left p-4 rounded-2xl border-2 border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform shrink-0">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 dark:text-gray-100 text-base">
                        {isEn ? "Take Photo with Camera" : "Kamera ile Çek"}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        {isEn ? "Live" : "Canlı Çekim"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {isEn
                        ? "Open device camera to capture immediate field hazard"
                        : "Cihazın kamerasını doğrudan açarak sahada anlık fotoğraf çekin"}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </div>
              </button>

              {/* Option 2: GALLERY */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full text-left p-4 rounded-2xl border-2 border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform shrink-0">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 dark:text-gray-100 text-base">
                        {isEn ? "Choose from Gallery" : "Galeriden / Dosyalardan Seç"}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700">
                        {isEn ? "Album" : "Cihaz Albümü"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {isEn
                        ? "Select an existing photo or screenshot from your device library"
                        : "Cihazınızdaki fotoğraflardan veya albümden mevcut bir görsel yükleyin"}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <UploadCloud className="w-4 h-4" />
                </div>
              </button>

              {/* Drag & Drop Hint */}
              <div
                className={`py-3 px-4 rounded-xl border border-dashed text-center transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                <p className="text-xs font-medium">
                  {isDragging
                    ? (isEn ? "Drop photo here to attach!" : "Fotoğrafı buraya bırakın!")
                    : (isEn ? "Or drag & drop an image file here" : "Veya bir görsel dosyasını buraya sürükleyip bırakabilirsiniz")}
                </p>
              </div>

              {/* Legal & KVKK compliance note */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight text-gray-500 dark:text-gray-400">
                  {isEn
                    ? "In accordance with OHS Law No. 6331 and KVKK, photos uploaded here are processed strictly for workplace safety inspection and risk assessment purposes."
                    : "6331 sayılı İSG Kanunu ve KVKK uyarınca yüklenen fotoğraflar yalnızca saha iş güvenliği denetimi ve tehlike giderme amacıyla işlenir."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer / Cancel */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {isEn ? "Cancel" : "Vazgeç"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoSourceModal;
