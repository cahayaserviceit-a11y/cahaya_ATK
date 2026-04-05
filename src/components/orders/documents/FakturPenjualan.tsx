import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Profile } from '../../../types';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { getLogoDataUrl } from './assets';

export const generateFakturPenjualan = async (order: Order, user: User | null, profile: Profile | null) => {
  const docTitle = 'FAKTUR PENJUALAN';
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
    
    // 1. Header Logo & Title
    try {
      const logoUrl = await getLogoDataUrl(200, 250);
      doc.addImage(logoUrl, 'PNG', 14, 10, 12, 15);
    } catch (e) {
      console.error('Logo error:', e);
    }

    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.setFont(undefined, 'bold');
    doc.text('Cahaya ATK', 28, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text('Solusi Alat Tulis Kantor & Sekolah', 28, 25);
    
    // Faktur Label (Right Aligned)
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('FAKTUR', pageWidth - 14, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Green
    doc.text('DIBAYAR', pageWidth - 14, 27, { align: 'right' });
    
    // 2. Info Grid
    doc.setDrawColor(230);
    doc.line(14, 35, pageWidth - 14, 35);
    
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('PEMBELI:', 14, 45);
    doc.setFont(undefined, 'normal');
    doc.text(profile?.full_name || user?.email || 'Pelanggan', 14, 50);
    doc.text(order.address, 14, 55, { maxWidth: 80 });
    doc.text(order.phone, 14, 65);
    
    // Right side info
    doc.setFont(undefined, 'bold');
    doc.text('NOMOR FAKTUR:', 120, 45);
    doc.setFont(undefined, 'normal');
    doc.text(`INV-${order.id.slice(0, 8).toUpperCase()}`, 160, 45);
    
    doc.setFont(undefined, 'bold');
    doc.text('TANGGAL:', 120, 52);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(order.created_at).toLocaleDateString('id-ID'), 160, 52);
    
    doc.setFont(undefined, 'bold');
    doc.text('METODE BAYAR:', 120, 59);
    doc.setFont(undefined, 'normal');
    doc.text(order.payment_method === 'cod' ? 'COD' : 'Transfer/QRIS', 160, 59);
    
    // 3. Product Details Table (Emerald Theme)
    const tableData = order.order_items?.map((item, index) => [
      index + 1,
      item.product?.name || 'Produk',
      `Rp ${item.price_at_time.toLocaleString('id-ID')}`,
      item.quantity,
      `Rp ${(item.quantity * item.price_at_time).toLocaleString('id-ID')}`
    ]) || [];
    
    autoTable(doc, {
      startY: 75,
      head: [['No.', 'Nama Barang', 'Harga Satuan', 'Qty', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        lineWidth: 0.2
      },
      bodyStyles: { 
        fontSize: 9,
        lineWidth: 0.2,
        fillColor: undefined // Make body transparent to show watermark
      },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });
    
    // 4. Totals Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('GRAND TOTAL', 130, finalY);
    doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 14, finalY, { align: 'right' });
    
    // 5. Signature Section (Formal SPJ Style)
    const sigY = finalY + 25;
    const buyerName = profile?.full_name || user?.email || 'Pelanggan';
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Magetan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 45, sigY - 10, { align: 'center' });
    
    const leftCenterX = 45;
    const rightCenterX = pageWidth - 45;
    
    // Buyer Side
    doc.setFont(undefined, 'bold');
    doc.text('Penerima Barang,', leftCenterX, sigY, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text('( ____________________ )', leftCenterX, sigY + 30, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text(buyerName, leftCenterX, sigY + 37, { align: 'center', maxWidth: 60 });
    
    // Seller Side
    doc.setFont(undefined, 'bold');
    doc.text('Hormat Kami,', rightCenterX, sigY, { align: 'center' });
    doc.text('CAHAYA ATK', rightCenterX, sigY + 5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text('( ____________________ )', rightCenterX, sigY + 30, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Cahaya Atk', rightCenterX, sigY + 37, { align: 'center' });
    
    // 7. Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Cahaya ATK - Solusi Alat Tulis Kantor & Sekolah', 14, doc.internal.pageSize.height - 30);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariiboyo, Magetan', 14, doc.internal.pageSize.height - 25);
    doc.text('NPWP: 00.000.000.0-000.000', 14, doc.internal.pageSize.height - 20);
    
    doc.text('Faktur ini adalah bukti pembayaran yang sah', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
    const fileName = `Faktur_Penjualan_${order.id.slice(0, 8)}.pdf`;
    
    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });
      
      await Share.share({
        title: docTitle,
        text: `Berikut adalah faktur penjualan pesanan Anda.`,
        url: savedFile.uri,
        dialogTitle: `Bagikan Faktur`,
      });
      
      toast.success(`Faktur berhasil disimpan`, { id: toastId });
    } else {
      doc.save(fileName);
      toast.success(`Faktur berhasil diunduh`, { id: toastId });
    }
  } catch (error: any) {
    console.error('PDF Error:', error);
    toast.error(`Gagal mengunduh faktur: ` + error.message, { id: toastId });
  }
};
