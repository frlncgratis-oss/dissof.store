import React, { useState, useRef } from 'react';
import { Sparkles, Heart, Wand2, Upload, MessageCircle, Check, Image as ImageIcon, ArrowRight, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { createWhatsAppLink, compressImageFile } from '../lib/utils';
import { BeadVisualizer } from '../components/visualizer/BeadVisualizer';
import confetti from 'canvas-confetti';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE } from '../components/common/ImageWithFallback';
import { CustomRequest } from '../types';

const ACCESSORY_TYPES = [
  'Charm Bracelet',
  'Handmade Beaded Bracelet',
  'Phone Charm / Phone Strap',
  'Beaded Choker / Necklace',
  'Candy Beads Ring Set',
  'Bag Charm / Keychain',
];

const COLOR_THEMES = [
  'Pastel Candy Mix',
  'Sakura Pink & Pearl',
  'Lilac Dream & Violet',
  'Matcha Sage & Cream',
  'Ocean Sky Blue',
  'Butter Sunshine',
];

const CHARM_OPTIONS = [
  { name: 'Heart Pearl', icon: '💖' },
  { name: 'Bow Ribbon', icon: '🎀' },
  { name: 'Gummy Bear', icon: '🧸' },
  { name: 'Daisy Flower', icon: '🌼' },
  { name: 'Star Crystal', icon: '⭐' },
  { name: 'Cherry Charm', icon: '🍒' },
  { name: 'Angel Wings', icon: '🪽' },
  { name: 'Butterfly', icon: '🦋' },
  { name: 'Smile Pastel', icon: '😊' },
  { name: 'Strawberry', icon: '🍓' },
];

