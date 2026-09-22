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

export interface TaxCalculationOptions {
  ppnPercent?: number;      // Default 11%
  pphPercent?: number;      // Default 0.5%
  adminPercent?: number;    // Default 1.0% (Admin Cahaya ATK)
  adminLabel?: string;      // Default 'Admin Cahaya ATK'
}

export const generateRincianPajakSPJ = async (
  order: Order, 
  user: User | null, 
  profile: Profile | null,
  options?: TaxCalculationOptions
) => {
  const docTitle = 'RINCIAN PERHITUNGAN PAJAK';
  const toastId = toast.loading(`Menyiapkan lembar ${docTitle.toLowerCase()}...`);
  
  const ppnRate = options?.ppnPercent ?? 11;
  const pphRate = options?.pphPercent ?? 0.5;
  const adminRate = options?.adminPercent ?? 1.0;
  const adminLabel = options?.adminLabel ?? 'Biaya Admin Cahaya ATK';

  const totalBelanja = order.total_amount;
  const nominalPPN = Math.round((ppnRate / 100) * totalBelanja);
  const nominalPPh = Math.round((pphRate / 100) * totalBelanja);
  const nominalAdmin = Math.round((adminRate / 100) * totalBelanja);
  const totalPotongan = nominalPPN + nominalPPh + nominalAdmin;
  const hargaRealBersih = totalBelanja - totalPotongan;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 0. Background Watermark (Subtle Logo)
    try {
      const logoUrl = await getLogoDataUrl(400, 500);
      const watermarkWidth = 70;
      const watermarkHeight = 87.5;
      
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.08 })); 
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
    
    // 1. Header Logo & Business Info
    try {
      const logoUrl = await getLogoDataUrl(200, 250);
      doc.addImage(logoUrl, 'PNG', 14, 10, 12, 15);
    } catch (e) {
      console.error('Logo error:', e);
    }

    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.setFont(undefined, 'bold');
    doc.text('Cahaya ATK', 28, 20);
    
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text('Solusi Alat Tulis Kantor & Sekolah', 28, 25);
    
    // Right Header Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('PERHITUNGAN PAJAK', pageWidth - 14, 20, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('LAMPIRAN TRANSAKSI RESMI', pageWidth - 14, 26, { align: 'right' });
    
    // Separator line
    doc.setDrawColor(220);
    doc.setLineWidth(0.4);
    doc.line(14, 33, pageWidth - 14, 33);

    // 2. Info Transaksi & Dokumen (Nomor Dokumen disamakan dengan Invoice)
    const buyerName = profile?.full_name || user?.email || 'Pelanggan';
    const docNumber = order.custom_doc_number || `#INV-${order.id.slice(0, 8).toUpperCase()}`;
    const docDate = order.custom_doc_date ? new Date(order.custom_doc_date) : new Date(order.created_at);
    const formattedDate = docDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(9);
    doc.setTextColor(0);
    
    // Left Box - Buyer Info
    doc.setFont(undefined, 'bold');
    doc.text('DITAGIHKAN KE / INSTANSI PEMBELI:', 14, 42);
    doc.setFont(undefined, 'normal');
    doc.text(buyerName, 14, 47);
    doc.text(order.address, 14, 52, { maxWidth: 85 });
    doc.setFont(undefined, 'bold');
    doc.text('Kontak / Telp', 14, 62);
    doc.text(':', 38, 62);
    doc.setFont(undefined, 'normal');
    doc.text(order.phone, 41, 62);

    // Right Box - Transaction Info (Rata Titik Dua Sempurna)
    const rightLabelX = 118;
    const rightColonX = 158;
    const rightValueX = 161;

    doc.setFont(undefined, 'bold');
    doc.text('NOMOR INVOICE', rightLabelX, 42);
    doc.text(':', rightColonX, 42);
    doc.setFont(undefined, 'normal');
    doc.text(docNumber, rightValueX, 42);

    doc.setFont(undefined, 'bold');
    doc.text('TANGGAL TRANSAKSI', rightLabelX, 48);
    doc.text(':', rightColonX, 48);
    doc.setFont(undefined, 'normal');
    doc.text(formattedDate, rightValueX, 48);

    doc.setFont(undefined, 'bold');
    doc.text('METODE BAYAR', rightLabelX, 54);
    doc.text(':', rightColonX, 54);
    doc.setFont(undefined, 'normal');
    doc.text(order.payment_method === 'cod' ? 'Tunai / COD' : 'Transfer / QRIS Bank', rightValueX, 54);

    doc.setFont(undefined, 'bold');
    doc.text('MEKANISME TRANSAKSI', rightLabelX, 60);
    doc.text(':', rightColonX, 60);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Disetor oleh Penyedia', rightValueX, 60);
    doc.setTextColor(0);

    // 3. Ringkasan Pembelian Barang
    const itemRows = order.order_items?.map((item, idx) => [
      idx + 1,
      item.product?.name || 'Item ATK',
      `Rp ${item.price_at_time.toLocaleString('id-ID')}`,
      item.quantity,
      `Rp ${(item.quantity * item.price_at_time).toLocaleString('id-ID')}`
    ]) || [];

    autoTable(doc, {
      startY: 70,
      head: [['No', 'Uraian Belanja Barang ATK', 'Harga Satuan', 'Qty', 'Total Belanja']],
      body: itemRows,
      theme: 'grid',
      styles: {
        valign: 'middle',
        fontSize: 8.5
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { halign: 'left' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'head') {
          hookData.cell.styles.halign = 'center';
        }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 6;

    // 4. Tabel Rincian Pajak & Biaya Sistem
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text('RINCIAN ALOKASI PAJAK & BIAYA LAYANAN SISTEM', 14, currentY);

    const taxRows = [
      ['1', 'Nilai Bruto Tagihan / Nilai Kontrak Transaksi', '100%', `Rp ${totalBelanja.toLocaleString('id-ID')}`],
      ['2', 'Pajak Pertambahan Nilai (PPN 11%) - Disetor ke Kas Negara', `${ppnRate}%`, `- Rp ${nominalPPN.toLocaleString('id-ID')}`],
      ['3', 'Pajak Penghasilan (PPh Final UMKM) - Disetor ke Kas Negara', `${pphRate}%`, `- Rp ${nominalPPh.toLocaleString('id-ID')}`],
      ['4', 'Biaya Layanan Sistem', `${adminRate}%`, `- Rp ${nominalAdmin.toLocaleString('id-ID')}`],
      ['', 'Total Alokasi Setoran Pajak & Biaya Sistem', `${(ppnRate + pphRate + adminRate).toFixed(1)}%`, `- Rp ${totalPotongan.toLocaleString('id-ID')}`],
      ['', 'TOTAL PENDAPATAN BERSIH PENYEDIA (CAHAYA ATK)', `${(100 - (ppnRate + pphRate + adminRate)).toFixed(1)}%`, `Rp ${hargaRealBersih.toLocaleString('id-ID')}`]
    ];

    autoTable(doc, {
      startY: currentY + 3,
      head: [['No', 'Komponen Transaksi & Alokasi', 'Tarif / Rasio', 'Nominal']],
      body: taxRows,
      theme: 'grid',
      styles: {
        valign: 'middle',
        fontSize: 8.5
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 95 },
        2: { cellWidth: 35, halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'head') {
          hookData.cell.styles.halign = 'center';
        }
        // Highlight the grand total rows
        if (hookData.section === 'body' && hookData.row.index === 4) {
          hookData.cell.styles.fillColor = [254, 242, 242]; // Rose 50
          hookData.cell.styles.textColor = [185, 28, 28]; // Red 700
          hookData.cell.styles.fontStyle = 'bold';
        }
        if (hookData.section === 'body' && hookData.row.index === 5) {
          hookData.cell.styles.fillColor = [236, 253, 245]; // Emerald 50
          hookData.cell.styles.textColor = [4, 120, 87]; // Emerald 700
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Catatan Terbilang
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60);
    doc.text(`Terbilang Pendapatan Bersih Penyedia:`, 14, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(`"${terbilang(hargaRealBersih)} Rupiah"`, 14, currentY + 5, { maxWidth: pageWidth - 28 });

    // Catatan Resmi Penyetoran Pajak oleh Rekanan
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Catatan Penyetoran Pajak:', 14, currentY + 12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80);
    doc.text(
      'Seluruh kewajiban perpajakan (PPN 11% & PPh Final 0,5%) atas transaksi ini disetorkan langsung ke Kas Negara oleh pihak Penyedia (Cahaya ATK).',
      14,
      currentY + 16,
      { maxWidth: pageWidth - 28 }
    );

    // 5. Tanda Tangan Resmi (Format Selaras dengan Faktur & Invoice)
    const sigY = currentY + 30;
    const leftCenterX = 50;
    const rightCenterX = pageWidth - 50;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Magetan, ${formattedDate}`, rightCenterX, sigY - 6, { align: 'center' });

    // Pihak 1 (Penerima / Pembeli / Bendahara)
    doc.setFont(undefined, 'bold');
    doc.text('Mengetahui / Memeriksa,', leftCenterX, sigY, { align: 'center' });
    doc.text('Bendahara / Pihak Pembeli', leftCenterX, sigY + 5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text('( __________________________ )', leftCenterX, sigY + 26, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text(buyerName, leftCenterX, sigY + 32, { align: 'center', maxWidth: 65 });

    // Pihak 2 (Penyedia Cahaya ATK)
    doc.setFont(undefined, 'bold');
    doc.text('Penyedia Barang / Rekanan,', rightCenterX, sigY, { align: 'center' });
    doc.text('CAHAYA ATK', rightCenterX, sigY + 5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text('( __________________________ )', rightCenterX, sigY + 26, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Pengelola Cahaya ATK', rightCenterX, sigY + 32, { align: 'center' });

    // 6. Footer Resmi Konsumen (Standar Faktur & Invoice Cahaya ATK)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Cahaya ATK - Solusi Alat Tulis Kantor & Sekolah', 14, pageHeight - 25);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan', 14, pageHeight - 20);
    doc.text(`NPWP: ${profile?.npwp || '00.000.000.0-000.000'}`, 14, pageHeight - 15);
    
    doc.text('Dokumen ini merupakan lampiran resmi rincian perhitungan pajak & alokasi transaksi belanja yang sah', pageWidth / 2, pageHeight - 8, { align: 'center' });

    const fileName = `Rincian_Pajak_${order.id.slice(0, 8)}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });

      await Share.share({
        title: docTitle,
        text: `Berikut lembar rincian perhitungan pajak transaksi pesanan ${docNumber}.`,
        url: savedFile.uri,
        dialogTitle: `Bagikan Lembar Perhitungan Pajak`,
      });

      toast.success(`Dokumen perhitungan pajak berhasil disimpan`, { id: toastId });
    } else {
      doc.save(fileName);
      toast.success(`Dokumen perhitungan pajak berhasil diunduh`, { id: toastId });
    }
  } catch (error: any) {
    console.error('PDF Tax Error:', error);
    toast.error(`Gagal mengunduh dokumen pajak: ` + error.message, { id: toastId });
  }
};
