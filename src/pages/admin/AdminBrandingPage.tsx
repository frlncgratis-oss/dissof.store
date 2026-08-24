import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Upload, 
  Trash2, 
  Eye, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw,
  Layers,
  Camera,
  Instagram,
  MapPin,
  MessageCircle,
  Megaphone,
  Radio,
  FileText,
  Save,
  CreditCard,
  QrCode,
  Crop
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { SiteSettings, PaymentSettings } from '../../types';
import { 
  getImageSizeInKB, 
  hardCompressImage, 
  safeString, 
  safeTrim, 
  isQuotaExceededError,
  saveBrandingBackupLocal,
  getBrandingBackupLocal
} from '../../lib/utils';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { ImageCropModal, AspectRatioOption } from '../../components/common/ImageCropModal';

const COLOR_PRESETS = [
  { name: 'Krem Pastel (Bawaan)', hex: '#F9F7F2' },
  { name: 'Soft Blush Pink', hex: '#FFF5F6' },
  { name: 'Pure White (Bersih)', hex: '#FFFFFF' },
  { name: 'Warm Cream Latte', hex: '#FAF5EE' },
  { name: 'Light Rose Marshmallow', hex: '#FDF2F4' },
  { name: 'Soft Sage Matcha', hex: '#F4F7F4' },
  { name: 'Lavender Mist', hex: '#F7F4FA' },
  { name: 'Pale Peach Butter', hex: '#FFF8F2' },
];

interface ActiveCropState {
  keyType: string;
  label: string;
  imageSrc: string;
  defaultAspect?: number;
  aspectOptions?: AspectRatioOption[];
}

