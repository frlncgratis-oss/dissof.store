import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Upload, 
  Check, 
  AlertCircle, 
  Save, 
  Building2, 
  User, 
  Hash, 
  Image as ImageIcon, 
  X, 
  Eye, 
  Copy, 
  Sparkles,
  Info,
  Crop,
  MessageCircle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PaymentSettings } from '../../types';
import { compressImageFile, createWhatsAppLink, getStoredWhatsAppNumber } from '../../lib/utils';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { ImageCropModal } from '../../components/common/ImageCropModal';
import { UniversalImageUploader } from '../../components/common/UniversalImageUploader';

const BANK_PRESETS = [
  'BCA (Bank Central Asia)',
  'Bank Mandiri',
  'BRI (Bank Rakyat Indonesia)',
  'BNI (Bank Negara Indonesia)',
  'Bank Syariah Indonesia (BSI)',
  'SeaBank',
  'Bank Jago',
  'GoPay / DANA / OVO / ShopeePay',
];

export const AdminPaymentSettingsPage: React.FC = () => {
  const { paymentSettings, savePaymentSettings, settings, updateWhatsAppNumberLocal } = useStore();

  const [bankName, setBankName] = useState(paymentSettings.bank_name || 'BCA (Bank Central Asia)');
  const [accountNumber, setAccountNumber] = useState(paymentSettings.account_number || '');
  const [accountHolder, setAccountHolder] = useState(paymentSettings.account_holder || '');
  const [whatsappNumber, setWhatsappNumber] = useState(paymentSettings.whatsapp_number || settings?.whatsapp_number || getStoredWhatsAppNumber() || '6282284901234');
  const [qrisLabel, setQrisLabel] = useState(paymentSettings.qris_label || 'QRIS DISSOF.ID');
  const [qrisImage, setQrisImage] = useState(paymentSettings.qris_image || '');
  const [instructions, setInstructions] = useState(
    paymentSettings.instructions || 
    '1. Transfer sesuai nominal total belanja ke Rekening / scan QRIS di atas.\n2. Simpan struk / screenshot bukti transfer.\n3. Unggah foto bukti transfer di bawah ini lalu klik tombol "Konfirmasi & Selesaikan Pesanan".'
  );
  const [isEnabled, setIsEnabled] = useState(paymentSettings.is_enabled !== false);
  const [notes, setNotes] = useState(
    paymentSettings.notes || 'Pesanan kamu akan langsung terverifikasi dan diproses oleh pengrajin DISSOF Dumai ♡'
  );

  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // QRIS Crop Modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paymentSettings) {
      if (paymentSettings.bank_name) setBankName(paymentSettings.bank_name);
      if (paymentSettings.account_number) setAccountNumber(paymentSettings.account_number);
      if (paymentSettings.account_holder) setAccountHolder(paymentSettings.account_holder);
      if (paymentSettings.whatsapp_number) setWhatsappNumber(paymentSettings.whatsapp_number);
      else if (settings?.whatsapp_number) setWhatsappNumber(settings.whatsapp_number);
      if (paymentSettings.qris_label) setQrisLabel(paymentSettings.qris_label);
      if (paymentSettings.qris_image) setQrisImage(paymentSettings.qris_image);
      if (paymentSettings.instructions) setInstructions(paymentSettings.instructions);
      if (paymentSettings.is_enabled !== undefined) setIsEnabled(paymentSettings.is_enabled);
      if (paymentSettings.notes) setNotes(paymentSettings.notes);
    }
  }, [paymentSettings, settings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setQrisImage(croppedBase64);
    setCropModalOpen(false);
    setCropImageSrc(null);
  };

  const handleOpenCropExisting = () => {
    if (!qrisImage) return;
    setCropImageSrc(qrisImage);
    setCropModalOpen(true);
  };

  const handleRemoveQrisImage = () => {
    setQrisImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setErrorMsg('Nama Bank wajib diisi.');
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMsg('Nomor Rekening wajib diisi.');
      return;
    }
    if (!accountHolder.trim()) {
      setErrorMsg('Nama Pemilik Rekening wajib diisi.');
      return;
    }
    if (!whatsappNumber.trim()) {
      setErrorMsg('Nomor WhatsApp Admin wajib diisi.');
      return;
    }

    const payload: PaymentSettings = {
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      account_holder: accountHolder.trim(),
      whatsapp_number: whatsappNumber.trim(),
      qris_label: qrisLabel.trim(),
      qris_image: qrisImage.trim() || undefined,
      instructions: instructions.trim(),
      is_enabled: isEnabled,
      notes: notes.trim(),
    };

    try {
      await savePaymentSettings(payload);
      if (whatsappNumber.trim()) {
        updateWhatsAppNumberLocal(whatsappNumber.trim());
      }
      setErrorMsg('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan pembayaran.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testWaUrl = createWhatsAppLink(
    whatsappNumber || '6282284901234',
    `Halo Admin ${settings?.brand_name || 'DISSOF.ID'} ♡ Ini pesan uji coba nomor WhatsApp pembayaran.`
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/80 text-pink-700 text-[11px] font-bold mb-1 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Sistem Pembayaran &amp; Kontak Toko</span>
          </div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Pengaturan Pembayaran &amp; WhatsApp ♡
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Atur rekening bank, nama pemilik, barcode QRIS, dan nomor WhatsApp admin yang tersinkronisasi otomatis ke Cloud Firestore.
          </p>
        </div>

        {/* Real-time sync badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0 shadow-2xs">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Real-Time Firestore Sync Aktif</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">
            Pengaturan pembayaran &amp; WhatsApp berhasil disimpan permanen ke Cloud Firestore! Otomatis langsung berubah di seluruh HP pembeli.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-sm space-y-5">
            
            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-2xl border border-pink-100">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-[#2E241E] block">Status Metode Transfer &amp; QRIS</span>
                <span className="text-[11px] text-[#7A6A61]">
                  {isEnabled ? 'Aktif: Customer dapat memilih opsi Transfer Bank / QRIS di keranjang' : 'Nonaktif: Customer hanya bisa checkout via WhatsApp'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isEnabled ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${
                    isEnabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* WhatsApp Admin Number */}
            <div className="space-y-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-[#2E241E] flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nomor WhatsApp Admin Penerima Pesanan <span className="text-rose-500">*</span></span>
                </label>
                <a
                  href={testWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-700 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Tes Buka Chat WA</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: 6282284901234 atau 082284901234"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 bg-white text-xs font-mono font-bold text-[#2D2D2D] focus:ring-2 focus:ring-emerald-400"
              />
              <p className="text-[11px] text-[#6E5A4E]">
                Nomor ini digunakan untuk tombol WhatsApp checkout, konfirmasi otomatis, dan tombol chat customer di semua halaman.
              </p>
            </div>

            {/* Bank Selection & Name */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-[#2E241E] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-pink-500" />
                <span>Nama Bank / E-Wallet <span className="text-rose-500">*</span></span>
              </label>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {BANK_PRESETS.slice(0, 5).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBankName(preset)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      bankName === preset
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-[#FAF7F2] text-[#63534B] border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    {preset.split(' ')[0]}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                placeholder="Contoh: BCA (Bank Central Asia) atau SeaBank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Account Number & Holder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-[#2E241E] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-pink-500" />
                  <span>Nomor Rekening <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 8280123456"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 bg-[#FAF7F2] text-xs font-mono font-bold text-pink-600 focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-[#2E241E] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pink-500" />
                  <span>Atas Nama (Pemilik) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: DISSOF ACCESSORIES"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {/* QRIS Upload & Label */}
            <div className="space-y-3 pt-2 border-t border-pink-100">
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-[#2E241E] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-pink-500" />
                  <span>Label & Judul QRIS:</span>
                </label>
                <input
                  type="text"
                  placeholder="Label QRIS (contoh: QRIS DISSOF.ID - Semua E-Wallet & M-Banking)"
                  value={qrisLabel}
                  onChange={(e) => setQrisLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-pink-200 bg-[#FAF7F2] text-xs focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <UniversalImageUploader
                label="Foto Barcode QRIS Toko"
                sublabel="Pilih foto QRIS dari galeri HP / Kamera. Otomatis dikompres &lt; 150 KB untuk checkout cepat."
                currentImage={qrisImage}
                onImageChange={(data) => setQrisImage(data)}
                onImageRemove={() => setQrisImage('')}
                aspectRatioLabel="Rasio 1:1 Persegi"
                previewHeightClass="h-44 sm:h-52"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-1.5 pt-2 border-t border-pink-100">
              <label className="font-bold text-xs text-[#2E241E] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-pink-500" />
                <span>Petunjuk / Instruksi Pembayaran untuk Pembeli</span>
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instruksi transfer..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 bg-[#FAF7F2] text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-[#2E241E]">
                Catatan Footer Pembayaran (opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pesanan kamu akan langsung diproses tim..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 bg-[#FAF7F2] text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-pink-300" />
                <span>SIMPAN KE FIRESTORE (REAL-TIME)</span>
              </button>
            </div>

          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-pink-600" />
            <h3 className="font-bold text-xs text-[#2E241E] uppercase tracking-wider">
              Live Preview di Checkout Pembeli
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-pink-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  💳
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#2E241E]">{bankName || 'Transfer Bank'}</h4>
                  <span className="text-[10px] text-pink-600 font-semibold">Metode Pembayaran Utama</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                {isEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {/* Bank Card Graphic */}
            <div className="bg-gradient-to-tr from-[#2D2D2D] to-[#4A3D36] text-white p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between text-[11px] opacity-80">
                <span>{bankName || 'BANK TRANSFER'}</span>
                <span>DISSOF.ID</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-pink-300">Nomor Rekening</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold tracking-wider">
                    {accountNumber || '8280-XXXX-XXXX'}
                  </span>
                  {accountNumber && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountNumber)}
                      className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-1 text-[11px]">
                <span className="text-[10px] opacity-70 block">Atas Nama:</span>
                <span className="font-bold">{accountHolder || 'NAMA PEMILIK'}</span>
              </div>
            </div>

            {/* QRIS Graphic Preview */}
            {qrisImage && (
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-pink-100 text-center space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
                    <QrCode className="w-4 h-4" />
                    <span>{qrisLabel || 'Scan QRIS untuk Bayar'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCropExisting}
                    className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-pink-200"
                    title="Crop QRIS"
                  >
                    <Crop className="w-3 h-3 text-pink-600" />
                    <span>Crop Barcode</span>
                  </button>
                </div>
                <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border border-pink-200 shadow-xs flex items-center justify-center overflow-hidden">
                  <ImageWithFallback
                    src={qrisImage}
                    alt="QRIS Barcode"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <p className="text-[10px] text-gray-500">Mendukung BCA, Mandiri, BRI, BNI, GoPay, DANA, OVO, ShopeePay</p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-100 space-y-1 text-[11px] text-[#52443C]">
              <span className="font-bold text-pink-700 block">Petunjuk Pembayaran:</span>
              <p className="whitespace-pre-line leading-relaxed">{instructions}</p>
            </div>

            {notes && (
              <p className="text-[10px] text-center text-[#7A6A61] italic">
                {notes}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* QRIS Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        title="Crop & Rapikan Gambar Barcode QRIS ♡"
        description="Potong bagian barcode QRIS agar pas dan mudah di-scan oleh pembeli."
        defaultAspect={1 / 1}
        cropOptions={{ maxDimension: 800, quality: 0.85 }}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
        }}
      />

    </div>
  );
};
