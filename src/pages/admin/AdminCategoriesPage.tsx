import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  ShoppingBag, 
  Sparkles,
  ExternalLink,
  ArrowRight,
  Crop
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import { compressImageFile } from '../../lib/utils';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE } from '../../components/common/ImageWithFallback';
import { ImageCropModal } from '../../components/common/ImageCropModal';

const PRESET_AESTHETIC_IMAGES = [
  { label: 'Charm Bracelets', url: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80', icon: '✨' },
  { label: 'Phone Charms', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80', icon: '📱' },
  { label: 'Beaded Necklaces', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', icon: '🌸' },
  { label: 'Beaded Rings', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80', icon: '💍' },
  { label: 'Keychains & Bag Charms', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80', icon: '🎀' },
  { label: 'Hair Clips & Pins', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80', icon: '🪄' },
  { label: 'Gift Sets & Bundles', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', icon: '🎁' },
  { label: 'Pastel Beads', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80', icon: '🧁' },
];

const EMOJI_PRESETS = ['✨', '🌸', '🎀', '💍', '📱', '🪄', '🎁', '💖', '⭐', '🧁', '🧸', '🍓', '🍒', '🦋', '🌷', '💫'];

interface AdminCategoriesPageProps {
  onNavigateToProducts?: (categoryId?: string) => void;
}

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({ onNavigateToProducts }) => {
  const { categories, products, saveFullCategoryLocal, deleteCategoryLocal, resetCategoriesToDefault } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('✨');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Category Crop Modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('✨');
    setImage(PRESET_AESTHETIC_IMAGES[0].url);
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || '✨');
    setImage(cat.image || PRESET_AESTHETIC_IMAGES[0].url);
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      const generatedSlug = String(val || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCropImageSrc(reader.result as string);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setImage(croppedBase64);
    setCropModalOpen(false);
    setCropImageSrc(null);
  };

  const handleOpenCropExisting = () => {
    if (!image) return;
    setCropImageSrc(image);
    setCropModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const catSlug = String(slug || '').trim() || String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const catId = editingCategory ? editingCategory.id : (catSlug || `cat-${Date.now()}`);

      const categoryToSave: Category = {
        id: catId,
        name: name.trim(),
        slug: catSlug,
        description: description.trim() || `Koleksi ${name.trim()} handmade DISSOF.ID`,
        icon: icon || '✨',
        image: image.trim() || PRESET_AESTHETIC_IMAGES[0].url,
      };

      await saveFullCategoryLocal(categoryToSave);
      setModalOpen(false);
      showToast(`Kategori "${categoryToSave.name}" berhasil disimpan ke LocalStorage!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const productCount = products.filter((p) => p.category_id === cat.id || p.category_id === cat.slug).length;
    let confirmMsg = `Hapus kategori "${cat.name}"?`;
    if (productCount > 0) {
      confirmMsg = `Kategori "${cat.name}" memiliki ${productCount} produk. Apakah kamu yakin ingin menghapus kategori ini?`;
    }

    if (confirm(confirmMsg)) {
      try {
        await deleteCategoryLocal(cat.id);
        showToast(`Kategori "${cat.name}" berhasil dihapus.`);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus kategori.');
      }
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Kembalikan daftar kategori ke pengaturan default DISSOF.ID? (Kategori bawaan dengan foto & ikon aesthetic akan dimuat ulang)')) {
      resetCategoriesToDefault();
      showToast('Kategori telah dikembalikan ke standar default DISSOF.ID ♡');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    return (
      String(c?.name || '').toLowerCase().includes(q) ||
      String(c?.slug || '').toLowerCase().includes(q) ||
      String(c?.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#2D2D2D] text-white px-4 py-3 rounded-2xl shadow-xl border border-pink-300 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Kelola Kategori Produk ♡
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Atur kategori etalase toko & seksi "Shop by Category" di halaman utama. Data tersimpan 100% di LocalStorage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white border border-black/10 hover:bg-[#FAF7F2] text-[#63534B] rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Reset Kategori Bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#2D2D2D] hover:bg-black text-white font-bold rounded-2xl text-xs transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-pink-300" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Search & Info Bar */}
      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A08C8C]" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F7F2] border border-black/5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
          />
        </div>

        <div className="text-xs text-[#7A6A61] font-medium flex items-center gap-4">
          <span>Total: <b>{categories.length} Kategori</b></span>
          <span>•</span>
          <span>Total Produk: <b>{products.length} Item</b></span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const productCount = products.filter(
            (p) => p.category_id === cat.id || p.category_id === cat.slug || String(p.category_name || '').toLowerCase() === String(cat.name || '').toLowerCase()
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-4 border border-black/5 hover:border-pink-300 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start gap-3.5">
                {/* Category Image Box */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 shrink-0 relative group-hover:scale-105 transition-transform">
                  <ImageWithFallback
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                  {cat.icon && (
                    <div className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-white/90 backdrop-blur-xs flex items-center justify-center text-xs shadow-2xs">
                      {cat.icon}
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-[#2D2D2D] truncate">
                      {cat.name}
                    </h3>
                  </div>

                  <span className="font-mono text-[10px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    /{cat.slug}
                  </span>

                  <p className="text-[11px] text-[#7A6A61] line-clamp-2 mt-1 leading-relaxed">
                    {cat.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-pink-500" />
                  <span>{productCount} Produk</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {onNavigateToProducts && (
                    <button
                      type="button"
                      onClick={() => onNavigateToProducts(cat.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
                      title="Lihat produk kategori ini"
                    >
                      Produk →
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Kategori"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-sm">
                  {icon || '✨'}
                </div>
                <h3 className="font-playfair font-bold text-lg text-[#2D2D2D]">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-black rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Category Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Nama Kategori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Charm Bracelets"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-1 focus:ring-pink-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Slug URL</label>
                  <input
                    type="text"
                    placeholder="contoh: charm-bracelets"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-1 focus:ring-pink-400 font-mono"
                  />
                </div>
              </div>

              {/* Emoji Icon Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#2D2D2D] flex items-center justify-between">
                  <span>Ikon / Emoji Kategori</span>
                  <span className="text-[10px] text-gray-400">Pilih cepat atau ketik sendiri</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-12 h-10 text-center text-base rounded-xl border border-black/10 bg-[#F9F7F2] font-bold focus:ring-1 focus:ring-pink-400"
                  />
                  <div className="flex-1 flex flex-wrap gap-1">
                    {EMOJI_PRESETS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setIcon(em)}
                        className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                          icon === em ? 'bg-pink-500 text-white shadow-xs scale-110' : 'bg-[#F9F7F2] hover:bg-pink-100 text-[#2D2D2D]'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi koleksi aksesoris ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-1 focus:ring-pink-400 resize-none"
                />
              </div>

              {/* Image Section */}
              <div className="space-y-2">
                <label className="font-bold text-[#2D2D2D] flex items-center justify-between">
                  <span>Foto Thumbnail Kategori</span>
                  <span className="text-[10px] text-pink-600 font-semibold">Bebas Broken Image ♡</span>
                </label>

                {/* Preview Box */}
                <div className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-pink-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-pink-200 shrink-0">
                    <ImageWithFallback
                      src={image}
                      alt="Pratinjau"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-white border border-pink-200 hover:bg-pink-50 text-pink-700 font-bold rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isUploading ? 'Memproses...' : 'Upload Foto'}</span>
                      </button>

                      {image && (
                        <button
                          type="button"
                          onClick={handleOpenCropExisting}
                          className="px-2.5 py-1.5 bg-pink-100/90 hover:bg-pink-200 text-pink-700 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-pink-200"
                          title="Crop Foto Kategori"
                        >
                          <Crop className="w-3 h-3 text-pink-600" />
                          <span>Crop ♡</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      type="url"
                      placeholder="Atau tempel Link/URL gambar..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 bg-white text-[10px]"
                    />
                  </div>
                </div>

                {/* Preset aesthetic templates */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-gray-500 font-semibold block">Pilihan Foto Aesthetic Cepat:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_AESTHETIC_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          if (!icon || icon === '✨') setIcon(preset.icon);
                        }}
                        className={`p-1 rounded-xl border text-[9px] font-semibold text-left truncate flex items-center gap-1 transition-all cursor-pointer ${
                          image === preset.url
                            ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-2xs'
                            : 'border-black/5 bg-[#F9F7F2] text-gray-600 hover:bg-pink-50/50'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-black/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-black/10 text-gray-600 font-bold hover:bg-[#F9F7F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-[#2D2D2D] hover:bg-black text-white font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 text-pink-300" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Kategori'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Category Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        title="Crop & Sesuaikan Foto Kategori ♡"
        description="Potong foto kategori dengan rasio 1:1 atau rasio lainnya agar serasi di katalog."
        defaultAspect={1 / 1}
        cropOptions={{ maxDimension: 600, quality: 0.85 }}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
        }}
      />

    </div>
  );
};
