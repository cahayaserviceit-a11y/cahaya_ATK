import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, Package, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } finally {
      setLoading(false);
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

  if (loading) return <div className="animate-pulse space-y-4">...</div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-neutral-300" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Belum Ada Pesanan</h2>
        <p className="text-neutral-500 mb-8">Anda belum melakukan pemesanan apapun.</p>
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <span>Mulai Belanja</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Pesanan Saya</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">ID Pesanan</p>
                <h3 className="font-bold">#{order.id.slice(0, 8)}</h3>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Tanggal</p>
                <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Total</p>
                <p className="text-sm font-bold text-emerald-600">Rp {order.total_amount.toLocaleString('id-ID')}</p>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusClass(order.status)}`}>
                {getStatusIcon(order.status)}
                <span>{order.status}</span>
              </div>
            </div>
            <div className="p-6 bg-neutral-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Barang</h4>
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-neutral-100">
                      <div className="w-10 h-10 bg-neutral-50 rounded-lg overflow-hidden">
                        <img 
                          src={item.product?.image_url || `https://picsum.photos/seed/${item.product_id}/100/100`} 
                          alt="Product" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold">{item.product?.name || 'Produk'}</p>
                        <p className="text-xs text-neutral-400">{item.quantity} x Rp {item.price_at_time.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Detail Pengiriman</h4>
                  <div className="bg-white p-4 rounded-xl border border-neutral-100 space-y-2">
                    <p className="text-sm"><span className="font-bold">Metode:</span> {order.payment_method === 'cod' ? 'COD (Bayar di Tempat)' : 'QRIS / Transfer'}</p>
                    <p className="text-sm"><span className="font-bold">Telepon:</span> {order.phone}</p>
                    <p className="text-sm"><span className="font-bold">Alamat:</span> {order.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
