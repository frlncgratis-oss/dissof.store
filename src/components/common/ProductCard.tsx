import React from 'react';
import { Heart, ShoppingBag, Sparkles, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatIDR } from '../../lib/utils';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE } from './ImageWithFallback';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, isWishlisted, toggleWishlist } = useStore();
  const wishlisted = isWishlisted(product.id);
  const isSoldOut = product.is_sold_out || product.stock === 0;

  const mainImage = product.images?.[0] || FALLBACK_PRODUCT_IMAGE;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut) return;
    addToCart(product, 1, product.variants?.[0]);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl p-3 sm:p-3.5 border border-[#F0F0F0] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FDE2E4]/40">
        <ImageWithFallback
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.is_best_seller && (
            <span className="bg-white/95 text-[#2D2D2D] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-black/5 flex items-center gap-1">
              <span className="text-[#FF9AA2]">✦</span>
              BEST SELLER
            </span>
          )}
          {isSoldOut && (
            <span className="bg-[#2D2D2D] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              SOLD OUT
            </span>
          )}
          {product.original_price && product.original_price > product.price && !isSoldOut && (
            <span className="bg-[#FFEFF1] text-[#FF9AA2] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#FFD1DC]">
              Hemat {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
            wishlisted
              ? 'bg-white text-[#FF9AA2] shadow-xs'
              : 'bg-white/80 text-gray-400 hover:text-[#FF9AA2] hover:bg-white shadow-2xs'
          }`}
          title="Simpan ke Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-[#FF9AA2] text-[#FF9AA2]' : ''}`} />
        </button>

        {/* Quick View Button hover */}
        <div className="absolute inset-x-2 bottom-2 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex-1 py-1.5 px-2.5 rounded-full bg-white/95 text-[11px] font-bold text-[#2D2D2D] shadow-xs hover:bg-white hover:text-[#FF9AA2] flex items-center justify-center gap-1 backdrop-blur-xs cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span>Detail</span>
          </button>
          {!isSoldOut && (
            <button
              onClick={handleQuickAdd}
              className="py-1.5 px-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              title="Tambah Cepat ke Cart"
            >
              <ShoppingBag className="w-3 h-3 text-[#FF9AA2]" />
              <span>+ Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <span className="text-[10px] font-semibold text-[#A08C8C] uppercase tracking-wider">
            {product.category_name || product.category_id}
          </span>
          <h3 className="font-playfair font-bold text-xs sm:text-sm text-[#2D2D2D] line-clamp-1 group-hover:text-[#FF9AA2] transition-colors mt-0.5">
            {product.name}
          </h3>
        </div>

        <div className="flex items-baseline justify-between pt-1 border-t border-black/5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-xs sm:text-sm text-[#2D2D2D]">
              {formatIDR(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[10px] text-gray-400 line-through">
                {formatIDR(product.original_price)}
              </span>
            )}
          </div>

          <span className="text-[10px] font-medium text-[#A08C8C]">
            {isSoldOut ? 'Habis' : 'Stok Ada'}
          </span>
        </div>
      </div>
    </div>
  );
};
