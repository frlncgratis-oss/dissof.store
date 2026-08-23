import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wand2, 
  Search, 
  MessageCircle, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import { CustomRequest } from '../../types';
import { formatDate, createWhatsAppLink } from '../../lib/utils';
import { ImageWithFallback, FALLBACK_PRODUCT_IMAGE } from '../../components/common/ImageWithFallback';

const CUSTOM_REQUESTS_KEY = 'customRequests';

export const AdminCustomRequestsPage: React.FC = () => {
  const { settings } = useStore();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      // 1. Check LocalStorage first
      const savedRaw = localStorage.getItem(CUSTOM_REQUESTS_KEY);
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRequests(parsed);
            return;
          }
        } catch {
          // ignore
        }
      }

      // 2. Fallback to API if LocalStorage is empty
      const data = await api.getCustomRequests().catch(() => []);
      if (data && data.length > 0) {
        setRequests(data);
        localStorage.setItem(CUSTOM_REQUESTS_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error loading custom requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: CustomRequest['status']) => {
    setRequests((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r));
      try {
        localStorage.setItem(CUSTOM_REQUESTS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update custom requests in LocalStorage:', e);
      }
      return updated;
    });

    // Optional background sync
    try {
      await api.updateCustomRequestStatus(id, status);
    } catch {
      // ignore
    }
  };

  const handleDeleteRequest = async (req: CustomRequest) => {
    if (confirm(`Hapus custom request dari "${req.customer_name}"?`)) {
      setRequests((prev) => {
        const updated = prev.filter((r) => r.id !== req.id);
        try {
          localStorage.setItem(CUSTOM_REQUESTS_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to delete custom request in LocalStorage:', e);
        }
        return updated;
      });

      // Optional background sync
      try {
        await api.deleteCustomRequest(req.id);
      } catch {
        // ignore
      }
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      const q = String(searchQuery || '').trim().toLowerCase();
      if (q) {
        return (
          String(r?.customer_name || '').toLowerCase().includes(q) ||
          String(r?.customer_whatsapp || '').includes(q) ||
          String(r?.accessory_type || '').toLowerCase().includes(q) ||
          String(r?.custom_initials || '').toLowerCase().includes(q) ||
          String(r?.special_notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
            Custom Accessories Requests ♡
          </h1>
          <p className="text-xs text-[#A08C8C] mt-0.5 font-medium">
            Permintaan pembuatan gelang nama, phone strap inisial, dan desain beads dari customer.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A08C8C]" />
          <input
            type="text"
            placeholder="Cari nama, inisial, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F9F7F2] border border-black/5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9AA2]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'New', 'Contacted', 'In Production', 'Completed', 'Cancelled'].map((status) => {
            const count = status === 'all' ? requests.length : requests.filter((r) => r.status === status).length;
            const active = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#2D2D2D] text-white'
                    : 'bg-[#F9F7F2] text-[#63534B] hover:bg-[#FFEFF1]'
                }`}
              >
                {status === 'all' ? 'Semua' : status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-black/5 text-gray-400 text-xs">
            Tidak ada custom request yang sesuai.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-xs space-y-4 hover:border-[#FFD1DC] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex items-start justify-between gap-2 border-b border-black/5 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#FF9AA2] tracking-wider">
                      {req.accessory_type}
                    </span>
                    <h3 className="font-bold text-sm text-[#2D2D2D]">{req.customer_name}</h3>
                    <span className="text-[10px] text-[#A08C8C]">{formatDate(req.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateStatus(req.id, e.target.value as any)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                        req.status === 'New'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : req.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : req.status === 'In Production'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : req.status === 'Contacted'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="In Production">In Production</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => handleDeleteRequest(req)}
                      className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-[#F9F7F2] p-3.5 rounded-xl space-y-1.5 text-xs text-[#52443C]">
                  <p>
                    <span className="font-bold text-[#2D2D2D]">Palet Warna:</span> {req.color_theme}
                  </p>
                  {req.custom_initials && (
                    <p className="text-pink-700 font-bold bg-[#FFEFF1] px-2 py-0.5 rounded-md inline-block">
                      Inisial: "{req.custom_initials}"
                    </p>
                  )}
                  <p>
                    <span className="font-bold text-[#2D2D2D]">Charms:</span>{' '}
                    {req.charms_selected && req.charms_selected.length > 0
                      ? req.charms_selected.join(', ')
                      : 'Default'}
                  </p>
                  {req.special_notes && (
                    <p className="pt-1 text-[11px] italic text-[#63534B]">
                      "{req.special_notes}"
                    </p>
                  )}
                </div>

                {/* Reference photo preview */}
                {req.reference_image_url && (
                  <div className="flex items-center gap-2 pt-1">
                    <ImageWithFallback
                      src={req.reference_image_url}
                      alt="Reference"
                      onClick={() => setPreviewImage(req.reference_image_url || null)}
                      className="w-12 h-12 rounded-lg object-cover border border-black/10 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <button
                      onClick={() => setPreviewImage(req.reference_image_url || null)}
                      className="text-[11px] text-[#FF9AA2] font-bold hover:underline cursor-pointer"
                    >
                      Lihat Foto Referensi Customer →
                    </button>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-black/5">
                <a
                  href={createWhatsAppLink(
                    req.customer_whatsapp,
                    `Halo kak ${req.customer_name} ♡ Ini admin ${settings?.brand_name || 'DISSOF.ID'} terkait custom ${req.accessory_type} yang kamu ajukan.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-full bg-[#2D2D2D] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#FF9AA2]" />
                  <span>Chat WhatsApp ({req.customer_whatsapp})</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-xl max-h-[85vh] bg-white rounded-3xl overflow-hidden p-2">
            <ImageWithFallback src={previewImage} alt="Preview zoom" className="w-full h-auto max-h-[75vh] object-contain rounded-2xl" />
            <p className="text-center text-xs text-[#2D2D2D] font-bold py-2">Klik di luar gambar untuk menutup</p>
          </div>
        </div>
      )}

    </div>
  );
};
