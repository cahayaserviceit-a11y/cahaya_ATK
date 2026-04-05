import React from 'react';
import { Construction, Clock, Mail, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[40px] shadow-sm p-12 text-center space-y-10 border border-neutral-100"
      >
        {/* Icon Header */}
        <div className="relative inline-block">
          <div className="w-20 h-20 bg-[#fff9eb] rounded-2xl flex items-center justify-center mx-auto border border-[#ffedc2]">
            <Construction className="w-10 h-10 text-[#d35400]" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-2xl shadow-md flex items-center justify-center border border-neutral-50">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-6">
          <h1 className="text-[42px] font-serif font-medium tracking-tight text-neutral-900 leading-tight">
            Aplikasi Dalam <span className="relative inline-block">
              <span className="text-[#d35400] italic">Pemeliharaan</span>
              <span className="absolute bottom-1 left-0 w-full h-1.5 bg-[#f39c12] opacity-30 rounded-full"></span>
            </span>
          </h1>
          <p className="text-lg text-neutral-500 max-w-md mx-auto leading-relaxed font-medium">
            Mohon maaf atas ketidaknyamanannya. Saat ini kami sedang melakukan pembaruan sistem untuk memberikan pengalaman yang lebih baik bagi Anda.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-4 bg-[#fafafa] p-5 rounded-3xl border border-neutral-100 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-50">
              <Clock className="w-6 h-6 text-[#d35400]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Estimasi Selesai</p>
              <p className="text-sm font-bold text-neutral-900">Segera Kembali</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-[#fafafa] p-5 rounded-3xl border border-neutral-100 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-50">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hubungi Kami</p>
              <p className="text-sm font-bold text-neutral-900">nurimanps0@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-10 border-t border-neutral-50">
          <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-[0.3em]">
            Terima Kasih Atas Kesabaran Anda
          </p>
        </div>
      </motion.div>
    </div>
  );
};
