import React from 'react';
import { Instagram, MessageCircle, MapPin, Sparkles, Heart, ShieldCheck, ShoppingBag, ArrowUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { createWhatsAppLink } from '../../lib/utils';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useStore();

  const brandName = settings?.brand_name || 'DISSOF.ID';
  const tagline = settings?.tagline || 'everything is heartmade♡';
  const instagram = settings?.instagram ? settings.instagram.replace('@', '') : 'dissof.id';
  const waNumber = settings?.whatsapp_number || '6282284901234';
  const location = settings?.location || 'Dumai, Riau';
  const offlineSpot = settings?.offline_spot || 'Dumai Pop-Up Store / Bazaars';
  const offlineSchedule = settings?.offline_schedule || 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)';
  const footerText = settings?.footer_text || 'DISSOF.ID — everything is heartmade♡ Crafted with love in Dumai, Indonesia.';

  const waHelloUrl = createWhatsAppLink(
    waNumber,
    `Halo ${brandName} ♡ Mau tanya-tanya seputar aksesoris handmade & custom order dong!`
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FAF8F5] text-[#2D2D2D] border-t border-pink-100/90 shadow-[0_-16px_40px_rgba(46,36,30,0.06)] rounded-t-[28px] sm:rounded-t-[40px] pt-16 pb-12 relative z-[95] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                ♡
              </div>
              <div>
                <h3 className="font-playfair text-2xl font-bold tracking-tight text-[#2D2D2D]">
                  {brandName}
                </h3>
                <p className="text-[10px] uppercase font-bold text-[#FF9AA2] tracking-wider -mt-0.5">{tagline}</p>
              </div>
            </div>
            <p className="text-xs text-[#73635B] leading-relaxed">
              UMKM handmade accessories lokal dari Dumai. Kami merangkai charm bracelet, beaded phone strap, kalung, dan custom jewelry unik satu per satu dengan cinta.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-black/10 text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white flex items-center justify-center transition-all shadow-xs"
                title="Instagram @dissof.id"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={waHelloUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-black/10 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-xs"
                title="WhatsApp Chat"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#A08C8C]">
              Jelajahi Koleksi
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-[#52443C]">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-[#FF9AA2] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#A08C8C] text-[10px]">01 —</span>
                  <span>Semua Produk (Shop All)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('custom')}
                  className="hover:text-[#FF9AA2] text-[#FF9AA2] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#A08C8C] text-[10px]">02 —</span>
                  <span>Custom Inisial & Charms ♡</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('events')}
                  className="hover:text-[#FF9AA2] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#A08C8C] text-[10px]">03 —</span>
                  <span>Jadwal Event & Pop-Up</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#FF9AA2] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#A08C8C] text-[10px]">04 —</span>
                  <span>Kisah Brand (About Us)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Offline Spot Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#A08C8C]">
              Find Us Offline ♡
            </h4>
            <div className="bg-white border border-black/5 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
              <p className="font-bold text-[#2D2D2D]">{offlineSpot}</p>
              <p className="text-[11px] text-[#73635B] leading-relaxed">{offlineSchedule}</p>
              <div className="pt-1">
                <button
                  onClick={() => onNavigate('events')}
                  className="text-xs font-bold text-[#FF9AA2] hover:underline cursor-pointer"
                >
                  Lihat peta booth & foto event →
                </button>
              </div>
            </div>
          </div>

          {/* Contact & Care */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#A08C8C]">
              Kontak & Bantuan
            </h4>
            <div className="space-y-2 text-xs text-[#52443C]">
              <p>
                <span className="font-bold text-[#2D2D2D] block">WhatsApp Admin:</span>
                <a href={waHelloUrl} target="_blank" rel="noreferrer" className="text-[#FF9AA2] font-semibold hover:underline">
                  +{waNumber}
                </a>
              </p>
              <p>
                <span className="font-bold text-[#2D2D2D] block">Instagram:</span>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="text-[#FF9AA2] font-semibold hover:underline">
                  @{instagram}
                </a>
              </p>
              <p className="text-[11px] text-[#A08C8C] pt-1">
                Lokasi: {location}
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & Admin login link */}
        <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A08C8C]">
          <div className="flex items-center gap-1 text-center sm:text-left">
            <span>{footerText}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-[#2D2D2D] flex items-center gap-1 transition-colors font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
            <button
              onClick={scrollToTop}
              className="w-8 h-8 rounded-full bg-white border border-black/5 text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Kembali ke atas"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
