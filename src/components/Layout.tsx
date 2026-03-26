import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { App } from '@capacitor/app';
import { ShoppingCart, User, LogOut, BookOpen, LayoutDashboard, Menu, X, Info, Truck, RotateCcw, Settings, Instagram, Facebook, Mail, Phone, MapPin, CreditCard, Wallet, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [helpModal, setHelpModal] = React.useState<{ isOpen: boolean; type: 'belanja' | 'pengiriman' | 'retur' | null }>({
    isOpen: false,
    type: null
  });

  // Supabase Keep-Alive: Pings Supabase to prevent project pausing
  React.useEffect(() => {
    const keepAlive = async () => {
      try {
        // Simple query to keep the project active
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) console.error('Keep-alive ping failed:', error.message);
        else console.log('Supabase keep-alive ping successful');
      } catch (err) {
        console.error('Keep-alive error:', err);
      }
    };

    // Ping on mount
    keepAlive();

    // Set up an interval to ping every 2 days (well within the 7-day limit)
    const interval = setInterval(keepAlive, 2 * 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Capacitor Back Button Handler
  React.useEffect(() => {
    const backListener = App.addListener('backButton', () => {
      if (window.location.pathname === '/') {
        // If on home, exit app
        App.exitApp();
      } else {
        // Otherwise go back
        navigate(-1);
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [navigate]);

  const handleSignOut = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    navigate('/');
  };

  const helpContent = {
    belanja: {
      title: 'Cara Belanja',
      icon: <ShoppingCart className="w-6 h-6 text-emerald-600" />,
      content: '1. Pilih produk yang Anda inginkan.\n2. Masukkan ke keranjang belanja.\n3. Klik ikon keranjang dan lengkapi data pengiriman.\n4. Pilih metode pembayaran (COD atau Transfer).\n5. Klik Checkout dan tunggu admin memproses pesanan Anda.'
    },
    pengiriman: {
      title: 'Informasi Pengiriman',
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      content: 'Kami melayani pengiriman setiap hari kerja. Khusus area sekitar Balegondo, tersedia layanan pengiriman cepat. Biaya pengiriman akan diinformasikan oleh admin setelah pesanan masuk.'
    },
    retur: {
      title: 'Kebijakan Pengembalian',
      icon: <RotateCcw className="w-6 h-6 text-emerald-600" />,
      content: 'Barang yang sudah dibeli dapat ditukar jika terdapat cacat produksi atau kesalahan pengiriman dari pihak kami. Harap sertakan video unboxing saat mengajukan komplain.'
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/5 font-sans text-neutral-900 flex flex-col">
      <Toaster 
        position="bottom-center" 
        expand={false} 
        richColors 
        closeButton={false}
        toastOptions={{
          style: {
            borderRadius: '1rem',
            padding: '1rem',
            cursor: 'pointer',
            marginBottom: '1rem'
          },
          duration: 3000
        }}
      />
      
      {/* Help Modal */}
      <AnimatePresence>
        {helpModal.isOpen && helpModal.type && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHelpModal({ isOpen: false, type: null })}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <button 
                onClick={() => setHelpModal({ isOpen: false, type: null })}
                className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  {helpContent[helpModal.type].icon}
                </div>
                <h2 className="text-2xl font-bold mb-4">{helpContent[helpModal.type].title}</h2>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                  {helpContent[helpModal.type].content}
                </p>
                <button 
                  onClick={() => setHelpModal({ isOpen: false, type: null })}
                  className="mt-8 w-full bg-neutral-900 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Keluar Akun?</h2>
              <p className="text-neutral-500 mb-8">Apakah Anda yakin ingin keluar dari akun Anda?</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">CAHAYA ATK</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-sm font-medium hover:text-emerald-600 transition-colors">Produk</Link>
              {user && !isAdmin && (
                <Link to="/orders" className="text-sm font-medium hover:text-emerald-600 transition-colors">Pesanan Saya</Link>
              )}
              
              {isAdmin && (
                <Link to="/admin" className="flex items-center space-x-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}

              <div className="flex items-center space-x-4 border-l border-neutral-200 pl-4">
                {!isAdmin && (
                  <Link to="/cart" className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                )}

                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link 
                      to="/settings" 
                      className="flex flex-col items-end hover:text-emerald-600 transition-colors"
                    >
                      <span className="text-xs font-semibold">{profile?.full_name || user.email}</span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{profile?.role}</span>
                    </Link>
                    <Link 
                      to="/settings"
                      className="w-9 h-9 rounded-xl overflow-hidden border border-neutral-100 hover:border-emerald-500 transition-all shadow-sm"
                      title="Pengaturan Profil"
                    >
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                    </Link>
                    <button 
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              {!isAdmin && (
                <Link to="/cart" className="relative p-2">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-neutral-100 py-4 px-4 space-y-4 shadow-lg">
            <Link to="/" className="block text-base font-medium py-2" onClick={() => setIsMenuOpen(false)}>Produk</Link>
            {user && !isAdmin && (
              <Link to="/orders" className="block text-base font-medium py-2" onClick={() => setIsMenuOpen(false)}>Pesanan Saya</Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="block text-base font-medium text-emerald-600 py-2" onClick={() => setIsMenuOpen(false)}>Dashboard Admin</Link>
            )}
            {user ? (
              <>
                <div className="py-2 border-t border-neutral-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">{profile?.full_name || user.email}</p>
                    <p className="text-xs text-neutral-500">{profile?.role}</p>
                  </div>
                  <Link 
                    to="/settings" 
                    className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-100 shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                  </Link>
                </div>
                <Link 
                  to="/settings" 
                  className="block text-base font-medium py-2" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pengaturan Profil
                </Link>
                <button 
                  onClick={() => { setIsLogoutModalOpen(true); setIsMenuOpen(false); }}
                  className="w-full text-left text-red-600 font-medium py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="block w-full bg-neutral-900 text-white text-center py-3 rounded-xl font-medium" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Section */}
            <div className="space-y-6">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                  <BookOpen className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tighter">CAHAYA ATK</span>
              </Link>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Pusat perlengkapan alat tulis kantor dan sekolah terlengkap di Balegondo. Kami berkomitmen memberikan kualitas terbaik dengan harga yang kompetitif.
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-neutral-100">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-neutral-100">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="mailto:cahayaatk@gmail.com" className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-neutral-100">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-900 mb-6">Bantuan & Layanan</h4>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => setHelpModal({ isOpen: true, type: 'belanja' })} 
                    className="text-neutral-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Cara Belanja</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setHelpModal({ isOpen: true, type: 'pengiriman' })} 
                    className="text-neutral-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Informasi Pengiriman</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setHelpModal({ isOpen: true, type: 'retur' })} 
                    className="text-neutral-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Kebijakan Retur</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-900 mb-6">Hubungi Kami</h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 text-sm text-neutral-500">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Jl. Sultan Agung No. 6, Balegondo, Magetan, Jawa Timur</span>
                </li>
                <li className="flex items-center space-x-3 text-sm text-neutral-500">
                  <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>+62 819 3477 9408</span>
                </li>
                <li className="flex items-center space-x-3 text-sm text-neutral-500">
                  <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>cahayaatk@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* Payment & Trust */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-900 mb-6">Metode Pembayaran</h4>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="h-10 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all">
                  <CreditCard className="w-6 h-6 text-neutral-400" />
                </div>
                <div className="h-10 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all">
                  <Wallet className="w-6 h-6 text-neutral-400" />
                </div>
                <div className="h-10 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all">
                  <span className="text-[10px] font-bold text-neutral-400">COD</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest mb-1">Jam Operasional</p>
                <p className="text-xs text-emerald-600">Senin - Sabtu: 08:00 - 20:00</p>
                <p className="text-xs text-emerald-600">Minggu: 09:00 - 17:00</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-neutral-400 font-medium">
              &copy; {new Date().getFullYear()} CAHAYA ATK. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Privacy Policy</a>
              <a href="#" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/6281934779408" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
        title="Chat via WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 bg-white text-neutral-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Tanya Admin
        </span>
      </a>
    </div>
  );
};
