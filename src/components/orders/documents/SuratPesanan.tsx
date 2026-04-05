import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Profile } from '../../../types';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { getLogoDataUrl } from './assets';

export const generateSuratPesanan = async (order: Order, user: User | null, profile: Profile | null) => {
  const docTitle = 'SURAT PESANAN';
  const toastId = toast.loading(`Menyiapkan ${docTitle.toLowerCase()}...`);
  
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 0. Background Watermark (Logo with transparency)
    try {
      const logoUrl = await getLogoDataUrl(400, 500);
      const watermarkWidth = 70;
      const watermarkHeight = 87.5;
      
      doc.saveGraphicsState();
      // Set transparency to ~10% opacity (90% transparent) for a subtle watermark
      doc.setGState(new (doc as any).GState({ opacity: 0.1 })); 
      doc.addImage(
        logoUrl, 
        'PNG', 
        (pageWidth - watermarkWidth) / 2, 
        (pageHeight - watermarkHeight) / 2, 
        watermarkWidth, 
        watermarkHeight
      );
      doc.restoreGraphicsState();
    } catch (e) {
      console.error('Watermark error:', e);
    }
    
    // 1. Header Logo & Professional Letterhead (Kop Surat)
    try {
      const logoUrl = await getLogoDataUrl(400, 500);
      // Geser logo ke kanan sedikit (dari 18 ke 28) agar lebih dekat dengan teks
      doc.addImage(logoUrl, 'PNG', 28, 7, 22, 27.5);
    } catch (e) {
      console.error('Logo error:', e);
    }

    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.setFont(undefined, 'bold');
    // Gunakan pageWidth / 2 agar benar-benar center di tengah kertas
    doc.text('CAHAYA ATK', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont(undefined, 'normal');
    doc.text('Solusi Alat Tulis Kantor & Sekolah Terlengkap', pageWidth / 2, 21, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan', pageWidth / 2, 26, { align: 'center' });
    doc.text('Telp: 081934779408 | Email: cahayaatk@gmail.com', pageWidth / 2, 30, { align: 'center' });
    
    // Horizontal Line for Letterhead (Diturunkan sedikit agar tidak menempel logo)
    doc.setLineWidth(0.8);
    doc.line(14, 36, pageWidth - 14, 36);
    doc.setLineWidth(0.2);
    doc.line(14, 37, pageWidth - 14, 37);
    
    // 2. Document Title (Centered)
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('SURAT PESANAN', pageWidth / 2, 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nomor: SP/${new Date(order.created_at).getFullYear()}/${order.id.slice(0, 8).toUpperCase()}`, pageWidth / 2, 50, { align: 'center' });
    
    // 3. Info Section (Formal Style)
    doc.setFontSize(10);
    doc.text('Yang bertanda tangan di bawah ini:', 14, 65);
    
    doc.setFont(undefined, 'bold');
    doc.text('Nama Pemesan', 20, 72);
    doc.text(':', 60, 72);
    doc.setFont(undefined, 'normal');
    doc.text(profile?.full_name || user?.email || 'Pelanggan Setia', 65, 72);
    
    doc.setFont(undefined, 'bold');
    doc.text('Alamat Pengiriman', 20, 78);
    doc.text(':', 60, 78);
    doc.setFont(undefined, 'normal');
    doc.text(order.address, 65, 78, { maxWidth: 120 });
    
    doc.setFont(undefined, 'bold');
    doc.text('Tanggal Pesanan', 20, 88);
    doc.text(':', 60, 88);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 65, 88);
    
    doc.text('Dengan ini mengajukan pesanan barang dengan rincian sebagai berikut:', 14, 100);
    
    // 4. Product Details Table
    const tableData = order.order_items?.map((item, index) => [
      index + 1,
      item.product?.name || 'Produk',
      item.quantity,
      'Pcs/Pack',
      `Rp ${item.price_at_time.toLocaleString('id-ID')}`,
      `Rp ${(item.quantity * item.price_at_time).toLocaleString('id-ID')}`
    ]) || [];
    
    autoTable(doc, {
      startY: 105,
      head: [['No.', 'Nama Barang', 'Jumlah', 'Satuan', 'Harga Satuan', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        halign: 'center',
        fontSize: 9
      },
      bodyStyles: { 
        fontSize: 9,
        fillColor: undefined // Make body transparent to show watermark
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });
    
    const tableFinalY = (doc as any).lastAutoTable.finalY;
    doc.setFont(undefined, 'bold');
    doc.text('Total Keseluruhan:', 140, tableFinalY + 10);
    doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 14, tableFinalY + 10, { align: 'right' });
    
    // 5. Signature Section (Formal SPJ Style)
    // Adjust spacing to match Invoice (approx 25 units from total line)
    const finalY = tableFinalY + 35;
    const buyerName = profile?.full_name || user?.email || 'Pelanggan';
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Magetan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 45, finalY - 10, { align: 'center' });
    
    const leftCenterX = 45;
    const rightCenterX = pageWidth - 45;
    
    // Buyer Side
    doc.setFont(undefined, 'bold');
    doc.text('Pemesan / Pembeli,', leftCenterX, finalY, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('( ____________________ )', leftCenterX, finalY + 35, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text(buyerName, leftCenterX, finalY + 42, { align: 'center', maxWidth: 60 });
    
    // Seller Side
    doc.setFont(undefined, 'bold');
    doc.text('Penyedia / Penjual,', rightCenterX, finalY, { align: 'center' });
    doc.text('CAHAYA ATK', rightCenterX, finalY + 5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text('( ____________________ )', rightCenterX, finalY + 35, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Cahaya Atk', rightCenterX, finalY + 42, { align: 'center' });
    
    // 6. Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Cahaya ATK - Solusi Alat Tulis Kantor & Sekolah', 14, doc.internal.pageSize.height - 15);
    
    const fileName = `Surat_Pesanan_${order.id.slice(0, 8)}.pdf`;
    
    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });
      
      await Share.share({
        title: docTitle,
        text: `Berikut adalah surat pesanan Anda.`,
        url: savedFile.uri,
        dialogTitle: `Bagikan Surat Pesanan`,
      });
      
      toast.success(`Surat Pesanan berhasil disimpan`, { id: toastId });
    } else {
      doc.save(fileName);
      toast.success(`Surat Pesanan berhasil diunduh`, { id: toastId });
    }
  } catch (error: any) {
    console.error('PDF Error:', error);
    toast.error(`Gagal mengunduh surat pesanan: ` + error.message, { id: toastId });
  }
};
