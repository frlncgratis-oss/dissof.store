import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { 
  X, 
  Check, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  FlipHorizontal, 
  FlipVertical, 
  Crop, 
  RefreshCw, 
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { getCroppedImg, CropOptions } from '../../lib/cropImage';

export interface AspectRatioOption {
  label: string;
  value: number | undefined;
  iconName?: string;
  badge?: string;
}

export const DEFAULT_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1 Persegi', value: 1 / 1, badge: 'Produk & Logo' },
  { label: '4:3 Standar', value: 4 / 3, badge: 'Katalog' },
  { label: '3:4 Portrait', value: 3 / 4, badge: 'IG Post' },
  { label: '16:9 Banner', value: 16 / 9, badge: 'Banner' },
  { label: '21:9 Wide', value: 21 / 9, badge: 'Hero Web' },
  { label: 'Bebas', value: undefined, badge: 'Free Crop' },
];

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  description?: string;
  defaultAspect?: number | undefined;
  aspectOptions?: AspectRatioOption[];
  cropOptions?: CropOptions;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Sesuaikan & Potong Foto (Crop) ♡',
  description = 'Geser, cubit (pinch) atau gunakan tombol zoom & rotasi untuk mengatur posisi foto terbaik.',
  defaultAspect = 1 / 1,
  aspectOptions = DEFAULT_ASPECT_RATIOS,
  cropOptions = { maxDimension: 800, quality: 0.6 },
  onCropComplete,
  onClose,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [flip, setFlip] = useState<{ horizontal: boolean; vertical: boolean }>({
    horizontal: false,
    vertical: false,
  });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 1));
  };

  const handleRotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateMinus90 = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }));
  };

  const handleFlipVertical = () => {
    setFlip((prev) => ({ ...prev, vertical: !prev.vertical }));
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlip({ horizontal: false, vertical: false });
    setAspect(defaultAspect);
  };

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        flip,
        cropOptions
      );
      onCropComplete(croppedImage);
      onClose();
    } catch (e: any) {
      console.error('Failed to crop image:', e);
      alert('Gagal memproses potongan gambar. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#F5E6E8]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#FFF5F7] via-[#FFF9FA] to-[#FFF0F5] border-b border-[#F5E6E8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-pink-100/90 text-pink-600 flex items-center justify-center shadow-xs">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-playfair text-lg sm:text-xl font-bold text-[#2D2D2D]">
                {title}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#8A7A75] font-medium hidden sm:block">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/90 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors border border-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[280px] sm:h-[340px] bg-[#1a1a1a] select-none overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            showGrid={showGrid}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            transform={[
              `translate(${crop.x}px, ${crop.y}px)`,
              `rotateZ(${rotation}deg)`,
              `rotateY(${flip.horizontal ? 180 : 0}deg)`,
              `rotateX(${flip.vertical ? 180 : 0}deg)`,
              `scale(${zoom})`,
            ].join(' ')}
          />

          {/* Quick Helper Badge */}
          <div className="absolute top-3 left-3 pointer-events-none bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white/90 font-medium flex items-center gap-1.5 border border-white/10">
            <Sparkles className="w-3 h-3 text-pink-300" />
            <span>Tarik / Cubit untuk atur posisi</span>
          </div>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid Garis Bantu"
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 border transition-all ${
              showGrid 
                ? 'bg-pink-500/90 text-white border-pink-400/50 shadow-xs' 
                : 'bg-black/50 text-white/70 border-white/10'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Grid</span>
          </button>
        </div>

        {/* Controls Area */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] overflow-y-auto space-y-4 text-xs">
          
          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#4A3E39] uppercase tracking-wider mb-2">
              Pilihan Rasio Aspek (Aspect Ratio):
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {aspectOptions.map((opt, idx) => {
                const isSelected = aspect === opt.value;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAspect(opt.value)}
                    className={`px-2.5 py-2 rounded-xl text-center font-medium border transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-200 ring-2 ring-pink-300'
                        : 'bg-white text-[#4A3E39] border-black/8 hover:border-pink-300 hover:bg-pink-50/50'
                    }`}
                  >
                    <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                    {opt.badge && (
                      <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-pink-100' : 'text-gray-400'}`}>
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom & Rotation Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
            
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#4A3E39] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-pink-500" />
                  Perbesar / Zoom ({zoom.toFixed(1)}x)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-pink-500 h-1.5 bg-pink-100 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#4A3E39] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-purple-500" />
                  Rotasi Derajat ({rotation}°)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRotateMinus90}
                    title="Putar -90°"
                    className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate90}
                    title="Putar +90°"
                    className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-purple-100 rounded-lg cursor-pointer"
              />
            </div>

          </div>

          {/* Quick Flip & Reset Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 mr-1">Cermin / Flip:</span>
              <button
                type="button"
                onClick={handleFlipHorizontal}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  flip.horizontal
                    ? 'bg-pink-100 text-pink-700 border-pink-300'
                    : 'bg-white text-gray-600 border-black/8 hover:bg-gray-50'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Horisontal</span>
              </button>
              <button
                type="button"
                onClick={handleFlipVertical}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  flip.vertical
                    ? 'bg-pink-100 text-pink-700 border-pink-300'
                    : 'bg-white text-gray-600 border-black/8 hover:bg-gray-50'
                }`}
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span>Vertikal</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 font-medium text-[11px] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Posisi</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-[#F5E6E8] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-2xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-200 hover:shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Hasil Crop...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Terapkan Potongan Foto ♡</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
