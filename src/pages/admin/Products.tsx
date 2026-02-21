import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'Kertas',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diunggah');
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar: ' + error.message);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produk diperbarui');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(formData);
        if (error) throw error;
        toast.success('Produk ditambahkan');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, stock: 0, category: 'Kertas', image_url: '' });
      fetchProducts();
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    const toastId = toast.loading('Menghapus produk...');
    try {
      // First, check if product is used in any order_items
      const { data: usage } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productToDelete)
        .limit(1);

      if (usage && usage.length > 0) {
        toast.error('Gagal menghapus: Produk ini sudah pernah dipesan oleh pelanggan.', { id: toastId });
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
        return;
      }

      const { error } = await supabase.from('products').delete().eq('id', productToDelete);
      if (error) throw error;
      
      toast.success('Produk berhasil dihapus dari database', { id: toastId });
      fetchProducts();
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message, { id: toastId });
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      image_url: product.image_url
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kelola Produk</h1>
          <p className="text-neutral-500">Tambah, edit, atau hapus inventaris toko</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setFormData({ name: '', description: '', price: 0, stock: 0, category: 'Kertas', image_url: '' }); setIsModalOpen(true); }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Produk</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Harga</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Stok</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                        <img 
                          src={product.image_url || `https://picsum.photos/seed/${product.id}/100/100`} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{product.name}</p>
                        <p className="text-xs text-neutral-400 line-clamp-1 max-w-[200px]">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium bg-neutral-100 px-2 py-1 rounded-md">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">Rp {product.price.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${product.stock < 10 ? 'text-red-500' : 'text-neutral-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => openEdit(product)}
                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(product.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Nama Produk</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Kategori</label>
                    <select 
                      className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {['Kertas', 'Pena & Pensil', 'Buku', 'Arsip', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Deskripsi</label>
                  <textarea 
                    required rows={3}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Harga (Rp)</label>
                    <input 
                      type="number" required
                      className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.price || ''}
                      onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Stok</label>
                    <input 
                      type="number" required
                      className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.stock || ''}
                      onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Gambar Produk</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {formData.image_url ? (
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-neutral-300" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <label className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                        <Upload className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-600">
                          {uploading ? 'Mengunggah...' : 'Pilih Gambar'}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                      {uploading && (
                        <div className="mt-2 w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-emerald-600"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-400 mt-2">Atau masukkan URL gambar di bawah ini</p>
                    </div>
                  </div>
                  <div className="relative mt-2">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input 
                      type="url"
                      className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={e => setFormData({...formData, image_url: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-neutral-200"
                  >
                    Simpan Produk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Hapus Produk?</h2>
              <p className="text-neutral-600 mb-8">
                Apakah Anda yakin ingin menghapus produk ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
