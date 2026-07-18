import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, Package, ArrowRight, MoreVertical, ArrowLeft, Download, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateInvoiceTagihan } from '../components/orders/documents/InvoiceTagihan';
import { generateFakturPenjualan } from '../components/orders/documents/FakturPenjualan';
import { generateSuratPesanan } from '../components/orders/documents/SuratPesanan';
import { generateKwitansiPembayaran } from '../components/orders/documents/KwitansiPembayaran';

export const Orders: React.FC = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();

      const channel = supabase
        .channel(`user-orders-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          () => {
            fetchOrders(false);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?');
    if (!isConfirmed) return;

    const toastId = toast.loading('Membatalkan pesanan...');
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Pesanan berhasil dibatalkan', { id: toastId });
      fetchOrders();
    } catch (error: any) {
      toast.error('Gagal membatalkan pesanan: ' + error.message, { id: toastId });
    }
  };

  const handleDownloadDocument = async (order: Order, type: 'invoice' | 'faktur' | 'surat_pesanan' | 'kwitansi') => {
    switch (type) {
      case 'invoice':
        await generateInvoiceTagihan(order, user, profile);
        break;
      case 'faktur':
        await generateFakturPenjualan(order, user, profile);
        break;
      case 'surat_pesanan':
        await generateSuratPesanan(order, user, profile);
        break;
      case 'kwitansi':
        await generateKwitansiPembayaran(order, user, profile);
        break;
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
      <div className="text-center py-20 bg-emerald-50/5 rounded-3xl border border-dashed border-emerald-200">
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
      <div className="flex items-center space-x-4 bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-emerald-50/50 shadow-sm">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold">Pesanan Saya</h1>
      </div>
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
              
              {order.status === 'pending' && (
                <div className="relative group">
                  <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-neutral-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-xl py-2 z-10 hidden group-hover:block min-w-[160px]">
                    <button 
                      onClick={() => cancelOrder(order.id)}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Batalkan Pesanan
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-emerald-50/10">
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
                  
                  {order.status === 'delivered' && (
                    <div className="pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Dokumen Pesanan</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <button 
                          onClick={() => handleDownloadDocument(order, 'invoice')}
                          className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-white transition-colors">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-neutral-700">Invoice Tagihan</span>
                          </div>
                          <Download className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600" />
                        </button>
                        
                        <button 
                          onClick={() => handleDownloadDocument(order, 'faktur')}
                          className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-white transition-colors">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-neutral-700">Faktur Penjualan</span>
                          </div>
                          <Download className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600" />
                        </button>
                        
                        <button 
                          onClick={() => handleDownloadDocument(order, 'surat_pesanan')}
                          className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-white transition-colors">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-neutral-700">Surat Pesanan</span>
                          </div>
                          <Download className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600" />
                        </button>

                        <button 
                          onClick={() => handleDownloadDocument(order, 'kwitansi')}
                          className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-white transition-colors">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-neutral-700">Kwitansi Pembayaran</span>
                          </div>
                          <Download className="w-4 h-4 text-neutral-300 group-hover:text-emerald-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
