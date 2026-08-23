import React from 'react';
import { Sparkles, Heart, MapPin, Instagram, ShieldCheck, Smile, Gift, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { createWhatsAppLink, getStoredWhatsAppNumber } from '../lib/utils';

interface AboutPageProps {
  onNavigate: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { settings } = useStore();

  const brandName = settings?.brand_name || 'DISSOF.ID';
  const tagline = settings?.tagline || 'everything is heartmade♡';
  const instagram = settings?.instagram ? settings.instagram.replace('@', '') : 'dissof.id';
  const waNumber = settings?.whatsapp_number || getStoredWhatsAppNumber();
  const offlineSpot = settings?.offline_spot || 'Dumai Pop-Up Store / Bazaars';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      
      {/* Hero Header */}
      <div className="animate-fade-slide-up text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold shadow-xs">
          <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
          <span>Our Handmade Story</span>
        </div>
        <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-[#2E241E]">
          everything is heartmade ♡
        </h1>
        <p className="text-sm sm:text-base text-[#6E5E56] font-medium leading-relaxed">
          {tagline} — Merangkai manik-manik indah menjadi perhiasan bermakna yang membawa keceriaan di setiap harimu.
        </p>
      </div>

      {/* Main Story Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-12 border border-pink-100 shadow-md space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 space-y-4">
            <h2 className="font-playfair text-2xl font-bold text-[#2E241E]">
              Tentang DISSOF.ID
            </h2>
            <p className="text-sm text-[#5C4C44] leading-relaxed">
              DISSOF.ID adalah UMKM handmade accessories lokal yang berakar dari Dumai, Riau. Kami berfokus pada kerajinan manik-manik (beads jewelry) yang playful, cute, artsy, dan feminin.
            </p>
            <p className="text-sm text-[#5C4C44] leading-relaxed">
              Kami percaya bahwa aksesoris bukan sekadar pelengkap outfit, melainkan bentuk ekspresi diri dan cerminan perasaan bahagia. Karena itulah, setiap item — mulai dari charm bracelet, beaded choker, hingga phone charm — kami rangkai secara manual satu per satu dengan penuh ketelitian dan kasih sayang.
            </p>
          </div>

          <div className="md:col-span-6 relative">
            <img
              src="https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=700&auto=format&fit=crop&q=80"
              alt="Dissof craft table"
              className="rounded-3xl object-cover w-full h-72 border-4 border-pink-50 shadow-lg"
            />
          </div>
        </div>

        {/* 3 Core Values */}
        <div className="pt-6 border-t border-pink-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2 p-4 rounded-2xl bg-pink-50/50">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white mx-auto flex items-center justify-center font-bold text-lg shadow-xs">
              ♡
            </div>
            <h3 className="font-bold text-sm text-[#2E241E]">100% Heartmade</h3>
            <p className="text-xs text-[#73635B] leading-relaxed">
              Dibuat secara handmade dengan sentuhan personal, bukan cetakan mesin pabrik.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-pink-50/50">
            <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white mx-auto flex items-center justify-center font-bold text-lg shadow-xs">
              ✨
            </div>
            <h3 className="font-bold text-sm text-[#2E241E]">Curated Materials</h3>
            <p className="text-xs text-[#73635B] leading-relaxed">
              Menggunakan glass beads, faux pearls berkualitas, dan hardware tahan karat.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-pink-50/50">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white mx-auto flex items-center justify-center font-bold text-lg shadow-xs">
              🎀
            </div>
            <h3 className="font-bold text-sm text-[#2E241E]">Cute Packaging</h3>
            <p className="text-xs text-[#73635B] leading-relaxed">
              Setiap pesanan dikemas manis lengkap dengan pouch dan kartu ucapan.
            </p>
          </div>
        </div>

      </div>

      {/* Jewelry Care Guide */}
      <div className="bg-[#FFF9F5] rounded-3xl p-6 sm:p-10 border border-pink-100 space-y-4">
        <h3 className="font-playfair text-xl font-bold text-[#2E241E] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <span>Panduan Merawat Aksesoris Manik (Jewelry Care)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#63534B]">
          <div className="bg-white p-4 rounded-2xl border border-pink-100 space-y-1">
            <p className="font-bold text-[#2E241E]">1. Hindari Semprotan Parfum Langsung</p>
            <p>Gunakan parfum atau lotion terlebih dahulu sebelum memakai aksesoris untuk menjaga kilau manik.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-pink-100 space-y-1">
            <p className="font-bold text-[#2E241E]">2. Simpan di Pouch / Kotak Kering</p>
            <p>Simpan di pouch gratis dari Dissof saat tidak dipakai agar tidak terkena debu dan gesekan.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-pink-100 space-y-1">
            <p className="font-bold text-[#2E241E]">3. Bersihkan dengan Kain Lembut</p>
            <p>Lap perlahan dengan kain microfiber kering bila terkena keringat setelah bepergian.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-pink-100 space-y-1">
            <p className="font-bold text-[#2E241E]">4. Jangan Ditarik Terlalu Keras</p>
            <p>Tali elastis kami fleksibel, namun tetap hindari peregangan berlebih agar tetap awet.</p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-3xl p-8 text-center text-white space-y-4 shadow-lg">
        <h3 className="font-playfair text-2xl sm:text-3xl font-bold">
          Siap Merangkai Aksesoris Impianmu?
        </h3>
        <p className="text-xs sm:text-sm text-pink-50 max-w-lg mx-auto">
          Jelajahi katalog ready stock kami atau buat pesanan custom dengan inisial nama kamu sendiri ♡
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-3 rounded-full bg-white text-pink-600 font-bold text-xs uppercase tracking-wider hover:bg-pink-50 transition-colors shadow-md cursor-pointer"
          >
            Lihat Semua Produk
          </button>
          <button
            onClick={() => onNavigate('custom')}
            className="px-6 py-3 rounded-full bg-pink-700/60 border border-white/40 text-white font-bold text-xs uppercase tracking-wider hover:bg-pink-700 transition-colors cursor-pointer"
          >
            Custom Inisial Beads ♡
          </button>
        </div>
      </div>

    </div>
  );
};

