import React, { useState, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  Sparkles, 
  Gift, 
  CreditCard, 
  QrCode, 
  Upload, 
  Camera,
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Crop
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatIDR, createWhatsAppLink, compressImageFile, isQuotaExceededError, safeString, safeTrim, safeToLowerCase, hardCompressImage, getImageSizeInKB } from '../../lib/utils';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ImageCropModal, AspectRatioOption } from '../common/ImageCropModal';
import { Order } from '../../types';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToShop: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onNavigateToShop }) => {
  const { 
    cart, 
    removeFromCart, 
    updateCartQty, 
    cartSubtotal, 
    clearCart,
    paymentSettings,
    createOrderLocal,
    settings 
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'whatsapp'>('bank_transfer');
  const [proofImage, setProofImage] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [previewQris, setPreviewQris] = useState(false);

  // Submission state & Success modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    total: number;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
    isQuotaFallback?: boolean;
    waUrl?: string;
  } | null>(null);

  const [previewProofModal, setPreviewProofModal] = useState<string | null>(null);
  const [cropProofModalOpen, setCropProofModalOpen] = useState(false);
  const [cropProofSrc, setCropProofSrc] = useState<string | null>(null);

  const proofInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const FREE_GIFT_THRESHOLD = 50000;
  const remainingForGift = Math.max(0, FREE_GIFT_THRESHOLD - cartSubtotal);
  const giftProgress = Math.min(100, (cartSubtotal / FREE_GIFT_THRESHOLD) * 100);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingProof(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result as string;
      if (!result) {
        setUploadingProof(false);
        return;
      }

      // Open Crop Modal immediately so user can crop transfer proof receipt
      setCropProofSrc(result);
      setCropProofModalOpen(true);
      setUploadingProof(false);
    };

    reader.onerror = () => {
      setErrorMsg('Gagal membaca file gambar. Silakan coba pilih foto lain.');
      setUploadingProof(false);
    };

    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleProofCropComplete = async (croppedBase64: string) => {
    setUploadingProof(true);
    setErrorMsg('');
    try {
      // Compress cropped image with high efficiency: max 800px, JPEG 0.5, target < 120 KB
      const compressed = await hardCompressImage(croppedBase64, 800, 0.5, 120);
      setProofImage(compressed);
    } catch (err) {
      console.warn('Canvas compression error, using cropped base64 directly:', err);
      setProofImage(croppedBase64);
    } finally {
      setCropProofModalOpen(false);
      setCropProofSrc(null);
      setUploadingProof(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeCustName = safeTrim(customerName);
    const safeCustPhone = safeTrim(customerPhone);
    const safeCustAddress = safeTrim(customerAddress);
    const safeOrderNotes = safeTrim(orderNotes);
    const safeMethod = safeString(paymentMethod) === 'whatsapp' ? 'whatsapp' : 'bank_transfer';

    if (!safeCustName) {
      setErrorMsg('Mohon isi nama lengkap kamu.');
      return;
    }
    if (!safeCustPhone || safeCustPhone.length < 8) {
      setErrorMsg('Mohon isi nomor WhatsApp yang valid.');
      return;
    }

    // Strict validation: Proof of payment is MANDATORY for Bank Transfer & QRIS
    if (safeMethod === 'bank_transfer' && !proofImage) {
      setErrorMsg('Wajib mengunggah foto bukti pembayaran (struk transfer bank / scan QRIS) untuk menyelesaikan pesanan.');
      proofInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    let createdOrder: Order | null = null;
    let isQuotaFallback = false;

    try {
      // 1. Create order in Firestore & LocalStorage
      createdOrder = await createOrderLocal({
        customer_name: safeCustName,
        customer_whatsapp: safeCustPhone,
        customer_address: safeCustAddress,
        order_notes: safeOrderNotes,
        payment_method: safeMethod,
        payment_proof: proofImage || undefined,
        payment_proof_url: proofImage || undefined,
      });
    } catch (err: any) {
      // Automatic Fallback when Firestore Quota is full/exceeded
      const errMsg = safeToLowerCase(err instanceof Error ? err.message : err?.message || err);
      const errCode = safeToLowerCase((err as any)?.code);

      if (
        isQuotaExceededError(err) ||
        errMsg.includes('quota') ||
        errMsg.includes('exceeded') ||
        errMsg.includes('resource-exhausted') ||
        errCode.includes('quota') ||
        errCode.includes('resource-exhausted')
      ) {
        console.warn('[Checkout Quota Fallback] Firestore Quota Exceeded. Directing order to WhatsApp Admin:', err);
        isQuotaFallback = true;
        const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
        createdOrder = {
          id: newOrderId,
          customer_name: safeCustName,
          customer_whatsapp: safeCustPhone,
          customer_address: safeCustAddress || 'Dumai (Ambil di tempat / Kirim)',
          items: cart.map((item) => ({
            product_id: safeString(item?.product?.id || 'prod-custom'),
            product_name: safeString(item?.product?.name || 'Aksesoris DISSOF'),
            price: Number(item?.product?.price) || 0,
            quantity: Number(item?.quantity) || 1,
            variant: item?.selectedVariant ? safeString(item.selectedVariant) : undefined,
            custom_note: item?.customNote ? safeString(item.customNote) : undefined,
            image: item?.product?.images?.[0] ? safeString(item.product.images[0]) : undefined,
          })) as any,
          subtotal: Number(cartSubtotal) || 0,
          total: Number(cartSubtotal) || 0,
          order_notes: safeOrderNotes,
          notes: safeOrderNotes,
          source: 'online',
          payment_method: safeMethod,
          payment_proof: proofImage || undefined,
          payment_proof_url: proofImage || undefined,
          status: 'Pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        const readableErr = safeString(err?.message || err) || 'Gagal memproses pesanan. Silakan coba lagi.';
        setErrorMsg(readableErr);
        setIsSubmitting(false);
        return;
      }
    }

    if (!createdOrder) {
      setErrorMsg('Gagal memproses pesanan. Silakan coba lagi.');
      setIsSubmitting(false);
      return;
    }

    // 2. Confetti celebration
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F472B6', '#FB7185', '#C084FC', '#FDE047', '#A7F3D0'],
    });

    // 3. Prepare formatted WhatsApp Order Message
    let itemsText = '';
    cart.forEach((item, index) => {
      const prodName = safeString(item?.product?.name || 'Aksesoris');
      const prodPrice = Number(item?.product?.price) || 0;
      const qty = Number(item?.quantity) || 1;
      itemsText += `${index + 1}. *${prodName}*\n`;
      if (item.selectedVariant) {
        itemsText += `   • Varian: ${safeString(item.selectedVariant)}\n`;
      }
      if (item.customNote) {
        itemsText += `   • Inisial/Catatan: ${safeString(item.customNote)}\n`;
      }
      itemsText += `   • Jumlah: ${qty} pcs x ${formatIDR(prodPrice)} = *${formatIDR(prodPrice * qty)}*\n\n`;
    });

    const waNumber = safeString(settings?.whatsapp_number) || '6282284901234';
    const isTransfer = safeMethod === 'bank_transfer';
    const msg = `Halo ${safeString(settings?.brand_name) || 'DISSOF.ID'} ♡\nSaya ingin memesan order *#${createdOrder.id}*:\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Data Pemesan:*\n` +
      `• Nama: ${safeCustName}\n` +
      `• No. HP / WA: ${safeCustPhone}\n` +
      (safeCustAddress ? `• Alamat: ${safeCustAddress}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🛍️ *Daftar Item:*\n` +
      itemsText +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total:* *${formatIDR(cartSubtotal)}*\n` +
      (safeOrderNotes ? `📝 *Catatan:* ${safeOrderNotes}\n` : '') +
      `💳 *Metode:* ${isTransfer ? 'Transfer Bank / QRIS (Bukti Transfer Siap Dikirim)' : 'Checkout WhatsApp'}\n` +
      (isQuotaFallback ? `⚡ *Status:* Konfirmasi Langsung via WhatsApp\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Mohon proses pesanan saya ya kak ♡`;

    const waUrl = createWhatsAppLink(waNumber, msg);

    // Auto open WhatsApp on WhatsApp method OR when Quota Fallback is triggered
    if (safeMethod === 'whatsapp' || isQuotaFallback) {
      window.open(waUrl, '_blank');
    }

    // 4. Set order success state
    setOrderSuccess({
      orderId: createdOrder.id,
      total: cartSubtotal,
      paymentMethod: safeMethod === 'bank_transfer' ? 'Transfer Bank / QRIS' : 'WhatsApp Checkout',
      customerName: safeCustName,
      customerPhone: safeCustPhone,
      isQuotaFallback,
      waUrl,
    });

    // 5. Clear cart
    clearCart();
    setIsSubmitting(false);
  };

  const handleCloseAfterSuccess = () => {
    setOrderSuccess(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setOrderNotes('');
    setProofImage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => {
          if (orderSuccess) handleCloseAfterSuccess();
          else onClose();
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#FFFDFB] shadow-2xl flex flex-col border-l border-black/5 animate-drawer-right h-full max-h-[100dvh] overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#F9F7F2] border-b border-black/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ♡
              </div>
              <div>
                <h3 className="font-playfair font-bold text-base text-[#2D2D2D]">
                  {orderSuccess ? 'Pesanan Diterima!' : 'Keranjang Belanja'}
                </h3>
                <span className="text-[11px] text-[#A08C8C] font-semibold">
                  {orderSuccess ? 'Order Berhasil Dibuat' : `${cart.length} item dipilih`}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (orderSuccess) handleCloseAfterSuccess();
                else onClose();
              }}
              className="p-1.5 rounded-full text-gray-400 hover:text-[#2D2D2D] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Screen if Order Placed */}
          {orderSuccess ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-between text-center space-y-6">
              <div className="space-y-4 my-auto">
                <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm animate-bounce">
                  <Check className="w-10 h-10 text-emerald-600 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-playfair text-2xl font-bold text-[#2D2D2D]">
                    Terima Kasih, {orderSuccess.customerName}! ♡
                  </h3>
                  <p className="text-xs text-[#7A6A61] max-w-sm mx-auto">
                    Pesanan kamu telah berhasil dicatat dan masuk ke sistem kami.
                  </p>
                </div>

                {/* Quota Fallback Banner Notice */}
                {orderSuccess.isQuotaFallback && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">Sistem sedang sibuk</p>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Pesanan kamu akan diteruskan langsung ke WhatsApp Admin untuk dikonfirmasi.
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Summary Card */}
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-pink-100 text-left text-xs space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                    <span className="text-gray-500">Nomor Pesanan:</span>
                    <span className="font-mono font-bold text-pink-600 text-sm">#{orderSuccess.orderId}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                    <span className="text-gray-500">Total Pembayaran:</span>
                    <span className="font-bold text-sm text-[#2D2D2D] font-playfair">{formatIDR(orderSuccess.total)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                    <span className="text-gray-500">Metode:</span>
                    <span className="font-bold text-[#2D2D2D]">{orderSuccess.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Menunggu Verifikasi
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100 text-[11px] text-pink-800 text-center">
                  ✨ Tim handmade DISSOF Dumai akan segera memverifikasi dan menyiapkan pesananmu dengan penuh cinta!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 pt-4">
                <a
                  href={createWhatsAppLink(
                    settings?.whatsapp_number || '6282284901234',
                    `Halo admin ${settings?.brand_name || 'DISSOF.ID'} ♡ Saya sudah order dengan No. Pesanan #${orderSuccess.orderId} senilai ${formatIDR(orderSuccess.total)} atas nama ${orderSuccess.customerName}. Mohon dicek ya kak!`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Konfirmasi ke WhatsApp Admin</span>
                </a>

                <button
                  type="button"
                  onClick={handleCloseAfterSuccess}
                  className="w-full py-3 px-4 rounded-full bg-[#FAF7F2] hover:bg-pink-50 text-[#63534B] font-bold text-xs border border-pink-200 transition-colors"
                >
                  Lanjut Belanja Aksesoris Lainnya
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Free Gift Progress Indicator */}
              <div className="bg-[#FFEFF1] px-5 py-3 border-b border-[#FFD1DC] text-xs shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#2D2D2D] flex items-center gap-1.5 text-[11px]">
                    <Gift className="w-3.5 h-3.5 text-[#FF9AA2]" />
                    {remainingForGift === 0 ? (
                      <span className="text-[#FF9AA2]">Hore! Kamu dapat Free Cute Gift Box & Pouch ♡</span>
                    ) : (
                      <span>Belanja <b>{formatIDR(remainingForGift)}</b> lagi untuk Free Gift Pouch!</span>
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-[#FF9AA2]">{Math.round(giftProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF9AA2] rounded-full transition-all duration-500"
                    style={{ width: `${giftProgress}%` }}
                  />
                </div>
              </div>

              {/* Cart Items List or Empty State */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                    <div className="w-16 h-16 rounded-full bg-[#FFEFF1] text-[#FF9AA2] flex items-center justify-center text-2xl shadow-xs">
                      🛍️
                    </div>
                    <h4 className="font-playfair font-bold text-base text-[#2D2D2D]">
                      Keranjangmu masih kosong
                    </h4>
                    <p className="text-xs text-[#A08C8C] max-w-xs">
                      Yuk jelajahi koleksi gelang charm, phone strap, dan kalung lucu di toko kami!
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToShop();
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                    >
                      Mulai Belanja ♡
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Item Cards */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={`${item.product.id}-${item.selectedVariant || 'default'}-${item.customNote || ''}`}
                          className="bg-[#F9F7F2] rounded-2xl p-3.5 border border-black/5 flex gap-3 shadow-2xs"
                        >
                          <ImageWithFallback
                            src={item.product.images?.[0]}
                            alt={item.product.name}
                            className="w-16 h-16 rounded-xl object-cover border border-black/5 shrink-0 bg-white"
                          />

                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-xs text-[#2D2D2D] line-clamp-1">
                                  {item.product.name}
                                </h4>
                                {item.selectedVariant && (
                                  <span className="text-[10px] text-[#A08C8C] block">
                                    Varian: {item.selectedVariant}
                                  </span>
                                )}
                                {item.customNote && (
                                  <span className="text-[10px] text-[#FF9AA2] font-semibold block">
                                    Request: "{item.customNote}"
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => removeFromCart(item.product.id, item.selectedVariant, item.customNote)}
                                className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer"
                                title="Hapus dari keranjang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-1.5">
                              <span className="font-bold text-xs text-[#FF9AA2]">
                                {formatIDR(item.product.price * item.quantity)}
                              </span>

                              {/* Stepper */}
                              <div className="flex items-center bg-white rounded-lg border border-black/10 p-0.5">
                                <button
                                  onClick={() => updateCartQty(item.product.id, item.quantity - 1, item.selectedVariant, item.customNote)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-xs text-[#2D2D2D] hover:bg-[#F9F7F2] cursor-pointer"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-[#2D2D2D]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQty(item.product.id, item.quantity + 1, item.selectedVariant, item.customNote)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-xs text-[#2D2D2D] hover:bg-[#F9F7F2] cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Checkout Details Form */}
                    <form onSubmit={handleCheckout} className="space-y-4 pt-3 border-t border-black/5 text-xs">
                      
                      {/* Subtotal */}
                      <div className="flex items-center justify-between bg-[#FAF7F2] p-3 rounded-2xl border border-pink-100">
                        <span className="text-[#7A6A61] uppercase tracking-wider font-bold text-[11px]">Total Belanja</span>
                        <span className="font-bold text-lg text-pink-600 font-playfair">
                          {formatIDR(cartSubtotal)}
                        </span>
                      </div>

                      {/* Customer info fields */}
                      <div className="space-y-2">
                        <span className="font-bold text-xs text-[#2D2D2D] block">1. Data Penerima</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nama Lengkap *"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-2 focus:ring-pink-400 focus:bg-white"
                          />
                          <input
                            type="tel"
                            required
                            placeholder="No. WhatsApp (08... / 62...) *"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-2 focus:ring-pink-400 focus:bg-white"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Alamat Pengiriman (Dumai / Luar Kota / Ambil di Pop-Up)"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-2 focus:ring-pink-400 focus:bg-white"
                        />

                        <input
                          type="text"
                          placeholder="Catatan pesanan / request kartu ucapan (opsional)"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#F9F7F2] text-xs focus:ring-2 focus:ring-pink-400 focus:bg-white"
                        />
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-2 pt-2">
                        <span className="font-bold text-xs text-[#2D2D2D] block">2. Metode Pembayaran</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              paymentMethod === 'bank_transfer'
                                ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-xs'
                                : 'bg-[#FAF7F2] border-black/5 text-[#63534B] hover:bg-pink-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <CreditCard className="w-4 h-4 text-pink-500" />
                              {paymentMethod === 'bank_transfer' && (
                                <div className="w-3.5 h-3.5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px]">
                                  ✓
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-[11px]">Transfer Bank / QRIS</span>
                            <span className="text-[9px] opacity-75">Upload bukti bayar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('whatsapp')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              paymentMethod === 'whatsapp'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                                : 'bg-[#FAF7F2] border-black/5 text-[#63534B] hover:bg-emerald-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <MessageCircle className="w-4 h-4 text-emerald-600" />
                              {paymentMethod === 'whatsapp' && (
                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">
                                  ✓
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-[11px]">Checkout via WhatsApp</span>
                            <span className="text-[9px] opacity-75">Chat admin langsung</span>
                          </button>
                        </div>
                      </div>

                      {/* Bank Details & QRIS & Proof Upload Box */}
                      {paymentMethod === 'bank_transfer' && (
                        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-pink-200 space-y-3 animate-in fade-in duration-200">
                          
                          {/* Bank Card Info */}
                          <div className="bg-gradient-to-tr from-[#2D2D2D] to-[#4A3D36] text-white p-3.5 rounded-xl shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-[10px] opacity-80">
                              <span>{paymentSettings.bank_name || 'BCA (Bank Central Asia)'}</span>
                              <span className="text-pink-300 font-bold">REKENING RESMI</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-pink-100">
                                {paymentSettings.account_number || '8280-9912-3456'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyAccount(paymentSettings.account_number || '8280-9912-3456')}
                                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedBank ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedBank ? 'Tersalin' : 'Salin Rekening'}</span>
                              </button>
                            </div>

                            <div className="text-[10px]">
                              <span className="opacity-70">A/N: </span>
                              <span className="font-bold">{paymentSettings.account_holder || 'DISSOF ACCESSORIES'}</span>
                            </div>
                          </div>

                          {/* QRIS section if exists */}
                          {paymentSettings.qris_image && (
                            <div className="bg-white p-3 rounded-xl border border-pink-100 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-pink-50 p-1 border border-pink-200 shrink-0">
                                  <ImageWithFallback
                                    src={paymentSettings.qris_image}
                                    alt="QRIS thumbnail"
                                    className="w-full h-full object-contain rounded"
                                  />
                                </div>
                                <div className="text-[11px]">
                                  <span className="font-bold text-[#2D2D2D] block">QRIS Tersedia</span>
                                  <span className="text-[10px] text-gray-500">Scan via Semua E-Wallet & M-Banking</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setPreviewQris(true)}
                                className="px-3 py-1.5 rounded-xl bg-pink-100 text-pink-700 font-bold text-[10px] hover:bg-pink-200 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Lihat Barcode QRIS</span>
                              </button>
                            </div>
                          )}

                          {/* Proof of Transfer Upload */}
                          <div className="space-y-2 pt-1 border-t border-pink-100/80 mt-2">
                            <input
                              type="file"
                              id="qris-proof-input"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleProofChange}
                              disabled={uploadingProof}
                            />

                            <div className="flex items-center justify-between">
                              <label className="font-bold text-[11px] text-[#2D2D2D] flex items-center gap-1.5">
                                <span>Bukti Transfer / QRIS</span>
                                <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 text-[9px] font-extrabold uppercase tracking-wider">
                                  Wajib Diisi *
                                </span>
                              </label>
                              {proofImage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setProofImage('');
                                  }}
                                  className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus Foto</span>
                                </button>
                              )}
                            </div>

                            {proofImage ? (
                              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-3.5 space-y-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="relative group shrink-0">
                                    <ImageWithFallback
                                      src={proofImage}
                                      alt="Bukti Transfer"
                                      onClick={() => setPreviewProofModal(proofImage)}
                                      className="w-18 h-18 rounded-xl object-cover border-2 border-emerald-300 shadow-xs cursor-pointer hover:opacity-90 transition-opacity bg-white"
                                    />
                                    <div 
                                      onClick={() => setPreviewProofModal(proofImage)}
                                      className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Foto Bukti Berhasil Dimuat!</span>
                                    </p>
                                    <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                                      Telah dikompresi otomatis &amp; siap diverifikasi admin.
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewProofModal(proofImage)}
                                        className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Perbesar</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCropProofSrc(proofImage);
                                          setCropProofModalOpen(true);
                                        }}
                                        className="text-[10px] font-bold text-pink-700 hover:text-pink-800 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-pink-200 shadow-2xs"
                                      >
                                        <Crop className="w-3 h-3 text-pink-600" />
                                        <span>Crop Foto</span>
                                      </button>

                                      <label
                                        htmlFor="qris-proof-input"
                                        style={{ cursor: 'pointer' }}
                                        className="text-[10px] font-bold text-[#63534B] hover:text-black flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-black/10 shadow-2xs"
                                      >
                                        <Upload className="w-3 h-3 text-pink-500" />
                                        <span>{uploadingProof ? 'Mengompres...' : 'Ganti Foto'}</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label
                                  htmlFor="qris-proof-input"
                                  style={{ cursor: 'pointer', display: 'block' }}
                                  className="border-2 border-dashed border-pink-300 hover:border-pink-500 bg-white rounded-2xl p-4.5 text-center transition-all hover:bg-pink-50/40 group shadow-2xs"
                                >
                                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform mx-auto mb-2">
                                    <Upload className="w-5 h-5" />
                                  </div>
                                  <p className="text-xs font-bold text-pink-700">
                                    {uploadingProof ? 'Mengompres Foto (Maks 800px)...' : 'Klik untuk Pilih dari Galeri HP / Kamera'}
                                  </p>
                                  <span className="text-[10px] text-[#A08C8C] block mt-1">
                                    Ambil struk ATM, scan QRIS, atau m-Banking (otomatis dikompres &lt; 150 KB)
                                  </span>
                                </label>

                                <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>Wajib melampirkan foto struk/screenshot pembayaran sebelum konfirmasi pesanan.</span>
                                </p>
                              </div>
                            )}
                          </div>

                          {paymentSettings.instructions && (
                            <p className="text-[10px] text-[#7A6A61] leading-relaxed pt-1">
                              💡 {paymentSettings.instructions}
                            </p>
                          )}
                        </div>
                      )}

                      {errorMsg && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl font-medium flex items-center gap-1.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        {paymentMethod === 'bank_transfer' ? (
                          <button
                            type="submit"
                            disabled={isSubmitting || uploadingProof || !proofImage}
                            className={`w-full py-3.5 px-4 rounded-full font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 ${
                              !proofImage
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                : 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                            }`}
                          >
                            <Check className={`w-4 h-4 ${!proofImage ? 'text-gray-400' : 'text-white'}`} />
                            <span>
                              {isSubmitting
                                ? 'Menyimpan Pesanan...'
                                : uploadingProof
                                ? 'Memproses Foto...'
                                : !proofImage
                                ? 'Unggah Bukti Foto Terlebih Dahulu'
                                : 'UNGGAH BUKTI & SELESAIKAN PESANAN ♡'}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-200" />
                            <span>{isSubmitting ? 'Membuka WhatsApp...' : 'CHECKOUT VIA WHATSAPP ♡'}</span>
                          </button>
                        )}
                      </div>

                    </form>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Proof Lightbox Zoom Modal for Buyer */}
      {previewProofModal && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewProofModal(null)}
        >
          <div className="max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="font-bold text-xs text-[#2D2D2D]">Foto Bukti Pembayaran Terunggah</span>
              <button onClick={() => setPreviewProofModal(null)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto rounded-2xl bg-[#F9F7F2] p-2 flex items-center justify-center">
              <ImageWithFallback
                src={previewProofModal}
                alt="Pratinjau Bukti Pembayaran"
                className="w-full h-auto max-h-[60vh] object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewProofModal(null)}
                className="px-4 py-2 bg-[#2D2D2D] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Modal Zoom */}
      {previewQris && paymentSettings.qris_image && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewQris(false)}
        >
          <div className="max-w-xs w-full bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#2D2D2D]">{paymentSettings.qris_label || 'QRIS DISSOF.ID'}</span>
              <button onClick={() => setPreviewQris(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-56 h-56 mx-auto bg-white p-2 border border-pink-100 rounded-2xl shadow-inner flex items-center justify-center">
              <ImageWithFallback
                src={paymentSettings.qris_image}
                alt="QRIS Barcode"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Scan barcode dengan BCA, Mandiri, BRI, GoPay, DANA, dll.</p>
            <button
              onClick={() => setPreviewQris(false)}
              className="w-full py-2 bg-[#2D2D2D] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Image Crop Modal for Transfer Proof */}
      {cropProofModalOpen && cropProofSrc && (
        <ImageCropModal
          isOpen={true}
          imageSrc={cropProofSrc}
          title="Crop & Sesuaikan Bukti Transfer / QRIS"
          description="Sesuaikan bingkai agar nominal, nomor referensi, dan tanggal transfer terlihat jelas."
          defaultAspect={undefined}
          aspectOptions={[
            { label: 'Bebas', value: undefined, badge: 'Free Crop' },
            { label: '4:3 Normal', value: 4 / 3, badge: 'Struk ATM' },
            { label: '1:1 Persegi', value: 1, badge: 'Square' },
            { label: '16:9 Wide', value: 16 / 9, badge: 'Landscape' },
          ]}
          onCropComplete={handleProofCropComplete}
          onClose={() => {
            setCropProofModalOpen(false);
            setCropProofSrc(null);
          }}
        />
      )}

    </div>
  );
};
