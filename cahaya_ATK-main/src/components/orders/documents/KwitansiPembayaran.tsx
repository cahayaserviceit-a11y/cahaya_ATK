import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Profile } from '../../../types';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { getLogoDataUrl } from './assets';
import { terbilang } from '../../../lib/utils';

export const generateKwitansiPembayaran = async (order: Order, user: User | null, profile: Profile | null) => {
  const docTitle = 'KWITANSI PEMBAYARAN';
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
    
    // 1. Top Header: Logo & Business Info
    try {
      const logoUrl = await getLogoDataUrl(120, 150);
      doc.addImage(logoUrl, 'PNG', 14, 12, 14, 17.5);
    } catch (e) {
      console.error('Logo error:', e);
    }

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.setFont(undefined, 'bold');
    doc.text('Cahaya ATK', 32, 18);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, 'normal');
    doc.text('Solusi Alat Tulis Kantor & Sekolah', 32, 23);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan, Jawa Timur', 32, 28);

    // 2. Receipt Title & Number Box (SIPLah Style)
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.rect(14, 35, pageWidth - 28, 20); // Main Header Box
    doc.line(pageWidth / 2 - 20, 35, pageWidth / 2 - 20, 55); // Vertical Divider

    // Left Box: Title
    const leftBoxCenterX = (14 + (pageWidth / 2 - 20)) / 2;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('KWITANSI', leftBoxCenterX, 43, { align: 'center' });
    doc.text('PEMBAYARAN', leftBoxCenterX, 49, { align: 'center' });

    // Right Box: Receipt Number
    const rightBoxCenterX = ((pageWidth / 2 - 20) + (pageWidth - 14)) / 2;
    doc.setFontSize(9);
    doc.text('Nomor Kwitansi', rightBoxCenterX, 43, { align: 'center' });
    doc.setFont(undefined, 'normal');
    const docNumber = order.custom_doc_number || `KW-${order.id.slice(0, 8).toUpperCase()}`;
    doc.text(docNumber, rightBoxCenterX, 49, { align: 'center' });

    // 3. Main Content Table (SIPLah Style)
    const amountInWords = terbilang(order.total_amount) + ' Rupiah';
    const customerName = profile?.full_name || user?.email || 'Pelanggan';
    const docDate = order.custom_doc_date ? new Date(order.custom_doc_date) : new Date(order.created_at);
    const formattedDate = docDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    autoTable(doc, {
      startY: 60,
      body: [
        ['Sudah terima dari :', `${customerName}\n${order.address}`],
        ['Terbilang :', amountInWords],
        ['Untuk Pembayaran :', `Kegiatan Jual Beli Alat Tulis Kantor & Sekolah dengan nomor Invoice #INV-${order.id.slice(0, 8).toUpperCase()}`],
        ['Alokasi Anggaran :', 'BOSP / Dana Operasional'],
      ],
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // 4. Notes Section
    doc.setLineWidth(0.3);
    doc.rect(14, finalY, pageWidth - 28, 30); // Notes Box
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Catatan', 18, finalY + 7);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('*Pembayaran dilakukan secara tunai (COD) saat barang diterima.', 18, finalY + 13);
    doc.text('*Dokumen ini adalah bukti pembayaran yang sah.', 18, finalY + 18);
    doc.text('*Simpan kwitansi ini sebagai bukti transaksi.', 18, finalY + 23);

    // 5. Signature Section
    doc.setLineWidth(0.3);
    doc.rect(14, finalY + 30, pageWidth - 28, 45); // Signature Box
    doc.line(pageWidth / 2 - 20, finalY + 30, pageWidth / 2 - 20, finalY + 75); // Vertical Divider

    // Right side of signature box: Date and Signature
    doc.setFontSize(10);
    doc.text(`Magetan, ${formattedDate}`, rightBoxCenterX, finalY + 38, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Nama Penanggung Jawab', rightBoxCenterX, finalY + 45, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.text('( ____________________ )', rightBoxCenterX, finalY + 63, { align: 'center' });

    doc.setFont(undefined, 'bold');
    doc.text('CAHAYA ATK', rightBoxCenterX, finalY + 70, { align: 'center' });

    // 6. Footer (SIPLah Style)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Dokumen ini diprint melalui sistem Aplikasi E-commerce Cahaya ATK', pageWidth / 2, pageHeight - 15, { align: 'center' });

    const fileName = `Kwitansi_Pembayaran_${order.id.slice(0, 8)}.pdf`;
    
    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });
      
      await Share.share({
        title: docTitle,
        text: `Berikut adalah kwitansi pembayaran pesanan Anda.`,
        url: savedFile.uri,
        dialogTitle: `Bagikan Kwitansi`,
      });
      
      toast.success(`Kwitansi berhasil disimpan`, { id: toastId });
    } else {
      doc.save(fileName);
      toast.success(`Kwitansi berhasil diunduh`, { id: toastId });
    }
  } catch (error: any) {
    console.error('PDF Error:', error);
    toast.error(`Gagal mengunduh kwitansi: ` + error.message, { id: toastId });
  }
};
