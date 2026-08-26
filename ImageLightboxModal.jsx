const ImageLightboxModal = () => {
    if (!previewModalImg) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-slide-up" onClick={() => setPreviewModalImg(null)}>
        <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button onClick={() => setPreviewModalImg(null)} className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors shadow-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
          {previewModalTitle && (
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">
              {previewModalTitle}
            </div>
          )}
          <img src={previewModalImg} alt="Büyütülmüş Fotoğraf" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20" />
          <p className="text-white/70 text-xs mt-3 flex items-center">
            <Maximize2 className="w-3.5 h-3.5 mr-1" /> Kapatmak için görsele veya boşluğa tıklayabilirsiniz
          </p>
        </div>
      </div>
    );
  }