export const AdminBrandingPage: React.FC = () => {
  const { 
    settings, 
    saveSettingsLocal, 
    storeLogo, 
    storeHeroBanner, 
    storeBackground,
    saveStoreBackground,
    resetStoreBackground,
    paymentSettings,
    savePaymentSettings,
    isOnlineSynced
  } = useStore();

  const [activeTab, setActiveTab] = useState<'media' | 'content' | 'background'>('media');

  // Race condition flag & ref to prevent onSnapshot from overwriting active form/media edits
  const isSavingRef = useRef<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Local state for instant preview & responsive reactivity
  const [brandingData, setBrandingData] = useState<{
    logoUrl?: string;
    faviconUrl?: string;
    heroBanner?: string;
    eventBanner?: string;
    qrisImage?: string;
    bankAccountImage?: string;
    highlightImage0?: string;
    highlightImage1?: string;
    igFeed0?: string;
    igFeed1?: string;
    igFeed2?: string;
    igFeed3?: string;
  }>({});

  // Crop Modal state
  const [activeCrop, setActiveCrop] = useState<ActiveCropState | null>(null);

  // Real-time Text State
  const initialBackup = typeof window !== 'undefined' ? getBrandingBackupLocal() : null;

  const [brandName, setBrandName] = useState(
    initialBackup?.brand_name || settings?.brand_name || 'DISSOF.ID'
  );
  const [tagline, setTagline] = useState(
    initialBackup?.tagline || settings?.tagline || 'everything is heartmade♡'
  );
  const [subTagline, setSubTagline] = useState(
    initialBackup?.sub_tagline || settings?.sub_tagline || 'handmade accessories & little treasures'
  );
  const [announcementBanner, setAnnouncementBanner] = useState(
    initialBackup?.announcement_banner || settings?.announcement_banner || '✨ FREE GIFT BOX & POUCH UNTUK SETIAP PEMBELIAN ♡ | BISA CUSTOM NAMA & INISIAL'
  );
  const [instagram, setInstagram] = useState(
    initialBackup?.instagram || settings?.instagram || '@dissof.id'
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialBackup?.whatsapp_number || settings?.whatsapp_number || '6282284901234'
  );
  const [location, setLocation] = useState(
    initialBackup?.location || settings?.location || 'Dumai, Riau'
  );
  const [offlineSpot, setOfflineSpot] = useState(
    initialBackup?.offline_spot || settings?.offline_spot || 'Dumai Pop-Up Store / Bazaars'
  );
  const [offlineSchedule, setOfflineSchedule] = useState(
    initialBackup?.offline_schedule || settings?.offline_schedule || 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)'
  );
  const [aboutStory, setAboutStory] = useState(
    initialBackup?.about_story || settings?.about_story || 'DISSOF.ID adalah UMKM handmade accessories lokal dari Dumai yang merangkai manik-manik indah secara manual dengan cinta.'
  );
  const [footerText, setFooterText] = useState(
    initialBackup?.footer_text || settings?.footer_text || 'everything is heartmade♡ Crafted with love in Dumai, Indonesia.'
  );

  // Background states
  const [selectedColor, setSelectedColor] = useState<string>(
    initialBackup?.backgroundColor || storeBackground?.value || '#F9F7F2'
  );
  const [bgMode, setBgMode] = useState<'cover' | 'repeat' | 'fixed'>(storeBackground?.mode || 'cover');

  // Status & Feedback
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<{ src: string; label: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize state with store settings ONLY when NOT currently saving/editing
  useEffect(() => {
    // Prevent snapshot echo from overwriting unsaved or in-flight save state
    if (isSavingRef.current) {
      return;
    }

    const backup = getBrandingBackupLocal();
    const source: any = {
      ...(settings || {}),
      ...(backup || {})
    };

    if (source) {
      if (source.brand_name) setBrandName(source.brand_name);
      if (source.tagline) setTagline(source.tagline);
      if (source.sub_tagline) setSubTagline(source.sub_tagline);
      if (source.announcement_banner) setAnnouncementBanner(source.announcement_banner);
      if (source.instagram) setInstagram(source.instagram);
      if (source.whatsapp_number) setWhatsappNumber(source.whatsapp_number);
      if (source.location) setLocation(source.location);
      if (source.offline_spot) setOfflineSpot(source.offline_spot);
      if (source.offline_schedule) setOfflineSchedule(source.offline_schedule);
      if (source.about_story) setAboutStory(source.about_story);
      if (source.footer_text) setFooterText(source.footer_text);
      if (source.backgroundColor) setSelectedColor(source.backgroundColor);

      setBrandingData((prev) => ({
        ...prev,
        logoUrl: source.logo_url || source.logoUrl || storeLogo || prev.logoUrl || undefined,
        faviconUrl: source.favicon_url || source.faviconUrl || prev.faviconUrl || undefined,
        heroBanner: source.hero_banner_url || source.heroBanner || storeHeroBanner || prev.heroBanner || undefined,
        eventBanner: source.popup_banner_image || source.eventBanner || prev.eventBanner || undefined,
        qrisImage: source.qris_image || source.qrisImage || paymentSettings?.qris_image || prev.qrisImage || undefined,
        bankAccountImage: source.bank_account_image || source.bankAccountImage || (paymentSettings as any)?.bank_account_image || prev.bankAccountImage || undefined,
        highlightImage0: source.highlight_images?.[0] || prev.highlightImage0 || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80',
        highlightImage1: source.highlight_images?.[1] || prev.highlightImage1 || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80',
        igFeed0: source.instagram_feed_images?.[0] || prev.igFeed0 || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80',
        igFeed1: source.instagram_feed_images?.[1] || prev.igFeed1 || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
        igFeed2: source.instagram_feed_images?.[2] || prev.igFeed2 || 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&auto=format&fit=crop&q=80',
        igFeed3: source.instagram_feed_images?.[3] || prev.igFeed3 || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
      }));
    }
  }, [settings, storeLogo, storeHeroBanner, paymentSettings]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // =========================================================================
  // SAVE COMPRESSED / CROPPED IMAGE TO FIRESTORE (DIRECT & REAL-TIME)
  // =========================================================================
  const saveImageToFirestore = async (keyType: string, base64Image: string, label: string) => {
    isSavingRef.current = true;
    setIsSaving(true);
    setUploadingKeys((prev) => ({ ...prev, [keyType]: true }));

    try {
      // 1. Ensure compressed quality with safe fallback
      let compressedBase64 = base64Image;
      try {
        compressedBase64 = await hardCompressImage(base64Image, 800, 0.6, 180);
      } catch (compErr) {
        console.warn('Canvas hard compress fallback to original base64:', compErr);
        compressedBase64 = base64Image;
      }

      // 2. Update local state immediately
      setBrandingData((prev) => ({ ...prev, [keyType]: compressedBase64 }));

      // Mapping payload
      const nowIso = new Date().toISOString();
      const generalPayload: Record<string, any> = {
        [keyType]: compressedBase64,
        updatedAt: nowIso
      };

      const storeConfigPayload: Partial<SiteSettings> = {};
      if (keyType === 'logoUrl' || keyType === 'logo_url') {
        storeConfigPayload.logo_url = compressedBase64;
        generalPayload.logo_url = compressedBase64;
        generalPayload.logoUrl = compressedBase64;
      } else if (keyType === 'faviconUrl' || keyType === 'favicon_url') {
        storeConfigPayload.favicon_url = compressedBase64;
        generalPayload.favicon_url = compressedBase64;
        generalPayload.faviconUrl = compressedBase64;
      } else if (keyType === 'heroBanner' || keyType === 'hero_banner_url') {
        storeConfigPayload.hero_banner_url = compressedBase64;
        generalPayload.hero_banner_url = compressedBase64;
        generalPayload.heroBanner = compressedBase64;
      } else if (keyType === 'eventBanner' || keyType === 'popup_banner_image') {
        storeConfigPayload.popup_banner_image = compressedBase64;
        generalPayload.popup_banner_image = compressedBase64;
        generalPayload.eventBanner = compressedBase64;
      } else if (keyType.startsWith('highlightImage')) {
        const idx = parseInt(keyType.replace('highlightImage', ''), 10);
        const currentHighlights = settings?.highlight_images && settings.highlight_images.length > 0
          ? [...settings.highlight_images]
          : [
              'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80',
            ];
        currentHighlights[idx] = compressedBase64;
        storeConfigPayload.highlight_images = currentHighlights;
        generalPayload.highlight_images = currentHighlights;
      } else if (keyType.startsWith('igFeed')) {
        const idx = parseInt(keyType.replace('igFeed', ''), 10);
        const currentFeeds = settings?.instagram_feed_images && settings.instagram_feed_images.length === 4
          ? [...settings.instagram_feed_images]
          : [
              'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
            ];
        currentFeeds[idx] = compressedBase64;
        storeConfigPayload.instagram_feed_images = currentFeeds;
        generalPayload.instagram_feed_images = currentFeeds;
      }

      // 3. Direct Firestore Save to store_settings/general with transparent LocalStorage Fallback
      let firestoreFailed = false;
      try {
        await setDoc(doc(db, 'store_settings', 'general'), generalPayload, { merge: true });
      } catch (dbErr: any) {
        if (isQuotaExceededError(dbErr)) {
          console.warn('[Firestore Quota Bypass] Quota exceeded while saving image. Preserving in LocalStorage fallback:', dbErr);
          firestoreFailed = true;
        } else {
          console.warn('Direct Firestore save failed, using local persistence fallback:', dbErr);
        }
      }

      try {
        if (Object.keys(storeConfigPayload).length > 0) {
          await saveSettingsLocal(storeConfigPayload);
        }

        if (keyType === 'qrisImage' || keyType === 'qris_image') {
          await savePaymentSettings({
            ...paymentSettings,
            qris_image: compressedBase64
          });
        }

        if (keyType === 'bankAccountImage') {
          await savePaymentSettings({
            ...paymentSettings,
            bank_account_image: compressedBase64
          } as any);
        }
      } catch (localSaveErr) {
        console.warn('Local settings save note:', localSaveErr);
      }

      // Always ensure full backup is saved to LocalStorage under 'dissof_branding_backup'
      saveBrandingBackupLocal({
        ...(settings || {}),
        ...generalPayload,
        ...storeConfigPayload,
        [keyType]: compressedBase64
      }, firestoreFailed);

      // Grace period (500ms) to allow Firestore onSnapshot echoes to settle without flicker
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (firestoreFailed) {
        showToast('success', 'Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database setelah kuota direset.');
      } else {
        showToast('success', `${label} berhasil di-crop & disimpan ke database ♡`);
      }
    } catch (err: any) {
      console.error('Gagal simpan ke Firestore:', err);
      if (isQuotaExceededError(err)) {
        saveBrandingBackupLocal({
          ...(settings || {}),
          [keyType]: base64Image
        }, true);
        alert('Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database besok setelah kuota direset.');
        showToast('success', 'Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database besok setelah kuota direset.');
      } else {
        showToast('error', 'Gagal menyimpan foto ke database: ' + (err?.message || err));
      }
    } finally {
      setUploadingKeys((prev) => ({ ...prev, [keyType]: false }));
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // =========================================================================
  // HANDLE FILE SELECTION -> OPEN CROP MODAL IMMEDIATELY
  // =========================================================================
  const handleBrandingImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    keyType: string,
    label: string,
    defaultAspect?: number,
    aspectOptions?: AspectRatioOption[]
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKeys((prev) => ({ ...prev, [keyType]: true }));

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          // Open Crop Modal directly with chosen image
          setActiveCrop({
            keyType,
            label,
            imageSrc: event.target.result as string,
            defaultAspect,
            aspectOptions,
          });
        }
      } catch (err) {
        console.error('FileReader load error:', err);
        showToast('error', 'Gagal memproses file foto.');
      } finally {
        setUploadingKeys((prev) => ({ ...prev, [keyType]: false }));
      }
    };
    reader.onerror = () => {
      setUploadingKeys((prev) => ({ ...prev, [keyType]: false }));
      showToast('error', 'Gagal membaca file dari perangkat.');
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if needed
    if (e.target) e.target.value = '';
  };

  // Trigger crop for already uploaded image
  const handleOpenCropExisting = (
    keyType: string,
    label: string,
    currentImgSrc: string,
    defaultAspect?: number,
    aspectOptions?: AspectRatioOption[]
  ) => {
    if (!currentImgSrc) return;
    setActiveCrop({
      keyType,
      label,
      imageSrc: currentImgSrc,
      defaultAspect,
      aspectOptions,
    });
  };

  // Helper to remove / reset image
  const handleRemoveImage = async (keyType: string, label: string) => {
    if (!window.confirm(`Hapus ${label}?`)) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setBrandingData((prev) => ({ ...prev, [keyType]: undefined }));

    try {
      await setDoc(doc(db, 'store_settings', 'general'), {
        [keyType]: '',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (keyType === 'logoUrl') {
        await saveSettingsLocal({ logo_url: '' });
      } else if (keyType === 'faviconUrl') {
        await saveSettingsLocal({ favicon_url: '' });
      } else if (keyType === 'heroBanner') {
        await saveSettingsLocal({ hero_banner_url: '' });
      } else if (keyType === 'eventBanner') {
        await saveSettingsLocal({ popup_banner_image: '' });
      } else if (keyType === 'qrisImage') {
        await savePaymentSettings({ ...paymentSettings, qris_image: undefined });
      } else if (keyType === 'bankAccountImage') {
        await savePaymentSettings({ ...paymentSettings, bank_account_image: undefined } as any);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast('success', `${label} berhasil dihapus.`);
    } catch (err: any) {
      showToast('error', 'Gagal menghapus foto: ' + (err?.message || err));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 1 & 2. SAVE ALL GLOBAL BRANDING (WITH RACE CONDITION FIX & AWAIT VERIFY)
  // =========================================================================
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Set flag penanda isSaving agar listener onSnapshot tidak menimpa state form lokal
    isSavingRef.current = true;
    setIsSaving(true);
    setIsSavingGlobal(true);

    try {
      const safeBrandName = safeTrim(brandName) || 'DISSOF.ID';
      const safeTagline = safeTrim(tagline) || 'everything is heartmade♡';
      const safeSubTagline = safeTrim(subTagline) || 'handmade accessories & little treasures';
      const safeAnnouncement = safeTrim(announcementBanner);
      const safeInstagram = safeTrim(instagram) || '@dissof.id';
      const safeWhatsapp = safeTrim(whatsappNumber) || '6282284901234';
      const safeLoc = safeTrim(location) || 'Dumai, Riau';
      const safeSpot = safeTrim(offlineSpot) || 'Dumai Pop-Up Store / Bazaars';
      const safeSched = safeTrim(offlineSchedule) || 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)';
      const safeStory = safeTrim(aboutStory);
      const safeFooter = safeTrim(footerText);

      // Latest Base64 images from current local state
      const currentHighlights = [
        brandingData.highlightImage0 || settings?.highlight_images?.[0] || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80',
        brandingData.highlightImage1 || settings?.highlight_images?.[1] || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80',
      ];

      const currentFeeds = [
        brandingData.igFeed0 || settings?.instagram_feed_images?.[0] || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80',
        brandingData.igFeed1 || settings?.instagram_feed_images?.[1] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
        brandingData.igFeed2 || settings?.instagram_feed_images?.[2] || 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&auto=format&fit=crop&q=80',
        brandingData.igFeed3 || settings?.instagram_feed_images?.[3] || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
      ];

      const updatedData: Record<string, any> = {
        brand_name: safeBrandName,
        tagline: safeTagline,
        sub_tagline: safeSubTagline,
        announcement_banner: safeAnnouncement,
        instagram: safeInstagram,
        whatsapp_number: safeWhatsapp,
        location: safeLoc,
        offline_spot: safeSpot,
        offline_schedule: safeSched,
        about_story: safeStory,
        footer_text: safeFooter,
        logoUrl: brandingData.logoUrl || '',
        logo_url: brandingData.logoUrl || '',
        faviconUrl: brandingData.faviconUrl || '',
        favicon_url: brandingData.faviconUrl || '',
        heroBanner: brandingData.heroBanner || '',
        hero_banner_url: brandingData.heroBanner || '',
        eventBanner: brandingData.eventBanner || '',
        popup_banner_image: brandingData.eventBanner || '',
        qrisImage: brandingData.qrisImage || '',
        bankAccountImage: brandingData.bankAccountImage || '',
        highlight_images: currentHighlights,
        instagram_feed_images: currentFeeds,
        updatedAt: new Date().toISOString(),
      };

      // 1. Direct Save to Firestore Doc 'store_settings/general' with LocalStorage backup
      let firestoreFailed = false;
      try {
        await setDoc(doc(db, 'store_settings', 'general'), updatedData, { merge: true });
      } catch (dbErr: any) {
        if (isQuotaExceededError(dbErr)) {
          console.warn('[Firestore Quota Bypass] Quota exceeded on global save. Preserving in LocalStorage fallback:', dbErr);
          firestoreFailed = true;
        } else {
          console.warn('Firestore general save error:', dbErr);
        }
      }

      // 2. Also persist to settings/store_config
      try {
        await saveSettingsLocal({
          brand_name: safeBrandName,
          tagline: safeTagline,
          sub_tagline: safeSubTagline,
          announcement_banner: safeAnnouncement,
          instagram: safeInstagram,
          whatsapp_number: safeWhatsapp,
          location: safeLoc,
          offline_spot: safeSpot,
          offline_schedule: safeSched,
          about_story: safeStory,
          footer_text: safeFooter,
          logo_url: brandingData.logoUrl || undefined,
          favicon_url: brandingData.faviconUrl || undefined,
          hero_banner_url: brandingData.heroBanner || undefined,
          popup_banner_image: brandingData.eventBanner || undefined,
          highlight_images: currentHighlights,
          instagram_feed_images: currentFeeds,
        });

        // 3. Sync payment settings if QRIS/bank image exist
        if (brandingData.qrisImage !== undefined || brandingData.bankAccountImage !== undefined) {
          await savePaymentSettings({
            ...paymentSettings,
            qris_image: brandingData.qrisImage,
            bank_account_image: brandingData.bankAccountImage,
          } as any);
        }
      } catch (subErr) {
        console.warn('Local settings save note:', subErr);
      }

      // Always save full backup to LocalStorage & IndexedDB
      saveBrandingBackupLocal(updatedData, firestoreFailed);

      // Jeda 500ms agar Firestore onSnapshot roundtrip selesai sempurna
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (firestoreFailed) {
        showToast('success', 'Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database setelah kuota direset.');
      } else {
        showToast('success', 'Pengaturan Branding Berhasil Disimpan!');
      }
    } catch (err: any) {
      console.error('Gagal menyimpan branding:', err);
      if (isQuotaExceededError(err)) {
        saveBrandingBackupLocal({
          brand_name: brandName,
          tagline,
          sub_tagline: subTagline,
          announcement_banner: announcementBanner,
          instagram,
          whatsapp_number: whatsappNumber,
          location,
          offline_spot: offlineSpot,
          offline_schedule: offlineSchedule,
          about_story: aboutStory,
          footer_text: footerText,
          ...brandingData,
        }, true);
        showToast('success', 'Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database setelah kuota direset.');
      } else {
        showToast('error', err?.message || 'Gagal menyimpan pengaturan branding.');
      }
    } finally {
      // Pastikan semua state loading selalu di-reset
      isSavingRef.current = false;
      setIsSaving(false);
      setIsSavingGlobal(false);
    }
  };

  // --- BACKGROUND COLOR & PATTERN HANDLERS ---
  const handleApplyColor = async (colorHex: string) => {
    setSelectedColor(colorHex);
    let firestoreFailed = false;
    try {
      await saveStoreBackground({ type: 'color', value: colorHex, mode: 'cover' });
      try {
        await setDoc(doc(db, 'store_settings', 'general'), {
          backgroundColor: colorHex,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr: any) {
        if (isQuotaExceededError(dbErr)) {
          firestoreFailed = true;
        }
      }

      saveBrandingBackupLocal({
        ...(settings || {}),
        backgroundColor: colorHex
      }, firestoreFailed);

      if (firestoreFailed) {
        showToast('success', 'Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database besok setelah kuota direset.');
      } else {
        showToast('success', `Warna tema latar belakang (${colorHex}) berhasil diterapkan!`);
      }
    } catch (err: any) {
      if (isQuotaExceededError(err)) {
        saveBrandingBackupLocal({ ...(settings || {}), backgroundColor: colorHex }, true);
        showToast('success', 'Kuota database harian penuh. Perubahan tersimpan secara lokal di HP Anda dan akan otomatis di-sync ke database besok setelah kuota direset.');
      } else {
        showToast('error', err.message || 'Gagal menyimpan warna background.');
      }
    }
  };

  // =========================================================================
  // RENDER ITEM UPLOAD WITH NATIVE LABEL, CROP BUTTON, AND HIDDEN INPUT
  // =========================================================================
  const renderUploadBox = (
    keyType: string,
    label: string,
    sublabel: string,
    currentImg: string | undefined,
    aspectRatioText: string,
    heightClass: string = 'h-40',
    defaultAspect?: number,
    aspectOptions?: AspectRatioOption[]
  ) => {
    const inputId = `upload-branding-${keyType}`;
    const isUploading = !!uploadingKeys[keyType];

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-xs space-y-3">
        {/* Hidden native HTML file input */}
        <input
          type="file"
          id={inputId}
          accept="image/*"
          onChange={(e) => handleBrandingImageUpload(e, keyType, label, defaultAspect, aspectOptions)}
          style={{ display: 'none' }}
        />

        {/* Header item */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-2.5">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#2E241E]">{label}</h4>
            <p className="text-[11px] text-[#7A6A61]">{sublabel}</p>
          </div>
          <span className="text-[10px] text-pink-600 font-medium bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100 shrink-0 flex items-center gap-1">
            <Crop className="w-3 h-3 text-pink-500" />
            <span>{aspectRatioText}</span>
          </span>
        </div>

        {/* Content Box: Preview if exists, else Upload Prompt */}
        {currentImg ? (
          <div className="space-y-2.5">
            <div className={`relative ${heightClass} w-full rounded-2xl overflow-hidden bg-[#FAF7F2] border border-pink-100 flex items-center justify-center group shadow-2xs`}>
              <ImageWithFallback
                src={currentImg}
                alt={label}
                className="w-full h-full object-cover"
              />

              {/* Hover/Tap Overlay with Zoom & Crop */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                <button
                  type="button"
                  onClick={() => setPreviewZoomImage({ src: currentImg, label })}
                  className="px-3 py-1.5 rounded-xl bg-white text-[#2D2D2D] font-bold text-[11px] shadow-sm hover:bg-pink-50 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCropExisting(keyType, label, currentImg, defaultAspect, aspectOptions)}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 text-white font-bold text-[11px] shadow-sm hover:bg-pink-700 flex items-center gap-1 cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Crop / Potong</span>
                </button>
              </div>

              {/* Compression Badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-pink-300" />
                <span>{getImageSizeInKB(currentImg)} KB (Bisa di-Crop)</span>
              </div>
            </div>

            {/* Action Row: Label Trigger (Ganti), Crop Button & Hapus */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <label
                htmlFor={inputId}
                className="flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-white border border-pink-300 hover:bg-pink-50 text-pink-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer select-none"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-600" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-pink-600" />
                    <span>Ganti Foto</span>
                  </>
                )}
              </label>

              <button
                type="button"
                onClick={() => handleOpenCropExisting(keyType, label, currentImg, defaultAspect, aspectOptions)}
                className="px-3 py-2 rounded-xl bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                title="Crop & Sesuaikan Posisi Foto"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop Foto</span>
              </button>

              <button
                type="button"
                onClick={() => handleRemoveImage(keyType, label)}
                className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Hapus Foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Box wrapped in label for 1-click native picker */
          <div className="space-y-2">
            <label
              htmlFor={inputId}
              className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-pink-50/40 group shadow-2xs select-none block"
            >
              <div className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform mb-2">
                {isUploading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-pink-600" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <p className="font-bold text-xs text-[#2E241E]">
                {isUploading ? 'Sedang Memproses...' : 'Klik untuk Pilih Foto dari Galeri (Bisa Langsung di-Crop)'}
              </p>
              <span className="text-[10px] text-[#8C7D75] mt-0.5 block">
                Format JPG/PNG/WEBP (Fitur Crop, Zoom, Rotasi &amp; Simpan Real-time ke Firestore)
              </span>
            </label>

            <label
              htmlFor={inputId}
              className="w-full px-4 py-2.5 rounded-xl bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer select-none"
            >
              <Crop className="w-4 h-4 text-pink-600" />
              <span>Pilih Foto &amp; Buka Alat Crop</span>
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pink-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100/70 text-pink-700 text-xs font-bold mb-2">
            <Crop className="w-3.5 h-3.5" />
            <span>Pusat Kendali Branding &amp; Alat Crop Foto Lengkap</span>
          </div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Pengaturan Toko &amp; Branding DISSOF.ID ♡
          </h1>
          <p className="text-xs text-[#7A6A61] mt-1 font-medium max-w-3xl">
            Semua foto (Logo, Favicon, Banner Hero, QRIS, Rekening Bank, Banner Event Pop-Up, Highlight Kerajinan, dan Galeri Instagram) kini dapat di-crop, di-zoom, diputar, dan disesuaikan rasionya secara bebas sebelum disimpan ke Firestore secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0 shadow-2xs">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Live Real-Time Sync</span>
        </div>
      </div>

      {/* Toast Pop-Up */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-pink-100 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-[#2D2D2D] text-white shadow-md'
              : 'bg-white text-[#63534B] hover:bg-pink-50 border border-pink-100'
          }`}
        >
          <Crop className="w-4 h-4 text-pink-300" />
          <span>1. Unggah &amp; Crop Foto (Logo, Banner, QRIS, IG)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'content'
              ? 'bg-[#2D2D2D] text-white shadow-md'
              : 'bg-white text-[#63534B] hover:bg-pink-50 border border-pink-100'
          }`}
        >
          <FileText className="w-4 h-4 text-pink-300" />
          <span>2. Teks Toko &amp; Running Announcement Bar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('background')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'background'
              ? 'bg-[#2D2D2D] text-white shadow-md'
              : 'bg-white text-[#63534B] hover:bg-pink-50 border border-pink-100'
          }`}
        >
          <Layers className="w-4 h-4 text-pink-300" />
          <span>3. Tema Warna Latar Belakang</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: MEDIA UPLOADERS WITH CROP MODAL
          ======================================================== */}
      {activeTab === 'media' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Section 1: Logo & Favicon */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderUploadBox(
              'logoUrl',
              'Logo Header Toko (Navbar)',
              'Tampil di bagian atas navigasi website pembeli (Format PNG Transparan / JPG)',
              brandingData.logoUrl,
              'Rasio Bebas / 1:1 / 16:9',
              'h-36',
              undefined,
              [
                { label: 'Bebas', value: undefined, badge: 'Free Crop' },
                { label: '1:1 Persegi', value: 1, badge: 'Logo Square' },
                { label: '4:3 Normal', value: 4 / 3, badge: 'Logo Horizontal' },
                { label: '16:9 Wide', value: 16 / 9, badge: 'Header Wide' },
              ]
            )}

            {renderUploadBox(
              'faviconUrl',
              'Favicon Toko (Icon Tab Browser)',
              'Icon kecil tab browser dan shortcut home screen pembeli',
              brandingData.faviconUrl,
              'Rasio 1:1 Persegi (256x256)',
              'h-36',
              1,
              [
                { label: '1:1 Persegi', value: 1, badge: 'Favicon Standard' },
                { label: 'Bebas', value: undefined, badge: 'Free Crop' },
              ]
            )}
          </div>

          {/* Section 2: Banner Hero & Barcode QRIS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderUploadBox(
              'heroBanner',
              'Hero Banner Promo Utama',
              'Foto highlight aksesoris besar di sebelah kanan headline halaman depan',
              brandingData.heroBanner,
              'Rasio 4:5 atau 1:1',
              'h-52',
              4 / 5,
              [
                { label: '4:5 Portrait', value: 4 / 5, badge: 'Hero Card Rekomendasi' },
                { label: '1:1 Persegi', value: 1, badge: 'Square' },
                { label: '3:4 Post', value: 3 / 4, badge: 'Portrait' },
                { label: '16:9 Banner', value: 16 / 9, badge: 'Landscape' },
                { label: 'Bebas', value: undefined, badge: 'Free Crop' },
              ]
            )}

            {renderUploadBox(
              'qrisImage',
              'Foto Barcode QRIS Toko',
              'Muncul otomatis saat pembeli memilih pembayaran QRIS di checkout',
              brandingData.qrisImage,
              'Rasio 1:1 Persegi',
              'h-52',
              1,
              [
                { label: '1:1 Persegi', value: 1, badge: 'QRIS Kotak' },
                { label: '4:3 Normal', value: 4 / 3, badge: 'Stiker QRIS' },
                { label: 'Bebas', value: undefined, badge: 'Free Crop' },
              ]
            )}
          </div>

          {/* Section 3: Banner Pop-Up Event & Foto Rekening Bank */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderUploadBox(
              'eventBanner',
              'Banner Event & Pop-Up Store Offline Dumai',
              'Foto booth Car Free Night / bazaar di section "Find Us Offline ♡"',
              brandingData.eventBanner,
              'Rasio 16:9 atau 4:3',
              'h-48',
              16 / 9,
              [
                { label: '16:9 Wide', value: 16 / 9, badge: 'Banner Event' },
                { label: '4:3 Standar', value: 4 / 3, badge: 'Poster' },
                { label: '1:1 Persegi', value: 1, badge: 'Square' },
                { label: 'Bebas', value: undefined, badge: 'Free Crop' },
              ]
            )}

            {renderUploadBox(
              'bankAccountImage',
              'Foto Buku Rekening / Panduan Transfer Bank',
              'Tampil sebagai panduan visual pembayaran transfer bank di checkout',
              brandingData.bankAccountImage,
              'Rasio 16:9 atau Bebas',
              'h-48',
              16 / 9,
              [
                { label: '16:9 Wide', value: 16 / 9, badge: 'Buku Rekening' },
                { label: '4:3 Standar', value: 4 / 3, badge: 'ATM Card' },
                { label: '1:1 Persegi', value: 1, badge: 'Square' },
                { label: 'Bebas', value: undefined, badge: 'Free Crop' },
              ]
            )}
          </div>

          {/* Section 4: Galeri Craft Highlight (2 Foto) */}
          <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs space-y-4">
            <div className="border-b border-pink-100 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-[#2E241E] flex items-center gap-2">
                <span>Galeri Highlight Aksesoris Handmade (2 Foto Craft)</span>
                <Sparkles className="w-4 h-4 text-pink-500" />
              </h3>
              <p className="text-xs text-[#7A6A61]">
                Dua foto proses kerajinan di samping cerita "made with love, bead by bead ♡"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderUploadBox(
                'highlightImage0',
                'Foto Highlight Craft #1',
                'Proses merangkai manik-manik',
                brandingData.highlightImage0,
                'Rasio 4:5 atau 1:1',
                'h-44',
                4 / 5,
                [
                  { label: '4:5 Craft', value: 4 / 5, badge: 'Highlight' },
                  { label: '1:1 Persegi', value: 1, badge: 'Square' },
                  { label: '3:4 Post', value: 3 / 4, badge: 'Portrait' },
                  { label: 'Bebas', value: undefined, badge: 'Free Crop' },
                ]
              )}

              {renderUploadBox(
                'highlightImage1',
                'Foto Highlight Craft #2',
                'Detail charm & packaging estetik',
                brandingData.highlightImage1,
                'Rasio 4:5 atau 1:1',
                'h-44',
                4 / 5,
                [
                  { label: '4:5 Craft', value: 4 / 5, badge: 'Highlight' },
                  { label: '1:1 Persegi', value: 1, badge: 'Square' },
                  { label: '3:4 Post', value: 3 / 4, badge: 'Portrait' },
                  { label: 'Bebas', value: undefined, badge: 'Free Crop' },
                ]
              )}
            </div>
          </div>

          {/* Section 5: Galeri Instagram Feed (4 Foto Kotak) */}
          <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2E241E] flex items-center gap-2">
                  <span>Galeri Instagram Feed (4 Foto Kotak)</span>
                  <Instagram className="w-4 h-4 text-pink-600" />
                </h3>
                <p className="text-xs text-[#7A6A61]">
                  Katalog Instagram @{instagram.replace('@', '')} di bagian bawah homepage
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderUploadBox('igFeed0', 'Kotak IG #1', 'Foto grid 1', brandingData.igFeed0, '1:1 Persegi', 'h-36', 1)}
              {renderUploadBox('igFeed1', 'Kotak IG #2', 'Foto grid 2', brandingData.igFeed1, '1:1 Persegi', 'h-36', 1)}
              {renderUploadBox('igFeed2', 'Kotak IG #3', 'Foto grid 3', brandingData.igFeed2, '1:1 Persegi', 'h-36', 1)}
              {renderUploadBox('igFeed3', 'Kotak IG #4', 'Foto grid 4', brandingData.igFeed3, '1:1 Persegi', 'h-36', 1)}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: CONTENT & TEXTS
          ======================================================== */}
      {activeTab === 'content' && (
        <form onSubmit={handleSaveAll} className="space-y-6 animate-in fade-in duration-200">
          
          {/* Running Announcement Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <Megaphone className="w-5 h-5 text-pink-500" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2E241E]">
                  Running Announcement Bar (Pengumuman Paling Atas)
                </h3>
                <p className="text-xs text-[#7A6A61]">Banner strip berjalan di paling atas halaman</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#2E241E]">Teks Pengumuman Banner:</label>
              <input
                type="text"
                required
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                placeholder="✨ FREE GIFT BOX & POUCH UNTUK SETIAP PEMBELIAN ♡ | BISA CUSTOM NAMA & INISIAL"
                className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Brand Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2E241E]">
                  Identitas Brand &amp; Kontak Resmi
                </h3>
                <p className="text-xs text-[#7A6A61]">Nama brand, tagline, WhatsApp, Instagram</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E241E]">Nama Brand / Toko:</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E241E]">Tagline Brand (Huruf Kecil Estetik):</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E241E]">Username Instagram:</label>
                <div className="relative">
                  <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                  <input
                    type="text"
                    required
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E241E]">No. WhatsApp Admin (Format 62... / 08...):</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Offline Spot */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <MapPin className="w-5 h-5 text-pink-500" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2E241E]">
                  Lokasi Pop-Up Bazaar &amp; Cerita Brand
                </h3>
                <p className="text-xs text-[#7A6A61]">Jadwal offline booth dan cerita handmade</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E241E]">Nama Spot Pop-Up Offline:</label>
                <input
                  type="text"
                  value={offlineSpot}
                  onChange={(e) => setOfflineSpot(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2E241E]">Jadwal Buka Booth Pop-Up:</label>
                <input
                  type="text"
                  value={offlineSchedule}
                  onChange={(e) => setOfflineSchedule(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2E241E]">Kisah / Filosofi Brand (About Story):</label>
              <textarea
                rows={3}
                value={aboutStory}
                onChange={(e) => setAboutStory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-[#FAF7F2] text-xs font-medium focus:ring-2 focus:ring-pink-400 focus:bg-white"
              />
            </div>
          </div>

        </form>
      )}

      {/* ========================================================
          TAB 3: THEME COLOR
          ======================================================== */}
      {activeTab === 'background' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs space-y-4">
            <div className="border-b border-pink-100 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-[#2E241E]">
                Pilihan Warna Latar Belakang Pastel
              </h3>
              <p className="text-xs text-[#7A6A61]">Klik palet warna untuk langsung mengubah nuansa estetika website</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => handleApplyColor(col.hex)}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
                    String(selectedColor || '').toLowerCase() === String(col.hex || '').toLowerCase()
                      ? 'border-pink-500 bg-pink-50/50 shadow-xs'
                      : 'border-black/5 hover:border-pink-300 bg-white'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-xl border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#2E241E]">{col.name}</p>
                    <span className="text-[10px] text-gray-500 font-mono">{col.hex}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM FLOATING SAVE BAR
          ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-2xl flex items-center justify-between gap-4 max-w-7xl mx-auto rounded-t-3xl sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:shadow-none sm:p-0 sm:mt-8">
        <div className="hidden sm:flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <span className="text-xs text-[#55473F] font-semibold">
            Semua foto &amp; teks otomatis terkirim real-time ke Firestore (store_settings/general) ♡
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={isSaving || isSavingGlobal}
          className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving || isSavingGlobal ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Menyimpan ke Firestore...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Simpan Perubahan / Update Branding ♡</span>
            </>
          )}
        </button>
      </div>

      {/* Full Image Crop Modal */}
      {activeCrop && (
        <ImageCropModal
          isOpen={true}
          imageSrc={activeCrop.imageSrc}
          title={`Crop & Sesuaikan: ${activeCrop.label}`}
          description="Geser, cubit (pinch), zoom, putar, dan pilih rasio aspek terbaik untuk foto ini."
          defaultAspect={activeCrop.defaultAspect}
          aspectOptions={activeCrop.aspectOptions}
          onCropComplete={(croppedBase64) => {
            saveImageToFirestore(activeCrop.keyType, croppedBase64, activeCrop.label);
            setActiveCrop(null);
          }}
          onClose={() => setActiveCrop(null)}
        />
      )}

      {/* Fullscreen Zoom Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="max-w-2xl w-full bg-white rounded-3xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="font-bold text-xs text-[#2D2D2D]">{previewZoomImage.label} (Pratinjau)</span>
              <button onClick={() => setPreviewZoomImage(null)} className="text-gray-400 hover:text-black text-xs font-bold px-2 py-1 cursor-pointer">
                Tutup ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#F9F7F2] rounded-2xl p-2">
              <ImageWithFallback src={previewZoomImage.src} alt={previewZoomImage.label} className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
