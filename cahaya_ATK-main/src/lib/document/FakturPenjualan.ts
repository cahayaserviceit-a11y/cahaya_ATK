import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentData, formatCurrency, formatDate, loadImage } from './types';

export const generateFakturPenjualan = async (data: DocumentData) => {
  const { order, seller, buyer } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Logo & Header Info
  let headerY = 15;
  if (seller.logo_url) {
    try {
      const logoData = await loadImage(seller.logo_url);
      // Ukuran 3x3 cm (30x30 mm)
      doc.addImage(logoData, 'PNG', 14, headerY, 30, 30);
    } catch (e) {
      console.error('Failed to load logo', e);
    }
  }

  // Store Info (Next to logo)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(seller.full_name || 'CAHAYA ATK', 48, headerY + 6);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Solusi Alat Tulis Kantor & Sekolah', 48, headerY + 12);
  doc.text(seller.address || 'Jl. Sutan Agung, Balegondo, Magetan', 48, headerY + 18, { maxWidth: 80 });
  doc.text(`Telp/WA: ${seller.phone || '-'}`, 48, headerY + 28);

  // Document Title & Number (Right Side)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('NOTA', pageWidth - 14, headerY + 6, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const dateObj = new Date(order.created_at);
  const monthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getFullYear()).slice(-2)}`;
  doc.text(`No Nota : ATK-${monthYear}-${order.id.slice(-3).toUpperCase()}`, pageWidth - 14, headerY + 14, { align: 'right' });
  doc.text(`Tanggal : ${formatDate(order.created_at)}`, pageWidth - 14, headerY + 20, { align: 'right' });
  
  // Separator Line (Thick)
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.line(14, headerY + 35, pageWidth - 14, headerY + 35);
  
  // Buyer Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada Yth:', 14, headerY + 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(buyer?.full_name || 'Pelanggan Umum', 14, headerY + 51);
  doc.text(order.address || buyer?.address || '-', 14, headerY + 57, { maxWidth: 100 });

  // Items Table (Standard Nota Style)
  const tableData = order.order_items?.map((item, index) => [
    index + 1,
    item.product?.name || 'Produk',
    item.quantity,
    formatCurrency(item.price_at_time),
    formatCurrency(item.price_at_time * item.quantity)
  ]) || [];

  autoTable(doc, {
    startY: headerY + 70,
    head: [['No', 'Nama Barang', 'Qty', 'Harga Satuan', 'Jumlah']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.3 },
    styles: { fontSize: 10, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.3 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 40 }
    }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AKHIR:', pageWidth - 85, finalY);
  doc.text(formatCurrency(order.total_amount), pageWidth - 14, finalY, { align: 'right' });

  // Footer / Signatures
  const footerY = Math.max(finalY + 25, doc.internal.pageSize.getHeight() - 70);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Magetan, ${formatDate(new Date())}`, pageWidth - 14, footerY, { align: 'right' });

  // Pembeli (Left)
  doc.text('Pembeli,', 35, footerY + 10, { align: 'center' });
  doc.text('( tanda tangan )', 35, footerY + 30, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(buyer?.full_name || 'Nama Pembeli', 35, footerY + 36, { align: 'center' });

  // Penjual (Right)
  doc.setFont('helvetica', 'normal');
  doc.text('Penjual,', pageWidth - 50, footerY + 10, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(seller.full_name || 'Cahaya ATK', pageWidth - 50, footerY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('( ttd + stempel )', pageWidth - 50, footerY + 30, { align: 'center' });
  doc.text('..........................', pageWidth - 50, footerY + 36, { align: 'center' });

  // Note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('* Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.', 14, doc.internal.pageSize.getHeight() - 15);

  return doc;
};
