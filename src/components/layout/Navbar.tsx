import React, { useState } from 'react';
import { ShoppingBag, Heart, Menu, X, Sparkles, Instagram, MessageCircle, MapPin, User, Search, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, filterCategory?: string) => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenCart }) => {
  const { settings, cartCount, wishlist, storeLogo } = useStore();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementClosed, setAnnouncementClosed] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const brandName = settings?.brand_name || 'DISSOF.ID';
  const tagline = settings?.tagline || 'everything is heartmade♡';
  const announcement = settings?.announcement_banner || '✨ FREE GIFT BOX & POUCH UNTUK SETIAP PEMBELIAN ♡ | READY TO SHIP SE-INDONESIA';

  // Reset logo load error if storeLogo changes
  React.useEffect(() => {
    setLogoLoadError(false);
  }, [storeLogo]);

  const navLinks = [
    { id: 'home', num: '01', label: 'HOME' },
    { id: 'shop', num: '02', label: 'SHOP' },
    { id: 'custom', num: '03', label: 'CUSTOM ORDER ♡', highlight: true },
    { id: 'events', num: '04', label: 'EVENTS' },
    { id: 'about', num: '05', label: 'ABOUT' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F9F7F2]/95 backdrop-blur-md border-b border-black/5 transition-all duration-300">
      {/* Top Editorial Announcement Bar */}
      {!announcementClosed && announcement && (
        <div className="bg-[#2D2D2D] text-white text-[11px] sm:text-xs py-1.5 px-4 font-semibold flex items-center justify-between text-center tracking-wider">
          <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-[#FF9AA2]">✦</span>
            <span className="uppercase">{announcement}</span>
            <span className="text-[#FF9AA2]">✦</span>
          </div>
          <button
            onClick={() => setAnnouncementClosed(true)}
            className="text-white/60 hover:text-white p-0.5 ml-2 transition-colors cursor-pointer"
            title="Tutup banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Editorial Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-22">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#2D2D2D] hover:bg-black/5 transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Editorial Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none py-1 group"
            onClick={() => handleNavClick('home')}
          >
            {storeLogo && !logoLoadError ? (
              <div className="flex items-center gap-3">
                <img
                  src={storeLogo}
                  alt={brandName}
                  onError={() => setLogoLoadError(true)}
                  className="h-10 sm:h-12 max-w-[160px] sm:max-w-[220px] object-contain rounded-xl group-hover:scale-105 transition-transform shadow-2xs"
                />
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-[#2D2D2D] text-white flex items-center justify-center shadow-xs text-base font-bold group-hover:scale-105 transition-transform">
                  ♡
                </div>
                <div className="flex flex-col">
                  <span className="font-playfair text-2xl sm:text-3xl font-bold tracking-tight text-[#2E241E] group-hover:text-pink-600 transition-colors">
                    {brandName}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#A08C8C] uppercase tracking-widest font-semibold -mt-1">
                    {tagline}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Desktop Editorial Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const active = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-xs font-bold tracking-wider transition-all duration-200 uppercase py-1 relative cursor-pointer ${
                    active
                      ? 'text-[#FF9AA2]'
                      : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
                  }`}
                >
                  <span className="opacity-40 text-[10px] mr-1">{link.num} —</span>
                  <span>{link.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF9AA2] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Search shortcut / Shop link */}
            <button
              onClick={() => handleNavClick('shop')}
              className="p-2.5 rounded-full text-[#2D2D2D] hover:bg-black/5 transition-colors cursor-pointer"
              title="Cari Produk"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => handleNavClick('wishlist')}
              className="p-2.5 rounded-full text-[#2D2D2D] hover:bg-black/5 transition-colors relative cursor-pointer"
              title="Wishlist / Favorit"
            >
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-[#FF9AA2] text-[#FF9AA2]' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF9AA2] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-[#2D2D2D] hover:bg-black text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#FF9AA2]" />
              <span className="hidden sm:inline uppercase tracking-wider">Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#FF9AA2] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Portal Shortcut */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`p-2 rounded-full transition-all text-xs font-semibold cursor-pointer ${
                isAuthenticated
                  ? 'text-[#2D2D2D] bg-[#FFEFF1] border border-[#FFD1DC]'
                  : 'text-[#A08C8C] hover:text-[#2D2D2D] hover:bg-black/5'
              }`}
              title={isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
            >
              {isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#FF9AA2]" />
                  <span className="hidden lg:inline text-xs font-bold">Admin</span>
                </div>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-black/5 px-6 pt-4 pb-8 space-y-4 shadow-xl animate-drawer-down">
          <div className="space-y-2">
            {navLinks.map((link) => {
              const active = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold tracking-wider transition-all flex items-center justify-between uppercase ${
                    active
                      ? 'bg-[#FFEFF1] text-[#FF9AA2]'
                      : 'text-[#2D2D2D] hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-40 text-xs">{link.num} —</span>
                    <span>{link.label}</span>
                  </div>
                  {link.highlight && (
                    <span className="text-[10px] bg-[#FF9AA2] text-white px-2 py-0.5 rounded-full font-bold">
                      Custom ♡
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => handleNavClick('wishlist')}
              className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-[#2D2D2D] hover:bg-black/5 flex items-center justify-between uppercase"
            >
              <div className="flex items-center gap-2">
                <span className="opacity-40 text-xs">06 —</span>
                <span>WISHLIST</span>
              </div>
              {wishlist.length > 0 && (
                <span className="text-xs bg-[#FFEFF1] text-[#FF9AA2] px-2 py-0.5 rounded-full font-bold">
                  {wishlist.length} item
                </span>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#A08C8C]">
            <div className="flex items-center gap-1 text-[#2D2D2D] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#FF9AA2]" />
              <span>{settings?.location || 'Dumai, Riau'}</span>
            </div>
            {settings?.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#2D2D2D] hover:text-[#FF9AA2]"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>@{settings.instagram.replace('@', '')}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
