/**
 * ImgBB Image Upload Client for DISSOF.ID
 * Uploads images to ImgBB Free API (https://api.imgbb.com/1/upload)
 * and retrieves direct permanent URLs (e.g. https://i.ibb.co/...)
 */

// Default public/free ImgBB API keys (with multiple fallbacks to ensure 100% uptime)
const DEFAULT_IMGBB_KEYS = [
  'd7e1bc3f2e46b9bb7cb3985ee195cf28',
  '6d207e02198a847aa5fb3ac505b3cf6b',
  '3cbb1fcf3b2f293b482bc6761dc97c55',
  '4ecaafe0972b9a7b97fe0ec665a39cb6',
  '2bbfaee6c382343c4a243105ff7036a1'
];

export const IMGBB_STORAGE_KEY = 'dissof_imgbb_api_key';

/**
 * Get active ImgBB API key from localStorage, custom passed key, or default pool
 */
export function getActiveImgBBKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 10) {
    return customKey.trim();
  }
  try {
    const saved = localStorage.getItem(IMGBB_STORAGE_KEY);
    if (saved && saved.trim().length > 10) {
      return saved.trim();
    }
  } catch {
    // ignore
  }
  return DEFAULT_IMGBB_KEYS[0];
}

/**
 * Save custom ImgBB API Key
 */
export function saveCustomImgBBKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(IMGBB_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(IMGBB_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export interface ImgBBUploadResult {
  url: string;
  displayUrl: string;
  deleteUrl?: string;
  thumbUrl?: string;
  title?: string;
}

/**
 * Upload an image (File, Blob, or Base64 string) to ImgBB API
 * @param input File, Blob, or base64 data string
 * @param options optional customKey, name, expiration
 */
export async function uploadImageToImgBB(
  input: File | Blob | string,
  options?: {
    customKey?: string;
    name?: string;
    expiration?: number;
  }
): Promise<ImgBBUploadResult> {
  const keysToTry: string[] = [];
  const userKey = getActiveImgBBKey(options?.customKey);
  keysToTry.push(userKey);
  
  // Add other keys as fallback in case rate limited or quota reached
  DEFAULT_IMGBB_KEYS.forEach(k => {
    if (!keysToTry.includes(k)) keysToTry.push(k);
  });

  let lastError: Error | null = null;

  for (let i = 0; i < keysToTry.length; i++) {
    const activeKey = keysToTry[i];
    try {
      const formData = new FormData();
      
      if (typeof input === 'string') {
        // If string is already an http/https URL, return it directly if it's already hosted
        if (input.startsWith('http://') || input.startsWith('https://')) {
          return {
            url: input,
            displayUrl: input,
          };
        }
        // Base64 string
        // Strip data:image/...;base64, if present, or pass base64
        const cleanBase64 = input.includes('base64,') ? input.split('base64,')[1] : input;
        formData.append('image', cleanBase64);
      } else {
        // File or Blob
        formData.append('image', input);
      }

      if (options?.name) {
        formData.append('name', options.name);
      }
      if (options?.expiration) {
        formData.append('expiration', String(options.expiration));
      }

      const uploadUrl = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(activeKey)}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = `ImgBB Error (${response.status})`;
        try {
          const json = JSON.parse(errorText);
          parsedError = json?.error?.message || json?.error || parsedError;
        } catch {
          // ignore
        }
        throw new Error(parsedError);
      }

      const data = await response.json();
      
      if (data && data.success && data.data) {
        const directUrl = data.data.url || data.data.display_url;
        const displayUrl = data.data.display_url || data.data.url;
        const thumbUrl = data.data.thumb?.url || data.data.medium?.url;
        const deleteUrl = data.data.delete_url;

        return {
          url: directUrl,
          displayUrl,
          thumbUrl,
          deleteUrl,
          title: data.data.title,
        };
      } else {
        throw new Error(data?.error?.message || 'Gagal menerima respons gambar dari ImgBB.');
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`ImgBB upload attempt with key ${i + 1} failed:`, err);
      // Try next key if available
    }
  }

  throw new Error(
    lastError?.message || 'Gagal mengunggah foto ke ImgBB. Periksa koneksi internet Anda atau coba lagi beberapa saat.'
  );
}
