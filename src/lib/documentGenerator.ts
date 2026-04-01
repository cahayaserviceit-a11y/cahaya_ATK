import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Profile } from '../types';
import { Capacitor } from '@capacitor/core';

export const generateInvoice = async (order: Order, seller: Profile, buyer: Profile | null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Helper for currency
  const formatCurrency = (num: number) => `Rp. ${num.toLocaleString('id-ID')}`;

  // 1. Header Section (Logo placeholder and Title)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CAHAYA ATK', 14, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('(Toko Alat Tulis & Kantor)', 14, 24);
  doc.text(`NPWP ${seller.npwp || '-'}`, 14, 28);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`NO: ${order.id.toUpperCase()}`, pageWidth - 14, 25, { align: 'right' });
  doc.text(`Tanggal Dokumen : ${new Date(order.created_at).toLocaleDateString('id-ID')}`, pageWidth - 14, 30, { align: 'right' });

  // 2. Dari & Untuk Section
  doc.setDrawColor(200);
  doc.line(14, 35, pageWidth - 14, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dari', 14, 45);
  doc.text('Untuk', pageWidth / 2 + 10, 45);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Seller Info
  let sellerY = 50;
  doc.text(`Nama Penyedia: ${seller.full_name || 'CAHAYA ATK'}`, 14, sellerY);
  doc.text(`Alamat Penyedia: ${seller.address || '-'}`, 14, sellerY + 4, { maxWidth: 80 });
  doc.text(`Kontak Penyedia: ${seller.phone || '-'}`, 14, sellerY + 12);
  doc.text(`NPWP Penyedia: ${seller.npwp || '-'}`, 14, sellerY + 16);

  // Buyer Info
  let buyerY = 50;
  doc.text(`Nama Perwakilan Satdik: ${buyer?.full_name || 'Pelanggan'}`, pageWidth / 2 + 10, buyerY);
  doc.text(`Alamat Satdik: ${order.address || buyer?.address || '-'}`, pageWidth / 2 + 10, buyerY + 4, { maxWidth: 80 });
  doc.text(`Kontak Satdik: ${order.phone || buyer?.phone || '-'}`, pageWidth / 2 + 10, buyerY + 12);
  doc.text(`NPWP Satdik: ${buyer?.npwp || '-'}`, pageWidth / 2 + 10, buyerY + 16);

  // 3. Payment & Shipping Info
  doc.setFont('helvetica', 'bold');
  doc.text('Pembayaran', 14, 80);
  doc.text('Metode Pengiriman:', pageWidth / 2 + 10, 80);
  
  doc.setFont('helvetica', 'normal');
  doc.text(order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Transfer Bank / QRIS', 14, 84);
  doc.text('Kurir Toko / Ambil Sendiri', pageWidth / 2 + 10, 84);

  // 4. Items Table
  const tableData = order.order_items?.map((item, index) => {
    const priceBeforeTax = Math.round(item.price_at_time / 1.12);
    const ppnPerItem = item.price_at_time - priceBeforeTax;
    return [
      index + 1,
      { content: `${item.product?.name || 'Produk'}\n${item.quantity} X ${formatCurrency(item.price_at_time)}`, styles: { fontStyle: 'bold' as const } },
      formatCurrency(priceBeforeTax),
      formatCurrency(ppnPerItem),
      { content: `${item.quantity}\n${item.quantity}`, styles: { halign: 'center' as const } },
      formatCurrency(priceBeforeTax * item.quantity)
    ];
  }) || [];

  autoTable(doc, {
    startY: 90,
    head: [['No', 'Barang/jasa', 'Harga\nsebelum PPN', 'PPN\nper Item', 'Kuantitas\nPesan | Terima', 'Total Harga\nsebelum PPN']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'right' }
    }
  });

  // 5. Summary Section
  const finalY = (doc as any).lastAutoTable.finalY;
  
  const totalPriceBeforeTax = order.order_items?.reduce((sum, item) => {
    const priceBeforeTax = Math.round(item.price_at_time / 1.12);
    return sum + (priceBeforeTax * item.quantity);
  }, 0) || 0;
  
  const totalPPN = order.total_amount - totalPriceBeforeTax;
  const pph22 = Math.round(totalPriceBeforeTax * 0.005);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  // Tax Summary Table
  autoTable(doc, {
    startY: finalY,
    body: [
      ['', 'DPP Nilai Lain (Barang/Jasa)', formatCurrency(totalPriceBeforeTax)],
      ['', 'PPN (12%)', formatCurrency(totalPPN)],
      ['', 'DPP Nilai Lain (Ongkos Kirim)', formatCurrency(0)],
      ['', 'PPN (12%)', formatCurrency(0)],
    ],
    theme: 'plain',
    styles: { halign: 'right', fontSize: 8, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 }, 2: { cellWidth: 40 } }
  });

  const grandTotalY = (doc as any).lastAutoTable.finalY;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, grandTotalY, pageWidth - 14, grandTotalY);
  
  doc.setFontSize(12);
  doc.text('GRAND TOTAL', 14, grandTotalY + 8);
  doc.text(formatCurrency(order.total_amount), pageWidth - 14, grandTotalY + 8, { align: 'right' });
  
  doc.line(14, grandTotalY + 12, pageWidth - 14, grandTotalY + 12);

  autoTable(doc, {
    startY: grandTotalY + 13,
    body: [
      ['', 'DPP PPh Pasal 22 (Barang/Jasa)', formatCurrency(totalPriceBeforeTax)],
      ['', 'PPh Pasal 22 (0.5%)', formatCurrency(pph22)],
      ['', 'DPP PPh Pasal 22 (Ongkir)', formatCurrency(0)],
      ['', 'PPh Pasal 22', formatCurrency(0)],
    ],
    theme: 'plain',
    styles: { halign: 'right', fontSize: 8, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 }, 2: { cellWidth: 40 } }
  });

  const footerY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('*PPN yang dikenakan telah menggunakan perhitungan terbaru sesuai dengan PMK No. 131 Tahun 2024.', 14, footerY);

  // Payment Status Box
  doc.setFillColor(240, 245, 255);
  doc.rect(14, footerY + 5, pageWidth - 28, 20, 'F');
  doc.setDrawColor(0, 50, 150);
  doc.setLineWidth(2);
  doc.line(14, footerY + 5, 14, footerY + 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 50, 150);
  doc.text('Pembayaran sudah Lunas dan Terkonfirmasi dengan Nominal:', 18, footerY + 12);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(order.total_amount), 18, footerY + 22);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('*Transaksi ini telah dipotong PPh Pasal 22 sebesar 0.5% kepada penyedia dan/atau mitra pengiriman dari nilai invoice diluar PPN', 14, footerY + 35);
  doc.text('**Invoice ini berlaku sebagai dokumen yang dipersamakan dengan bukti pemotongan PPh Pasal 22 dan dokumen tertentu yang', 14, footerY + 40);
  doc.text('kedudukannya dipersamakan dengan Faktur Pajak', 14, footerY + 45);

  return doc;
};

