import React, { useState, useMemo } from 'react';
import { 
  Order, 
  Profile, 
  SchoolTransactionData, 
  SchoolBuyerType, 
  FundingSource, 
  PaymentStatus, 
  PKPStatus, 
  PPhUMKMStatus, 
  PPh22CollectorStatus,
  DocumentLifecycleStatus 
} from '../../types';
import { calculateSchoolTax } from '../../lib/taxEngine';
import { 
  generateSuratPesanan 
} from './documents/SuratPesanan';
import { 
  generateFakturPenjualan 
} from './documents/FakturPenjualan';
import { 
  generateInvoiceTagihan 
} from './documents/InvoiceTagihan';
import { 
  generateKwitansiPembayaran 
} from './documents/KwitansiPembayaran';
import { 
  generateRincianPajakSPJ 
} from './documents/RincianPajakSPJ';
import { 
  generateBeritaAcaraSerahTerima 
} from './documents/BeritaAcaraSerahTerima';
import { 
  Building2, 
  Package, 
  Store, 
  Coins, 
  CreditCard, 
  Scale, 
  CheckSquare, 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Printer, 
  HelpCircle,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface SchoolTransactionWizardProps {
  order: Order;
  profile: Profile | null;
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveData: (orderId: string, data: SchoolTransactionData) => void;
}

export const SchoolTransactionWizard: React.FC<SchoolTransactionWizardProps> = ({
  order,
  profile,
  user,
  isOpen,
  onClose,
  onSaveData,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Initial State derived from order or default
  const [formData, setFormData] = useState<SchoolTransactionData>(() => {
    if (order.school_transaction) {
      return order.school_transaction;
    }
    return {
      schoolName: profile?.full_name || 'SDN / SMPN / SMAN / Swasta',
      npsn: '',
      schoolAddress: order.address || 'Kec. Ngariboyo, Kab. Magetan',
      buyerType: 'Sekolah Negeri',
      personInCharge: profile?.full_name || 'Kepala Sekolah / Penanggung Jawab',
      personTitle: 'Kepala Sekolah',
      buyerNpwpNik: '',
      bankAccountNumber: '',
      treasurerName: '',

      fundingSource: 'BOS/BOSP',
      fundingSourceDetail: 'Dana BOSP Reguler',
      paymentStatus: 'Transfer',
      paymentMethodDetail: 'Transfer Rekening Bank BPD/Briva',

      sellerPkpStatus: 'Non-PKP',
      sellerPphUmkmStatus: 'Memenuhi dan memiliki dasar/keterangan yang berlaku',
      sellerPphUmkmRefNumber: '',

      isTaxableItem: true,
      priceIncludesPpn: true,
      ppnRatePercent: 11,

      isPph22Collector: 'Belum Diketahui',
      isPph22Exempt: false,
      pph22ExemptReason: 'Belanja keperluan operasional sekolah / BOS',
      pph22RatePercent: 1.5,

      hasRealThirdPartyFee: false,
      realThirdPartyFeeAmount: 0,
      realThirdPartyFeePayer: 'Biaya Administrasi Bank Riil',

      documentStatus: order.status === 'delivered' ? 'LUNAS' : 'DIPESAN',
      isVerified: false,
      verificationNotes: ''
    };
  });

  // Checklist Verifikasi sebelum Dokumen Final (Poin J)
  const [verifications, setVerifications] = useState({
    transaksiNyata: true,
    namaSekolahBenar: true,
    barangBenar: true,
    hargaBenar: true,
    tanggalBenar: true,
    statusBayarBenar: true,
    sumberDanaDiketahui: formData.fundingSource !== 'Belum Diketahui',
    statusPkpDiketahui: formData.sellerPkpStatus !== 'Belum Diketahui',
    statusPphUmkmDiketahui: formData.sellerPphUmkmStatus !== 'Belum Diketahui',
    mekanismePph22Diketahui: formData.isPph22Collector !== 'Belum Diketahui',
    tidakAdaPajakDitebak: true,
    tidakAdaBiayaFiktif: true,
    tidakAdaBuktiPajakFiktif: true,
    tidakAdaTandaTanganFiktif: true,
  });

  // Calculate Tax based on current data
  const taxCalc = useMemo(() => {
    return calculateSchoolTax(order.total_amount, formData);
  }, [order.total_amount, formData]);

  if (!isOpen) return null;

  // Validation Check
  const allVerified = Object.values(verifications).every(Boolean) && 
    formData.schoolName.trim().length > 0 &&
    formData.fundingSource !== 'Belum Diketahui' &&
    formData.sellerPkpStatus !== 'Belum Diketahui' &&
    formData.isPph22Collector !== 'Belum Diketahui';

  const steps = [
    { num: 1, title: 'Data Sekolah', icon: Building2 },
    { num: 2, title: 'Data Barang', icon: Package },
    { num: 3, title: 'Data Penjual', icon: Store },
    { num: 4, title: 'Sumber Dana', icon: Coins },
    { num: 5, title: 'Pembayaran', icon: CreditCard },
    { num: 6, title: 'Status Pajak', icon: Scale },
    { num: 7, title: 'Validasi', icon: CheckSquare },
    { num: 8, title: 'Cetak Dokumen', icon: FileText },
    { num: 9, title: 'Finalisasi', icon: Sparkles },
  ];

  const handleNext = () => {
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveAndClose = () => {
    onSaveData(order.id, {
      ...formData,
      isVerified: allVerified
    });
    toast.success('Data transaksi sekolah berhasil disimpan.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/30 text-white border border-emerald-300/40 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Admin & Legal SPJ
              </span>
              <span className="text-xs text-emerald-100 font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold mt-1 text-white flex items-center gap-2">
              Sistem Transaksi Sekolah & Dokumen SPJ
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Standar akuntansi konservatif, tanpa rekayasa pajak, dan siap audit administrasi.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {steps.map((st) => {
              const Icon = st.icon;
              const isActive = currentStep === st.num;
              const isPast = currentStep > st.num;
              return (
                <button
                  key={st.num}
                  onClick={() => setCurrentStep(st.num)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : isPast 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : isPast ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>{st.num}. {st.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: DATA SEKOLAH */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="text-emerald-600" size={18} />
                  Langkah 1: Data Identitas Pihak Sekolah / Pembeli
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan identitas sekolah secara akurat. Sistem tidak akan menyimpulkan status pajak hanya dari nama sekolah.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Sekolah / Instansi *
                  </label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="Contoh: SMP Negeri 1 Ngariboyo"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Pembeli *
                  </label>
                  <select
                    value={formData.buyerType}
                    onChange={(e) => setFormData({ ...formData, buyerType: e.target.value as SchoolBuyerType })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="Sekolah Negeri">Sekolah Negeri (Instansi Pemerintah)</option>
                    <option value="Sekolah Swasta">Sekolah Swasta</option>
                    <option value="Madrasah Negeri">Madrasah Negeri</option>
                    <option value="Madrasah Swasta">Madrasah Swasta</option>
                    <option value="Lainnya">Lainnya / Lembaga Pendidikan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPSN (Nomor Pokok Sekolah Nasional) - Opsional
                  </label>
                  <input
                    type="text"
                    value={formData.npsn || ''}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                    placeholder="Contoh: 20509876"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Penanggung Jawab / Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    value={formData.personInCharge}
                    onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })}
                    placeholder="Nama Lengkap Penanggung Jawab"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan Penanggung Jawab *
                  </label>
                  <input
                    type="text"
                    value={formData.personTitle}
                    onChange={(e) => setFormData({ ...formData, personTitle: e.target.value })}
                    placeholder="Contoh: Kepala Sekolah / Pelaksana Kegiatan"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Bendahara (Opsional jika relevan)
                  </label>
                  <input
                    type="text"
                    value={formData.treasurerName || ''}
                    onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                    placeholder="Nama Bendahara BOSP / Pengeluaran"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Sekolah *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.schoolAddress}
                    onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                    placeholder="Alamat lengkap instansi sekolah"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPWP / NIK Sekolah (Hanya jika memang diperlukan & diberikan)
                  </label>
                  <input
                    type="text"
                    value={formData.buyerNpwpNik || ''}
                    onChange={(e) => setFormData({ ...formData, buyerNpwpNik: e.target.value })}
                    placeholder="Format: 00.000.000.0-000.000"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Rekening Sekolah (Hanya jika diperlukan)
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Contoh: Bank Jatim 0123456789"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATA BARANG */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Package className="text-emerald-600" size={18} />
                    Langkah 2: Data Barang & Nilai Transaksi Nyata
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Daftar barang yang dibeli oleh pihak sekolah berdasarkan pesanan sebenarnya.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold block">Total Transaksi Bruto:</span>
                  <span className="text-lg font-bold text-emerald-700">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Produk / Barang ATK</th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-center">Jumlah (Qty)</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {order.order_items && order.order_items.length > 0 ? (
                      order.order_items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900">{item.product?.name || 'Barang ATK'}</td>
                          <td className="p-3 text-right">Rp {item.price_at_time.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-center">{item.quantity} Unit</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          Tidak ada rincian item barang spesifik (Total Kontrak: Rp {order.total_amount.toLocaleString('id-ID')})
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Prinsip Transaksi Nyata:</span> Seluruh dokumen transaksi yang diterbitkan oleh sistem Cahaya ATK hanya boleh merujuk pada barang fisik yang benar-benar dipesan dan dikirimkan ke sekolah.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DATA CAHAYA ATK */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Store className="text-emerald-600" size={18} />
                  Langkah 3: Data & Status Perpajakan Penjual (Cahaya ATK)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Status resmi toko penjual menentukan apakah transaksi dapat dikenakan PPN atau fasilitas PPh Final UMKM.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-500 block uppercase">Profil Toko Rekanan:</span>
                  <div className="text-sm font-bold text-slate-900">CAHAYA ATK</div>
                  <div className="text-xs text-slate-600">Jl. Sultan Agung, RT.3/RW.2, Balegondo, Ngariboyo, Magetan</div>
                  <div className="text-xs text-slate-600">NPWP Toko: {profile?.npwp || '00.000.000.0-000.000'}</div>
                  <div className="text-xs text-slate-600">WhatsApp: 085850392240</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status PKP Cahaya ATK *
                    </label>
                    <select
                      value={formData.sellerPkpStatus}
                      onChange={(e) => setFormData({ ...formData, sellerPkpStatus: e.target.value as PKPStatus })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                    >
                      <option value="Non-PKP">Non-PKP (Pengusaha Bukan PKP - Bebas Pungut PPN)</option>
                      <option value="PKP">PKP (Pengusaha Kena Pajak)</option>
                      <option value="Belum Diketahui">Belum Diketahui (Status PPN Tidak Dihitung)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Jika status Non-PKP, toko tidak memungut PPN dan PPN tidak akan dihitung.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status PPh Final UMKM (0,5%) Cahaya ATK *
                    </label>
                    <select
                      value={formData.sellerPphUmkmStatus}
                      onChange={(e) => setFormData({ ...formData, sellerPphUmkmStatus: e.target.value as PPhUMKMStatus })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                    >
                      <option value="Memenuhi dan memiliki dasar/keterangan yang berlaku">
                        Memenuhi & Memiliki Dasar/Suket yang Sah
                      </option>
                      <option value="Tidak menggunakan PPh Final UMKM">
                        Tidak Menggunakan PPh Final UMKM 0,5%
                      </option>
                      <option value="Belum Diketahui">
                        Belum Diketahui
                      </option>
                    </select>
                  </div>

                  {formData.sellerPphUmkmStatus === 'Memenuhi dan memiliki dasar/keterangan yang berlaku' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Suket PPh Final DJP (Hanya jika benar-benar ada)
                      </label>
                      <input
                        type="text"
                        value={formData.sellerPphUmkmRefNumber || ''}
                        onChange={(e) => setFormData({ ...formData, sellerPphUmkmRefNumber: e.target.value })}
                        placeholder="Contoh: KET-12345/WPJ.24/KP.0103/2026"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        * Jangan mengarang nomor surat keterangan jika tidak memilikinya.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUMBER DANA */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Coins className="text-emerald-600" size={18} />
                  Langkah 4: Sumber Pendanaan Sekolah
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih sumber dana yang sebenarnya. Jangan menebak bahwa semua transaksi sekolah menggunakan dana BOS.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sumber Dana Pembelian *
                  </label>
                  <select
                    value={formData.fundingSource}
                    onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value as FundingSource })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                  >
                    <option value="BOS/BOSP">BOS / BOSP (Reguler / Kinerja / Afirmasi)</option>
                    <option value="APBD">APBD (Anggaran Pendapatan dan Belanja Daerah)</option>
                    <option value="APBN">APBN (Anggaran Pendapatan dan Belanja Negara)</option>
                    <option value="Dana Desa">Dana Desa / Alokasi Desa</option>
                    <option value="Dana Yayasan">Dana Yayasan (Khusus Swasta)</option>
                    <option value="Dana Sekolah">Kas Operasional Sekolah / Komite</option>
                    <option value="Lainnya">Lainnya</option>
                    <option value="Belum Diketahui">Belum Diketahui</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rincian Keterangan Anggaran (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.fundingSourceDetail || ''}
                    onChange={(e) => setFormData({ ...formData, fundingSourceDetail: e.target.value })}
                    placeholder="Contoh: BOSP Tahap 1 Tahun Anggaran 2026"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {formData.fundingSource === 'Belum Diketahui' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>Sumber dana yang belum diketahui akan menyebabkan status pajak berstatus <b>&quot;Perlu Verifikasi&quot;</b>.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PEMBAYARAN */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="text-emerald-600" size={18} />
                  Langkah 5: Status & Metode Pembayaran Nyata
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Jangan pernah membuat dokumen &quot;LUNAS&quot; jika uang belum benar-benar diterima oleh Cahaya ATK.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Pembayaran Saat Ini *
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                  >
                    <option value="Belum Dibayar">Belum Dibayar (Menunggu Pencairan/Verifikasi)</option>
                    <option value="Dibayar Langsung">Dibayar Langsung (Tunai / Cash Saat Terima)</option>
                    <option value="Transfer">Transfer Rekening Bank / QRIS</option>
                    <option value="Mekanisme Lainnya">Mekanisme Lainnya (SIPLaH / CMS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Siklus Dokumen *
                  </label>
                  <select
                    value={formData.documentStatus}
                    onChange={(e) => setFormData({ ...formData, documentStatus: e.target.value as DocumentLifecycleStatus })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                  >
                    <option value="DRAFT">DRAFT (Penyusunan Awal)</option>
                    <option value="DIPESAN">DIPESAN (Pesanan Resmi Sekolah Diterima)</option>
                    <option value="BARANG DISERAHKAN">BARANG DISERAHKAN (Barang Sudah Sampai di Sekolah)</option>
                    <option value="MENUNGGU PEMBAYARAN">MENUNGGU PEMBAYARAN (Tagihan Diterbitkan)</option>
                    <option value="LUNAS">LUNAS (Pembayaran Sudah Masuk & Sah)</option>
                    <option value="DIBATALKAN">DIBATALKAN</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rincian Metode Pembayaran
                  </label>
                  <input
                    type="text"
                    value={formData.paymentMethodDetail || ''}
                    onChange={(e) => setFormData({ ...formData, paymentMethodDetail: e.target.value })}
                    placeholder="Contoh: Transfer Bank Jatim / Tunai Bendahara Sekolah"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: STATUS PAJAK */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Scale className="text-emerald-600" size={18} />
                  Langkah 6: Status & Mekanisme Pajak (PPh 22, PPN, PPh Final)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Jawab pertanyaan berikut secara objektif. Sistem tidak akan menebak atau mengarang pungutan pajak.
                </p>
              </div>

              {/* PPN Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">A. Pajak Pertambahan Nilai (PPN)</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    formData.sellerPkpStatus === 'PKP' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {formData.sellerPkpStatus === 'PKP' ? 'Penjual PKP' : 'Penjual Non-PKP (Bebas PPN)'}
                  </span>
                </div>

                {formData.sellerPkpStatus === 'PKP' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Apakah Barang Merupakan Objek PPN?</label>
                      <select
                        value={formData.isTaxableItem ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, isTaxableItem: e.target.value === 'true' })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="true">Ya, Barang Kena Pajak</option>
                        <option value="false">Tidak, Dikecualikan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Harga Belanja Termasuk PPN?</label>
                      <select
                        value={formData.priceIncludesPpn ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, priceIncludesPpn: e.target.value === 'true' })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="true">Harga Sudah Termasuk PPN (Include)</option>
                        <option value="false">Harga Belum Termasuk PPN (Exclude)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Karena status Cahaya ATK adalah <b>Non-PKP</b>, maka tidak ada PPN yang dipungut pada transaksi ini.
                  </p>
                )}
              </div>

              {/* PPh 22 Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">B. PPh Pasal 22 (Pemungutan Bendahara)</span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Aturan Khusus Bendahara
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apakah pihak sekolah/bendahara merupakan pihak yang melakukan pemungutan PPh Pasal 22? *
                  </label>
                  <select
                    value={formData.isPph22Collector}
                    onChange={(e) => setFormData({ ...formData, isPph22Collector: e.target.value as PPh22CollectorStatus })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                  >
                    <option value="Belum Diketahui">Belum Diketahui (Jangan Hitung PPh 22)</option>
                    <option value="Tidak">Tidak (Bukan Pemungut PPh 22)</option>
                    <option value="Ya">Ya (Bendahara Bertindak Sebagai Pemungut PPh 22)</option>
                  </select>
                </div>

                {formData.isPph22Collector === 'Ya' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isExempt"
                        checked={formData.isPph22Exempt || false}
                        onChange={(e) => setFormData({ ...formData, isPph22Exempt: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="isExempt" className="font-bold text-slate-700">
                        Dikecualikan dari Pemungutan PPh 22 (Misal: Belanja Dana BOS / Di Bawah Batas Nominal)
                      </label>
                    </div>

                    {formData.isPph22Exempt && (
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Alasan Pengecualian:</label>
                        <input
                          type="text"
                          value={formData.pph22ExemptReason || ''}
                          onChange={(e) => setFormData({ ...formData, pph22ExemptReason: e.target.value })}
                          placeholder="Contoh: Belanja barang operasional sekolah yang dibiayai dana BOSP"
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Biaya Transaksi Riil (Bukan Rekaan 1%) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">C. Biaya Tambahan Nyata (Hanya Jika Benar Ada)</span>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                    Bukan Pajak
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasRealFee"
                    checked={formData.hasRealThirdPartyFee || false}
                    onChange={(e) => setFormData({ ...formData, hasRealThirdPartyFee: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="hasRealFee" className="text-xs font-bold text-slate-700">
                    Ada biaya administrasi nyata dari bank / payment gateway / pihak ketiga
                  </label>
                </div>

                {formData.hasRealThirdPartyFee && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nominal Biaya Riil (Rp):</label>
                      <input
                        type="number"
                        value={formData.realThirdPartyFeeAmount || 0}
                        onChange={(e) => setFormData({ ...formData, realThirdPartyFeeAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Pihak yang Mengenakan Biaya:</label>
                      <input
                        type="text"
                        value={formData.realThirdPartyFeePayer || ''}
                        onChange={(e) => setFormData({ ...formData, realThirdPartyFeePayer: e.target.value })}
                        placeholder="Contoh: Biaya Transfer Antar Bank"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: VALIDASI */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <CheckSquare className="text-emerald-600" size={18} />
                    Langkah 7: Validasi Kesiapan Dokumen Final
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pemeriksaan 14 poin kepatuhan sebelum dokumen resmi diterbitkan (Poin J Prompt).
                  </p>
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    allVerified 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {allVerified ? 'STATUS: SIAP DIFINALKAN' : 'STATUS: BELUM SIAP DIFINALKAN'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'transaksiNyata', label: 'Transaksi benar-benar terjadi' },
                  { key: 'namaSekolahBenar', label: 'Nama sekolah benar & valid' },
                  { key: 'barangBenar', label: 'Rincian barang benar sesuai pesanan' },
                  { key: 'hargaBenar', label: 'Harga satuan & total belanja benar' },
                  { key: 'tanggalBenar', label: 'Tanggal transaksi sesuai kejadian' },
                  { key: 'statusBayarBenar', label: 'Status pembayaran sesuai kondisi' },
                  { key: 'sumberDanaDiketahui', label: `Sumber dana diketahui (${formData.fundingSource})` },
                  { key: 'statusPkpDiketahui', label: `Status PKP penjual diketahui (${formData.sellerPkpStatus})` },
                  { key: 'statusPphUmkmDiketahui', label: `Status PPh Final UMKM terkonfirmasi` },
                  { key: 'mekanismePph22Diketahui', label: `Mekanisme PPh 22 terkonfirmasi (${formData.isPph22Collector})` },
                  { key: 'tidakAdaPajakDitebak', label: 'Tidak ada status pajak yang ditebak/dikarang' },
                  { key: 'tidakAdaBiayaFiktif', label: 'Tidak ada biaya admin fiktif (1% palsu dihilangkan)' },
                  { key: 'tidakAdaBuktiPajakFiktif', label: 'Tidak ada nomor bukti pajak/NTPN/SSP fiktif' },
                  { key: 'tidakAdaTandaTanganFiktif', label: 'Tidak ada tanda tangan digital palsu' },
                ].map((item) => (
                  <label 
                    key={item.key} 
                    className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={(verifications as any)[item.key]}
                      onChange={(e) => setVerifications({ ...verifications, [item.key]: e.target.checked })}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>

              {/* Tax Engine Result Preview */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-700 pb-2">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Hasil Audit Tax Engine:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    taxCalc.status === 'VALID' 
                      ? 'bg-emerald-500 text-slate-950' 
                      : taxCalc.status === 'BEBAS_PAJAK' 
                      ? 'bg-sky-500 text-slate-950' 
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {taxCalc.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nilai Bruto:</span>
                    <span className="font-bold">Rp {taxCalc.grossAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dasar Pajak (DPP):</span>
                    <span className="font-bold">Rp {taxCalc.dpp.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Potongan Pajak:</span>
                    <span className="font-bold text-amber-400">Rp {taxCalc.totalDeductions.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Netto Cair ke Penyedia:</span>
                    <span className="font-bold text-emerald-400">Rp {taxCalc.netTransferAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                  {taxCalc.explanation}
                </p>
              </div>
            </div>
          )}

          {/* STEP 8: CETAK DOKUMEN */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="text-emerald-600" size={18} />
                  Langkah 8: Preview & Cetak Dokumen Administrasi Transaksi
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih dokumen resmi yang dibutuhkan untuk keperluan administrasi dan SPJ pihak sekolah.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* 1. Surat Pesanan */}
                <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">1. Surat Pesanan (SP)</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {formData.documentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dokumen resmi pemesanan barang dari pihak sekolah kepada Cahaya ATK.
                    </p>
                  </div>
                  <button
                    onClick={() => generateSuratPesanan(order, user, profile, formData)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} /> Cetak Surat Pesanan
                  </button>
                </div>

                {/* 2. Faktur Penjualan */}
                <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">2. Faktur Penjualan</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {formData.documentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Faktur resmi transaksi penjualan barang ATK dari toko rekanan penyedia.
                    </p>
                  </div>
                  <button
                    onClick={() => generateFakturPenjualan(order, user, profile, formData)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} /> Cetak Faktur Penjualan
                  </button>
                </div>

                {/* 3. Invoice Tagihan */}
                <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">3. Invoice / Tagihan</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {formData.documentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Surat penagihan pembayaran atas pengadaan barang perlengkapan sekolah.
                    </p>
                  </div>
                  <button
                    onClick={() => generateInvoiceTagihan(order, user, profile, formData)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} /> Cetak Invoice Tagihan
                  </button>
                </div>

                {/* 4. Kwitansi Pembayaran */}
                <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">4. Kwitansi Pembayaran</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {formData.documentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Kwitansi tanda terima uang pembayaran internal toko yang sah.
                    </p>
                  </div>
                  <button
                    onClick={() => generateKwitansiPembayaran(order, user, profile, formData)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} /> Cetak Kwitansi
                  </button>
                </div>

                {/* 5. Lampiran Rincian Pajak Transaksi */}
                <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 space-y-2 flex flex-col justify-between md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Scale size={16} className="text-emerald-700" />
                        5. Lampiran Rincian Perpajakan Transaksi (Audit-Ready)
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                        {taxCalc.status}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1">
                      Format administrasi perhitungan pajak konservatif sesuai data input nyata, bebas dari rekaan angka atau bukti potong palsu.
                    </p>
                  </div>
                  <button
                    onClick={() => generateRincianPajakSPJ(order, user, profile, formData)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    <Download size={14} /> Cetak Lampiran Rincian Perpajakan
                  </button>
                </div>

                {/* 6. BAST */}
                <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white space-y-2 flex flex-col justify-between md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCheck size={16} className="text-indigo-600" />
                        6. Berita Acara Serah Terima Barang (BAST)
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        Pemeriksaan Fisik
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Bukti serah terima fisik barang dalam kondisi baik dan lengkap antara rekanan dan kepala sekolah/guru penanggung jawab.
                    </p>
                  </div>
                  <button
                    onClick={() => generateBeritaAcaraSerahTerima(order, user, profile, formData)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} /> Cetak Berita Acara (BAST)
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 9: FINALISASI */}
          {currentStep === 9 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Data Transaksi Sekolah Berhasil Diselaraskan
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Seluruh data sekolah, sumber dana, status pembayaran, dan aturan perpajakan telah diverifikasi secara konservatif dan tersimpan di sistem Cahaya ATK.
              </p>

              <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Instansi Sekolah:</span>
                  <span className="font-bold text-slate-900">{formData.schoolName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Sumber Dana:</span>
                  <span className="font-bold text-slate-900">{formData.fundingSource}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Status Pembayaran:</span>
                  <span className="font-bold text-slate-900">{formData.paymentStatus}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Status Audit Pajak:</span>
                  <span className="font-bold text-emerald-700">{taxCalc.status}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Netto Diterima Rekanan:</span>
                  <span className="font-bold text-emerald-700 text-sm">Rp {taxCalc.netTransferAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveAndClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Simpan Data Transaksi Sekolah
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-all ${
              currentStep === 1 
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' 
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft size={14} /> Sebelumnya
          </button>

          <div className="text-xs text-slate-500 font-medium">
            Langkah {currentStep} dari 9
          </div>

          {currentStep < 9 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              Selanjutnya <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <CheckCircle2 size={14} /> Selesai & Simpan
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
