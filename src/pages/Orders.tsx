import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, Package, ArrowRight, MoreVertical, ArrowLeft, Download, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const Orders: React.FC = () => {
  const { user } = useAuth();
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

  const handleDownloadDocument = async (order: Order, type: 'invoice' | 'faktur' | 'surat_pesanan') => {
    const docTitle = type === 'invoice' ? 'NOTA PESANAN' : type === 'faktur' ? 'FAKTUR PENJUALAN' : 'SURAT PESANAN';
    const toastId = toast.loading(`Menyiapkan ${docTitle.toLowerCase()}...`);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // 1. Header Logo & Title
      doc.setFontSize(24);
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.setFont(undefined, 'bold');
      doc.text('Cahaya ATK', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Nota Pesanan', 14, 35);
      
      // 2. Buyer & Seller Info Box (Gray Box)
      doc.setFillColor(245, 245, 245);
      doc.rect(14, 40, pageWidth - 28, 45, 'F');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Nama Pembeli:', 20, 48);
      doc.setFont(undefined, 'normal');
      doc.text(user?.email || 'Pelanggan Setia', 50, 48);
      
      doc.setFont(undefined, 'bold');
      doc.text('Alamat Pembeli:', 20, 55);
      doc.setFont(undefined, 'normal');
      doc.text(order.address, 50, 55, { maxWidth: 80 });
      
      doc.setFont(undefined, 'bold');
      doc.text('No. Handphone:', 20, 75);
      doc.setFont(undefined, 'normal');
      doc.text(order.phone, 50, 75);
      
      // Right side of the gray box
      doc.setFont(undefined, 'bold');
      doc.text('Nama Penjual:', 130, 48);
      doc.setFont(undefined, 'normal');
      doc.text('Cahaya ATK', 160, 48);
      
      // 3. Order Summary Row
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('No. Pesanan', 14, 95);
      doc.text('Tanggal Transaksi', 55, 95);
      doc.text('Metode Pembayaran', 100, 95);
      doc.text('Jasa Kirim', 150, 95);
      
      doc.setFont(undefined, 'normal');
      doc.text(order.id.slice(0, 12).toUpperCase(), 14, 102);
      doc.text(new Date(order.created_at).toLocaleDateString('id-ID'), 55, 102);
      doc.text(order.payment_method === 'cod' ? 'COD' : 'QRIS/Transfer', 100, 102);
      doc.text('Reguler', 150, 102);
      
      // 4. Product Details Table
      doc.setFont(undefined, 'bold');
      doc.text('Rincian Pesanan', 14, 115);
      
      const tableData = order.order_items?.map((item, index) => [
        index + 1,
        item.product?.name || 'Produk',
        `Rp ${item.price_at_time.toLocaleString('id-ID')}`,
        item.quantity,
        `Rp ${(item.quantity * item.price_at_time).toLocaleString('id-ID')}`
      ]) || [];
      
      autoTable(doc, {
        startY: 120,
        head: [['No.', 'Produk', 'Harga Produk', 'Kuantitas', 'Subtotal']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [100, 100, 100],
          fontSize: 8,
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [230, 230, 230]
        },
        bodyStyles: { 
          fontSize: 8,
          lineWidth: 0.1,
          lineColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 'auto' },
          2: { halign: 'right' },
          3: { halign: 'center' },
          4: { halign: 'right' }
        }
      });
      
      // 5. Totals Section
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Subtotal', 140, finalY);
      doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 14, finalY, { align: 'right' });
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Total Kuantitas: ${order.order_items?.reduce((sum, i) => sum + i.quantity, 0)} produk`, 140, finalY + 5);
      
      // Gray box for breakdown
      doc.setFillColor(250, 250, 250);
      doc.rect(110, finalY + 15, pageWidth - 124, 45, 'F');
      
      const breakdownY = finalY + 25;
      doc.text('Subtotal Pesanan', 115, breakdownY);
      doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 20, breakdownY, { align: 'right' });
      
      doc.text('Subtotal Pengiriman', 115, breakdownY + 7);
      doc.text('Rp 0', pageWidth - 20, breakdownY + 7, { align: 'right' });
      
      doc.text('Biaya Layanan', 115, breakdownY + 14);
      doc.text('Rp 0', pageWidth - 20, breakdownY + 14, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Total Pembayaran', 115, breakdownY + 25);
      doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 20, breakdownY + 25, { align: 'right' });
      
      // 6. Footer
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text('Cahaya ATK - Solusi Alat Tulis Kantor & Sekolah', 14, doc.internal.pageSize.height - 30);
      doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariiboyo, Magetan', 14, doc.internal.pageSize.height - 25);
      doc.text('NPWP: 00.000.000.0-000.000', 14, doc.internal.pageSize.height - 20);
      
      doc.text('End of receipt', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      
      const fileName = `${docTitle.replace(' ', '_')}_${order.id.slice(0, 8)}.pdf`;
      
      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
        });
        
        await Share.share({
          title: docTitle,
          text: `Berikut adalah ${docTitle.toLowerCase()} pesanan Anda.`,
          url: savedFile.uri,
          dialogTitle: `Bagikan ${docTitle}`,
        });
        
        toast.success(`${docTitle} berhasil disimpan`, { id: toastId });
      } else {
        doc.save(fileName);
        toast.success(`${docTitle} berhasil diunduh`, { id: toastId });
      }
    } catch (error: any) {
      console.error('PDF Error:', error);
      toast.error(`Gagal mengunduh ${docTitle.toLowerCase()}: ` + error.message, { id: toastId });
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
