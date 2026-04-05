import { Order, Profile } from '../types';
import { generateInvoiceTagihan } from './document/InvoiceTagihan';
import { generateFakturPenjualan } from './document/FakturPenjualan';
import { generateSuratPesanan as generateSP } from './document/SuratPesanan';

export const generateInvoice = async (order: Order, seller: Profile, buyer: Profile | null) => {
  return generateInvoiceTagihan({ order, seller, buyer });
};

export const generateFaktur = async (order: Order, seller: Profile, buyer: Profile | null) => {
  return generateFakturPenjualan({ order, seller, buyer });
};

export const generateSuratPesanan = async (order: Order, seller: Profile, buyer: Profile | null) => {
  return generateSP({ order, seller, buyer });
};

export const generatePaymentReceipt = async (order: Order, seller: Profile, buyer: Profile | null) => {
  // Use Faktur layout for "Nota" as requested by user
  return generateFakturPenjualan({ order, seller, buyer });
};
