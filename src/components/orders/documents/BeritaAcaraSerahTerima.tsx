import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Profile, SchoolTransactionData } from '../../../types';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { getLogoDataUrl } from './assets';

export const generateBeritaAcaraSerahTerima = async (
  order: Order,
  user: User | null,
  profile: Profile | null,
  schoolData?: Partial<SchoolTransactionData>
) => {
  const docTitle = 'BERITA ACARA SERAH TERIMA';
  const toastId = toast.loading(`Menyiapkan ${docTitle.toLowerCase()}...`);

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 0. Watermark
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

    // 1. Kop Surat Resmi
    try {
      const logoUrl = await getLogoDataUrl(200, 250);
      doc.addImage(logoUrl, 'PNG', 14, 10, 14, 17.5);
    } catch (e) {
      console.error('Logo error:', e);
    }

    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.setFont(undefined, 'bold');
    doc.text('CAHAYA ATK', 32, 18);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text('Solusi Pengadaan Alat Tulis Kantor & Perlengkapan Sekolah', 32, 23);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan | WA/Telp: 085850392240', 32, 27);

    // Garis Pemisah Kop
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(14, 32, pageWidth - 14, 32);

    // 2. Judul Dokumen
    const docNumber = order.custom_doc_number || `#INV-${order.id.slice(0, 8).toUpperCase()}`;

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('BERITA ACARA SERAH TERIMA BARANG', pageWidth / 2, 40, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Nomor: ${docNumber}`, pageWidth / 2, 45, { align: 'center' });

    // 3. Kalimat Pembuka
    const docDate = order.custom_doc_date 
      ? new Date(order.custom_doc_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(8.5);
    doc.setTextColor(50);
    doc.text(
      `Pada hari ini, tanggal ${docDate}, kami yang bertanda tangan di bawah ini:`,
      14,
      53
    );

    const labelX = 20;
    const colonX = 54;
    const valX = 58;

    // Pihak Pertama (Penyedia)
    doc.setFont(undefined, 'bold');
    doc.text('1. PIHAK PERTAMA (Penyedia Barang):', 14, 60);
    
    doc.setFont(undefined, 'normal');
    doc.text('Nama Usaha', labelX, 65);
    doc.text(':', colonX, 65);
    doc.text('CAHAYA ATK (Toko Alat Tulis Kantor & Sekolah)', valX, 65);

    doc.text('Penanggung Jawab', labelX, 70);
    doc.text(':', colonX, 70);
    doc.text('Pengelola Cahaya ATK', valX, 70);

    doc.text('Alamat Usaha', labelX, 75);
    doc.text(':', colonX, 75);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan', valX, 75, { maxWidth: pageWidth - valX - 14 });

    // Pihak Kedua (Sekolah / Pembeli)
    const picName = schoolData?.personInCharge || profile?.full_name || 'Pembeli Terverifikasi';
    const schoolName = schoolData?.schoolName || 'Instansi Sekolah / Pembeli';
    const schoolAddress = schoolData?.schoolAddress || order.address || 'Magetan';
    const picTitle = schoolData?.personTitle || 'Kepala Sekolah / Penanggung Jawab';

    doc.setFont(undefined, 'bold');
    doc.text('2. PIHAK KEDUA (Penerima / Instansi Sekolah):', 14, 83);
    
    doc.setFont(undefined, 'normal');
    doc.text('Nama Instansi', labelX, 88);
    doc.text(':', colonX, 88);
    doc.text(schoolName, valX, 88, { maxWidth: pageWidth - valX - 14 });

    doc.text('Penanggung Jawab', labelX, 93);
    doc.text(':', colonX, 93);
    doc.text(`${picName} (${picTitle})`, valX, 93, { maxWidth: pageWidth - valX - 14 });

    doc.text('Alamat Instansi', labelX, 98);
    doc.text(':', colonX, 98);
    doc.text(schoolAddress, valX, 98, { maxWidth: pageWidth - valX - 14 });

    doc.text(
      'PIHAK PERTAMA telah menyerahkan barang dalam keadaan baik, baru, dan lengkap kepada PIHAK KEDUA, dan PIHAK KEDUA telah menerima penyerahan barang tersebut dengan rincian sebagai berikut:',
      14,
      107,
      { maxWidth: pageWidth - 28 }
    );

    // 4. Tabel Barang
    const tableItems = order.order_items && order.order_items.length > 0
      ? order.order_items.map((item, idx) => [
          (idx + 1).toString(),
          item.product?.name || 'Barang ATK',
          `${item.quantity} Unit / Pcs`,
          'Baik & Lengkap',
          `Sesuai Pesanan`
        ])
      : [
          ['1', 'Pengadaan Barang Alat Tulis Kantor', '1 Paket', 'Baik & Lengkap', 'Sesuai Pesanan']
        ];

    autoTable(doc, {
      startY: 115,
      head: [['No', 'Uraian Nama Barang & Spesifikasi', 'Jumlah', 'Kondisi Fisik', 'Keterangan']],
      body: tableItems,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'head') {
          hookData.cell.styles.halign = 'center';
          hookData.cell.styles.valign = 'middle';
        }
      },
      bodyStyles: {
        fontSize: 8,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 85 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 32, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(50);
    doc.text(
      'Demikian Berita Acara Serah Terima Barang ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.',
      14,
      currentY,
      { maxWidth: pageWidth - 28 }
    );

    // 5. Tanda Tangan Formal
    const sigY = currentY + 16;
    const leftCenterX = 50;
    const rightCenterX = pageWidth - 50;

    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.text(`Magetan, ${docDate}`, rightCenterX, sigY - 5, { align: 'center' });

    doc.setFont(undefined, 'bold');
    doc.text('PIHAK KEDUA (Penerima),', leftCenterX, sigY, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text(schoolName, leftCenterX, sigY + 4, { align: 'center', maxWidth: 65 });
    doc.text('( ........................................ )', leftCenterX, sigY + 26, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text(picName, leftCenterX, sigY + 31, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text(picTitle, leftCenterX, sigY + 35, { align: 'center' });

    doc.setFont(undefined, 'bold');
    doc.text('PIHAK PERTAMA (Penyedia),', rightCenterX, sigY, { align: 'center' });
    doc.text('CAHAYA ATK', rightCenterX, sigY + 4, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text('( ........................................ )', rightCenterX, sigY + 26, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Pengelola Cahaya ATK', rightCenterX, sigY + 31, { align: 'center' });

    // Footer (Standar Legal Cahaya ATK)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Cahaya ATK - Solusi Alat Tulis Kantor & Sekolah', 14, pageHeight - 25);
    doc.text('Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan', 14, pageHeight - 20);
    doc.text(`NPWP: ${profile?.npwp || '00.000.000.0-000.000'}`, 14, pageHeight - 15);
    doc.text(
      'Dokumen transaksi ini dibuat sebagai bukti fisik penyerahan barang yang sah antara rekanan dan pihak sekolah.',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    const fileName = `BAST_${order.id.slice(0, 8)}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });

      await Share.share({
        title: docTitle,
        text: `Berikut adalah Berita Acara Serah Terima Barang untuk ${schoolName}.`,
        url: savedFile.uri,
        dialogTitle: `Bagikan BAST`,
      });

      toast.success(`BAST berhasil disimpan`, { id: toastId });
    } else {
      doc.save(fileName);
      toast.success(`BAST berhasil diunduh`, { id: toastId });
    }
  } catch (error: any) {
    console.error('PDF Error:', error);
    toast.error(`Gagal membuat BAST: ` + error.message, { id: toastId });
  }
};
