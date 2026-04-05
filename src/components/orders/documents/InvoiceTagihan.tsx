import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Profile } from '../../../types';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { getLogoDataUrl } from './assets';

export const generateInvoiceTagihan = async (order: Order, user: User | null, profile: Profile | null) => {
  const docTitle = 'NOTA PESANAN';
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
    
    // Invoice Label (Right Aligned)
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });
    
    doc.setFontSize(10);
    if (order.status === 'pending') {
      doc.setTextColor(220, 38, 38); // Red
    } else {
      doc.setTextColor(16, 185, 129); // Green
    }
    doc.text(order.status === 'pending' ? 'BELUM LUNAS' : 'LUNAS', pageWidth - 14, 27, { align: 'right' });
    
    // 2. Info Grid
    doc.setDrawColor(230);
    doc.setLineWidth(0.3);
    doc.line(14, 35, pageWidth - 14, 35);
    
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('DITAGIHKAN KE:', 14, 45);
    doc.setFont(undefined, 'normal');
    doc.text(profile?.full_name || user?.email || 'Pelanggan', 14, 50);
    doc.text(order.address, 14, 55, { maxWidth: 80 });
    doc.text(order.phone, 14, 65);
    
    // Right side info
    doc.setFont(undefined, 'bold');
    doc.text('NOMOR INVOICE:', 120, 45);
    doc.setFont(undefined, 'normal');
    const docNumber = order.custom_doc_number || `#INV-${order.id.slice(0, 8).toUpperCase()}`;
    doc.text(docNumber, 160, 45);
    
    doc.setFont(undefined, 'bold');
    doc.text('TANGGAL:', 120, 52);
    doc.setFont(undefined, 'normal');
    const docDate = order.custom_doc_date ? new Date(order.custom_doc_date) : new Date(order.created_at);
    doc.text(docDate.toLocaleDateString('id-ID'), 160, 52);
    
    doc.setFont(undefined, 'bold');
    doc.text('JATUH TEMPO:', 120, 59);
    doc.setFont(undefined, 'normal');
    const dueDate = new Date(docDate);
    dueDate.setDate(dueDate.getDate() + 3); // 3 days due
    doc.text(dueDate.toLocaleDateString('id-ID'), 160, 59);
    
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
      head: [['No.', 'Deskripsi Barang', 'Harga Satuan', 'Qty', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        lineWidth: 0.3
      },
      bodyStyles: { 
        fontSize: 9,
        lineWidth: 0.3,
        fillColor: undefined // Make body transparent to show watermark
      },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });
    
    // 4. Payment Instructions & Totals
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Payment Info Box (Outline only to show watermark)
    doc.setDrawColor(16, 185, 129); // Emerald 600
    doc.setLineWidth(0.1);
    doc.rect(14, finalY, 100, 30); 
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('INFORMASI PEMBAYARAN:', 18, finalY + 8);
    doc.setFont(undefined, 'normal');
    doc.text('Metode: Tunai / COD (Cash on Delivery)', 18, finalY + 15);
    doc.text('Silakan lakukan pembayaran saat barang diterima', 18, finalY + 22);
    doc.setFontSize(8);
    doc.text('*Simpan nota ini sebagai bukti transaksi', 18, finalY + 27);
    
    // Totals on the right
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', 130, finalY + 8);
    doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 14, finalY + 8, { align: 'right' });
    
    doc.text('Biaya Kirim:', 130, finalY + 16);
    doc.text('Rp 0', pageWidth - 14, finalY + 16, { align: 'right' });
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(130, finalY + 22, pageWidth - 14, finalY + 22);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL TAGIHAN:', 130, finalY + 30);
    doc.text(`Rp ${order.total_amount.toLocaleString('id-ID')}`, pageWidth - 14, finalY + 30, { align: 'right' });
    
    // 5. Signature Section (Formal SPJ Style)
    const sigY = finalY + 55;
    const buyerName = profile?.full_name || user?.email || 'Pelanggan';
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const sigDate = order.custom_doc_date ? new Date(order.custom_doc_date) : new Date();
    doc.text(`Magetan, ${sigDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 45, sigY - 10, { align: 'center' });
    
    const leftCenterX = 45;
    const rightCenterX = pageWidth - 45;
    
    // Buyer Side
    doc.setFont(undefined, 'bold');
    doc.text('Penerima / Pembeli,', leftCenterX, sigY, { align: 'center' });
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
    
    doc.text('End of receipt', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
    const fileName = `Invoice_Tagihan_${order.id.slice(0, 8)}.pdf`;
    
    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });
      
      await Share.share({
        title: docTitle,
        text: `Berikut adalah invoice tagihan pesanan Anda.`,
        url: savedFile.uri,
        dialogTitle: `Bagikan Invoice`,
      });
      
      toast.success(`Invoice berhasil disimpan`, { id: toastId });
    } else {
      doc.save(fileName);
      toast.success(`Invoice berhasil diunduh`, { id: toastId });
    }
  } catch (error: any) {
    console.error('PDF Error:', error);
    toast.error(`Gagal mengunduh invoice: ` + error.message, { id: toastId });
  }
};
