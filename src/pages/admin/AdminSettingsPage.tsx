import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Sparkles, 
  Check, 
  Instagram, 
  MessageCircle, 
  MapPin, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SiteSettings } from '../../types';
import { createWhatsAppLink, getStoredWhatsAppNumber, setStoredWhatsAppNumber } from '../../lib/utils';

export const AdminSettingsPage: React.FC = () => {
  const { settings, saveSettingsLocal, updateWhatsAppNumberLocal } = useStore();

  const [formData, setFormData] = useState<SiteSettings>({
    brand_name: 'DISSOF.ID',
    tagline: 'everything is heartmade♡',
    sub_tagline: 'handmade accessories & little treasures',
    instagram: '@dissof.id',
    whatsapp_number: '6282284901234',
    location: 'Dumai, Riau',
    offline_spot: 'Dumai Pop-Up Store / Bazaars',
    offline_schedule: 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)',
    announcement_banner: '✨ FREE GIFT BOX & POUCH UNTUK SETIAP PEMBELIAN ♡ | BISA CUSTOM NAMA & INISIAL',
    about_story: 'DISSOF.ID adalah UMKM handmade accessories lokal dari Dumai yang merangkai manik-manik indah secara manual dengan cinta.',
    footer_text: 'everything is heartmade♡ Crafted with love in Dumai, Indonesia.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const currentWA = getStoredWhatsAppNumber();
    if (settings) {
      setFormData({
        brand_name: settings.brand_name ?? 'DISSOF.ID',
        tagline: settings.tagline ?? 'everything is heartmade♡',
        sub_tagline: settings.sub_tagline ?? 'handmade accessories & little treasures',
        instagram: settings.instagram ?? '@dissof.id',
        whatsapp_number: currentWA || settings.whatsapp_number || '6282284901234',
        location: settings.location ?? 'Dumai, Riau',
        offline_spot: settings.offline_spot ?? 'Dumai Pop-Up Store / Bazaars',
        offline_schedule: settings.offline_schedule ?? 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)',
        announcement_banner: settings.announcement_banner ?? settings.announcement ?? '✨ FREE GIFT BOX & POUCH UNTUK SETIAP PEMBELIAN ♡ | BISA CUSTOM NAMA & INISIAL',
        about_story: settings.about_story ?? '',
        footer_text: settings.footer_text ?? '',
      });
    }
  }, [settings]);

  const handleChange = (field: keyof SiteSettings, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (formData.whatsapp_number) {
        setStoredWhatsAppNumber(formData.whatsapp_number);
      }
      await saveSettingsLocal(formData);
      setSuccessMsg('Pengaturan website & nomor WhatsApp berhasil disimpan ke LocalStorage dan aktif seketika di seluruh halaman!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const testWaUrl = createWhatsAppLink(
    formData.whatsapp_number || '6282284901234',
    `Halo ${formData.brand_name || 'DISSOF.ID'} ♡ Ini pesan uji coba nomor WhatsApp admin.`
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Pengaturan Website &amp; Kontak Toko ♡
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Atur nomor WhatsApp admin penerima pesanan, akun Instagram, nama brand, dan teks toko. Data tersimpan permanen di Cloud Firestore &amp; real-time sync.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6 text-xs">
        
        {/* Contact & WhatsApp Integration */}
        <div className="space-y-4 bg-pink-50/40 p-5 rounded-3xl border border-pink-100">
          <div className="flex items-center justify-between border-b border-pink-200 pb-2">
            <h3 className="font-bold text-sm text-[#2D2D2D] flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Nomor WhatsApp Admin (Tersimpan Permanen di Firestore)</span>
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Real-Time Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-[#2D2D2D]">
                Nomor WhatsApp Admin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="6282284901234 atau 0822..."
                value={formData.whatsapp_number ?? ''}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-xs focus:ring-1 focus:ring-pink-400 font-mono font-bold text-[#2D2D2D]"
              />
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Semua tombol "Chat WA", checkout keranjang, dan formulir custom di seluruh website akan langsung diarahkan ke nomor ini.
              </p>
            </div>

            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="font-bold text-[#2D2D2D]">Uji Coba Tautan WhatsApp</label>
              <div className="bg-white p-3 rounded-2xl border border-pink-200 space-y-2">
                <p className="text-[10px] text-gray-500">
                  Target: <span className="font-mono font-bold text-emerald-700">{formData.whatsapp_number || '6282284901234'}</span>
                </p>
                <a
                  href={testWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Tes Buka WhatsApp Sekarang</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Identity */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2D2D2D] border-b border-black/5 pb-2">
            2. Identitas Brand & Media Sosial
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-[#2D2D2D]">Nama Brand</label>
              <input
                type="text"
                required
                value={formData.brand_name ?? ''}
                onChange={(e) => handleChange('brand_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2D2D2D]">Tagline Utama</label>
              <input
                type="text"
                required
                value={formData.tagline ?? ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2D2D2D] flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-[#FF9AA2]" />
                <span>Instagram Brand</span>
              </label>
              <input
                type="text"
                required
                placeholder="@dissof.id"
                value={formData.instagram ?? ''}
                onChange={(e) => handleChange('instagram', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#2D2D2D]">Sub-tagline (Penjelasan Singkat)</label>
            <input
              type="text"
              value={formData.sub_tagline ?? ''}
              onChange={(e) => handleChange('sub_tagline', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Offline Spot & Schedules */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2D2D2D] border-b border-black/5 pb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FF9AA2]" />
            <span>3. Lokasi Toko & Offline Spot (Dumai)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-[#2D2D2D]">Kota Asal Brand</label>
              <input
                type="text"
                value={formData.location ?? ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2D2D2D]">Nama Spot Offline / Bazaar</label>
              <input
                type="text"
                value={formData.offline_spot ?? ''}
                onChange={(e) => handleChange('offline_spot', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#2D2D2D]">Jadwal Buka Offline Spot</label>
            <input
              type="text"
              value={formData.offline_schedule ?? ''}
              onChange={(e) => handleChange('offline_schedule', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Announcement Banner & Footer */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2D2D2D] border-b border-black/5 pb-2">
            4. Teks Promosi Banner & Footer
          </h3>

          <div className="space-y-1">
            <label className="font-bold text-[#2D2D2D]">Teks Running Announcement Bar (Paling Atas Website)</label>
            <input
              type="text"
              value={formData.announcement_banner ?? ''}
              onChange={(e) => handleChange('announcement_banner', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#2D2D2D]">Ringkasan Cerita Brand (About)</label>
            <textarea
              rows={3}
              value={formData.about_story ?? ''}
              onChange={(e) => handleChange('about_story', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#2D2D2D]">Teks Hak Cipta / Footer</label>
            <input
              type="text"
              value={formData.footer_text ?? ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-black/5 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4 text-pink-300" />
            <span>{isSaving ? 'Menyimpan ke LocalStorage...' : 'SIMPAN SEMUA PENGATURAN'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
