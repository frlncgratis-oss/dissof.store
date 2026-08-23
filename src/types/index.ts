export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name?: string;
  price: number;
  original_price?: number;
  description: string;
  details?: string[];
  images: string[];
  stock: number;
  is_best_seller: boolean;
  is_sold_out: boolean;
  is_visible: boolean;
  variants: string[];
  tags: string[];
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  display_order?: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
  custom_note?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_address?: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee?: number;
  total: number;
  order_notes?: string;
  notes?: string;
  source: 'whatsapp' | 'online';
  payment_method?: 'bank_transfer' | 'qris' | 'whatsapp';
  payment_proof?: string;
  payment_proof_url?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface PaymentSettings {
  bank_name: string;
  account_number: string;
  account_holder: string;
  whatsapp_number?: string;
  qris_image?: string;
  qris_label?: string;
  instructions?: string;
  is_enabled: boolean;
  notes?: string;
}

export interface CustomRequest {
  id: string;
  customer_name: string;
  customer_whatsapp: string;
  accessory_type: string;
  color_theme: string;
  charms_selected: string[];
  custom_initials?: string;
  special_notes?: string;
  reference_image_url?: string;
  estimated_budget?: number;
  status: 'New' | 'Contacted' | 'In Production' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at?: string;
}

export interface EventItem {
  id: string;
  title: string;
  tagline?: string;
  location: string;
  date: string;
  time: string;
  status: 'upcoming' | 'past';
  poster_url: string;
  gallery_images: string[];
  description: string;
  booth_number?: string;
  google_maps_url?: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_handle?: string;
  product_name?: string;
  rating: number;
  review: string;
  photo_url?: string;
  is_featured: boolean;
  date: string;
  created_at: string;
}

export interface StoreBackground {
  type: 'color' | 'image';
  value: string; // Hex color (e.g. #F9F7F2) or image data/url
  mode?: 'cover' | 'repeat' | 'fixed';
}

export interface SiteSettings {
  id?: string;
  brand_name: string;
  tagline: string;
  sub_tagline: string;
  instagram: string;
  whatsapp_number: string;
  location: string;
  offline_spot: string;
  offline_schedule: string;
  announcement?: string;
  announcement_banner?: string;
  about_story: string;
  footer_text: string;
  logo_url?: string;
  favicon_url?: string;
  hero_banner_url?: string;
  popup_banner_image?: string;
  highlight_images?: string[];
  instagram_feed_images?: string[];
  background?: StoreBackground;
  currency_symbol?: string;
  banner_image?: string;
  shopee_url?: string;
  tiktok_url?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'admin';
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  customNote?: string;
}
