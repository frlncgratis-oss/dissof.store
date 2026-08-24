import React, { useEffect, useState } from 'react';
import { Bell, Package, X, ArrowRight, Volume2 } from 'lucide-react';
import { Order } from '../../types';
import { formatIDR, playNotificationChime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface GlobalOrderNotifierProps {
  onNavigateToOrders: () => void;
}

export const GlobalOrderNotifier: React.FC<GlobalOrderNotifierProps> = ({ onNavigateToOrders }) => {
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let timer: any = null;

    const handleNewOrder = (e: any) => {
      const order = e.detail as Order;
      if (order) {
        setNewOrder(order);
        // Play chime sound
        playNotificationChime(true);

        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setNewOrder(null);
        }, 30000); // Display for 30s
      }
    };

    window.addEventListener('dissof_new_order', handleNewOrder);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('dissof_new_order', handleNewOrder);
    };
  }, []);

  if (!newOrder) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[420px] z-[9999] animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-gradient-to-br from-[#1E1B18] via-[#2A2421] to-[#1E1B18] text-white p-4.5 rounded-3xl shadow-2xl border-2 border-pink-400 ring-4 ring-pink-500/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/50 animate-bounce">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-300 bg-pink-950/80 border border-pink-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Pesanan Baru Masuk! ♡
                </span>
              </div>
              <h4 className="font-bold text-base text-white tracking-tight">
                {newOrder.customer_name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-pink-200 font-bold">
                <span className="text-pink-300">{formatIDR(newOrder.total)}</span>
                <span className="text-white/40">•</span>
                <span className="text-gray-300 text-[11px] font-normal">
                  {newOrder.items?.length || 1} Item
                </span>
                <span className="text-white/40">•</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white">
                  {newOrder.payment_method === 'qris' ? 'QRIS' : newOrder.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'WhatsApp'}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 line-clamp-1">
                {newOrder.items?.map(it => `${it.quantity}x ${it.product_name}`).join(', ') || `ID: #${newOrder.id}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setNewOrder(null)}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-pink-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Notifikasi Live HP Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => playNotificationChime(true)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-pink-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
              title="Bunyikan suara lonceng lagi"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setNewOrder(null);
                onNavigateToOrders();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-pink-500/30 cursor-pointer"
            >
              <span>Buka Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
