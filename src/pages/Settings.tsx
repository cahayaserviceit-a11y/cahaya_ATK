import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { User, MapPin, Phone, FileText, Camera, Save, ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Profil berhasil diperbarui!');
    } catch (error: any) {
      toast.error('Gagal memperbarui profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!user || !e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Delete old photo if exists
      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // 2. Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 4. Update local state and DB
      setFormData({ ...formData, avatar_url: publicUrl });
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      toast.success('Foto profil berhasil diunggah!');
    } catch (error: any) {
      toast.error('Gagal mengunggah foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !formData.avatar_url) return;

    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus foto profil?');
    if (!confirmDelete) return;

    try {
      setUploading(true);
      
      // 1. Extract path from URL
      const urlParts = formData.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // 2. Remove from Storage
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (storageError) throw storageError;

      // 3. Update Database
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setFormData({ ...formData, avatar_url: '' });
      await refreshProfile();
      toast.success('Foto profil berhasil dihapus!');
    } catch (error: any) {
      toast.error('Gagal menghapus foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Silahkan Login</h2>
        <p className="text-neutral-500 mb-8">Anda harus login untuk mengakses halaman pengaturan.</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Profil</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 overflow-hidden"
      >
        <div className="p-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-emerald-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-16 h-16 text-emerald-300" />
                  )}
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-3 bg-neutral-900 text-white rounded-2xl shadow-lg hover:bg-emerald-600 transition-all group-hover:scale-110"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />

              <div className="mt-6 flex items-center space-x-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all"
                >
                  <span>Ganti Foto</span>
                </button>
                
                {formData.avatar_url && (
                  <button 
                    type="button"
                    onClick={handleDeletePhoto}
                    className="flex items-center space-x-2 text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
              
              <p className="mt-4 text-[10px] text-neutral-400 uppercase tracking-widest">
                Format: JPG, PNG (Maks. 2MB)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 flex items-center space-x-2">
                  <span>Nama Lengkap</span>
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Masukkan nama lengkap"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 flex items-center space-x-2">
                  <span>Nomor WhatsApp</span>
                </label>
                <input 
                  type="tel" 
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Contoh: 08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 flex items-center space-x-2">
                <span>Biodata Singkat</span>
              </label>
              <textarea 
                rows={3}
                className="w-full px-5 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                placeholder="Ceritakan sedikit tentang Anda..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 flex items-center space-x-2">
                <span>Alamat Pengiriman Default</span>
              </label>
              <textarea 
                rows={4}
                className="w-full px-5 py-3 rounded-2xl bg-neutral-50 border border-neutral-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                placeholder="Masukkan alamat lengkap untuk pengiriman otomatis..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <p className="text-[10px] text-neutral-400 italic">
                * Alamat ini akan otomatis terisi saat Anda melakukan checkout pesanan.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
