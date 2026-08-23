import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  Maximize2, 
  X,
  ZoomIn
} from 'lucide-react';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE } from './ImageWithFallback';
import { Product } from '../../types';

interface ProductGallerySliderProps {
  product: Product;
  wishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  className?: string;
}

export const ProductGallerySlider: React.FC<ProductGallerySliderProps> = ({
  product,
  wishlisted = false,
  onToggleWishlist,
  className = '',
}) => {
  // Normalize images array with robust backward compatibility
  const images = React.useMemo(() => {
    let list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      list = product.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
    } else if ((product as any).image && typeof (product as any).image === 'string') {
      list = [(product as any).image];
    }
    return list.length > 0 ? list : [FALLBACK_PRODUCT_IMAGE];
  }, [product.images, (product as any).image]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const totalImages = images.length;
  const isSoldOut = product.is_sold_out || product.stock === 0;

  // Ensure currentIndex stays within bounds when images change
  useEffect(() => {
    if (currentIndex >= totalImages) {
      setCurrentIndex(0);
    }
  }, [totalImages, currentIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const container = thumbnailContainerRef.current;
    const activeThumb = container.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      const scrollLeft = activeThumb.offsetLeft - container.offsetWidth / 2 + activeThumb.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const goToNext = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const goToPrev = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  // Touch Swipe Handlers for mobile
  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && totalImages > 1) {
      goToNext();
    } else if (isRightSwipe && totalImages > 1) {
      goToPrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse Drag Handlers for desktop slider
  const onMouseDown = (e: React.MouseEvent) => {
    if (totalImages <= 1) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const diff = e.clientX - dragStartX;
    setDragOffset(diff);
  };

  const onMouseUp = () => {
    if (!isDragging || dragStartX === null) return;
    if (dragOffset < -minSwipeDistance && totalImages > 1) {
      goToNext();
    } else if (dragOffset > minSwipeDistance && totalImages > 1) {
      goToPrev();
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragOffset(0);
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartX(null);
      setDragOffset(0);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  return (
    <div className={`space-y-3.5 select-none ${className}`}>
      
      {/* Main Big Slide Display */}
      <div 
        className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#FAF6F0] border border-pink-100/90 shadow-md group cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Images Sliding Container */}
        <div 
          className="w-full h-full flex transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {images.map((imgUrl, idx) => (
            <div 
              key={idx} 
              className="w-full h-full shrink-0 relative bg-[#FAF6F0]"
            >
              <ImageWithFallback
                src={imgUrl}
                alt={`${product.name} - Foto ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
          ))}
        </div>

        {/* Top Badges (Best Seller, Sold Out, Discount) */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-20 pointer-events-none">
          {product.is_best_seller && (
            <span className="bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
              <span>Best Seller</span>
            </span>
          )}
          {isSoldOut && (
            <span className="bg-[#2D2D2D]/95 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
              Sold Out
            </span>
          )}
          {product.original_price && product.original_price > product.price && !isSoldOut && (
            <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 shadow-xs">
              Hemat {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
            </span>
          )}
        </div>

        {/* Top Right Actions (Wishlist & Fullscreen Lightbox) */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-20">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-700 hover:text-pink-600 flex items-center justify-center shadow-xs backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Lihat Foto Layar Penuh"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {onToggleWishlist && (
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs backdrop-blur-xs ${
                wishlisted
                  ? 'bg-rose-50 text-rose-500 shadow-md'
                  : 'bg-white/85 text-gray-500 hover:text-rose-500 hover:bg-white'
              }`}
              title={wishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Navigation Arrows for Multi-Image (Visible on desktop / hover) */}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#2D2D2D] hover:text-pink-600 flex items-center justify-center shadow-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer backdrop-blur-xs hover:scale-105 active:scale-95 border border-pink-100"
              title="Foto Sebelumnya"
              aria-label="Foto Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#2D2D2D] hover:text-pink-600 flex items-center justify-center shadow-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer backdrop-blur-xs hover:scale-105 active:scale-95 border border-pink-100"
              title="Foto Selanjutnya"
              aria-label="Foto Selanjutnya"
            >
              <ChevronRight className="w-5 h-5 -mr-0.5" />
            </button>
          </>
        )}

        {/* Bottom Floating Bar: Pagination Dots & Counter Badge */}
        {totalImages > 1 && (
          <div className="absolute inset-x-0 bottom-3.5 flex items-center justify-between px-4 z-20 pointer-events-none">
            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-auto shadow-xs">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all rounded-full cursor-pointer ${
                    currentIndex === idx
                      ? 'w-5 h-2 bg-pink-400 shadow-xs'
                      : 'w-2 h-2 bg-white/60 hover:bg-white'
                  }`}
                  title={`Foto ${idx + 1}`}
                  aria-label={`Slide ke-${idx + 1}`}
                />
              ))}
            </div>

            {/* Counter Badge (e.g. 1/3) */}
            <div className="bg-black/55 backdrop-blur-md text-white font-mono font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs pointer-events-auto">
              {currentIndex + 1} / {totalImages}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails Gallery Strip */}
      {totalImages > 1 && (
        <div 
          ref={thumbnailContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-pink-200 px-0.5"
        >
          {images.map((imgUrl, idx) => {
            const isActive = currentIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-200 cursor-pointer bg-white ${
                  isActive
                    ? 'border-pink-500 ring-2 ring-pink-200 scale-100 shadow-sm'
                    : 'border-pink-100/80 opacity-70 hover:opacity-100 hover:border-pink-300'
                }`}
                title={`Pilih Foto ${idx + 1}`}
              >
                <ImageWithFallback
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-pink-500/10 pointer-events-none" />
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-mono font-bold px-1 rounded">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox / Fullscreen Image Zoom Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between text-white max-w-4xl pt-2">
            <div>
              <h4 className="font-playfair font-bold text-sm sm:text-base text-pink-200">
                {product.name}
              </h4>
              <p className="text-[11px] text-white/70">
                Foto {currentIndex + 1} dari {totalImages}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Zoomed Image with Next/Prev Controls */}
          <div 
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {totalImages > 1 && (
              <button
                type="button"
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs z-30"
                title="Foto Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl bg-black/50">
              <ImageWithFallback
                src={images[currentIndex]}
                alt={`${product.name} zoomed`}
                className="max-h-[75vh] w-auto object-contain mx-auto"
              />
            </div>

            {totalImages > 1 && (
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs z-30"
                title="Foto Selanjutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {totalImages > 1 && (
            <div 
              className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    currentIndex === idx
                      ? 'border-pink-500 ring-2 ring-pink-300 scale-105'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
