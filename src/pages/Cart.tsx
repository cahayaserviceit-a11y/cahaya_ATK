import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, MapPin, Phone, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'qris_transfer'>('cod');

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk checkout');
      navigate('/login');
      return;
    }

    if (isAdmin) {
      toast.error('Admin tidak diperbolehkan melakukan checkout');
      return;
    }

    if (!phone || !address) {
      toast.error('Silakan lengkapi nomor telepon dan alamat pengiriman');
      return;
    }

    setLoading(true);
    try {
      // 1. Validate Stock
      for (const item of items) {
        const { data: product, error: stockError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();
        
        if (stockError || !product) throw new Error(`Gagal memverifikasi stok untuk ${item.name}`);
        if (product.stock < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk ${item.name}. Tersisa: ${product.stock}`);
        }
      }

      // 2. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
          status: 'pending',
          phone,
          address,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items and Update Stock
      for (const item of items) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price
          });

        if (itemsError) throw itemsError;

        // Update Stock
        const { error: updateStockError } = await supabase.rpc('decrement_stock', {
          row_id: item.id,
          amount: item.quantity
        });
        
        // If RPC doesn't exist, fallback to manual update (though RPC is safer for concurrency)
        if (updateStockError) {
          const { data: currentProduct } = await supabase.from('products').select('stock').eq('id', item.id).single();
          await supabase.from('products').update({ stock: (currentProduct?.stock || 0) - item.quantity }).eq('id', item.id);
        }
      }

      // 4. Clear Cart and show success
      clearCart();
      toast.success('Pesanan berhasil dibuat! Silakan cek menu Pesanan Saya.');
      navigate('/orders');
    } catch (error: any) {
      toast.error('Gagal memproses pesanan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-neutral-300" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Keranjang Kosong</h2>
        <p className="text-neutral-500 mb-8">Anda belum menambahkan produk apapun ke keranjang.</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>
        {items.map((item) => (
          <motion.div 
            layout
            key={item.id}
            className="bg-white p-4 rounded-2xl border border-neutral-100 flex items-center space-x-4 shadow-sm"
          >
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-50 flex-shrink-0">
              <img 
                src={item.image_url || `https://picsum.photos/seed/${item.id}/200/200`} 
                alt={item.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-emerald-600 font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
              <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">{item.category}</p>
            </div>
            <div className="flex items-center space-x-3 bg-neutral-50 p-1 rounded-xl">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="lg:col-span-1 space-y-6">
        {/* Identity Form */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Informasi Pengiriman
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input 
                  type="tel"
                  placeholder="0812..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Alamat Lengkap</label>
              <textarea 
                placeholder="Jl. Nama Jalan No. 123..."
                rows={3}
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Metode Pembayaran
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaymentMethod('cod')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                paymentMethod === 'cod' 
                ? 'bg-emerald-50 border-emerald-600 text-emerald-700' 
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-emerald-300'
              }`}
            >
              <p className="font-bold text-sm">COD</p>
              <p className="text-[10px] opacity-70">Bayar di Tempat</p>
            </button>
            <button 
              onClick={() => setPaymentMethod('qris_transfer')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                paymentMethod === 'qris_transfer' 
                ? 'bg-emerald-50 border-emerald-600 text-emerald-700' 
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-emerald-300'
              }`}
            >
              <p className="font-bold text-sm">QRIS / TF</p>
              <p className="text-[10px] opacity-70">Transfer Bank</p>
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/50">
          <h2 className="text-xl font-bold mb-6">Ringkasan Belanja</h2>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-neutral-500">
              <span>Total Barang</span>
              <span>{items.reduce((sum, i) => sum + i.quantity, 0)} pcs</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Biaya Pengiriman</span>
              <span className="text-emerald-600 font-medium">Gratis</span>
            </div>
            <div className="border-t border-neutral-100 pt-4 flex justify-between items-center">
              <span className="font-bold text-lg">Total Bayar</span>
              <span className="font-black text-2xl text-neutral-900">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-neutral-200"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Checkout Sekarang</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-neutral-400 text-center mt-4 uppercase tracking-widest">
            Pembayaran Aman & Terpercaya
          </p>
        </div>
      </div>
    </div>
  );
};
