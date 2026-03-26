import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ShoppingCart, Search, Package, X, Info, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [animatingCart, setAnimatingCart] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();

  const categories = ['Semua', 'Kertas', 'Pena & Pensil', 'Buku', 'Arsip', 'Lainnya'];

  useEffect(() => {
    fetchProducts();

    // Realtime subscription for "always synchronized" behavior
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts(false); // Fetch without showing the full-page spinner
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    {
      title: "Lengkapi Kebutuhan Kantor & Sekolah Anda",
      description: "Kualitas terbaik, harga bersahabat, pelayanan cepat. Hanya di CAHAYA ATK.",
      image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2000&auto=format&fit=crop",
      accent: "Kantor & Sekolah"
    },
    {
      title: "Promo Spesial Alat Tulis Kantor",
      description: "Dapatkan diskon menarik untuk pembelian grosir. Stok terbatas!",
      image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=2000&auto=format&fit=crop",
      accent: "Alat Tulis"
    },
    {
      title: "Kualitas Terbaik untuk Prestasi Anda",
      description: "Menyediakan berbagai macam perlengkapan sekolah terlengkap.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2000&auto=format&fit=crop",
      accent: "Prestasi Anda"
    },
    {
      title: "Koleksi Seni & Melukis Terlengkap",
      description: "Ekspresikan kreativitas Anda dengan peralatan seni berkualitas tinggi.",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2000&auto=format&fit=crop",
      accent: "Seni & Melukis"
    },
    {
      title: "Buku Tulis & Kertas Kualitas Premium",
      description: "Berbagai pilihan kertas dan buku tulis untuk segala kebutuhan Anda.",
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=2000&auto=format&fit=crop",
      accent: "Kualitas Premium"
    },
    {
      title: "Aksesoris Meja Kerja Modern",
      description: "Buat ruang kerja Anda lebih rapi dan produktif dengan aksesoris kami.",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2000&auto=format&fit=crop",
      accent: "Meja Kerja"
    },
    {
      title: "Tas & Kotak Pensil Stylish",
      description: "Tampil keren ke sekolah atau kantor dengan koleksi tas terbaru.",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=2000&auto=format&fit=crop",
      accent: "Stylish"
    },
    {
      title: "Peralatan Kantor Esensial",
      description: "Stapler, klip, hingga penggaris, semua tersedia lengkap di sini.",
      image: "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?q=80&w=2000&auto=format&fit=crop",
      accent: "Peralatan Kantor"
    },
    {
      title: "Kebutuhan Kuliah & Mahasiswa",
      description: "Persiapkan semester baru Anda dengan perlengkapan kuliah terbaik.",
      image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2000&auto=format&fit=crop",
      accent: "Kuliah & Mahasiswa"
    },
    {
      title: "Produk Eksklusif Cahaya ATK",
      description: "Temukan produk-produk pilihan yang hanya ada di toko kami.",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2000&auto=format&fit=crop",
      accent: "Eksklusif"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const fetchProducts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAnimatingCart(product.id);
    addToCart(product);
    toast.success(`${product.name} ditambahkan ke keranjang`);
    setTimeout(() => setAnimatingCart(null), 2000);
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
      {/* Hero Section / Banner Slider */}
      <section className="relative h-[250px] sm:h-[350px] rounded-3xl overflow-hidden bg-neutral-900 text-white flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center px-6 sm:px-12"
          >
            <div className="absolute inset-0">
              <img 
                src={banners[currentBanner].image} 
                alt="Hero" 
                className="w-full h-full object-cover opacity-70"
                referrerPolicy="no-referrer"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 to-transparent" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight leading-tight"
              >
                {banners[currentBanner].title.split(banners[currentBanner].accent)[0]}
                <span className="text-emerald-400">{banners[currentBanner].accent}</span>
                {banners[currentBanner].title.split(banners[currentBanner].accent)[1]}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-lg text-neutral-300 mb-6"
              >
                {banners[currentBanner].description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentBanner === idx ? 'bg-emerald-500 w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5 transition-colors group-focus-within:text-emerald-600" />
          <input 
            type="text"
            placeholder="Cari alat tulis..."
            className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === cat 
                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                : 'bg-white/90 backdrop-blur-sm text-neutral-600 border border-emerald-50 hover:border-emerald-500 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedProduct(product)}
              className="group bg-white rounded-3xl border border-emerald-50 overflow-hidden hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="aspect-square overflow-hidden bg-neutral-100 relative">
                <img 
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-600 shadow-sm">
                    {product.category}
                  </span>
                </div>
                
                {/* Flying to cart animation element */}
                <AnimatePresence>
                  {animatingCart === product.id && (
                    <motion.div 
                      initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                      animate={{ 
                        scale: 0.2, 
                        x: window.innerWidth > 768 ? 400 : 100, 
                        y: window.innerWidth > 768 ? -400 : -200, 
                        opacity: 0 
                      }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <ShoppingCart className="text-white w-10 h-10" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-3 sm:p-5 flex-grow flex flex-col">
                <h3 className="font-bold text-sm sm:text-lg mb-1 group-hover:text-emerald-600 transition-colors leading-tight line-clamp-1">{product.name}</h3>
                <p className="text-neutral-500 text-[10px] sm:text-xs mb-3 sm:mb-4 line-clamp-1 sm:line-clamp-2">{product.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm sm:text-lg font-black text-neutral-900">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                  {!isAdmin && (
                    <button 
                      onClick={(e) => handleAddToCart(product, e)}
                      className="bg-neutral-900 text-white p-2 sm:p-2.5 rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-neutral-200"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="mt-2 text-[8px] sm:text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
                  Stok: {product.stock}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-emerald-50/5 rounded-3xl border border-dashed border-neutral-200">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900">Produk tidak ditemukan</h3>
          <p className="text-neutral-500">Coba gunakan kata kunci lain atau filter kategori yang berbeda.</p>
        </div>
      )}
      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-neutral-100">
                <img 
                  src={selectedProduct.image_url || `https://picsum.photos/seed/${selectedProduct.id}/600/600`} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col overflow-y-auto">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-emerald-50/10 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight mb-2">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-2xl font-black text-emerald-600">
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Deskripsi Produk</h4>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-emerald-50/5 rounded-2xl border border-neutral-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-200 shadow-sm">
                      <Package className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Stok Tersedia</p>
                      <p className="text-sm font-bold text-neutral-900">{selectedProduct.stock} unit</p>
                    </div>
                  </div>
                </div>

                {!isAdmin && (
                  <button 
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-neutral-200 active:scale-95"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Tambah ke Keranjang</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
