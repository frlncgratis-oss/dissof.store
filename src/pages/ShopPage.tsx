import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { Product } from '../types';

interface ShopPageProps {
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory = 'all',
  onSelectProduct,
  onNavigate,
}) => {
  const { products, categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  const filterTabs = useMemo(() => {
    return [
      { id: 'all', name: 'All Products' },
      ...categories.map((c) => ({ id: c.id, name: c.name })),
    ];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.is_visible === false) return false;
        if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;
        if (inStockOnly && (p.is_sold_out || p.stock === 0)) return false;
        const q = String(searchQuery || '').trim().toLowerCase();
        if (q) {
          const matchName = String(p?.name || '').toLowerCase().includes(q);
          const matchDesc = String(p?.description || '').toLowerCase().includes(q);
          const matchTags = (p?.tags || []).some((t) => String(t || '').toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        // default 'featured': best sellers first
        if (a.is_best_seller && !b.is_best_seller) return -1;
        if (!a.is_best_seller && b.is_best_seller) return 1;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy, inStockOnly]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="animate-fade-slide-up text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest text-pink-500">
          <Sparkles className="w-3.5 h-3.5" />
          Koleksi Aksesoris
        </span>
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-[#2E241E]">
          Handmade Catalog ♡
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5B53]">
          Temukan gelang charm, phone strap aesthetic, choker mutiara, dan aksesoris manik-manik yang siap mempercantik harimu.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-pink-100/90 shadow-xs space-y-4">
        
        {/* Search input & Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B73]" />
            <input
              type="text"
              placeholder="Cari gelang, phone charm, lilac, choker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-pink-200 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* In stock toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-[#574941] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-pink-500 focus:ring-pink-400 border-pink-300"
              />
              <span>Hanya Ready Stock</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-full border border-pink-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-pink-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#4A3D36] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="featured">Best Seller</option>
                <option value="price-asc">Harga Terendah</option>
                <option value="price-desc">Harga Tertinggi</option>
                <option value="newest">Terbaru</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                    : 'bg-[#FAF7F2] text-[#63544C] hover:bg-pink-50 hover:text-pink-600 border border-pink-100'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#78685F] px-1">
        <span>
          Menampilkan <b>{filteredProducts.length}</b> produk aksesoris
        </span>
        {selectedCategory === 'custom' && (
          <button
            onClick={() => onNavigate('custom')}
            className="font-bold text-pink-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Interactive Custom Builder →</span>
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 space-y-3">
          <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-400 mx-auto flex items-center justify-center text-xl">
            ♡
          </div>
          <h3 className="font-bold text-base text-[#3A2E28]">Produk tidak ditemukan</h3>
          <p className="text-xs text-[#7B6A62] max-w-sm mx-auto">
            Coba gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setInStockOnly(false);
            }}
            className="px-4 py-2 rounded-full bg-pink-500 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((product) => (
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

