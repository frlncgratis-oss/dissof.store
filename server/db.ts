import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Product, Category, Order, CustomRequest, EventItem, Testimonial, SiteSettings, AdminUser } from '../src/types';

interface DatabaseSchema {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  custom_requests: CustomRequest[];
  events: EventItem[];
  testimonials: Testimonial[];
  users: Array<AdminUser & { password_hash: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'dissof_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data for DISSOF.ID
const INITIAL_SETTINGS: SiteSettings = {
  id: 'main',
  brand_name: 'DISSOF.ID',
  tagline: 'everything is heartmade♡',
  sub_tagline: 'handmade accessories & little treasures',
  instagram: 'dissof.id',
  whatsapp_number: '6282284901234', // Easy to change in admin
  location: 'Pekanbaru, Riau',
  offline_spot: 'Car Free Night Soebrantas, Pekanbaru',
  offline_schedule: 'Setiap Sabtu & Minggu Malam (19.00 - 23.00 WIB)',
  announcement: '✨ Free cute sticker pack & velvet pouch for orders above Rp 50.000! ✨',
  about_story: `Di DISSOF.ID, setiap aksesoris dibuat dengan sepenuh hati ("everything is heartmade♡"). Berawal dari kecintaan kami pada seni merangkai manik-manik (beads) dan liontin unik (charms), kami percaya bahwa perhiasan kecil bisa membawa kebahagiaan besar dan mempercantik setiap hari kamu.

Setiap gelang, kalung, phone strap, dan cincin dibuat manual secara handmade satu per satu di workshop kecil kami di Pekanbaru. Kami memilih manik berkualitas tinggi — mulai dari faux pearl, glass beads, pastel acrylic, candy charms, hingga silver-plated hardware yang tahan karat dan nyaman dipakai sehari-hari.

Kamu juga bisa membuat aksesoris impianmu lewat fitur custom: pilih warna favorit, charm pilihan, hingga custom inisial nama kamu sendiri! Temui kami juga secara langsung di Car Free Night Soebrantas Pekanbaru setiap akhir pekan ♡`,
  footer_text: 'DISSOF.ID — everything is heartmade♡ handmade with love from Pekanbaru.',
  currency_symbol: 'Rp',
  shopee_url: 'https://shopee.co.id/dissof.id',
  tiktok_url: 'https://tiktok.com/@dissof.id',
  banner_image: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=1200&auto=format&fit=crop&q=80'
};

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'bracelets',
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Handmade charm bracelets & beaded stacking bangles',
    display_order: 1,
    image: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'phone-charms',
    name: 'Phone Charms',
    slug: 'phone-charms',
    description: 'Aesthetic beaded phone straps & y2k charms',
    display_order: 2,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'necklaces',
    name: 'Necklaces',
    slug: 'necklaces',
    description: 'Choker, layered chains & pearl beaded necklaces',
    display_order: 3,
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'beaded',
    name: 'Beaded Accessories',
    slug: 'beaded',
    description: 'Rings, keychains, bag charms & cute hair accessories',
    display_order: 4,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'custom',
    name: 'Custom',
    slug: 'custom',
    description: 'Personalized beads with your initials & custom charms',
    display_order: 5,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    name: 'Strawberry Milk Charm Bracelet ♡',
    slug: 'strawberry-milk-charm-bracelet',
    category_id: 'bracelets',
    category_name: 'Bracelets',
    price: 35000,
    original_price: 45000,
    description: 'Gelang handmade bernuansa pastel pink & pearl dengan charm strawberry manis, pita bow satin, dan bintang holographic. Menggunakan tali elastis premium Jepang atau rantai stainless steel anti karat.',
    details: [
      'Material: Glass beads, faux pearl 6mm, acrylic candy charm, stainless steel clasp',
      'Panjang standar: 16cm + 4cm extender chain (adjustable)',
      '100% handmade with love in Pekanbaru',
      'Sudah termasuk free gift box & cute sticker'
    ],
    images: [
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 18,
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    variants: ['Elastic Band (16cm)', 'Chain + Extender (16-20cm)', 'Custom Size'],
    tags: ['pink', 'strawberry', 'bestseller', 'pastel', 'y2k'],
    rating: 5,
    review_count: 24,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-02',
    name: 'Lilac Dream Y2K Phone Charm ✧',
    slug: 'lilac-dream-y2k-phone-charm',
    category_id: 'phone-charms',
    category_name: 'Phone Charms',
    price: 28000,
    original_price: 35000,
    description: 'Phone strap aesthetic warna lilac ungu & lavender dengan butterfly charm, mutiara air tawar imitasi, dan beads kristal blink. Tali nilon super kuat tahan beban handphone.',
    details: [
      'Material: Heavy-duty nylon cord, butterfly charm, iridescent crystal beads',
      'Panjang: ~22cm total (nyaman digantung di pergelangan tangan)',
      'Cocok untuk semua jenis case HP dengan lubang strap',
      'Waterproof & tidak mudah putus'
    ],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 25,
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    variants: ['Lilac Butterfly', 'Sky Cloud Star', 'Matcha Mint'],
    tags: ['phonecharm', 'lilac', 'y2k', 'butterfly'],
    rating: 4.9,
    review_count: 31,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-03',
    name: 'Coquette Pearl & Ribbon Choker ♡',
    slug: 'coquette-pearl-ribbon-choker',
    category_id: 'necklaces',
    category_name: 'Necklaces',
    price: 48000,
    original_price: 59000,
    description: 'Kalung choker coquette aesthetic dengan mutiara putih elegan dan liontin pita bow perak mini. Sempurna untuk outfit feminine, casual date, maupun kondangan cute!',
    details: [
      'Material: High grade shell pearl, silver alloy ribbon charm, hypoallergenic clasp',
      'Panjang: 38cm + 6cm rantai extension',
      'Anti karat dan aman untuk kulit sensitif',
      'Packaging pouch satin eksklusif Dissof.id'
    ],
    images: [
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 12,
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    variants: ['Silver Bow', 'Gold Ribbon', 'Heart Pendant'],
    tags: ['necklace', 'pearl', 'coquette', 'ribbon'],
    rating: 5,
    review_count: 19,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-04',
    name: 'Gummy Bear Candy Beads Ring Set (Pack of 3)',
    slug: 'gummy-bear-candy-beads-ring-set',
    category_id: 'beaded',
    category_name: 'Beaded Accessories',
    price: 22000,
    original_price: 30000,
    description: 'Set 3 pcs cincin manik-manik warna pastel cerah dengan charm gummy bear mungil, daisy flower, dan pearl stacking ring. Super gemas dipakai bertumpuk!',
    details: [
      'Isi: 3 cincin manik kombinasi (Gummy Bear + Daisy Flower + Pearl Minimalist)',
      'Tali elastis stretchable fits ukuran 5 - 8',
      'Warna ceria tidak mudah pudar'
    ],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 30,
    is_best_seller: false,
    is_sold_out: false,
    is_visible: true,
    variants: ['Pastel Candy Mix', 'Ocean Blue Set', 'Sakura Blossom Set'],
    tags: ['ring', 'beaded', 'gummybear', 'cute'],
    rating: 4.8,
    review_count: 15,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-05',
    name: 'Custom Initials Heartmade Bracelet ♡',
    slug: 'custom-initials-heartmade-bracelet',
    category_id: 'custom',
    category_name: 'Custom',
    price: 40000,
    original_price: 50000,
    description: 'Gelang custom dengan inisial nama kamu atau sahabat/pasangan! Kamu bebas memilih kombinasi warna manik, 2 charm favorit, dan huruf inisial hingga 8 karakter.',
    details: [
      'Custom huruf inisial A-Z, angka 0-9, dan simbol hati ♡',
      'Pilihan charm: Heart, Star, Bow, Butterfly, Bear, Smile',
      'Cocok untuk kado ulang tahun, couple bracelet, atau friendship bracelet',
      'Termasuk kartu ucapan mini gratis'
    ],
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 50,
    is_best_seller: true,
    is_sold_out: false,
    is_visible: true,
    variants: ['Single Custom', 'Couple Set (2 Pcs - Hemat Rp 10k)', 'Bestie Pack (3 Pcs)'],
    tags: ['custom', 'initial', 'couple', 'gift'],
    rating: 5,
    review_count: 42,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-06',
    name: 'Matcha Blossom Layered Beaded Necklace',
    slug: 'matcha-blossom-layered-beaded-necklace',
    category_id: 'necklaces',
    category_name: 'Necklaces',
    price: 45000,
    original_price: 55000,
    description: 'Kalung manik warna sage green matcha dengan kombinasi mutiara putih dan bunga daisy mungil. Tampilan fresh dan aesthetic untuk OOTD santai.',
    details: [
      'Material: Seed beads 3mm, acrylic daisy, glass beads, lobster clasp',
      'Panjang: 40cm + extender 5cm',
      'Ringan dan nyaman di leher seharian'
    ],
    images: [
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 0,
    is_best_seller: false,
    is_sold_out: true,
    is_visible: true,
    variants: ['Matcha Sage Green', 'Baby Sky Blue', 'Butter Sunshine'],
    tags: ['necklace', 'matcha', 'daisy', 'aesthetic'],
    rating: 4.9,
    review_count: 11,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-07',
    name: 'Cloud Nine Pastel Sky Phone Strap ☁️',
    slug: 'cloud-nine-pastel-sky-phone-strap',
    category_id: 'phone-charms',
    category_name: 'Phone Charms',
    price: 29000,
    original_price: 36000,
    description: 'Gantungan handphone dengan nuansa awan biru muda dan putih susu, dihiasi charm bintang berbinar dan mutiara bulat lembut. Membuat case HP kamu terlihat 10x lebih aesthetic!',
    details: [
      'Material: High durability phone cord, frosted cloud beads, crystal stars',
      'Panjang: 23cm',
      'Finishing kuat anti-putus'
    ],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 14,
    is_best_seller: false,
    is_sold_out: false,
    is_visible: true,
    variants: ['Sky Blue Cloud', 'Cotton Candy Pink', 'Night Starlight'],
    tags: ['phonecharm', 'cloud', 'sky', 'blue'],
    rating: 4.9,
    review_count: 18,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-08',
    name: 'Sweet Cherry & Pearl Keychain / Bag Charm 🍒',
    slug: 'sweet-cherry-pearl-keychain-bag-charm',
    category_id: 'beaded',
    category_name: 'Beaded Accessories',
    price: 25000,
    original_price: 32000,
    description: 'Gantungan tas dan kunci berbentuk buah cherry merah menggemaskan dengan rantai mutiara dan ring gold yang kokoh. Cocok untuk tote bag, ransel, maupun gantungan kunci motor/mobil.',
    details: [
      'Material: Resin 3D Cherry Charm, faux pearl chain, sturdy gold key ring',
      'Panjang: ~14cm',
      'Dapat dikaitkan pada zipper tas atau kunci'
    ],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80'
    ],
    stock: 22,
    is_best_seller: false,
    is_sold_out: false,
    is_visible: true,
    variants: ['Red Cherry', 'Pink Peach', 'Green Apple'],
    tags: ['keychain', 'bagcharm', 'cherry', 'fruit'],
    rating: 5,
    review_count: 14,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'testi-01',
    customer_name: 'Dinda Maharani',
    customer_handle: '@dindamhrn',
    product_name: 'Strawberry Milk Charm Bracelet ♡',
    rating: 5,
    review: 'Gelangnya bener-bener cantik banget aslinya! Detail manik dan charm strawberry nya super rapi, gak gampang lepas. Packagingnya juga dapet pouch pink gemes. Pasti repeat order lagii ♡',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    is_featured: true,
    date: '2026-08-15',
    created_at: new Date().toISOString()
  },
  {
    id: 'testi-02',
    customer_name: 'Salsabila Putri',
    customer_handle: '@salsabilap_',
    product_name: 'Lilac Dream Phone Charm ✧',
    rating: 5,
    review: 'Beli langsung pas mampir ke Car Free Night Soebrantas Pekanbaru! Kakaknya ramah banget, phone strapnya kuat gak gampang putus padahal HP aku lumayan berat. Highly recommended!',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    is_featured: true,
    date: '2026-08-12',
    created_at: new Date().toISOString()
  },
  {
    id: 'testi-03',
    customer_name: 'Anindya Aurelia',
    customer_handle: '@anindyarelia',
    product_name: 'Custom Initials Heartmade Bracelet ♡',
    rating: 5,
    review: 'Order custom buat kado sahabat wisuda, hasilnya melebihi ekspektasi! Request warna lilac-silver dan inisial namanya pas banget. Adminnya fast response dan ramah poll.',
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    is_featured: true,
    date: '2026-08-08',
    created_at: new Date().toISOString()
  },
  {
    id: 'testi-04',
    customer_name: 'Vania Clarissa',
    customer_handle: '@clari.vania',
    product_name: 'Coquette Pearl & Ribbon Choker ♡',
    rating: 5,
    review: 'Chokernya mewah tapi tetep cute. Dipake ke kampus atau nongkrong di cafe banyak yang nanya beli di mana. Bahannya juga gak bikin gatal di leher. Love it Dissof!',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    is_featured: true,
    date: '2026-08-02',
    created_at: new Date().toISOString()
  }
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'event-01',
    title: 'Dissof Pop-Up @ Car Free Night Soebrantas',
    tagline: 'Weekend Beads & Accessories Showcase ♡',
    location: 'Car Free Night, Jl. HR. Soebrantas, Panam, Pekanbaru (Dekat Pintu Masuk Utama)',
    date: '2026-08-22',
    time: '19.00 - 23.00 WIB',
    status: 'upcoming',
    poster_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Kunjungi booth Dissof.id di Car Free Night Soebrantas Pekanbaru! Kamu bisa cobain langsung aneka charm bracelet, phone charm, kalung beads, dan ikutan DIY Live Custom Bracelet di tempat. Dapatkan free sticker pack untuk setiap pembelian!',
    booth_number: 'Booth A-12 (Tenda Pink Dissof)',
    google_maps_url: 'https://maps.google.com/?q=Car+Free+Night+Soebrantas+Pekanbaru',
    created_at: new Date().toISOString()
  },
  {
    id: 'event-02',
    title: 'Pekanbaru Creative & Youth Craft Fair 2026',
    tagline: 'Handmade Local Brand Exhibition',
    location: 'Mall SKA Pekanbaru - Atrium Kampar Lt. Dasar',
    date: '2026-09-05',
    time: '10.00 - 22.00 WIB',
    status: 'upcoming',
    poster_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Edisi spesial pameran brand lokal Pekanbaru. Dissof.id akan merilis Exclusive Collection "Sakura Fairy Beads" yang hanya ada di event ini.',
    booth_number: 'Booth No. 28',
    google_maps_url: 'https://maps.google.com/?q=Mall+SKA+Pekanbaru',
    created_at: new Date().toISOString()
  },
  {
    id: 'event-03',
    title: 'Weekend Market Soebrantas Summer Edition',
    tagline: 'Pop-up Bazaar & Flash Sale Aksesoris',
    location: 'Area Car Free Night Soebrantas Pekanbaru',
    date: '2026-07-25',
    time: '19.00 - 23.00 WIB',
    status: 'past',
    poster_url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Terima kasih banyak untuk 150+ lovely customers yang sudah borong aksesoris Dissof di CFN Soebrantas! Sold out lebih dari 80 pcs gelang & phone charm.',
    booth_number: 'Booth A-12',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-20260818-001',
    customer_name: 'Nadia Rahmawati',
    customer_whatsapp: '081371234567',
    customer_address: 'Jl. Garuda No. 12, Sukajadi, Pekanbaru',
    items: [
      {
        product_id: 'prod-01',
        product_name: 'Strawberry Milk Charm Bracelet ♡',
        price: 35000,
        quantity: 2,
        variant: 'Chain + Extender (16-20cm)',
        image: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80'
      },
      {
        product_id: 'prod-02',
        product_name: 'Lilac Dream Y2K Phone Charm ✧',
        price: 28000,
        quantity: 1,
        variant: 'Lilac Butterfly',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 98000,
    shipping_fee: 10000,
    total: 108000,
    order_notes: 'Tolong beri pita kado ya kak, mau buat kado ultah teman ♡',
    source: 'whatsapp',
    status: 'Processing',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ORD-20260817-002',
    customer_name: 'Tiara Indah',
    customer_whatsapp: '085278901234',
    customer_address: 'Tampan, Pekanbaru (Ambil di CFN Soebrantas)',
    items: [
      {
        product_id: 'prod-03',
        product_name: 'Coquette Pearl & Ribbon Choker ♡',
        price: 48000,
        quantity: 1,
        variant: 'Silver Bow',
        image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 48000,
    shipping_fee: 0,
    total: 48000,
    order_notes: 'Mau ambil langsung pas malam minggu di CFN ya kak',
    source: 'whatsapp',
    status: 'Completed',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_CUSTOM_REQUESTS: CustomRequest[] = [
  {
    id: 'CUST-20260818-01',
    customer_name: 'Alya Zahrani',
    customer_whatsapp: '081268903344',
    accessory_type: 'Charm Bracelet',
    color_theme: 'Pastel Lilac & Baby Pink',
    charms_selected: ['Heart Pearl', 'Bow Ribbon', 'Daisy Flower', 'Angel Wings'],
    custom_initials: 'ALYA ♡',
    special_notes: 'Pengen ada beads bintang kelap-kelip holographic dan ukuran pas di tangan 15.5cm.',
    reference_image_url: 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=600&auto=format&fit=crop&q=80',
    estimated_budget: 45000,
    status: 'In Production',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'CUST-20260816-02',
    customer_name: 'Fani Oktavia',
    customer_whatsapp: '085367891234',
    accessory_type: 'Phone Charm / Strap',
    color_theme: 'Ocean Sky Blue & Pearl White',
    charms_selected: ['Starfish', 'Blue Butterfly', 'Cloud Bead'],
    custom_initials: 'FANI ☆',
    special_notes: 'Tali nylon kuat ya kak, buat case iPhone 14.',
    estimated_budget: 35000,
    status: 'Contacted',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Seed Admin User (username: "admin", password: "dissof2026!")
const defaultAdminPasswordHash = bcrypt.hashSync('dissof2026!', 10);
const INITIAL_USERS = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    name: 'Dissof Owner',
    role: 'admin' as const,
    password_hash: defaultAdminPasswordHash
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: { ...INITIAL_SETTINGS, ...parsed.settings },
          categories: parsed.categories || INITIAL_CATEGORIES,
          products: parsed.products || INITIAL_PRODUCTS,
          orders: parsed.orders || INITIAL_ORDERS,
          custom_requests: parsed.custom_requests || INITIAL_CUSTOM_REQUESTS,
          events: parsed.events || INITIAL_EVENTS,
          testimonials: parsed.testimonials || INITIAL_TESTIMONIALS,
          users: parsed.users || INITIAL_USERS
        };
      } catch (err) {
        console.error('Error reading database file, using initial data:', err);
      }
    }
    const initial: DatabaseSchema = {
      settings: INITIAL_SETTINGS,
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      custom_requests: INITIAL_CUSTOM_REQUESTS,
      events: INITIAL_EVENTS,
      testimonials: INITIAL_TESTIMONIALS,
      users: INITIAL_USERS
    };
    this.saveDataDirect(initial);
    return initial;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  // --- Settings ---
  public getSettings(): SiteSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.data.settings = { ...this.data.settings, ...updates, id: 'main' };
    this.save();
    return this.data.settings;
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return this.data.categories.sort((a, b) => a.display_order - b.display_order);
  }

  public getCategory(id: string): Category | undefined {
    return this.data.categories.find(c => c.id === id || c.slug === id);
  }

  public saveCategory(category: Category): Category {
    const idx = this.data.categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.data.categories[idx] = category;
    } else {
      this.data.categories.push(category);
    }
    this.save();
    return category;
  }

  // --- Products ---
  public getProducts(filter?: { category_id?: string; best_seller?: boolean; search?: string; visible_only?: boolean }): Product[] {
    let result = [...this.data.products];
    if (filter?.visible_only) {
      result = result.filter(p => p.is_visible !== false);
    }
    if (filter?.category_id && filter.category_id !== 'all') {
      result = result.filter(p => p.category_id === filter.category_id);
    }
    if (filter?.best_seller) {
      result = result.filter(p => p.is_best_seller);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }

  public getProduct(idOrSlug: string): Product | undefined {
    return this.data.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  }

  public createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const id = `prod-${Date.now()}`;
    const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = this.data.categories.find(c => c.id === productData.category_id);
    
    const newProduct: Product = {
      ...productData,
      id,
      slug,
      category_name: category ? category.name : productData.category_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    
    const category = updates.category_id ? this.data.categories.find(c => c.id === updates.category_id) : undefined;
    
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      category_name: category ? category.name : (updates.category_name || this.data.products[idx].category_name),
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return [...this.data.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOrder(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Order {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const id = `ORD-${today}-${randomSuffix}`;

    const newOrder: Order = {
      ...orderData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.orders.unshift(newOrder);

    // Auto deduct stock for purchased items
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        const p = this.data.products.find(prod => prod.id === item.product_id);
        if (p && typeof p.stock === 'number') {
          p.stock = Math.max(0, p.stock - item.quantity);
          if (p.stock === 0) {
            p.is_sold_out = true;
          }
        }
      }
    }

    this.save();
    return newOrder;
  }

  public updateOrderStatus(id: string, status: Order['status']): Order | null {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return null;
    order.status = status;
    order.updated_at = new Date().toISOString();
    this.save();
    return order;
  }

  public deleteOrder(id: string): boolean {
    const initialLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter(o => o.id !== id);
    if (this.data.orders.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Custom Requests ---
  public getCustomRequests(): CustomRequest[] {
    return [...this.data.custom_requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createCustomRequest(data: Omit<CustomRequest, 'id' | 'created_at'>): CustomRequest {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const id = `CUST-${today}-${randomSuffix}`;

    const newReq: CustomRequest = {
      ...data,
      id,
      created_at: new Date().toISOString()
    };
    this.data.custom_requests.unshift(newReq);
    this.save();
    return newReq;
  }

  public updateCustomRequestStatus(id: string, status: CustomRequest['status']): CustomRequest | null {
    const req = this.data.custom_requests.find(r => r.id === id);
    if (!req) return null;
    req.status = status;
    req.updated_at = new Date().toISOString();
    this.save();
    return req;
  }

  public deleteCustomRequest(id: string): boolean {
    const initialLen = this.data.custom_requests.length;
    this.data.custom_requests = this.data.custom_requests.filter(r => r.id !== id);
    if (this.data.custom_requests.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Events ---
  public getEvents(): EventItem[] {
    return [...this.data.events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createEvent(data: Omit<EventItem, 'id' | 'created_at'>): EventItem {
    const id = `event-${Date.now()}`;
    const newEvent: EventItem = {
      ...data,
      id,
      created_at: new Date().toISOString()
    };
    this.data.events.unshift(newEvent);
    this.save();
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<EventItem>): EventItem | null {
    const idx = this.data.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.events[idx] = { ...this.data.events[idx], ...updates };
    this.save();
    return this.data.events[idx];
  }

  public deleteEvent(id: string): boolean {
    const initialLen = this.data.events.length;
    this.data.events = this.data.events.filter(e => e.id !== id);
    if (this.data.events.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Testimonials ---
  public getTestimonials(): Testimonial[] {
    return [...this.data.testimonials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createTestimonial(data: Omit<Testimonial, 'id' | 'created_at'>): Testimonial {
    const id = `testi-${Date.now()}`;
    const newTesti: Testimonial = {
      ...data,
      id,
      created_at: new Date().toISOString()
    };
    this.data.testimonials.unshift(newTesti);
    this.save();
    return newTesti;
  }

  public updateTestimonial(id: string, updates: Partial<Testimonial>): Testimonial | null {
    const idx = this.data.testimonials.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.testimonials[idx] = { ...this.data.testimonials[idx], ...updates };
    this.save();
    return this.data.testimonials[idx];
  }

  public deleteTestimonial(id: string): boolean {
    const initialLen = this.data.testimonials.length;
    this.data.testimonials = this.data.testimonials.filter(t => t.id !== id);
    if (this.data.testimonials.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Admin Users & Auth ---
  public findUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public updateAdminPassword(username: string, newPasswordPlain: string): boolean {
    const user = this.findUserByUsername(username);
    if (!user) return false;
    user.password_hash = bcrypt.hashSync(newPasswordPlain, 10);
    this.save();
    return true;
  }

  public getDashboardStats() {
    const totalProducts = this.data.products.length;
    const totalOrders = this.data.orders.length;
    const pendingOrders = this.data.orders.filter(o => o.status === 'Pending').length;
    const totalRevenue = this.data.orders
      .filter(o => o.status === 'Completed' || o.status === 'Processing')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const totalCustomRequests = this.data.custom_requests.length;
    const newCustomRequests = this.data.custom_requests.filter(r => r.status === 'New').length;
    const lowStockCount = this.data.products.filter(p => p.stock <= 3 && !p.is_sold_out).length;

    return {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalCustomRequests,
      newCustomRequests,
      lowStockCount
    };
  }
}

export const db = new Database();
