import { Product, Category, Order, CustomRequest, EventItem, Testimonial, SiteSettings, AdminUser } from '../types';

const API_BASE = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('dissof_admin_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Terjadi kesalahan saat memproses data.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // --- Auth ---
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: AdminUser; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request<{ user: AdminUser }>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // --- Settings ---
  getSettings: () => request<SiteSettings>('/settings'),
  updateSettings: (settings: Partial<SiteSettings>) =>
    request<{ message: string; settings: SiteSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // --- Categories ---
  getCategories: () => request<Category[]>('/categories'),

  // --- Products ---
  getProducts: (params?: { category?: string; best_seller?: boolean; search?: string; all?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.best_seller) searchParams.append('best_seller', 'true');
    if (params?.search) searchParams.append('search', params.search);
    if (params?.all) searchParams.append('all', 'true');
    const query = searchParams.toString();
    return request<Product[]>(`/products${query ? `?${query}` : ''}`);
  },

  getProduct: (idOrSlug: string) => request<Product>(`/products/${idOrSlug}`),

  createProduct: (product: Partial<Product>) =>
    request<{ message: string; product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  updateProduct: (id: string, product: Partial<Product>) =>
    request<{ message: string; product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // --- Orders ---
  createOrder: (order: Partial<Order>) =>
    request<{ message: string; order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),

  getOrders: () => request<Order[]>('/orders'),

  updateOrderStatus: (id: string, status: Order['status']) =>
    request<{ message: string; order: Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteOrder: (id: string) =>
    request<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    }),

  // --- Custom Requests ---
  createCustomRequest: (data: Partial<CustomRequest>) =>
    request<{ message: string; custom_request: CustomRequest }>('/custom-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCustomRequests: () => request<CustomRequest[]>('/custom-requests'),

  updateCustomRequestStatus: (id: string, status: CustomRequest['status']) =>
    request<{ message: string; custom_request: CustomRequest }>(`/custom-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteCustomRequest: (id: string) =>
    request<{ message: string }>(`/custom-requests/${id}`, {
      method: 'DELETE',
    }),

  // --- Events ---
  getEvents: () => request<EventItem[]>('/events'),

  createEvent: (event: Partial<EventItem>) =>
    request<{ message: string; event: EventItem }>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  updateEvent: (id: string, event: Partial<EventItem>) =>
    request<{ message: string; event: EventItem }>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    }),

  deleteEvent: (id: string) =>
    request<{ message: string }>(`/events/${id}`, {
      method: 'DELETE',
    }),

  // --- Testimonials ---
  getTestimonials: () => request<Testimonial[]>('/testimonials'),

  createTestimonial: (testi: Partial<Testimonial>) =>
    request<{ message: string; testimonial: Testimonial }>('/testimonials', {
      method: 'POST',
      body: JSON.stringify(testi),
    }),

  updateTestimonial: (id: string, testi: Partial<Testimonial>) =>
    request<{ message: string; testimonial: Testimonial }>(`/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testi),
    }),

  deleteTestimonial: (id: string) =>
    request<{ message: string }>(`/testimonials/${id}`, {
      method: 'DELETE',
    }),

  // --- Uploads ---
  uploadImages: async (files: FileList | File[]) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengupload gambar.');
    }
    return res.json() as Promise<{ urls: string[]; url: string }>;
  },

  // --- Admin Stats ---
  getStats: () =>
    request<{
      totalProducts: number;
      totalOrders: number;
      pendingOrders: number;
      totalRevenue: number;
      totalCustomRequests: number;
      newCustomRequests: number;
      lowStockCount: number;
    }>('/stats'),
};
