import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Upload, 
  X, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  AlertCircle,
  Star,
  Eye,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Camera,
  Link as LinkIcon,
  Crop
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { 
  formatIDR, 
  compressImageFile, 
  hardCompressImage, 
  getImageSizeInKB 
} from '../../lib/utils';
import { 
  uploadImageToImgBB, 
  getActiveImgBBKey, 
  saveCustomImgBBKey, 
  IMGBB_STORAGE_KEY 
} from '../../lib/imgbb';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE } from '../../components/common/ImageWithFallback';
import { ImageCropModal } from '../../components/common/ImageCropModal';

export const AdminProductsPage: React.FC = () => {
  const { products, categories, saveProductLocal, deleteProductLocal, saveCategoryLocal, refreshData } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Delete confirm modal state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [detailsText, setDetailsText] = useState('');
  const [variantsText, setVariantsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ImgBB API Key settings
  const [showImgBBSettings, setShowImgBBSettings] = useState(false);
  const [imgbbKeyInput, setImgbbKeyInput] = useState(() => {
    try {
      return localStorage.getItem(IMGBB_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropUploadInputRef = useRef<HTMLInputElement>(null);

  // Crop Modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTargetIndex, setCropTargetIndex] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenCropForIndex = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetSrc = images[index];
    if (!targetSrc) return;
    setCropImageSrc(targetSrc);
    setCropTargetIndex(index);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedBase64: string) => {
    setUploadingImage(true);
    setUploadProgressText('Mengunggah hasil crop foto ke ImgBB API gratis...');
    try {
      // 1. Upload cropped image directly to ImgBB
      const res = await uploadImageToImgBB(croppedBase64);
      const directUrl = res.url || res.displayUrl || croppedBase64;

      if (cropTargetIndex !== null && cropTargetIndex >= 0 && cropTargetIndex < images.length) {
        setImages((prev) => {
          const next = [...prev];
          next[cropTargetIndex] = directUrl;
          return next;
        });
        showToast(`Foto #${cropTargetIndex + 1} berhasil di-crop & diunggah ke ImgBB!`);
      } else {
        setImages((prev) => {
          const filtered = prev.filter((img) => img !== FALLBACK_PRODUCT_IMAGE);
          return [...filtered, directUrl];
        });
        showToast('Foto baru berhasil di-crop & diunggah ke ImgBB!');
      }
    } catch (err: any) {
      console.warn('ImgBB crop upload warning, applying fallback compression:', err);
      try {
        const compressedCrop = await hardCompressImage(croppedBase64, 800, 0.6, 195);
        if (cropTargetIndex !== null && cropTargetIndex >= 0 && cropTargetIndex < images.length) {
          setImages((prev) => {
            const next = [...prev];
            next[cropTargetIndex] = compressedCrop;
            return next;
          });
        } else {
          setImages((prev) => {
            const filtered = prev.filter((img) => img !== FALLBACK_PRODUCT_IMAGE);
            return [...filtered, compressedCrop];
          });
        }
        showToast('Foto tersimpan secara offline.');
      } catch {
        // ignore
      }
    } finally {
      setUploadingImage(false);
      setUploadProgressText('');
      setCropModalOpen(false);
      setCropImageSrc(null);
      setCropTargetIndex(null);
    }
  };

  const handleUploadWithCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCropImageSrc(reader.result as string);
        setCropTargetIndex(null);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleSaveImgBBKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomImgBBKey(imgbbKeyInput.trim());
    setShowImgBBSettings(false);
    showToast(imgbbKeyInput.trim() ? 'API Key ImgBB Kustom berhasil disimpan!' : 'Menggunakan API Key ImgBB bawaan.');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || 'bracelets');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setPrice('');
    setOriginalPrice('');
    setStock('15');
    setDescription('');
    setDetailsText('Material: Premium glass beads & stainless steel\nPanjang: 16cm + 4cm extender\n100% handmade with love in Dumai');
    setVariantsText('Standard (16cm), Custom Size');
    setTagsText('handmade, cute, beads, accessories, gifts');
    setImages([FALLBACK_PRODUCT_IMAGE]);
    setNewImageUrl('');
    setIsBestSeller(false);
    setIsSoldOut(false);
    setIsVisible(true);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setCategoryId(product.category_id || categories[0]?.id || 'bracelets');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setPrice(product.price != null ? String(product.price) : '');
    setOriginalPrice(product.original_price != null ? String(product.original_price) : '');
    setStock(String(product.stock ?? 10));
    setDescription(product.description || '');
    setDetailsText((product.details || []).join('\n'));
    setVariantsText((product.variants || []).join(', '));
    setTagsText((product.tags || []).join(', '));
    const loadedImgs = Array.isArray(product.images) && product.images.length > 0
      ? [...product.images]
      : (product as any).image
        ? [(product as any).image]
        : [FALLBACK_PRODUCT_IMAGE];
    setImages(loadedImgs);
    setNewImageUrl('');
    setIsBestSeller(Boolean(product.is_best_seller));
    setIsSoldOut(Boolean(product.is_sold_out));
    setIsVisible(product.is_visible !== false);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryInput.trim()) return;
    setSavingCategory(true);
    setErrorMsg('');
    try {
      const created = await saveCategoryLocal(newCategoryInput.trim());
      setCategoryId(created.id);
      setNewCategoryInput('');
      setIsAddingNewCategory(false);
      showToast(`Kategori "${created.name}" berhasil disimpan ke LocalStorage!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan kategori baru.');
    } finally {
      setSavingCategory(false);
    }
  };

  // Upload files from mobile gallery / PC camera directly to ImgBB Free API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg('');
    setUploadProgressText(`Mempersiapkan ${files.length} foto untuk diunggah ke ImgBB API gratis...`);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Mengunggah foto (${i + 1}/${files.length}): ${file.name} ke ImgBB API...`);
        try {
          // Upload directly to ImgBB API
          const res = await uploadImageToImgBB(file);
          if (res && res.url) {
            uploadedUrls.push(res.url);
          }
        } catch (imgErr: any) {
          console.warn('ImgBB direct file upload error, trying compressed fallback:', imgErr);
          try {
            // Compress and retry upload to ImgBB
            const compressed = await hardCompressImage(file, 800, 0.6, 195);
            const fallbackRes = await uploadImageToImgBB(compressed);
            if (fallbackRes && fallbackRes.url) {
              uploadedUrls.push(fallbackRes.url);
            } else {
              uploadedUrls.push(compressed);
            }
          } catch {
            setErrorMsg(imgErr.message || `Gagal mengunggah file "${file.name}" ke ImgBB.`);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => {
          const filtered = prev.filter((img) => img !== FALLBACK_PRODUCT_IMAGE);
          return [...filtered, ...uploadedUrls];
        });
        showToast(`${uploadedUrls.length} foto berhasil diunggah ke ImgBB & siap disimpan ke Firestore!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses unggah foto ke ImgBB.');
    } finally {
      setUploadingImage(false);
      setUploadProgressText('');
      if (e.target) e.target.value = '';
    }
  };

  // Add image via URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:') && !url.startsWith('/uploads/')) {
      alert('Mohon masukkan URL gambar yang valid (contoh: https://...)');
      return;
    }
    setImages((prev) => {
      const filtered = prev.filter((img) => img !== FALLBACK_PRODUCT_IMAGE);
      return [...filtered, url];
    });
    setNewImageUrl('');
    showToast('Foto berhasil ditambahkan!');
  };

  // Remove specific image from product gallery
  const handleRemoveImage = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        return [FALLBACK_PRODUCT_IMAGE];
      }
      return next;
    });
    showToast('Foto dihapus dari galeri');
  };

  // Make image the primary cover photo
  const handleSetPrimaryImage = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [selected, ...remaining];
    });
    showToast('Foto utama berhasil diubah!');
  };

  // Move image position
  const handleMoveImage = (index: number, direction: 'left' | 'right', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Save product (Add or Edit) with ImgBB upload and Cloud Firestore persistence
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMsg('Harga jual harus berupa angka valid (contoh: 35000).');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Silakan pilih kategori produk.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      // 1. If any base64 images remain, upload them to ImgBB before saving
      const finalProcessedImages = await Promise.all(
        images.map(async (img) => {
          if (img && img.startsWith('data:')) {
            try {
              const res = await uploadImageToImgBB(img);
              if (res && res.url) return res.url;
            } catch (err) {
              console.warn('ImgBB fallback on save:', err);
            }
          }
          return img;
        })
      );

      const validImages = finalProcessedImages.length > 0 ? finalProcessedImages : [FALLBACK_PRODUCT_IMAGE];

      const payload: Partial<Product> = {
        name: name.trim(),
        category_id: categoryId,
        price: Number(price),
        original_price: originalPrice && !isNaN(Number(originalPrice)) ? Number(originalPrice) : undefined,
        stock: stock && !isNaN(Number(stock)) ? Number(stock) : 10,
        description: description.trim(),
        details: detailsText.split('\n').map((s) => s.trim()).filter(Boolean),
        variants: variantsText.split(',').map((s) => s.trim()).filter(Boolean),
        tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
        images: validImages,
        is_best_seller: isBestSeller,
        is_sold_out: isSoldOut || Number(stock) === 0,
        is_visible: isVisible,
      };

      // 2. Save directly to Cloud Firestore & Local cache
      await saveProductLocal(payload, editingProduct?.id);

      // Show toast confirmation
      showToast('Produk & Foto Berhasil Disimpan ke Firestore!');

      // Automatically close modal and reset error
      setModalOpen(false);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMsg(
        err.message || 'Gagal menyimpan data ke Cloud Firestore. Silakan periksa koneksi dan coba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete product
  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    setIsDeleting(true);

    try {
      await deleteProductLocal(deleteConfirmProduct.id);
      showToast('Produk Berhasil Dihapus!');
      setDeleteConfirmProduct(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk dari Cloud Firestore.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      const q = String(searchQuery || '').trim().toLowerCase();
      if (q) {
        return (
          String(p?.name || '').toLowerCase().includes(q) ||
          String(p?.description || '').toLowerCase().includes(q) ||
          String(p?.category_name || '').toLowerCase().includes(q) ||
          (p?.tags && (p.tags || []).some((t) => String(t || '').toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [products, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300 ${
          toastMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {toastMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Kelola Produk & Foto Aksesoris
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Tambah, edit foto produk (upload dari HP/PC/URL), ubah harga, stok & status toko.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="p-2.5 rounded-full bg-white border border-black/10 text-[#2D2D2D] hover:bg-[#F9F7F2] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF9AA2]" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A08C8C]" />
          <input
            type="text"
            placeholder="Cari nama produk, tag, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F7F2] border border-black/5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#2D2D2D] text-white'
                : 'bg-[#F9F7F2] text-[#63534B] hover:bg-[#FFEFF1]'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === c.id
                  ? 'bg-[#2D2D2D] text-white'
                  : 'bg-[#F9F7F2] text-[#63534B] hover:bg-[#FFEFF1]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 bg-[#F9F7F2]/60 text-[#A08C8C] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Produk & Foto</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Stok</th>
                <th className="py-3.5 px-4">Status & Visibilitas</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-sm text-[#2D2D2D]">Tidak ada produk ditemukan</p>
                    <p className="text-xs mt-1">Coba ganti kata kunci pencarian atau tambah produk baru.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.is_sold_out || p.stock === 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#F9F7F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-[#F9F7F2]">
                            <ImageWithFallback
                              src={p.images?.[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                            {p.images && p.images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] font-bold px-1 rounded-tl">
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#2D2D2D] line-clamp-1">{p.name}</p>
                            <span className="text-[10px] text-[#A08C8C]">
                              {p.variants?.length || 0} varian • {p.images?.length || 0} foto
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#63534B]">
                        {p.category_name || categories.find((c) => c.id === p.category_id)?.name || p.category_id}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#FF9AA2]">{formatIDR(p.price)}</p>
                        {p.original_price && p.original_price > p.price && (
                          <p className="text-[10px] text-gray-400 line-through">
                            {formatIDR(p.original_price)}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${p.stock <= 3 ? 'text-rose-600' : 'text-[#2D2D2D]'}`}>
                          {p.stock} pcs
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.is_best_seller && (
                            <span className="bg-[#FFEFF1] text-[#FF9AA2] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FFD1DC]">
                              ★ Best Seller
                            </span>
                          )}
                          {isOut ? (
                            <span className="bg-neutral-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Sold Out
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Ready
                            </span>
                          )}
                          {p.is_visible === false && (
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-xl text-[#2D2D2D] hover:bg-[#FFEFF1] hover:text-[#FF9AA2] transition-colors border border-black/5 hover:border-[#FFD1DC] cursor-pointer"
                            title="Edit Produk & Foto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteConfirmProduct(p)}
                            className="p-2 rounded-xl text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-black/5 hover:border-rose-200 cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-black/5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-playfair text-lg font-bold text-[#2D2D2D]">
                Hapus Produk Ini?
              </h3>
              <p className="text-xs text-[#A08C8C]">
                Produk ini akan dihapus dari katalog toko pembeli.
              </p>
            </div>

            {/* Product info preview */}
            <div className="bg-[#F9F7F2] p-3 rounded-2xl border border-black/5 flex items-center gap-3">
              <ImageWithFallback
                src={deleteConfirmProduct.images?.[0]}
                alt={deleteConfirmProduct.name}
                className="w-12 h-12 rounded-xl object-cover border border-black/5"
              />
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-xs text-[#2D2D2D] truncate">{deleteConfirmProduct.name}</p>
                <p className="text-[11px] text-[#FF9AA2] font-semibold">{formatIDR(deleteConfirmProduct.price)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-2.5 rounded-full border border-black/10 text-xs font-bold text-[#63534B] hover:bg-[#F9F7F2] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Produk'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h3 className="font-playfair text-xl font-bold text-[#2D2D2D]">
                  {editingProduct ? 'Edit Produk & Kelola Foto ♡' : 'Tambah Produk Baru ♡'}
                </h3>
                <p className="text-xs text-[#A08C8C]">
                  {editingProduct 
                    ? `Perbarui foto, informasi, dan stok untuk "${editingProduct.name}"`
                    : 'Lengkapi foto dan detail aksesoris handmade untuk toko online'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-[#2D2D2D] hover:bg-[#F9F7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              
              {/* Product Images Manager */}
              <div className="space-y-3 bg-[#F9F7F2] p-4 rounded-2xl border border-black/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="font-bold text-[#2D2D2D] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#FF9AA2]" />
                        <span>Galeri Foto Produk ({images.length} foto)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ImgBB API Gratis
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A08C8C] mt-0.5">
                      Unggah foto langsung ke server ImgBB gratis. Foto #{1} otomatis jadi <b>Cover Utama</b> di etalase toko.
                    </p>
                  </div>

                  {/* Add More Photo Button & ImgBB Config */}
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => setShowImgBBSettings(!showImgBBSettings)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-black/10 hover:bg-[#F9F7F2] text-[#63534B] font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      title="Atur API Key ImgBB Kustom"
                    >
                      <Sparkles className="w-3 h-3 text-[#FF9AA2]" />
                      <span>API Key ImgBB</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Unggah Foto</span>
                    </button>
                  </div>
                </div>

                {/* Optional ImgBB API Key Drawer */}
                {showImgBBSettings && (
                  <div className="bg-white p-3.5 rounded-2xl border border-pink-200 shadow-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-[#2D2D2D]">Konfigurasi API Key ImgBB (Opsional)</p>
                      <button 
                        type="button" 
                        onClick={() => setShowImgBBSettings(false)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#A08C8C]">
                      DISSOF sudah menyertakan kunci API ImgBB bawaan gratis aktif. Anda juga bisa memasukkan API Key dari akun ImgBB Anda sendiri (dapatkan gratis di <b>api.imgbb.com</b>).
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Contoh: 6d207e02198a847aa5fb3ac505b3cf6b (atau kosongkan untuk default)"
                        value={imgbbKeyInput}
                        onChange={(e) => setImgbbKeyInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-black/10 text-xs bg-[#F9F7F2] font-mono focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveImgBBKey}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs cursor-pointer"
                      >
                        Simpan Key
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading Indicator for Image Upload */}
                {uploadingImage && (
                  <div className="bg-pink-50 border-2 border-dashed border-pink-400 p-4 rounded-2xl flex items-center gap-3 shadow-xs animate-pulse">
                    <RefreshCw className="w-5 h-5 text-pink-600 animate-spin shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-pink-900">
                        {uploadProgressText || 'Sedang Mengunggah Foto ke ImgBB API gratis...'}
                      </p>
                      <p className="text-[10px] text-pink-700">
                        Foto diproses dan diunggah langsung ke server CDN ImgBB. URL gambar akan otomatis tersimpan ke Firestore.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Thumbnails grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => {
                    const sizeKB = getImageSizeInKB(img);
                    const isImgBB = img.includes('ibb.co') || img.includes('imgbb');
                    return (
                      <div 
                        key={idx} 
                        className={`relative rounded-2xl overflow-hidden border bg-white aspect-square shadow-xs flex flex-col justify-between ${
                          idx === 0 ? 'border-2 border-[#FF9AA2] ring-2 ring-[#FFD1DC]' : 'border-black/10'
                        }`}
                      >
                        {/* Image with fallback */}
                        <ImageWithFallback
                          src={img}
                          alt={`Foto produk ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Top Header inside Thumbnail */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                          <div className="flex items-center gap-1">
                            {idx === 0 ? (
                              <span className="bg-[#2D2D2D] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 pointer-events-auto">
                                <Star className="w-2.5 h-2.5 fill-[#FF9AA2] text-[#FF9AA2]" />
                                UTAMA
                              </span>
                            ) : (
                              <span className="bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md pointer-events-auto">
                                #{idx + 1}
                              </span>
                            )}

                            {/* ImgBB badge if hosted on ImgBB */}
                            {isImgBB && (
                              <span className="bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md pointer-events-auto backdrop-blur-xs">
                                ImgBB
                              </span>
                            )}

                            {/* Ultra-light size badge */}
                            {!isImgBB && sizeKB > 0 && (
                              <span className="bg-emerald-800/80 text-emerald-100 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-md pointer-events-auto backdrop-blur-xs">
                                {sizeKB} KB
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Crop button */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenCropForIndex(idx, e)}
                              className="w-6 h-6 rounded-full bg-white/95 hover:bg-pink-50 text-[#2D2D2D] hover:text-pink-600 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto border border-black/5"
                              title="Crop & Sesuaikan Foto"
                            >
                              <Crop className="w-3.5 h-3.5 text-pink-600" />
                            </button>

                            {/* Direct Pink Delete 'X' Button */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveImage(idx, e)}
                              className="w-6 h-6 rounded-full bg-[#FF9AA2] hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
                              title="Hapus foto dari produk"
                            >
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Action Bar inside Thumbnail */}
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-10">
                          {idx > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => handleSetPrimaryImage(idx, e)}
                              className="text-[9px] bg-[#FF9AA2] hover:bg-[#ff858e] text-white px-2 py-0.5 rounded-full font-bold shadow-xs transition-colors cursor-pointer"
                              title="Jadikan Foto Utama"
                            >
                              Set Utama
                            </button>
                          ) : (
                            <span className="text-[9px] text-[#FFD1DC] font-semibold pl-1">Cover Toko</span>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => handleMoveImage(idx, 'left', e)}
                                className="p-1 bg-white/90 hover:bg-white rounded text-[#2D2D2D] shadow-xs cursor-pointer"
                                title="Geser ke kiri"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {idx < images.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleMoveImage(idx, 'right', e)}
                                className="p-1 bg-white/90 hover:bg-white rounded text-[#2D2D2D] shadow-xs cursor-pointer"
                                title="Geser ke kanan"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Upload Card: Phone / Device Gallery */}
                  <label 
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed border-[#FF9AA2] hover:border-[#FFB7B2] bg-white text-[#FF9AA2] cursor-pointer flex flex-col items-center justify-center p-3 aspect-square transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs group ${
                      uploadingImage ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingImage ? (
                      <RefreshCw className="w-5 h-5 mb-1 animate-spin text-[#FF9AA2]" />
                    ) : (
                      <Upload className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[10px] font-bold text-center">
                      {uploadingImage ? 'Mengunggah...' : '+ Unggah Foto (ImgBB)'}
                    </span>
                    <span className="text-[9px] text-[#A08C8C] text-center mt-0.5">Dari Galeri HP / PC</span>
                  </label>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />

                {/* Upload Action Helpers */}
                <div className="flex flex-wrap gap-2 pt-1 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cropUploadInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      title="Pilih foto dan langsung potong (crop) sesuai rasio terbaik"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Upload & Crop Foto ♡</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#FFD1DC] text-[#FF9AA2] hover:bg-[#FFEFF1] font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Mengunggah ke ImgBB...' : 'Pilih File Gambar (Banyak)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-[#63534B] hover:bg-[#F9F7F2] font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#FF9AA2]" />
                      <span>Kamera HP Langsung</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={cropUploadInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadWithCrop}
                  className="hidden"
                />

                {/* Direct image URL adder */}
                <div className="flex gap-2 pt-2 border-t border-black/5">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A08C8C]" />
                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar web / ImgBB (https://i.ibb.co/...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 rounded-xl bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    + Tambah URL
                  </button>
                </div>
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Nama Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Strawberry Milk Charm Bracelet ♡"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#2D2D2D]">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(!isAddingNewCategory);
                        setNewCategoryInput('');
                      }}
                      className="text-[11px] text-[#FF9AA2] hover:text-pink-700 font-bold cursor-pointer transition-colors"
                    >
                      {isAddingNewCategory ? '← Pilih dari Daftar' : '+ Tambah Kategori Baru'}
                    </button>
                  </div>

                  {isAddingNewCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ketik kategori baru (contoh: Hair Clips / Brooch)..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory();
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-pink-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2] font-medium"
                      />
                      <button
                        type="button"
                        disabled={savingCategory || !newCategoryInput.trim()}
                        onClick={handleAddNewCategory}
                        className="px-3.5 py-2.5 bg-[#2D2D2D] hover:bg-black text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                      >
                        {savingCategory ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  ) : (
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewCategory(true);
                        } else {
                          setCategoryId(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2] font-medium cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__add_new__" className="text-pink-600 font-bold">
                        + Tambah Kategori Baru...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Price, Original Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="35000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2] font-bold text-[#FF9AA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Harga Coret (Diskon)
                  </label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Jumlah Stok (pcs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                  />
                </div>
              </div>

              {/* Badges Toggles */}
              <div className="flex flex-wrap gap-5 py-3 px-4 bg-[#F9F7F2] rounded-2xl border border-black/5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF9AA2] focus:ring-[#FF9AA2]"
                  />
                  <span className="font-bold text-[#2D2D2D]">★ Tandai Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSoldOut}
                    onChange={(e) => setIsSoldOut(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-800 focus:ring-neutral-800"
                  />
                  <span className="font-bold text-[#2D2D2D]">Tandai Sold Out</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-[#2D2D2D]">Tampilkan di Toko</span>
                </label>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi cerita dan keunggulan aksesoris..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                />
              </div>

              {/* Details & Variants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Spesifikasi / Material (1 baris per poin)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Material: Glass beads & pearl&#10;Panjang: 16cm + 4cm extender&#10;100% handmade in Dumai"
                    value={detailsText}
                    onChange={(e) => setDetailsText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Pilihan Varian (Pisahkan dengan koma)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Elastic Band (16cm), Chain Clasp (16-20cm), Custom Size"
                    value={variantsText}
                    onChange={(e) => setVariantsText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-black/10 text-[#63534B] font-bold text-xs hover:bg-[#F9F7F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-7 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 text-[#FF9AA2] animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-[#FF9AA2]" />
                  )}
                  <span>{isSaving ? 'Menyimpan Perubahan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Perubahan')}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        title="Crop & Sesuaikan Foto Produk ♡"
        description="Pilih rasio 1:1 Persegi (Rekomendasi Foto Produk) atau rasio lainnya, atur zoom dan rotasi agar manik-manik terlihat manis."
        defaultAspect={1 / 1}
        cropOptions={{ maxDimension: 900, quality: 0.85 }}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
          setCropTargetIndex(null);
        }}
      />

    </div>
  );
};