export const CustomOrderPage: React.FC = () => {
  const { settings } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [accessoryType, setAccessoryType] = useState(ACCESSORY_TYPES[0]);
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0]);
  const [selectedCharms, setSelectedCharms] = useState<string[]>(['Heart Pearl', 'Bow Ribbon']);
  const [customInitials, setCustomInitials] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [refImageUrl, setRefImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCharm = (charmName: string) => {
    if (selectedCharms.includes(charmName)) {
      setSelectedCharms(selectedCharms.filter((c) => c !== charmName));
    } else {
      if (selectedCharms.length >= 4) {
        alert('Maksimal 4 charm pilihan untuk 1 item custom ya kak ♡');
        return;
      }
      setSelectedCharms([...selectedCharms, charmName]);
    }
  };

  // Asynchronous and compressed photo upload (mobile gallery / camera / PC)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg('');

    try {
      const file = files[0];
      // Compress to optimal dimensions and quality for quick base64 storage
      const compressedDataUrl = await compressImageFile(file, 800, 0.78);
      setRefImageUrl(compressedDataUrl);
    } catch (err: any) {
      console.warn('Image processing warning:', err);
      setErrorMsg(err.message || 'Gagal memproses foto referensi. Silakan gunakan format JPG atau PNG.');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveRefImage = () => {
    setRefImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Mohon isi nama kamu.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMsg('Mohon isi nomor WhatsApp kamu yang aktif (minimal 8 digit).');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const newCustomRequest: CustomRequest = {
        id: `custom-${Date.now()}`,
        customer_name: customerName.trim(),
        customer_whatsapp: customerPhone.trim(),
        accessory_type: accessoryType,
        color_theme: colorTheme,
        charms_selected: selectedCharms,
        custom_initials: customInitials.trim(),
        special_notes: specialNotes.trim(),
        reference_image_url: refImageUrl || undefined,
        status: 'New',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save directly to LocalStorage with key 'customRequests'
      try {
        const savedRaw = localStorage.getItem('customRequests');
        const existingList = savedRaw ? JSON.parse(savedRaw) : [];
        const updatedList = [newCustomRequest, ...(Array.isArray(existingList) ? existingList : [])];
        localStorage.setItem('customRequests', JSON.stringify(updatedList));
      } catch (storageErr) {
        console.warn('LocalStorage save warning:', storageErr);
      }

      // Trigger festive confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F472B6', '#C084FC', '#FDE047', '#A7F3D0', '#7DD3FC'],
      });

      // Construct clean, formatted WhatsApp message
      const waNumber = settings?.whatsapp_number || '6282284901234';
      const charmsList = selectedCharms.length > 0 ? selectedCharms.join(', ') : 'Sesuai rekomendasi admin';
      
      const message = `Halo ${settings?.brand_name || 'DISSOF.ID'} ♡\nSaya ingin submit *Custom Accessories Request*:\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Data Pemesan:*\n` +
        `• Nama: ${customerName.trim()}\n` +
        `• WhatsApp: ${customerPhone.trim()}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `✨ *Detail Custom Accessories:*\n` +
        `• Jenis: *${accessoryType}*\n` +
        `• Nuansa Warna: *${colorTheme}*\n` +
        `• Inisial / Nama: *${customInitials.trim() || '-'}*\n` +
        `• Charm Pilihan: *${charmsList}*\n` +
        (specialNotes.trim() ? `• Request Khusus / Ukuran: ${specialNotes.trim()}\n` : '') +
        (refImageUrl ? `• Foto Referensi: Terlampir / Tersimpan di sistem Dissof\n` : '') +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `Mohon estimasi harga & waktu pengerjaannya ya kak. Makasih banyak ♡`;

      const waUrl = createWhatsAppLink(waNumber, message);

      // Open WhatsApp Admin immediately
      window.location.href = waUrl;

      // Reset form fields
      setCustomerName('');
      setCustomerPhone('');
      setAccessoryType(ACCESSORY_TYPES[0]);
      setColorTheme(COLOR_THEMES[0]);
      setSelectedCharms(['Heart Pearl', 'Bow Ribbon']);
      setCustomInitials('');
      setSpecialNotes('');
      setRefImageUrl('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      console.error('Custom request submission error:', err);
      setErrorMsg(err.message || 'Gagal mengirim custom request. Silakan coba kembali.');
    } finally {
      // Return button status back to normal
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold shadow-xs">
          <Wand2 className="w-3.5 h-3.5" />
          <span>Bikin Aksesoris Impianmu</span>
        </div>
        <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-[#2E241E]">
          Create Your Own ♡
        </h1>
        <p className="text-xs sm:text-base text-[#6E5E56] max-w-xl mx-auto">
          Pilih manik-manik, liontin charm, dan inisial nama yang kamu sukai. Tim pengrajin Dissof.id akan merangkainya secara personal khusus untukmu.
        </p>
      </div>

      {/* Visual Bead String Live Preview */}
      <BeadVisualizer
        accessoryType={accessoryType}
        colorTheme={colorTheme}
        charms={selectedCharms}
        initials={customInitials}
      />

      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">
            Custom request kamu berhasil disimpan dan diarahkan ke WhatsApp Admin! Form telah dikosongkan.
          </span>
        </div>
      )}

      {/* Custom Request Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-pink-100 shadow-md space-y-8">
        
        {/* Step 1: Customer Contact */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2E241E] flex items-center gap-2 border-b border-pink-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">1</span>
            <span>Data Diri Kamu</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A3D36]">
                Nama Kamu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Alya Zahrani"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-400 bg-[#FAF7F2]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A3D36]">
                No. WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081268903344"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-400 bg-[#FAF7F2]"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Accessory Type */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2E241E] flex items-center gap-2 border-b border-pink-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            <span>Pilih Jenis Aksesoris</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ACCESSORY_TYPES.map((type) => {
              const active = accessoryType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setAccessoryType(type)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                    active
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                      : 'bg-[#FAF7F2] text-[#4A3D36] border-pink-100 hover:border-pink-300'
                  }`}
                >
                  <span>{type}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Color Palette Theme */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2E241E] flex items-center gap-2 border-b border-pink-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">3</span>
            <span>Pilih Nuansa Warna Beads</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {COLOR_THEMES.map((theme) => {
              const active = colorTheme === theme;
              return (
                <button
                  type="button"
                  key={theme}
                  onClick={() => setColorTheme(theme)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                    active
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200'
                      : 'bg-[#FAF7F2] text-[#4A3D36] border-pink-100 hover:border-pink-300'
                  }`}
                >
                  <span>{theme}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Charm Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-pink-100 pb-2">
            <h3 className="font-bold text-sm text-[#2E241E] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">4</span>
              <span>Pilih Charm Liontin (Maks. 4)</span>
            </h3>
            <span className="text-xs font-semibold text-pink-600">
              {selectedCharms.length}/4 terpilih
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {CHARM_OPTIONS.map((charm) => {
              const active = selectedCharms.includes(charm.name);
              return (
                <button
                  type="button"
                  key={charm.name}
                  onClick={() => toggleCharm(charm.name)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border text-center cursor-pointer ${
                    active
                      ? 'bg-pink-100 border-pink-400 text-pink-800 shadow-xs'
                      : 'bg-[#FAF7F2] border-pink-100 text-[#574941] hover:border-pink-300'
                  }`}
                >
                  <span className="text-xl">{charm.icon}</span>
                  <span className="text-[11px] leading-tight">{charm.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 5: Initials & Special Request */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2E241E] flex items-center gap-2 border-b border-pink-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">5</span>
            <span>Custom Inisial & Catatan Ukuran</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A3D36]">
                Nama / Inisial Huruf (opsional)
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="Contoh: SARAH ♡ atau A & B"
                value={customInitials}
                onChange={(e) => setCustomInitials(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-400 bg-[#FAF7F2]"
              />
              <p className="text-[10px] text-gray-400">Preview otomatis muncul di string visualizer di atas</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A3D36]">
                Ukuran Pergelangan / Request Khusus
              </label>
              <input
                type="text"
                placeholder="Contoh: Ukuran 15.5cm / Pengen tali elastis"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-400 bg-[#FAF7F2]"
              />
            </div>
          </div>
        </div>

        {/* Step 6: Reference Image Upload */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#2E241E] flex items-center gap-2 border-b border-pink-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">6</span>
            <span>Foto Referensi / Desain yang Kamu Mau (opsional)</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto px-5 py-3 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-[#FAF7F2] text-pink-700 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              <span>{uploadingImage ? 'Mengompres foto...' : 'Unggah Foto Contoh / Pinterest'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>

            {refImageUrl && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl text-xs border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Foto referensi siap disertakan!</span>
                <ImageWithFallback src={refImageUrl} alt="Ref" className="w-8 h-8 rounded-lg object-cover ml-1 border border-emerald-300" />
                <button
                  type="button"
                  onClick={handleRemoveRefImage}
                  className="text-emerald-700 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                  title="Hapus foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">
            {errorMsg}
          </p>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || uploadingImage}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-pink-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>{isSubmitting ? 'MENGIRIM CUSTOM REQUEST...' : 'SUBMIT CUSTOM REQUEST'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-center text-[#7A6A61] mt-2">
            Request kamu akan tersimpan di sistem dan langsung diteruskan ke WhatsApp Admin untuk konfirmasi harga & pembuatan ♡
          </p>
        </div>

      </form>

    </div>
  );
};