export const generateFaktur = async (order: Order, seller: Profile, buyer: Profile | null) => {
  const doc = await generateInvoice(order, seller, buyer);
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Change title to FAKTUR
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth - 60, 15, 50, 10, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FAKTUR', pageWidth - 14, 20, { align: 'right' });
  
  return doc;
};

export const generateSuratPesanan = async (order: Order, seller: Profile, buyer: Profile | null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const formatCurrency = (num: number) => `Rp. ${num.toLocaleString('id-ID')}`;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT PESANAN', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: SP-${order.id.slice(0, 8).toUpperCase()}`, pageWidth / 2, 25, { align: 'center' });
  doc.text(`Tanggal: ${new Date(order.created_at).toLocaleDateString('id-ID')}`, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text('Kepada Yth,', 14, 45);
  doc.setFont('helvetica', 'bold');
  doc.text(seller.full_name || 'CAHAYA ATK', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(seller.address || '-', 14, 54, { maxWidth: 80 });

  doc.text('Dengan ini kami memesan barang/jasa sebagai berikut:', 14, 70);

  const tableData = order.order_items?.map((item, index) => [
    index + 1,
    item.product?.name || 'Produk',
    item.quantity,
    formatCurrency(item.price_at_time),
    formatCurrency(item.price_at_time * item.quantity)
  ]) || [];

  autoTable(doc, {
    startY: 75,
    head: [['No', 'Nama Barang', 'Qty', 'Harga Satuan', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('Demikian surat pesanan ini kami sampaikan.', 14, finalY);

  doc.text('Pemesan,', pageWidth - 60, finalY + 20);
  doc.text(`( ${buyer?.full_name || '....................'} )`, pageWidth - 60, finalY + 45);

  return doc;
};

export const generatePaymentReceipt = async (order: Order, buyer: Profile | null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const formatCurrency = (num: number) => `Rp. ${num.toLocaleString('id-ID')}`;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bukti Pembayaran', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let y = 35;
  const leftCol = 14;
  const rightCol = 60;

  const rows = [
    ['No', `: ${order.id.toUpperCase()}`],
    ['Satuan Pendidikan', `: ${buyer?.full_name || 'Pelanggan'}`],
    ['Total Tagihan', `: ${formatCurrency(order.total_amount)}`],
    ['Tanggal Pemesanan', `: ${new Date(order.created_at).toLocaleDateString('id-ID')}`],
    ['Tanggal Pembayaran', `: ${new Date().toLocaleDateString('id-ID')}`],
    ['Pembayaran Terverifikasi', `: ${new Date().toLocaleDateString('id-ID')}`],
    ['Untuk Pembayaran', `: Pembayaran Barang/Jasa yang dipesan melalui CAHAYA ATK dengan nomor pesanan ${order.id.slice(0, 8)}`]
  ];

  rows.forEach(([label, value]) => {
    doc.text(label, leftCol, y);
    doc.text(value, rightCol, y, { maxWidth: 130 });
    y += 7;
    if (label === 'Untuk Pembayaran') y += 10;
  });

  doc.setFillColor(235, 250, 235);
  doc.rect(14, y, pageWidth - 28, 10, 'F');
  doc.setDrawColor(76, 175, 80);
  doc.setLineWidth(2);
  doc.line(14, y, 14, y + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 125, 50);
  doc.text(formatCurrency(order.total_amount), 18, y + 7);

  return doc;
};
