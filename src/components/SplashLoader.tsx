import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashLoader() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulasi loading selama 3.5 detik (sesuai jeda minimal)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#F3FAF5] via-[#E8F5ED] to-[#DFEFE5] flex flex-col items-center justify-center px-6 overflow-hidden select-none"
        >
          {/* 1. Soft Ambient Radial Lights (Efek Cahaya Latar Belakang) */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#D2EBDC] opacity-40 blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#C2E5CD] opacity-40 blur-[80px]" />

          {/* 2. Premium Floating Stationery Watermarks (Ornamen Alat Tulis Melayang) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Pensil Melayang */}
            <motion.div 
              animate={{ 
                y: [0, -12, 0],
                rotate: [15, 20, 15]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[12%] text-[#2D9F63]/10 w-12 h-12"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                <path d="m15 5 3 3" />
              </svg>
            </motion.div>

            {/* Buku Melayang */}
            <motion.div 
              animate={{ 
                y: [0, 15, 0],
                rotate: [-10, -5, -10]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-[20%] right-[15%] text-[#2D9F63]/8 w-16 h-16"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </motion.div>

            {/* Penggaris Kotak Melayang */}
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotate: [-35, -30, -35]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[25%] left-[15%] text-[#2D9F63]/8 w-14 h-14"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z" />
                <path d="M3 7h4" />
                <path d="M3 11h9" />
                <path d="M3 15h4" />
              </svg>
            </motion.div>

            {/* Tas / Backpack Melayang */}
            <motion.div 
              animate={{ 
                y: [0, 12, 0],
                rotate: [12, 8, 12]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-[20%] right-[12%] text-[#2D9F63]/10 w-14 h-14"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20V10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                <path d="M9 6V4a3 3 0 0 1 6 0v2" />
                <path d="M8 10h8" />
                <path d="M8 14h8" />
              </svg>
            </motion.div>

            {/* Bintang Berkelap-kelip Kecil 1 */}
            <motion.div 
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[45%] left-[8%] text-[#2D9F63]/15 w-6 h-6"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>

            {/* Bintang Berkelap-kelip Kecil 2 */}
            <motion.div 
              animate={{ scale: [1.2, 0.8, 1.2], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
              className="absolute top-[40%] right-[8%] text-[#2D9F63]/15 w-5 h-5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>
          </div>

          {/* 3. Konten Utama */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.21, 1.02, 0.43, 1.01] }}
            className="flex flex-col items-center text-center max-w-sm w-full z-10"
          >
            {/* Logo Utama Cahaya ATK */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 mb-8 filter drop-shadow-[0_12px_24px_rgba(45,159,99,0.18)]"
            >
              <svg width="100%" height="100%" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="200" cy="460" rx="140" ry="15" fill="#000" opacity="0.05"/>
                <path d="M100 160 Q200 130 300 160 L335 400 Q200 460 65 400 Z" fill="#2D9F63"/>
                <path d="M155 160 V125 C155 90 245 90 245 125 V160" fill="none" stroke="#2D9F63" strokeWidth="24" strokeLinecap="round"/>
                <path d="M155 160 V135 C155 110 245 110 245 135 V160" fill="none" stroke="#228551" strokeWidth="24" strokeLinecap="round" opacity="0.3"/>
                <g transform="rotate(10, 270, 150)">
                  <rect x="250" y="60" width="50" height="150" rx="4" fill="#FFC107"/>
                  <line x1="260" y1="85" x2="290" y2="85" stroke="#E6A700" strokeWidth="3"/>
                  <line x1="260" y1="110" x2="290" y2="110" stroke="#E6A700" strokeWidth="3"/>
                  <line x1="260" y1="135" x2="290" y2="135" stroke="#E6A700" strokeWidth="3"/>
                </g>
                <g transform="rotate(-5, 130, 150)">
                  <path d="M115 110 L135 110 L140 160 L110 160 Z" fill="#FFCCBC"/>
                  <path d="M115 110 L125 70 L135 110 Z" fill="#2D9F63"/>
                  <rect x="110" y="150" width="30" height="60" fill="#1b5e20"/>
                  <rect x="117" y="150" width="16" height="60" fill="#4CAF50"/>
                </g>
                <path d="M60 175 L200 200 V445 L60 405 Z" fill="#4CAF50"/>
                <path d="M200 200 L340 175 L340 405 L200 445 Z" fill="#2E7D32"/>
                <path d="M60 175 Q200 210 340 175 L340 185 Q200 220 60 185 Z" fill="#FFFFFF"/>
                <g transform="translate(10, 10)">
                  <path d="M90 255 Q145 230 190 255 Q235 230 290 255 L290 380 Q235 355 190 380 Q145 355 90 380 Z" fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round"/>
                  <line x1="190" y1="265" x2="190" y2="380" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M175 385 Q190 370 205 385" fill="#FFFFFF" />
                </g>
              </svg>
            </motion.div>
            
            {/* Judul Aplikasi */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-4xl font-extrabold text-[#1A432C] mb-3 tracking-tight font-sans"
            >
              CAHAYA ATK
            </motion.h1>
            
            {/* Sub-judul Deskripsi */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-sm font-medium text-[#3A6B4E] mb-12 leading-relaxed px-2"
            >
              Penyedia Alat Tulis Kantor dan Perlengkapan Sekolah Terlengkap<br/>
              <span className="text-[#2D9F63] font-semibold">Belanja Mudah, Cepat, dan Terpercaya</span>
            </motion.p>
            
            {/* Indikator Loading */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col items-center gap-8 mt-auto w-full"
            >
              {/* Spinner Minimalis Bercahaya */}
              <div className="relative flex justify-center items-center h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#2D9F63]/10" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2D9F63] animate-spin" />
                <div className="absolute w-2 h-2 bg-[#2D9F63] rounded-full animate-ping" />
              </div>
              
              {/* Slogan */}
              <p className="text-[10px] font-bold text-[#568767] tracking-widest uppercase text-balance leading-relaxed max-w-xs">
                Layanan Terbaik, Jaminan Kualitas,<br/>
                <span className="opacity-75 font-normal">Mendukung Kebutuhan Edukasi & Bisnis Anda</span>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
