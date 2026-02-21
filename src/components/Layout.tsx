import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, BookOpen, LayoutDashboard, Menu, X, Info, Truck, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [helpModal, setHelpModal] = React.useState<{ isOpen: boolean; type: 'belanja' | 'pengiriman' | 'retur' | null }>({
    isOpen: false,
    type: null
  });

  const handleSignOut = async () => {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin keluar?');
    if (!isConfirmed) return;
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
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <Toaster 
        position="bottom-center" 
        expand={false} 
        richColors 
        closeButton={false}
        toastOptions={{
          style: {
            borderRadius: '1rem',
            padding: '1rem',
            cursor: 'pointer'
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
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold">{profile?.full_name || user.email}</span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{profile?.role}</span>
                    </div>
                    <button 
                      onClick={handleSignOut}
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
                <div className="py-2 border-t border-neutral-100">
                  <p className="text-sm font-semibold">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-neutral-500">{profile?.role}</p>
                </div>
                <button 
                  onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-emerald-50/30 border-t border-neutral-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
                  <BookOpen className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-bold">CAHAYA ATK</span>
              </div>
              <p className="text-sm text-neutral-500 max-w-xs">
                Solusi kebutuhan alat tulis kantor dan sekolah terlengkap dengan harga terbaik.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Bantuan</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button 
                    onClick={() => setHelpModal({ isOpen: true, type: 'belanja' })} 
                    className="text-emerald-600 font-bold hover:text-emerald-700 transition-all"
                  >
                    Cara Belanja
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setHelpModal({ isOpen: true, type: 'pengiriman' })} 
                    className="text-emerald-600 font-bold hover:text-emerald-700 transition-all"
                  >
                    Pengiriman
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setHelpModal({ isOpen: true, type: 'retur' })} 
                    className="text-emerald-600 font-bold hover:text-emerald-700 transition-all"
                  >
                    Kebijakan Pengembalian
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>Email: cahayaatk@gmail.com</li>
                <li>WhatsApp: +62 819 4477 9408</li>
                <li>Alamat: Jl. Sultan Agung No. 6, Balegondo</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-100 mt-12 pt-8 text-center text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} CAHAYA ATK. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
