import React from 'react';
import { Sparkles, Heart, ArrowRight, ShoppingBag, Star, MapPin, Instagram, CheckCircle2, Wand2, ShieldCheck, Clock, Layers, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { Product, Category } from '../types';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE, FALLBACK_AVATAR_IMAGE, FALLBACK_EVENT_IMAGE } from '../components/common/ImageWithFallback';
import { createWhatsAppLink, getStoredWhatsAppNumber } from '../lib/utils';
import { DEFAULT_CATEGORIES, DEFAULT_INITIAL_PRODUCTS } from '../context/StoreContext';
import { StackedSection } from '../components/common/StackedSection';

interface HomePageProps {
  onNavigate: (tab: string, filterCategory?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectProduct }) => {
  const { settings, categories, products, testimonials, events, storeHeroBanner } = useStore();

  const brandName = settings?.brand_name || 'DISSOF.ID';
  const tagline = settings?.tagline || 'everything is heartmade♡';
  const instagram = settings?.instagram ? settings.instagram.replace('@', '') : 'dissof.id';
  const waNumber = settings?.whatsapp_number || getStoredWhatsAppNumber();
  const offlineSpot = settings?.offline_spot || 'Dumai Pop-Up Store / Bazaars';
  const offlineSchedule = settings?.offline_schedule || 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)';

  const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=900&auto=format&fit=crop&q=80';
  const heroImage = (storeHeroBanner && storeHeroBanner.trim()) ? storeHeroBanner : DEFAULT_HERO_IMAGE;

  // Categories fallback guarantee
  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  // Best sellers fallback guarantee
  const bestSellers = (products || []).filter((p) => p.is_best_seller && p.is_visible !== false);
  const featuredProducts = bestSellers.length > 0 
    ? bestSellers.slice(0, 8) 
    : ((products && products.length > 0) ? products.slice(0, 8) : DEFAULT_INITIAL_PRODUCTS.slice(0, 8));

  const getCategoryImage = (cat: Category) => {
    if (cat?.image && String(cat.image).trim()) return cat.image;
    const slug = String(cat?.slug || cat?.name || '').toLowerCase();
    const matched = DEFAULT_CATEGORIES.find((d) => d.id === cat?.id || d.slug === slug || (slug && slug.includes(d.id)));
    return matched?.image || DEFAULT_CATEGORIES[0].image;
  };

  let currentSectionIdx = 0;

  return (
    <div className="relative">
      
      {/* 1. HERO SECTION */}
      <StackedSection index={currentSectionIdx++} className="pt-6 sm:pt-10 pb-12 sm:pb-20">
        <section className="relative">
          {/* Soft pastel ambient background spots */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-pink-100/60 via-rose-50/40 to-transparent rounded-3xl -z-10 blur-2xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
              
              {/* Left Content Column */}
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                
                {/* Cute top pill */}
                <div className="animate-fade-slide-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-200 shadow-xs text-xs font-bold text-pink-600">
                  <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-ping" />
                  <span>Dumai Local Handmade Brand ♡</span>
                </div>

                {/* Headline */}
                <h1 className="animate-fade-slide-up delay-100 font-playfair text-3xl sm:text-5xl lg:text-6xl font-bold text-[#2E241E] leading-[1.15] tracking-tight">
                  little things, made with{' '}
                  <span className="relative inline-block text-pink-600 italic">
                    heart ♡
                    <span className="absolute left-0 bottom-1 w-full h-3 bg-pink-200/50 -z-10 rounded-full" />
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="animate-fade-slide-up delay-200 text-base sm:text-lg text-[#66564E] max-w-xl mx-auto lg:mx-0 font-medium">
                  handmade accessories & little treasures. Setiap gelang, phone charm, dan kalung dirangkai satu per satu dengan cinta untuk melengkapi gayamu.
                </p>

                {/* Action Buttons */}
                <div className="animate-fade-slide-up delay-300 pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                  <button
                    onClick={() => onNavigate('shop')}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate('custom')}
                    className="w-full sm:w-auto px-7 py-4 rounded-full bg-white border-2 border-pink-300 text-pink-700 font-bold text-sm hover:bg-pink-50 hover:border-pink-400 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4 text-pink-500" />
                    <span>MAKE YOUR CUSTOM ♡</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="animate-fade-slide-up delay-400 pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-[#7A6A61]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-pink-500" />
                    <span>100% Handmade Beads</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-pink-500" />
                    <span>Custom Inisial & Charms</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-pink-500" />
                    <span>Available at CFN Soebrantas</span>
                  </div>
                </div>
              </div>

              {/* Right Visual Image Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md">
                  
                  {/* Main Hero Image Card */}
                  <div className="animate-scale-in relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white aspect-[4/5] group">
                    <ImageWithFallback
                      src={heroImage}
                      alt={`${brandName} Handmade Charm Bracelet`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  {/* Floating Aesthetic Card 1 */}
                  <div className="animate-scale-in delay-200 absolute -top-4 -left-4 bg-white p-3 rounded-2xl border border-pink-100 shadow-xl flex items-center gap-2.5 animate-float">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-lg">
                      ✨
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#2E241E]">everything is</p>
                      <p className="text-xs font-extrabold text-pink-600">heartmade ♡</p>
                    </div>
                  </div>

                  {/* Floating Aesthetic Card 2 */}
                  <div className="animate-scale-in delay-300 absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl border border-pink-100 shadow-xl flex items-center gap-2.5 animate-float-slow">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
                      ⭐
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#2E241E]">Rated 5.0 / 5.0</p>
                      <p className="text-[10px] text-[#73635B]">by 100+ lovely customers</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>
      </StackedSection>

      {/* 2. CATEGORY SECTION */}
      <StackedSection index={currentSectionIdx++} className="py-12 sm:py-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-8 animate-fade-slide-up">
            <span className="text-xs font-extrabold uppercase tracking-widest text-pink-500">
              Jelajahi Koleksi ♡
            </span>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2E241E]">
              Shop by Category
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('shop', cat.id)}
                className="group bg-white rounded-3xl p-4 sm:p-5 border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center space-y-3 cursor-pointer"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 group-hover:scale-105 transition-transform duration-300 shadow-xs relative">
                  <ImageWithFallback
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                  {cat.icon && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/90 backdrop-blur-xs flex items-center justify-center text-[10px] sm:text-xs shadow-2xs">
                      {cat.icon}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#2E241E] group-hover:text-pink-600 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-[#8C7D75] line-clamp-1 mt-0.5">
                    {cat.description || 'Koleksi handmade DISSOF.ID'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </StackedSection>

      {/* 3. BEST SELLERS ("shop our favorites ♡") */}
      <StackedSection index={currentSectionIdx++} className="py-12 sm:py-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 animate-fade-slide-up">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-pink-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Paling Diminati
              </span>
              <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2E241E] mt-1">
                shop our favorites ♡
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5F57] mt-1">
                Aksesoris handmade best seller pilihan kesayangan customer.
              </p>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>Lihat Semua Produk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      </StackedSection>

      {/* 4. STORY / PHILOSOPHY ("made with love, bead by bead") */}
      <StackedSection index={currentSectionIdx++} className="py-12 sm:py-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#FFF5F5] via-[#FFF9F6] to-pink-50/70 rounded-3xl p-6 sm:p-12 border border-pink-100/90 shadow-sm relative overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-pink-200 text-xs font-bold text-pink-600">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                  <span>Our Handmade Craft</span>
                </div>
                <h2 className="font-playfair text-2xl sm:text-4xl font-bold text-[#2E241E]">
                  made with love, bead by bead ♡
                </h2>
                <p className="text-sm sm:text-base text-[#615149] leading-relaxed">
                  Di DISSOF.ID, setiap aksesoris bukan sekadar perhiasan, melainkan karya seni mini yang dirangkai secara manual menggunakan manik-manik pilihan, charm unik, dan tali berkualitas tinggi.
                </p>
                <p className="text-sm text-[#73635B] leading-relaxed">
                  Tidak ada produk yang diproduksi secara massal oleh mesin pabrik. Setiap simpul, penataan warna, dan liontin kami perhatikan secara teliti agar memberikan sentuhan personal yang manis bagi pemakainya.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#4A3D36]">
                  <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-pink-100">
                    <span className="text-pink-500">✦</span> Bahan Berkualitas & Anti Karat
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-pink-100">
                    <span className="text-pink-500">✦</span> Pilihan Inisial & Charm Sesuai Selera
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-pink-100">
                    <span className="text-pink-500">✦</span> Packaging Gemas & Free Gift
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <ImageWithFallback
                  src={
                    settings?.highlight_images?.[0] ||
                    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80'
                  }
                  alt="Handmade beads crafting"
                  className="rounded-2xl object-cover h-44 sm:h-52 w-full border-2 border-white shadow-md"
                />
                <ImageWithFallback
                  src={
                    settings?.highlight_images?.[1] ||
                    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80'
                  }
                  alt="Jewelry details"
                  className="rounded-2xl object-cover h-44 sm:h-52 w-full border-2 border-white shadow-md mt-4"
                />
              </div>
            </div>

          </div>
        </section>
      </StackedSection>

      {/* 5. CUSTOM PROMO SECTION ("create your own ♡") */}
      <StackedSection index={currentSectionIdx++} className="py-12 sm:py-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            {/* Sparkle background icons */}
            <div className="absolute top-4 right-10 text-white/20 text-6xl select-none pointer-events-none">✨</div>
            <div className="absolute bottom-4 left-10 text-white/20 text-5xl select-none pointer-events-none">♡</div>

            <div className="relative z-10 max-w-2xl space-y-4 text-center sm:text-left">
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wider uppercase">
                Custom Order Studio
              </span>
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold tracking-tight">
                create your own ♡
              </h2>
              <p className="text-sm sm:text-base text-pink-50 leading-relaxed">
                Mau bikin gelang nama inisial kamu & bestie? Atau request phone strap dengan warna outfit favoritmu? Kamu bebas menentukan model, palet warna, dan charm impianmu!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('custom')}
                  className="px-8 py-4 rounded-full bg-white text-pink-600 font-extrabold text-sm uppercase tracking-wider shadow-lg hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>MAKE YOUR CUSTOM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </StackedSection>

      {/* 6. TESTIMONIALS ("what our customers say") */}
      {testimonials.length > 0 && (
        <StackedSection index={currentSectionIdx++} className="py-12 sm:py-16">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 mb-8 animate-fade-slide-up">
              <span className="text-xs font-extrabold uppercase tracking-widest text-pink-500">
                Cerita Dari Mereka ♡
              </span>
              <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2E241E]">
                what our customers say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {testimonials.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-pink-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-pink-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#574941] italic leading-relaxed">
                      "{item.review}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-pink-50 flex items-center gap-3">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.customer_name}
                        className="w-10 h-10 rounded-full object-cover border border-pink-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-sm">
                        {item.customer_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-[#2E241E]">
                        {item.customer_name}
                      </h4>
                      {item.customer_handle && (
                        <p className="text-[11px] text-pink-500 font-medium">
                          {item.customer_handle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </StackedSection>
      )}

      {/* 7. OFFLINE PRESENCE ("find us offline ♡") */}
      <StackedSection index={currentSectionIdx++} className="py-12 sm:py-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-pink-100 p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-xs font-bold text-pink-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Dumai Pop-Up Store</span>
                </div>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2E241E]">
                  find us offline ♡
                </h2>
                <p className="text-sm text-[#66564E] leading-relaxed">
                  Ingin melihat langsung kilau manik-manik, mencoba ukuran gelang di tanganmu, atau merangkai custom bracelet langsung di tempat? Kunjungi booth kami di:
                </p>

                <div className="bg-pink-50/70 border border-pink-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-[#2E241E]">{offlineSpot}</h4>
                      <p className="text-xs text-[#6B5C54]">Dumai, Riau (Area Kuliner & Fashion)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#6B5C54] pt-1">
                    <Clock className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>{offlineSchedule}</span>
                  </div>
                </div>

                <div className="pt-1 flex gap-3">
                  <button
                    onClick={() => onNavigate('events')}
                    className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition-colors shadow-xs cursor-pointer"
                  >
                    Lihat Info Event & Jadwal Pop-Up →
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-pink-100 shadow-md">
                  <ImageWithFallback
                    src={
                      settings?.popup_banner_image ||
                      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=700&auto=format&fit=crop&q=80'
                    }
                    alt="Car Free Night Soebrantas booth"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>
      </StackedSection>

      {/* 8. INSTAGRAM SHOWCASE ("follow our little world ♡") */}
      <StackedSection index={currentSectionIdx++} className="py-12 sm:py-20 pb-20 sm:pb-28">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-pink-500">
              Instagram Feed
            </span>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2E241E] mt-1">
              follow our little world ♡
            </h2>
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-600 hover:text-pink-700 mt-1"
            >
              <Instagram className="w-4 h-4" />
              <span>@{instagram}</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {(
              settings?.instagram_feed_images && settings.instagram_feed_images.length === 4
                ? settings.instagram_feed_images
                : [
                    'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=500&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=80',
                  ]
            ).map((src, i) => (
              <a
                key={i}
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
                className="group aspect-square rounded-2xl overflow-hidden border border-pink-100 relative block bg-pink-50 shadow-xs"
              >
                <ImageWithFallback
                  src={src}
                  alt={`Instagram post ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-pink-600/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                  <Instagram className="w-6 h-6" />
                </div>
              </a>
            ))}
          </div>
        </section>
      </StackedSection>

    </div>
  );
};


