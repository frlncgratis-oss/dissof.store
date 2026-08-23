import React from 'react';
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { Product } from '../types';

interface WishlistPageProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onSelectProduct, onNavigate }) => {
  const { wishlist, products } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9AA2] mb-2 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog</span>
          </button>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D] flex items-center gap-2">
            <span>Wishlist Favorit Kamu ♡</span>
            <span className="text-xs font-normal text-[#FF9AA2] bg-[#FFEFF1] px-2.5 py-0.5 rounded-full border border-[#FFD1DC]">
              {wishlistedProducts.length} item
            </span>
          </h1>
        </div>
      </div>

      {/* Grid */}
      {wishlistedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-black/5 space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FFEFF1] text-[#FF9AA2] mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="font-playfair font-bold text-base text-[#2D2D2D]">Belum ada produk favorit</h3>
          <p className="text-xs text-[#A08C8C]">
            Klik ikon hati ♡ pada produk yang kamu sukai untuk menyimpannya di sini.
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-2.5 rounded-full bg-[#2D2D2D] text-white font-bold text-xs shadow-sm hover:bg-black transition-colors"
          >
            Jelajahi Produk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}

    </div>
  );
};
