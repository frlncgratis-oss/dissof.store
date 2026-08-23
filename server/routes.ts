import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { generateToken, requireAdmin, AuthenticatedRequest } from './auth';

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Setup multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `dissof-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Hanya format gambar (JPG, PNG, WEBP, GIF, SVG) yang diperbolehkan!'));
  },
});

// ==================== AUTHENTICATION ====================
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi!' });
  }

  const user = db.findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  return res.json({
    message: 'Login berhasil ♡',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
});

router.get('/auth/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

router.post('/auth/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi!' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter!' });
  }

  const user = db.findUserByUsername(req.user!.username);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Password saat ini salah!' });
  }

  db.updateAdminPassword(user.username, newPassword);
  res.json({ message: 'Password berhasil diubah!' });
});

// ==================== FILE UPLOADS ====================
router.post('/upload', upload.array('images', 10), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    }

    const urls = files.map(file => `/uploads/${file.filename}`);
    return res.json({
      message: 'Upload berhasil',
      urls,
      url: urls[0], // for single upload compatibility
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal mengunggah file' });
  }
});

// ==================== SITE SETTINGS ====================
router.get('/settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json(settings);
});

router.put('/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json({ message: 'Pengaturan website berhasil diperbarui ♡', settings: updated });
});

// ==================== CATEGORIES ====================
router.get('/categories', (_req: Request, res: Response) => {
  const categories = db.getCategories();
  res.json(categories);
});

// ==================== PRODUCTS ====================
router.get('/products', (req: Request, res: Response) => {
  const { category, best_seller, search, all } = req.query;
  const filter: any = {};

  if (!all) {
    filter.visible_only = true;
  }
  if (category && typeof category === 'string') {
    filter.category_id = category;
  }
  if (best_seller === 'true') {
    filter.best_seller = true;
  }
  if (search && typeof search === 'string') {
    filter.search = search;
  }

  const products = db.getProducts(filter);
  res.json(products);
});

router.get('/products/:idOrSlug', (req: Request, res: Response) => {
  const product = db.getProduct(req.params.idOrSlug);
  if (!product) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }
  res.json(product);
});

router.post('/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, category_id, price, description, images, stock } = req.body;
  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'Nama, kategori, dan harga produk wajib diisi!' });
  }

  const newProduct = db.createProduct({
    name,
    slug: req.body.slug,
    category_id,
    price: Number(price),
    original_price: req.body.original_price ? Number(req.body.original_price) : undefined,
    description: description || '',
    details: Array.isArray(req.body.details) ? req.body.details : (typeof req.body.details === 'string' ? req.body.details.split('\n').filter(Boolean) : []),
    images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=800&auto=format&fit=crop&q=80'],
    stock: stock !== undefined ? Number(stock) : 10,
    is_best_seller: Boolean(req.body.is_best_seller),
    is_sold_out: Number(stock) === 0 || Boolean(req.body.is_sold_out),
    is_visible: req.body.is_visible !== false,
    variants: Array.isArray(req.body.variants) ? req.body.variants : (typeof req.body.variants === 'string' ? req.body.variants.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    tags: Array.isArray(req.body.tags) ? req.body.tags : (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    rating: req.body.rating ? Number(req.body.rating) : 5,
    review_count: req.body.review_count ? Number(req.body.review_count) : 0
  });

  res.status(201).json({ message: 'Produk berhasil ditambahkan ♡', product: newProduct });
});

router.put('/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updates = { ...req.body };
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.original_price !== undefined) updates.original_price = updates.original_price ? Number(updates.original_price) : undefined;
  if (updates.stock !== undefined) {
    updates.stock = Number(updates.stock);
    if (updates.stock === 0) updates.is_sold_out = true;
  }
  if (typeof updates.details === 'string') {
    updates.details = updates.details.split('\n').filter(Boolean);
  }
  if (typeof updates.variants === 'string') {
    updates.variants = updates.variants.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  const updated = db.updateProduct(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }

  res.json({ message: 'Produk berhasil diperbarui ♡', product: updated });
});

router.delete('/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }
  res.json({ message: 'Produk berhasil dihapus.' });
});

// ==================== ORDERS ====================
router.post('/orders', (req: Request, res: Response) => {
  const { customer_name, customer_whatsapp, items, total, subtotal, shipping_fee, order_notes, customer_address } = req.body;

  if (!customer_name || !customer_whatsapp || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nama, nomor WhatsApp, dan produk wajib diisi!' });
  }

  const newOrder = db.createOrder({
    customer_name,
    customer_whatsapp,
    customer_address: customer_address || '',
    items,
    subtotal: Number(subtotal) || Number(total),
    shipping_fee: Number(shipping_fee) || 0,
    total: Number(total),
    order_notes: order_notes || '',
    source: 'whatsapp',
    status: 'Pending'
  });

  res.status(201).json({
    message: 'Pesanan berhasil dicatat ♡',
    order: newOrder,
  });
});

router.get('/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  res.json(orders);
});

router.get('/orders/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const order = db.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }
  res.json(order);
});

router.patch('/orders/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status pesanan wajib diisi.' });
  }

  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }

  res.json({ message: 'Status pesanan diperbarui', order: updated });
});

router.delete('/orders/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteOrder(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }
  res.json({ message: 'Pesanan berhasil dihapus.' });
});

// ==================== CUSTOM REQUESTS ====================
router.post('/custom-requests', (req: Request, res: Response) => {
  const { customer_name, customer_whatsapp, accessory_type, color_theme, charms_selected, custom_initials, special_notes, reference_image_url } = req.body;

  if (!customer_name || !customer_whatsapp || !accessory_type) {
    return res.status(400).json({ error: 'Nama, WhatsApp, dan jenis aksesoris wajib diisi!' });
  }

  const newReq = db.createCustomRequest({
    customer_name,
    customer_whatsapp,
    accessory_type,
    color_theme: color_theme || 'Pastel Mix',
    charms_selected: Array.isArray(charms_selected) ? charms_selected : (charms_selected ? [charms_selected] : []),
    custom_initials: custom_initials || '',
    special_notes: special_notes || '',
    reference_image_url: reference_image_url || '',
    status: 'New'
  });

  res.status(201).json({
    message: 'Custom request berhasil dikirim ♡',
    custom_request: newReq
  });
});

router.get('/custom-requests', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const requests = db.getCustomRequests();
  res.json(requests);
});

router.patch('/custom-requests/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status custom request wajib diisi.' });
  }

  const updated = db.updateCustomRequestStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Custom request tidak ditemukan.' });
  }

  res.json({ message: 'Status custom request diperbarui', custom_request: updated });
});

router.delete('/custom-requests/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCustomRequest(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Custom request tidak ditemukan.' });
  }
  res.json({ message: 'Custom request berhasil dihapus.' });
});

// ==================== EVENTS ====================
router.get('/events', (_req: Request, res: Response) => {
  const events = db.getEvents();
  res.json(events);
});

router.post('/events', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, location, date, time, description, poster_url } = req.body;
  if (!title || !location || !date) {
    return res.status(400).json({ error: 'Judul, lokasi, dan tanggal event wajib diisi!' });
  }

  const newEvent = db.createEvent({
    title,
    tagline: req.body.tagline || '',
    location,
    date,
    time: time || '19.00 - 23.00 WIB',
    status: req.body.status || 'upcoming',
    poster_url: poster_url || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
    gallery_images: Array.isArray(req.body.gallery_images) ? req.body.gallery_images : [],
    description: description || '',
    booth_number: req.body.booth_number || '',
    google_maps_url: req.body.google_maps_url || ''
  });

  res.status(201).json({ message: 'Event berhasil ditambahkan ♡', event: newEvent });
});

router.put('/events/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateEvent(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Event tidak ditemukan.' });
  }
  res.json({ message: 'Event berhasil diperbarui ♡', event: updated });
});

router.delete('/events/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteEvent(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Event tidak ditemukan.' });
  }
  res.json({ message: 'Event berhasil dihapus.' });
});

// ==================== TESTIMONIALS ====================
router.get('/testimonials', (_req: Request, res: Response) => {
  const testimonials = db.getTestimonials();
  res.json(testimonials);
});

router.post('/testimonials', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { customer_name, rating, review } = req.body;
  if (!customer_name || !review) {
    return res.status(400).json({ error: 'Nama customer dan review wajib diisi!' });
  }

  const newTesti = db.createTestimonial({
    customer_name,
    customer_handle: req.body.customer_handle || '',
    product_name: req.body.product_name || '',
    rating: Number(rating) || 5,
    review,
    photo_url: req.body.photo_url || '',
    is_featured: req.body.is_featured !== false,
    date: req.body.date || new Date().toISOString().slice(0, 10)
  });

  res.status(201).json({ message: 'Testimoni berhasil ditambahkan ♡', testimonial: newTesti });
});

router.put('/testimonials/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateTestimonial(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Testimoni tidak ditemukan.' });
  }
  res.json({ message: 'Testimoni berhasil diperbarui ♡', testimonial: updated });
});

router.delete('/testimonials/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteTestimonial(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Testimoni tidak ditemukan.' });
  }
  res.json({ message: 'Testimoni berhasil dihapus.' });
});

// ==================== DASHBOARD STATS ====================
router.get('/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const stats = db.getDashboardStats();
  res.json(stats);
});

export default router;
