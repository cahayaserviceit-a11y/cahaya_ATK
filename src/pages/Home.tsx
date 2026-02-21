import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ShoppingCart, Search, Filter, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();

  const categories = ['Semua', 'Kertas', 'Pena & Pensil', 'Buku', 'Arsip', 'Lainnya'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Gagal mengambil data produk: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative h-[350px] rounded-3xl overflow-hidden bg-neutral-900 text-white flex items-center px-8 sm:px-12">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
          >
            Lengkapi Kebutuhan <span className="text-emerald-400">Kantor & Sekolah</span> Anda
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-300 mb-6"
          >
            Kualitas terbaik, harga bersahabat, pelayanan cepat. Hanya di CAHAYA ATK.
          </motion.p>
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Cari alat tulis..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          <Filter className="text-neutral-400 w-5 h-5 mr-2 flex-shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-emerald-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-300"
            >
              <div className="aspect-square overflow-hidden bg-neutral-100 relative">
                <img 
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-600 shadow-sm">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-emerald-600 transition-colors leading-tight">{product.name}</h3>
                <p className="text-neutral-500 text-xs mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-neutral-900">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                  {!isAdmin && (
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-neutral-900 text-white p-2.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-neutral-200"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="mt-3 text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
                  Stok: {product.stock}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900">Produk tidak ditemukan</h3>
          <p className="text-neutral-500">Coba gunakan kata kunci lain atau filter kategori yang berbeda.</p>
        </div>
      )}
    </div>
  );
};
