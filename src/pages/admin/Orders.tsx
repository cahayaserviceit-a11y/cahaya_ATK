import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { ShoppingBag, ChevronDown, CheckCircle, Clock, Truck, XCircle, ArrowLeft, FileText, Receipt, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { generateInvoice, generatePaymentReceipt, generateFaktur, generateSuratPesanan } from '../../lib/documentGenerator';
import { Capacitor } from '@capacitor/core';

export const AdminOrders: React.FC = () => {
  const { profile: adminProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } finally {
      if (showLoading) setLoading(false);
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

  const handleDownloadDocument = async (order: Order, type: 'invoice' | 'receipt' | 'faktur' | 'sp') => {
    const documentNames = {
      invoice: 'Invoice',
      receipt: 'Bukti Pembayaran',
      faktur: 'Faktur',
      sp: 'Surat Pesanan'
    };
    
    const toastId = toast.loading(`Menyiapkan ${documentNames[type]}...`);
    try {
      // 1. Fetch buyer profile
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (!adminProfile) throw new Error('Profil admin tidak ditemukan');

      // 2. Generate PDF
      let doc;
      switch (type) {
        case 'invoice': doc = await generateInvoice(order, adminProfile, buyerProfile); break;
        case 'receipt': doc = await generatePaymentReceipt(order, buyerProfile); break;
        case 'faktur': doc = await generateFaktur(order, adminProfile, buyerProfile); break;
        case 'sp': doc = await generateSuratPesanan(order, adminProfile, buyerProfile); break;
      }

      const fileName = `${type.toUpperCase()}_${order.id.slice(0, 8)}.pdf`;

      // 3. Handle Download
      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        window.parent.postMessage({
          type: 'DOWNLOAD_FILE',
          data: pdfBase64,
          fileName: fileName,
          mimeType: 'application/pdf'
        }, '*');
        toast.success('Dokumen sedang diproses ke memori HP...', { id: toastId });
      } else {
        doc.save(fileName);
        toast.success('Dokumen berhasil diunduh', { id: toastId });
      }
    } catch (error: any) {
      console.error('PDF Error:', error);
      toast.error('Gagal mengunduh dokumen: ' + error.message, { id: toastId });
    }
  };

  const deleteOrder = async (orderId: string) => {
    const isConfirmed = window.confirm('KONFIRMASI PENGHAPUSAN\n\nApakah Anda yakin ingin menghapus pesanan ini secara permanen? Data pendapatan mungkin akan terpengaruh jika pesanan ini sudah selesai.');
    if (!isConfirmed) return;

    const toastId = toast.loading('Menghapus pesanan...');
    try {
      // Delete order items first
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;
      
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;
      
      toast.success('Pesanan berhasil dihapus', { id: toastId });
      fetchOrders();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus pesanan: ' + error.message, { id: toastId });
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
      <div className="flex items-center space-x-4 bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-emerald-50/50 shadow-sm">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Kelola Pesanan</h1>
          <p className="text-neutral-500">Pantau dan proses pesanan pelanggan</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div 
              className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-[10px] sm:text-xs text-neutral-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end sm:space-x-8 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Total</p>
                  <p className="font-black text-base sm:text-lg">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wider ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                    className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-[10px] sm:text-xs font-bold"
                    title="Hapus Pesanan"
                  >
                    <span>Hapus</span>
                  </button>

                  <ChevronDown className={`w-4 h-4 sm:w-5 h-5 text-neutral-300 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedOrder === order.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-emerald-100 bg-emerald-50/10"
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
                      <div className="bg-white p-4 rounded-2xl border border-neutral-100 space-y-3">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Detail Pengiriman</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Metode:</span>
                            <span className="font-bold">{order.payment_method === 'cod' ? 'COD (Bayar di Tempat)' : 'QRIS / Transfer Bank'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Telepon:</span>
                            <span className="font-bold">{order.phone}</span>
                          </div>
                          <div className="flex flex-col text-sm">
                            <span className="text-neutral-500">Alamat:</span>
                            <span className="font-bold mt-1">{order.address}</span>
                          </div>
                        </div>
                      </div>

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
                      
                      <div className="p-4 bg-emerald-50/5 rounded-2xl border border-emerald-100">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Informasi Pembayaran</h4>
                        <p className="text-sm text-emerald-900">Pembayaran dilakukan melalui Transfer Bank / E-Wallet. Silakan verifikasi bukti bayar sebelum memproses pesanan.</p>
                      </div>

                      {/* Document Actions */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Dokumen Pesanan</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            onClick={() => handleDownloadDocument(order, 'invoice')}
                            className="flex flex-col items-center justify-center space-y-1 bg-neutral-900 text-white p-3 rounded-xl text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(order, 'faktur')}
                            className="flex flex-col items-center justify-center space-y-1 bg-white text-neutral-900 border border-neutral-200 p-3 rounded-xl text-[10px] font-bold hover:bg-neutral-50 transition-all shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Faktur</span>
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(order, 'sp')}
                            className="flex flex-col items-center justify-center space-y-1 bg-white text-neutral-900 border border-neutral-200 p-3 rounded-xl text-[10px] font-bold hover:bg-neutral-50 transition-all shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>SP</span>
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(order, 'receipt')}
                            className="flex flex-col items-center justify-center space-y-1 bg-white text-neutral-900 border border-neutral-200 p-3 rounded-xl text-[10px] font-bold hover:bg-neutral-50 transition-all shadow-sm"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>Nota</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">
                          * Dokumen resmi dengan perhitungan PPN 12% dan PPh 22.
                        </p>
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
