import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { ShoppingBag, ChevronDown, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      toast.success(`Status pesanan diperbarui ke ${status}`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Gagal memperbarui status: ' + error.message);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing': return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-600" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Kelola Pesanan</h1>
        <p className="text-neutral-500">Pantau dan proses pesanan pelanggan</p>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div 
              className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-xs text-neutral-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Total</p>
                  <p className="font-black text-lg">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                </div>
                
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusClass(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>

                <ChevronDown className={`w-5 h-5 text-neutral-300 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
              </div>
            </div>

            <AnimatePresence>
              {expandedOrder === order.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-neutral-50 bg-neutral-50/30"
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Items List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Daftar Barang</h4>
                      <div className="space-y-2">
                        {order.order_items?.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-neutral-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-neutral-50 rounded-lg overflow-hidden">
                                <img 
                                  src={item.product?.image_url || `https://picsum.photos/seed/${item.product_id}/100/100`} 
                                  alt="Product" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{item.product?.name || 'Produk Terhapus'}</p>
                                <p className="text-xs text-neutral-400">{item.quantity} x Rp {item.price_at_time.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions & Info */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Update Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as Order['status'][]).map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(order.id, s)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                                order.status === s 
                                ? 'bg-neutral-900 text-white border-neutral-900' 
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-emerald-500'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Informasi Pembayaran</h4>
                        <p className="text-sm text-emerald-900">Pembayaran dilakukan melalui Transfer Bank / E-Wallet. Silakan verifikasi bukti bayar sebelum memproses pesanan.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
