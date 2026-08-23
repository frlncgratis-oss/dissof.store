import React, { useState } from 'react';
import { Sparkles, Heart, ShoppingBag, MessageCircle, ArrowLeft, Check, ShieldCheck, Truck, RotateCcw, Share2 } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatIDR, createWhatsAppLink, getStoredWhatsAppNumber } from '../lib/utils';
import { ProductCard } from '../components/common/ProductCard';
import { ProductGallerySlider } from '../components/common/ProductGallerySlider';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectProduct,
}) => {
  const { addToCart, isWishlisted, toggleWishlist, settings, products } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<string>(
    product.variants?.[0] || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  const isSoldOut = product.is_sold_out || product.stock === 0;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addToCart(product, quantity, selectedVariant || undefined, customNote.trim() || undefined);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    const waNumber = settings?.whatsapp_number || getStoredWhatsAppNumber();
    const message = `Halo ${settings?.brand_name || 'DISSOF.ID'} ♡\nSaya ingin langsung pesan produk ini:\n\n` +
      `• *Produk:* ${product.name}\n` +
      (selectedVariant ? `• *Varian:* ${selectedVariant}\n` : '') +
      (customNote.trim() ? `• *Request/Inisial:* ${customNote.trim()}\n` : '') +
      `• *Jumlah:* ${quantity} pcs\n` +
      `• *Total Harga:* ${formatIDR(product.price * quantity)}\n\n` +
      `Mohon info ketersediaan & no rekening untuk pembayarannya ya kak. Terima kasih ♡`;

    window.location.href = createWhatsAppLink(waNumber, message);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Lihat aksesoris handmade gemas ini di DISSOF.ID: ${product.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Related products in the same category
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category_id === product.category_id && p.is_visible !== false)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#6B5A51] hover:text-pink-600 transition-colors bg-white px-4 py-2 rounded-full border border-pink-100 shadow-xs cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog</span>
      </button>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        
        {/* Left Gallery Column: Interactive Multi-Image Slider */}
        <div className="lg:col-span-6">
          <ProductGallerySlider 
            product={product} 
            wishlisted={wishlisted} 
            onToggleWishlist={toggleWishlist} 
          />
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-pink-500 uppercase">
                {product.category_name || product.category_id}
              </span>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors text-xs font-semibold flex items-center gap-1"
                title="Bagikan produk"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Tersalin!' : 'Share'}</span>
              </button>
            </div>

            <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2E241E]">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-extrabold text-2xl sm:text-3xl text-pink-600">
                {formatIDR(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatIDR(product.original_price)}
                </span>
              )}
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Hemat {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                </span>
              )}
            </div>

            {/* Stock status */}
            <div className="pt-1">
              {isSoldOut ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  Stok Habis / Sold Out
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ready Stock ({product.stock} pcs tersisa)
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-pink-100 pt-4 space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#4A3D36]">
              Deskripsi Produk
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4C44] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Details / Materials bullet points */}
          {product.details && product.details.length > 0 && (
            <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100 space-y-2">
              <h4 className="font-bold text-xs text-pink-800">Spesifikasi & Material:</h4>
              <ul className="text-xs text-[#63534B] space-y-1">
                {product.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-pink-500 font-bold">♡</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4A3D36]">
                Pilih Varian / Model:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active = selectedVariant === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        active
                          ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                          : 'bg-white text-[#5C4C44] border border-pink-200 hover:border-pink-300'
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Note Input (for initials or requests) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4A3D36] flex items-center justify-between">
              <span>Request Khusus / Inisial (opsional):</span>
              <span className="text-[10px] text-gray-400">Contoh: Inisial "NADIA" / Tali 15cm</span>
            </label>
            <input
              type="text"
              placeholder="Tuliskan inisial nama atau catatan khusus di sini..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
            />
          </div>

          {/* Quantity Stepper & Add to Cart Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-pink-200 rounded-2xl bg-white p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl text-pink-700 hover:bg-pink-50 font-bold flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-bold text-[#2E241E]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="w-9 h-9 rounded-xl text-pink-700 hover:bg-pink-50 font-bold flex items-center justify-center transition-colors"
                  disabled={isSoldOut || quantity >= (product.stock || 99)}
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isSoldOut ? 'STOK HABIS' : 'TAMBAH KE CART'}</span>
              </button>
            </div>

            {/* Buy Now via WhatsApp Button */}
            {!isSoldOut && (
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>BELI LANGSUNG VIA WHATSAPP</span>
              </button>
            )}
          </div>

          {/* Quick Perks */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-pink-100 text-center text-[10px] text-[#7A6A61]">
            <div className="bg-white p-2.5 rounded-xl border border-pink-100">
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-pink-500" />
              <span>100% Handmade</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-pink-100">
              <Truck className="w-4 h-4 mx-auto mb-1 text-pink-500" />
              <span>Kirim Seluruh RI</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-pink-100">
              <Sparkles className="w-4 h-4 mx-auto mb-1 text-pink-500" />
              <span>Free Gift Box</span>
            </div>
          </div>

        </div>

      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-pink-100 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">
              Rekomendasi Lainnya ♡
            </span>
            <h2 className="font-playfair text-2xl font-bold text-[#2E241E]">
              You May Also Love
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
