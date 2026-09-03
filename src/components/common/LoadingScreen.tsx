import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface LoadingScreenProps {
  isFadingOut: boolean;
  message?: string;
  brandName?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isFadingOut,
  message = 'Memuat Koleksi Produk...',
  brandName = 'DISSOF.ID',
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ease-out ${
        isFadingOut ? 'loading-fade-out' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#FAF8F5',
      }}
      aria-label="Memuat aplikasi"
      role="status"
    >
      {/* Soft pastel ambient gradient orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pink-200/50 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Main Center Box */}
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        
        {/* Animated Modern Ring + Icon Container */}
        <div className="relative flex items-center justify-center">
          {/* Rotating gradient halo ring */}
          <div className="w-24 h-24 rounded-full border-3 border-pink-200/70 border-t-pink-500 border-r-rose-400 animate-spin" />
          
          {/* Inner pulsing circle */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-pink-100 to-rose-50 border border-pink-200/80 flex items-center justify-center shadow-md shadow-pink-100 animate-pulse">
            <Heart className="w-7 h-7 text-pink-500 fill-pink-400 animate-bounce" />
          </div>

          {/* Sparkle badge */}
          <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-xs border border-pink-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>

        {/* Brand & Loading Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-pink-200/70 text-[11px] font-bold text-pink-600 shadow-xs tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            <span>{brandName}</span>
          </div>

          <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2E241E] tracking-tight">
            {message}
          </h2>

          <p className="text-xs text-[#6B5B53] font-medium leading-relaxed">
            Menyiapkan katalog aksesoris handmade & little treasures♡
          </p>
        </div>

        {/* Modern animated progress bar */}
        <div className="w-48 h-1.5 bg-pink-100 rounded-full overflow-hidden relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500 rounded-full w-full animate-[shimmer_1.4s_infinite_linear] skeleton-shimmer-pink" />
        </div>

        {/* Skeleton Card Preview Hint */}
        <div className="pt-2 w-full grid grid-cols-2 gap-2 opacity-60">
          <div className="h-16 rounded-xl skeleton-shimmer border border-pink-100/60 flex flex-col justify-end p-2 gap-1">
            <div className="h-2 w-3/4 bg-pink-200/50 rounded-full" />
            <div className="h-2 w-1/2 bg-pink-200/40 rounded-full" />
          </div>
          <div className="h-16 rounded-xl skeleton-shimmer border border-pink-100/60 flex flex-col justify-end p-2 gap-1">
            <div className="h-2 w-3/4 bg-pink-200/50 rounded-full" />
            <div className="h-2 w-1/2 bg-pink-200/40 rounded-full" />
          </div>
        </div>

        {/* Small live badge */}
        <div className="flex items-center gap-1 text-[10px] text-[#8C7D75]">
          <span>Terhubung ke Supabase Cloud</span>
          <span className="text-emerald-600 font-bold">●</span>
        </div>

      </div>
    </div>
  );
};
