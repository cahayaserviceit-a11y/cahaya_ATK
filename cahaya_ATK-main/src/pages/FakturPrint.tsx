import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { Printer, ArrowLeft, ShieldAlert, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FakturPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id || !user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*))')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Authorization check
        if (!isAdmin && data.user_id !== user.id) {
          throw new Error('Unauthorized');
        }

        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user, isAdmin]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <div className="p-10 text-center">Silakan login untuk melihat faktur.</div>;
  if (!order) return (
    <div className="p-10 text-center flex flex-col items-center">
      <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-red-600">Akses Ditolak atau Faktur Tidak Ditemukan</h2>
      <p className="text-neutral-500 mt-2">Anda tidak memiliki izin untuk melihat faktur ini.</p>
      <button onClick={() => navigate('/')} className="mt-6 text-emerald-600 font-bold">Kembali ke Beranda</button>
    </div>
  );

  const formatCurrency = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Generate Nota Number based on date and ID
  const notaNumber = `ATK-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getFullYear().toString().slice(-2)}-${order.id.slice(0, 3).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 print:p-0 print:bg-white">
      {/* Action Bar - Hidden on Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Kembali</span>
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <Printer className="w-5 h-5" />
          <span>Cetak Faktur (A4)</span>
        </button>
      </div>

      {/* Invoice Page (A4 Size) */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl p-[15mm] print:shadow-none print:p-0">
        
        {/* 1. Header Toko & Nomor Nota */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-start space-x-4">
            {/* Logo 3cm x 3cm (approx 110px) */}
            <div className="w-[110px] h-[110px] bg-emerald-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="text-white w-12 h-12" />
            </div>
            <div className="pt-2">
              <h1 className="text-3xl font-black tracking-tighter text-neutral-900 leading-none mb-1">CAHAYA ATK</h1>
              <p className="text-sm font-bold text-emerald-600 mb-1 italic">Solusi Alat Tulis Kantor & Sekolah</p>
              <p className="text-xs text-neutral-500 leading-tight">
                Jl. Sutan Agung, Balegondo, Magetan<br />
                Telp: +62 819 3477 9408<br />
                Email: cahayaatk@gmail.com
              </p>
            </div>
          </div>
          
          <div className="text-right pt-2">
            <div className="space-y-1">
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Informasi Nota</p>
              <p className="text-sm"><span className="font-bold">No Nota :</span> {notaNumber}</p>
              <p className="text-sm"><span className="font-bold">Tanggal :</span> {formattedDate}</p>
            </div>
          </div>
        </div>

        {/* 2. Judul Dokumen */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black tracking-widest text-neutral-900 border-b-4 border-neutral-900 inline-block pb-2">
            FAKTUR PENJUALAN
          </h2>
        </div>

        {/* 3. Buyer Info */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Ditujukan Kepada:</p>
            <p className="font-bold text-lg">{order.address.split(',')[0] || 'Pelanggan Setia'}</p>
            <p className="text-sm text-neutral-600 mt-1">{order.address}</p>
            <p className="text-sm font-bold mt-2 text-emerald-600">{order.phone}</p>
          </div>
          <div className="flex flex-col justify-end text-right">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Status Pembayaran</p>
            <p className="text-xl font-black text-emerald-600 uppercase italic">
              {order.payment_method === 'cod' ? 'LUNAS (COD)' : 'LUNAS (TRANSFER)'}
            </p>
          </div>
        </div>

        {/* 4. Tabel Daftar Barang */}
        <div className="mb-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y-2 border-neutral-900">
                <th className="py-4 text-left text-xs font-black uppercase tracking-widest px-2">No</th>
                <th className="py-4 text-left text-xs font-black uppercase tracking-widest px-2">Nama Barang</th>
                <th className="py-4 text-right text-xs font-black uppercase tracking-widest px-2">Harga</th>
                <th className="py-4 text-center text-xs font-black uppercase tracking-widest px-2">Qty</th>
                <th className="py-4 text-right text-xs font-black uppercase tracking-widest px-2">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.order_items?.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-4 px-2 text-sm text-neutral-500">{index + 1}</td>
                  <td className="py-4 px-2">
                    <p className="font-bold text-neutral-900">{item.product?.name || 'Produk'}</p>
                    <p className="text-[10px] text-neutral-400 italic">SKU: {item.product_id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td className="py-4 px-2 text-right text-sm font-medium">{formatCurrency(item.price_at_time)}</td>
                  <td className="py-4 px-2 text-center text-sm font-bold">{item.quantity}</td>
                  <td className="py-4 px-2 text-right text-sm font-black">{formatCurrency(item.price_at_time * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-900">
                <td colSpan={3} className="py-6"></td>
                <td className="py-6 text-right text-sm font-bold text-neutral-400 uppercase tracking-widest">Total Harga</td>
                <td className="py-6 text-right text-2xl font-black text-neutral-900">{formatCurrency(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 5. Bagian Tanda Tangan */}
        <div className="mt-auto pt-10">
          <p className="text-right text-sm mb-12">Magetan, {formattedDate}</p>
          
          <div className="grid grid-cols-2 gap-20">
            <div className="text-center">
              <p className="text-sm font-bold mb-20">Pembeli</p>
              <div className="border-b border-neutral-900 w-48 mx-auto"></div>
              <p className="text-xs text-neutral-400 mt-1">( tanda tangan pembeli )</p>
            </div>
            
            <div className="text-center relative">
              <p className="text-sm font-bold mb-2">Penjual</p>
              <p className="text-sm font-black text-emerald-600 mb-12">Cahaya ATK</p>
              
              {/* Stempel Placeholder */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 border-4 border-emerald-600/20 rounded-full flex items-center justify-center rotate-12 pointer-events-none">
                <p className="text-[10px] font-black text-emerald-600/20 uppercase text-center">CAHAYA ATK<br/>MAGETAN</p>
              </div>

              <div className="border-b border-neutral-900 w-48 mx-auto"></div>
              <p className="text-xs text-neutral-400 mt-1">( tanda tangan + stempel )</p>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block fixed bottom-10 left-0 right-0 text-center">
          <p className="text-[10px] text-neutral-300 italic">Terima kasih telah berbelanja di Cahaya ATK. Barang yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          @page { size: A4; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      ` }} />
    </div>
  );
};
