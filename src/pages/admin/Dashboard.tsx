import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, Order } from '../../types';
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, X, Download, User as UserIcon, Mail, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchCustomers();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  const fetchStats = async () => {
    try {
      const [products, orders, profiles] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      const revenue = orders.data?.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0) || 0;

      setStats({
        totalProducts: products.count || 0,
        totalOrders: orders.data?.length || 0,
        totalRevenue: revenue,
        totalUsers: profiles.count || 0
      });

      // Fetch recent orders with items
      const { data: recent } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentOrders(recent || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    const toastId = toast.loading('Menyiapkan laporan PDF...');
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('LAPORAN PENJUALAN CAHAYA ATK', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 25);
      
      // Stats Summary
      autoTable(doc, {
        startY: 30,
        head: [['Kategori', 'Total']],
        body: [
          ['Total Produk', stats.totalProducts],
          ['Total Pesanan', stats.totalOrders],
          ['Total Pendapatan', `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`],
          ['Total Pelanggan', stats.totalUsers],
        ],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });

      // Recent Orders Table
      const { data: allOrders, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (allOrders && allOrders.length > 0) {
        doc.text('Daftar Pesanan Lengkap', 14, (doc as any).lastAutoTable.finalY + 10);
        
        const tableData = allOrders.map(o => [
          o.id.slice(0, 8),
          new Date(o.created_at).toLocaleDateString(),
          o.status,
          o.payment_method === 'cod' ? 'COD' : 'QRIS/TF',
          `Rp ${o.total_amount.toLocaleString('id-ID')}`
        ]);

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [['ID Order', 'Tanggal', 'Status', 'Metode', 'Total']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }
        });
      } else {
        doc.text('Belum ada data pesanan.', 14, (doc as any).lastAutoTable.finalY + 10);
      }

      const fileName = `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
        });

        await Share.share({
          title: 'Laporan Penjualan Cahaya ATK',
          text: 'Berikut adalah laporan penjualan terbaru.',
          url: savedFile.uri,
          dialogTitle: 'Bagikan Laporan PDF',
        });
        
        toast.success('Laporan berhasil disimpan dan siap dibagikan', { id: toastId });
      } else {
        doc.save(fileName);
        toast.success('Laporan berhasil diunduh', { id: toastId });
      }
    } catch (error: any) {
      console.error('PDF Error:', error);
      toast.error('Gagal mengunduh laporan: ' + error.message, { id: toastId });
    }
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent('Halo Admin Cahaya ATK, saya butuh bantuan terkait pengelolaan toko.');
    window.open(`https://wa.me/6281944779408?text=${message}`, '_blank');
  };

  if (loading) return <div className="animate-pulse space-y-8">...</div>;

  return (
    <div className="space-y-8">
      {/* Customers Modal */}
      <AnimatePresence>
        {isCustomersModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomersModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-600" />
                  Daftar Pelanggan
                </h2>
                <button onClick={() => setIsCustomersModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-neutral-200 shadow-sm">
                          <UserIcon className="w-6 h-6 text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{customer.full_name || 'Tanpa Nama'}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="flex items-center text-xs text-neutral-500">
                              <Mail className="w-3 h-3 mr-1" />
                              {customer.email}
                            </span>
                            <span className="flex items-center text-xs text-neutral-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(customer.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        customer.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {customer.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-500">Ringkasan performa toko ATK CAHAYA</p>
        </div>
        <div className="text-sm font-medium bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
          Update Terakhir: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Produk', value: stats.totalProducts, icon: Package, color: 'bg-blue-500', link: '/admin/products' },
          { label: 'Total Pesanan', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-emerald-500', link: '/admin/orders' },
          { 
            label: 'Pendapatan', 
            value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`, 
            icon: TrendingUp, 
            color: 'bg-purple-500', 
            action: handleDownloadReport,
            actionIcon: <Download className="w-4 h-4" />
          },
          { 
            label: 'Pelanggan', 
            value: stats.totalUsers, 
            icon: Users, 
            color: 'bg-orange-500', 
            action: () => setIsCustomersModalOpen(true) 
          },
        ].map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => {
              if (stat.action) stat.action();
              else if (stat.link && stat.link !== '#') navigate(stat.link);
            }}
            className={`bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group ${
              (stat.action || (stat.link && stat.link !== '#')) ? 'cursor-pointer active:scale-95' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.link && stat.link !== '#' ? (
                <div className="text-neutral-400 group-hover:text-neutral-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              ) : stat.action ? (
                <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  {stat.actionIcon || <ArrowRight className="w-4 h-4" />}
                  <span>{stat.label === 'Pendapatan' ? 'Laporan' : 'Lihat'}</span>
                </div>
              ) : null}
            </div>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-50 flex justify-between items-center">
            <h2 className="font-bold text-lg">Pesanan Terbaru</h2>
            <Link to="/admin/orders" className="text-sm font-bold text-emerald-600 hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-neutral-50">
            {recentOrders.map(order => (
              <div key={order.id} className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-neutral-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-neutral-900">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-neutral-900 text-white p-8 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Kelola Inventaris</h2>
              <p className="text-neutral-400 mb-6 text-sm">Tambah produk baru atau update stok alat tulis Anda dengan mudah.</p>
              <Link 
                to="/admin/products" 
                className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                <span>Kelola Produk</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <Package className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="font-bold text-sm mb-2">Bantuan Admin</h3>
              <p className="text-xs text-neutral-500 mb-4">Butuh bantuan mengelola toko?</p>
              <button 
                onClick={handleContactSupport}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Hubungi Support
              </button>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="font-bold text-sm mb-2">Laporan</h3>
              <p className="text-xs text-neutral-500 mb-4">Laporan bulanan kini ada di kartu Pendapatan.</p>
              <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                Fitur Dipindahkan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
