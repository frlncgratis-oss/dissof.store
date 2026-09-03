import { createClient } from '@supabase/supabase-js';

// Supabase Credentials provided by User
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://joyjmnnsniajwqbyuoit.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_o9kG84_3_1LtJq-fK3vS9w_ptsPwUtm';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_STORAGE_BUCKET = 'Product-image';

/**
 * Convert base64 data string to standard Blob
 */
function base64ToBlob(base64Data: string): { blob: Blob; mimeType: string } {
  const parts = base64Data.split(';base64,');
  const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
  const raw = atob(parts[1] || parts[0]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return {
    blob: new Blob([uInt8Array], { type: mimeType }),
    mimeType,
  };
}

export interface SupabaseUploadResult {
  url: string;
  path: string;
  name: string;
}

/**
 * 1. Upload an image (File, Blob, or Base64 string) to Supabase Storage bucket "Product-image"
 * 2. Retrieve the direct Public URL from Supabase
 * @param input File, Blob, or base64 string
 * @param customName Optional custom filename prefix
 */
export async function uploadProductImageToSupabase(
  input: File | Blob | string,
  customName?: string
): Promise<SupabaseUploadResult> {
  // If string is already a remote public URL (HTTP/HTTPS), no need to re-upload
  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return {
        url: input,
        path: '',
        name: 'remote_image',
      };
    }
  }

  let fileBody: Blob | File;
  let mimeType = 'image/jpeg';
  let ext = 'jpg';

  if (typeof input === 'string' && input.startsWith('data:')) {
    const converted = base64ToBlob(input);
    fileBody = converted.blob;
    mimeType = converted.mimeType;
    ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  } else if (input instanceof File) {
    fileBody = input;
    mimeType = input.type || 'image/jpeg';
    const originalExt = input.name.split('.').pop();
    if (originalExt) ext = originalExt.toLowerCase();
  } else if (input instanceof Blob) {
    fileBody = input;
    mimeType = input.type || 'image/jpeg';
    ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  } else {
    throw new Error('Format gambar tidak didukung untuk upload ke Supabase.');
  }

  // Generate a clean, collision-free filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const cleanPrefix = customName
    ? customName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
    : 'prod';
  const filePath = `products/${cleanPrefix}_${timestamp}_${randomStr}.${ext}`;

  // 1. Upload to Supabase Storage Bucket "Product-image"
  const { data, error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filePath, fileBody, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    throw new Error(
      `Gagal upload foto ke Supabase Storage (Bucket "${SUPABASE_STORAGE_BUCKET}"): ${error.message}`
    );
  }

  // 2. Obtain Public URL
  const { data: publicData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(data.path || filePath);

  if (!publicData?.publicUrl) {
    throw new Error('Gagal mendapatkan Public URL foto dari Supabase Storage.');
  }

  return {
    url: publicData.publicUrl,
    path: data.path || filePath,
    name: filePath,
  };
}

export interface SupabaseProductRecord {
  id?: string;
  name: string;
  price: number;
  description?: string;
  image_url: string;
  images?: string[];
  category_id?: string;
  category_name?: string;
  stock?: number;
  original_price?: number;
  is_best_seller?: boolean;
  is_sold_out?: boolean;
  is_visible?: boolean;
  variants?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * 3. Save or Upsert product data directly into Supabase 'products' table
 */
export async function saveProductToSupabaseDatabase(product: SupabaseProductRecord): Promise<any> {
  const primaryImageUrl = product.image_url || (product.images && product.images[0]) || '';

  // Prepare full payload
  const fullPayload: Record<string, any> = {
    name: product.name,
    price: Number(product.price) || 0,
    description: product.description || '',
    image_url: primaryImageUrl,
    created_at: product.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (product.id) fullPayload.id = product.id;
  if (product.category_id) fullPayload.category_id = product.category_id;
  if (product.category_name) fullPayload.category_name = product.category_name;
  if (product.stock !== undefined) fullPayload.stock = Number(product.stock);
  if (product.original_price !== undefined) fullPayload.original_price = Number(product.original_price);
  if (product.is_best_seller !== undefined) fullPayload.is_best_seller = Boolean(product.is_best_seller);
  if (product.is_sold_out !== undefined) fullPayload.is_sold_out = Boolean(product.is_sold_out);
  if (product.is_visible !== undefined) fullPayload.is_visible = Boolean(product.is_visible);
  if (product.images && Array.isArray(product.images)) fullPayload.images = product.images;
  if (product.variants && Array.isArray(product.variants)) fullPayload.variants = product.variants;
  if (product.tags && Array.isArray(product.tags)) fullPayload.tags = product.tags;

  try {
    // Attempt upsert/insert with full payload
    const { data, error } = await supabase
      .from('products')
      .upsert([fullPayload], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase products table full upsert error, trying minimal columns:', error);
      // Fallback: If table has simpler schema (e.g. only name, price, description, image_url)
      const minimalPayload: Record<string, any> = {
        name: product.name,
        price: Number(product.price) || 0,
        description: product.description || '',
        image_url: primaryImageUrl,
      };
      if (product.id) minimalPayload.id = product.id;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .upsert([minimalPayload], { onConflict: 'id' })
        .select();

      if (fallbackError) {
        throw new Error(
          `Gagal menyimpan produk ke database Supabase (tabel "products"): ${fallbackError.message}`
        );
      }
      return fallbackData;
    }

    return data;
  } catch (err: any) {
    console.error('Error saving product to Supabase table:', err);
    throw err;
  }
}

/**
 * Fetch all products from Supabase database ('products' table)
 */
export async function fetchProductsFromSupabase(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Warning fetching products:', error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('[Supabase] Exception fetching products from Supabase:', err);
    return [];
  }
}

/**
 * Preload an array of image URLs to ensure crisp, flicker-free rendering
 * after the loading screen finishes fading out.
 */
export async function preloadImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;
  const uniqueUrls = Array.from(new Set(urls.filter((u) => u && typeof u === 'string' && u.startsWith('http'))));
  
  // Preload top images (max 16) with individual timeout so it doesn't hold up slow connections
  const promises = uniqueUrls.slice(0, 16).map((url) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve();
      // Cap at 1500ms max per image so user isn't kept waiting
      setTimeout(() => resolve(), 1500);
    });
  });

  await Promise.allSettled(promises);
}
