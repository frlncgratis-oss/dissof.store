import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Clock, 
  Upload, 
  X, 
  ExternalLink,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../lib/api';
import { EventItem } from '../../types';
import { formatDate } from '../../lib/utils';
import { ImageWithFallback, FALLBACK_EVENT_IMAGE } from '../../components/common/ImageWithFallback';
import { UniversalImageUploader } from '../../components/common/UniversalImageUploader';

export const AdminEventsPage: React.FC = () => {
  const { events, settings, saveSettingsLocal, saveEventLocal, deleteEventLocal, refreshData } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [bannerSaveStatus, setBannerSaveStatus] = useState<string | null>(null);

  const handleUpdatePopupBanner = async (newImage: string) => {
    try {
      await saveSettingsLocal({ popup_banner_image: newImage || '' });
      setBannerSaveStatus('Tersimpan & Live ke HP Pembeli ✓');
      setTimeout(() => setBannerSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan foto banner pop-up.');
    }
  };

  const handleRemovePopupBanner = async () => {
    try {
      await saveSettingsLocal({ popup_banner_image: '' });
      setBannerSaveStatus('Foto dihapus (default) ✓');
      setTimeout(() => setBannerSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus foto.');
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [boothNumber, setBoothNumber] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'past'>('upcoming');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setTagline('Pop-Up Market & Bazaar');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('19.00 - 23.00 WIB');
    setLocation('Dumai Pop-Up Market, Jl. Jend. Sudirman, Dumai');
    setBoothNumber('Booth #A12');
    setDescription('Kunjungi booth Dissof.id! Beli 2 gratis 1 charm dan kamu bisa custom bracelet langsung di tempat ♡');
    setPosterUrl('https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80');
    setGoogleMapsUrl('https://maps.google.com/?q=Dumai+Pop+Up+Market');
    setStatus('upcoming');
    setGalleryImages([]);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setTitle(event.title || '');
    setTagline(event.tagline || '');
    setDate(event.date || '');
    setTime(event.time || '');
    setLocation(event.location || '');
    setBoothNumber(event.booth_number || '');
    setDescription(event.description || '');
    setPosterUrl(event.poster_url || '');
    setGoogleMapsUrl(event.google_maps_url || '');
    setStatus(event.status || 'upcoming');
    setGalleryImages(event.gallery_images || []);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const res = await api.uploadImages(files);
      if (res.url) {
        setPosterUrl(res.url);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal upload poster.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !location.trim()) {
      setErrorMsg('Nama event, tanggal, dan lokasi wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload: Partial<EventItem> = {
      title: title.trim(),
      tagline: tagline.trim(),
      date,
      time: time.trim(),
      location: location.trim(),
      booth_number: boothNumber.trim(),
      description: description.trim(),
      poster_url: posterUrl || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
      google_maps_url: googleMapsUrl.trim(),
      status,
      gallery_images: galleryImages,
    };

    try {
      await saveEventLocal(payload, editingEvent?.id);
      // Optional fallback to backend API
      if (editingEvent) {
        api.updateEvent(editingEvent.id, payload).catch(() => {});
      } else {
        api.createEvent(payload).catch(() => {});
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: EventItem) => {
    if (confirm(`Hapus event "${event.title}"?`)) {
      try {
        await deleteEventLocal(event.id);
        api.deleteEvent(event.id).catch(() => {});
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus event.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Kelola Event & Pop-Up Market
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Jadwal bazaar offline di Dumai, info booth event, dan dokumentasi.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FF9AA2]" />
          <span>Tambah Jadwal Event</span>
        </button>
      </div>

      {/* SECTION: FOTO & BANNER SECTION OFFLINE / POP-UP (REAL-TIME SYNC) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-3">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#2E241E] flex items-center gap-2">
              <span>Foto Banner Section "Find Us Offline / Pop-Up Store"</span>
              {bannerSaveStatus && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {bannerSaveStatus}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#7A6A61]">
              Foto ini tampil langsung di section "Find Us Offline ♡" di halaman depan pembeli. Perubahan otomatis tersinkronisasi real-time ke seluruh layar HP pembeli tanpa reload.
            </p>
          </div>
        </div>

        <UniversalImageUploader
          label="Foto Booth Pop-Up Market / Bazaar Dumai"
          sublabel="Pilih foto dari galeri HP atau PC. Otomatis dikompres &lt; 150KB (Maks 800px, JPEG 0.6) agar cepat dimuat."
          currentImage={settings?.popup_banner_image || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=700&auto=format&fit=crop&q=80'}
          onImageChange={handleUpdatePopupBanner}
          onImageRemove={handleRemovePopupBanner}
          aspectRatioLabel="Rasio 16:9 atau 4:3"
          previewHeightClass="h-44 sm:h-56"
        />
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-[#2D2D2D]">Daftar Jadwal Event & Pop-Up Bazaar:</h2>
          <span className="text-xs text-pink-600 font-bold">{events.length} Event Terdaftar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-black/5 text-gray-400 text-xs">
            Belum ada jadwal event.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="relative h-44 bg-[#FAF6F0]">
                <ImageWithFallback
                  src={ev.poster_url}
                  alt={ev.title}
                  fallbackSrc={FALLBACK_EVENT_IMAGE}
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  ev.status === 'upcoming'
                    ? 'bg-[#2D2D2D] text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {ev.status === 'upcoming' ? '✨ Upcoming' : 'Selesai'}
                </span>
                {ev.booth_number && (
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[#2D2D2D] text-[10px] font-bold px-2.5 py-1 rounded-full border border-black/5">
                    {ev.booth_number}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#FF9AA2] tracking-wider">
                    {ev.tagline || 'Bazaar'}
                  </span>
                  <h3 className="font-playfair text-lg font-bold text-[#2D2D2D]">{ev.title}</h3>
                  <div className="space-y-1 text-xs text-[#63534B]">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#FF9AA2]" />
                      <span>{formatDate(ev.date)} ({ev.time})</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF9AA2] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{ev.location}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(ev)}
                    className="text-xs font-bold text-[#2D2D2D] hover:text-[#FF9AA2] flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Info</span>
                  </button>

                  <button
                    onClick={() => handleDelete(ev)}
                    className="text-xs font-bold text-gray-400 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Modal Add / Edit Event */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/5 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h3 className="font-playfair text-xl font-bold text-[#2D2D2D]">
                  {editingEvent ? 'Edit Event ♡' : 'Tambah Event Pop-Up ♡'}
                </h3>
                <p className="text-xs text-[#A08C8C]">Jadwal offline bazaar di Dumai</p>
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
              
              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">
                  Nama Event / Pop-Up <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Car Free Night Soebrantas Weekend"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Tagline / Kategori</label>
                  <input
                    type="text"
                    placeholder="Pop-Up Market & Fashion"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Status Event</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none font-bold"
                  >
                    <option value="upcoming">Upcoming Event (Akan Datang)</option>
                    <option value="past">Past Event (Sudah Selesai)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">
                    Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Waktu</label>
                  <input
                    type="text"
                    placeholder="19.00 - 23.00 WIB"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D2D2D]">Nomor Booth</label>
                  <input
                    type="text"
                    placeholder="Booth #A12"
                    value={boothNumber}
                    onChange={(e) => setBoothNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">
                  Lokasi / Alamat Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Jend. Sudirman, Dumai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">Link Google Maps</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2D2D2D]">Deskripsi Event & Promo</label>
                <textarea
                  rows={3}
                  placeholder="Info promo event, workshop manik-manik, atau freebies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <UniversalImageUploader
                  label="Foto Poster / Banner Event"
                  sublabel="Foto suasana booth pop-up atau poster jadwal bazaar Dumai."
                  currentImage={posterUrl}
                  onImageChange={(data) => setPosterUrl(data)}
                  onImageRemove={() => setPosterUrl('')}
                  aspectRatioLabel="Rasio 16:9 atau 4:3"
                  previewHeightClass="h-40"
                />
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Event ♡'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
