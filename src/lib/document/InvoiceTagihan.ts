import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentData, formatCurrency, formatDate, loadImage } from './types';

export const generateInvoiceTagihan = async (data: DocumentData) => {
  const { order, seller, buyer } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Logo & Header Info
  let headerY = 15;
  if (seller.logo_url) {
    try {
      const logoData = await loadImage(seller.logo_url);
      doc.addImage(logoData, 'PNG', 14, headerY, 30, 30);
    } catch (e) {
      console.error('Failed to load logo', e);
    }
  }

  // Store Info (Next to logo)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(seller.full_name || 'CAHAYA ATK', 48, headerY + 5);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Solusi Alat Tulis Kantor & Sekolah', 48, headerY + 10);
  doc.text(seller.address || 'Jl. Sutan Agung, Balegondo, Magetan', 48, headerY + 15, { maxWidth: 80 });
  doc.text(`Telp/WA: ${seller.phone || '-'}`, 48, headerY + 25);

  // Document Title & Number (Right Side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE TAGIHAN', pageWidth - 14, headerY + 5, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const dateObj = new Date(order.created_at);
  const monthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getFullYear()).slice(-2)}`;
  doc.text(`No Nota : ATK-${monthYear}-${order.id.slice(-3).toUpperCase()}`, pageWidth - 14, headerY + 12, { align: 'right' });
  doc.text(`Tanggal : ${formatDate(order.created_at)}`, pageWidth - 14, headerY + 17, { align: 'right' });
  
  // Separator
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, headerY + 35, pageWidth - 14, headerY + 35);
  
  // Buyer Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Kepada Yth:', 14, headerY + 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(buyer?.full_name || 'Pelanggan', 14, headerY + 50);
  doc.text(order.address || buyer?.address || '-', 14, headerY + 55, { maxWidth: 100 });

  // Items Table
  const tableData = order.order_items?.map((item, index) => [
    index + 1,
    item.product?.name || 'Produk',
    item.quantity,
    formatCurrency(item.price_at_time),
    formatCurrency(item.price_at_time * item.quantity)
  ]) || [];

  autoTable(doc, {
    startY: headerY + 70,
    head: [['No', 'Nama Barang', 'Qty', 'Harga Satuan', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 40 }
    }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Pembayaran:', pageWidth - 80, finalY);
  doc.text(formatCurrency(order.total_amount), pageWidth - 14, finalY, { align: 'right' });

  // Footer / Signatures
  const footerY = Math.max(finalY + 20, doc.internal.pageSize.getHeight() - 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Magetan, ${formatDate(new Date())}`, pageWidth - 14, footerY, { align: 'right' });

  // Pembeli (Left)
  doc.text('Pembeli,', 30, footerY + 10, { align: 'center' });
  doc.text('( tanda tangan )', 30, footerY + 30, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(buyer?.full_name || 'Nama Pembeli', 30, footerY + 35, { align: 'center' });

  // Penjual (Right)
  doc.setFont('helvetica', 'normal');
  doc.text('Penjual,', pageWidth - 50, footerY + 10, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(seller.full_name || 'Cahaya ATK', pageWidth - 50, footerY + 15, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('( ttd + stempel )', pageWidth - 50, footerY + 30, { align: 'center' });
  doc.text('..........................', pageWidth - 50, footerY + 35, { align: 'center' });

  return doc;
};
