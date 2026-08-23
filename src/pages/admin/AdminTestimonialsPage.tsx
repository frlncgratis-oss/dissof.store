import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Upload, 
  X,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../lib/api';
import { Testimonial } from '../../types';
import { ImageWithFallback, FALLBACK_AVATAR_IMAGE } from '../../components/common/ImageWithFallback';

export const AdminTestimonialsPage: React.FC = () => {
  const { testimonials, refreshData } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerHandle, setCustomerHandle] = useState('');
  const [productName, setProductName] = useState('');
  const [rating, setRating] = useState('5');
  const [review, setReview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setCustomerName('');
    setCustomerHandle('@');
    setProductName('Charm Bracelet');
    setRating('5');
    setReview('Sumpah gelangnya lucu banget pas dipake! Manik-maniknya rapi dan packagingnya ada free gift lucu banget ♡');
    setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingItem(item);
    setCustomerName(item.customer_name || '');
    setCustomerHandle(item.customer_handle || '');
    setProductName(item.product_name || '');
    setRating(String(item.rating || 5));
    setReview(item.review || '');
    setPhotoUrl(item.photo_url || '');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const res = await api.uploadImages(files);
      if (res.url) {
        setPhotoUrl(res.url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal upload foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !review.trim()) {
      setErrorMsg('Nama dan ulasan customer wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload: Partial<Testimonial> = {
      customer_name: customerName.trim(),
      customer_handle: customerHandle.trim(),
      product_name: productName.trim(),
      rating: Number(rating),
      review: review.trim(),
      photo_url: photoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    };

    try {
      if (editingItem) {
        await api.updateTestimonial(editingItem.id, payload);
      } else {
        await api.createTestimonial(payload);
      }
      await refreshData();
      setModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan testimoni.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: Testimonial) => {
    if (confirm(`Hapus testimoni dari "${item.customer_name}"?`)) {
      try {
        await api.deleteTestimonial(item.id);
        await refreshData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus testimoni.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Kelola Testimoni Customer ♡
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Tampilkan ulasan asli pembeli di halaman depan untuk meningkatkan kepercayaan calon customer.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FF9AA2]" />
          <span>Tambah Testimoni</span>
        </button>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-black/5 text-gray-400 text-xs">
            Belum ada testimoni tersimpan.
          </div>
        ) : (
          testimonials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#FFD1DC] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-[#52443C] italic leading-relaxed">
                  "{item.review}"
                </p>
              </div>

              <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ImageWithFallback
                    src={item.photo_url}
                    alt={item.customer_name}
                    fallbackSrc={FALLBACK_AVATAR_IMAGE}
                    className="w-8 h-8 rounded-full object-cover border border-black/5"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-[#2D2D2D]">{item.customer_name}</h4>
                    <p className="text-[10px] text-[#FF9AA2] font-medium">{item.customer_handle || '@customer'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 text-[#2D2D2D] hover:text-[#FF9AA2]"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Testimonial */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h3 className="font-playfair text-xl font-bold text-[#2D2D2D]">
                  {editingItem ? 'Edit Testimoni ♡' : 'Tambah Testimoni ♡'}
                </h3>
                <p className="text-xs text-[#A08C8C]">Review dari pembeli Dissof.id</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-[#2D2D2D] hover:bg-[#F9F7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Nama Customer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nadia Putri"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Username IG / TikTok</label>
                  <input
                    type="text"
                    placeholder="@nadiaputrii"
                    value={customerHandle}
                    onChange={(e) => setCustomerHandle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Produk yang Dibeli</label>
                  <input
                    type="text"
                    placeholder="Candy Cloud Charm Bracelet"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Rating Bintang</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none font-bold"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value="3">⭐⭐⭐ (3 Bintang)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">
                  Isi Ulasan / Testimoni <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Kesan dan pesan customer..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">Foto Profil / Avatar</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="URL Foto..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                  <label className="px-3 py-2 rounded-xl bg-[#2D2D2D] text-white font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-black/10 text-[#63534B] font-bold hover:bg-[#F9F7F2]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Testimoni ♡'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
