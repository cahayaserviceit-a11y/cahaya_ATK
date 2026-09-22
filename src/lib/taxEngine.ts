import { SchoolTransactionData, TaxEngineResult } from '../types';

/**
 * Tax Engine Konservatif & Audit-Ready untuk Transaksi Sekolah (Cahaya ATK)
 * 
 * Prinsip:
 * 1. Tidak pernah mengarang tarif, nomor suket, atau status pajak.
 * 2. Tidak otomatis mengenakan PPN, PPh 22, atau PPh 0,5%.
 * 3. Tidak mengenakan biaya admin 1% rekaan.
 * 4. Jika data belum lengkap, status = 'PERLU_VERIFIKASI' dan kalkulasi pajak dinolkan.
 */
export function calculateSchoolTax(
  grossTotal: number,
  data?: Partial<SchoolTransactionData>
): TaxEngineResult {
  const issues: string[] = [];

  if (!data) {
    return {
      status: 'PERLU_VERIFIKASI',
      grossAmount: grossTotal,
      dpp: grossTotal,
      ppnAmount: 0,
      ppnRate: 0,
      ppnNote: 'Status PPN belum dapat ditentukan (Data transaksi belum dimasukkan).',
      pph22Amount: 0,
      pph22Rate: 0,
      pph22Note: 'Status PPh 22 belum dapat ditentukan (Data transaksi belum dimasukkan).',
      pphFinalUmkmAmount: 0,
      pphFinalUmkmRate: 0,
      pphFinalUmkmNote: 'Status PPh UMKM belum dapat ditentukan.',
      realThirdPartyFee: 0,
      realThirdPartyFeeNote: 'Tidak ada biaya tambahan.',
      totalDeductions: 0,
      netTransferAmount: grossTotal,
      verificationIssues: [
        'Data identitas sekolah belum lengkap',
        'Sumber dana belum ditentukan',
        'Status pemungut pajak belum ditentukan'
      ],
      explanation: 'Perhitungan pajak belum dapat dibuat karena rincian transaksi sekolah belum dikonfirmasi.'
    };
  }

  // 1. Validasi Dasar Pihak Pembeli
  if (!data.schoolName || data.schoolName.trim() === '') {
    issues.push('Nama sekolah belum diisi');
  }
  if (!data.fundingSource || data.fundingSource === 'Belum Diketahui') {
    issues.push('Sumber dana transaksi belum diketahui');
  }

  // 2. Evaluasi Status PKP & PPN
  let dpp = grossTotal;
  let ppnRate = 0;
  let ppnAmount = 0;
  let ppnNote = '';

  if (!data.sellerPkpStatus || data.sellerPkpStatus === 'Belum Diketahui') {
    issues.push('Status PKP Cahaya ATK belum ditentukan (Penjual harus memastikan status PKP/Non-PKP)');
    ppnNote = 'Status PPN belum dapat ditentukan (Status PKP belum dikonfirmasi).';
  } else if (data.sellerPkpStatus === 'Non-PKP') {
    ppnRate = 0;
    ppnAmount = 0;
    ppnNote = 'Tidak dipungut PPN (Cahaya ATK berstatus Non-PKP).';
  } else {
    // Status PKP = 'PKP'
    if (!data.isTaxableItem) {
      ppnRate = 0;
      ppnAmount = 0;
      ppnNote = 'Bukan merupakan objek PPN sesuai peraturan yang berlaku.';
    } else {
      ppnRate = data.ppnRatePercent ?? 11;
      if (data.priceIncludesPpn) {
        dpp = Math.round(grossTotal / (1 + ppnRate / 100));
        ppnAmount = grossTotal - dpp;
        ppnNote = `PPN ${ppnRate}% termasuk dalam harga bruto (DPP: Rp ${dpp.toLocaleString('id-ID')}).`;
      } else {
        dpp = grossTotal;
        ppnAmount = Math.round(dpp * (ppnRate / 100));
        ppnNote = `PPN ${ppnRate}% dihitung dari DPP (belum termasuk dalam harga dasar).`;
      }
    }
  }

  // 3. Evaluasi PPh Pasal 22
  let pph22Rate = 0;
  let pph22Amount = 0;
  let pph22Note = '';

  if (!data.isPph22Collector || data.isPph22Collector === 'Belum Diketahui') {
    issues.push('Kewenangan pemungutan PPh Pasal 22 oleh pihak sekolah belum dikonfirmasi');
    pph22Note = 'Perhitungan PPh 22 belum dapat ditentukan (Status pemungut sekolah belum diverifikasi).';
  } else if (data.isPph22Collector === 'Tidak') {
    pph22Rate = 0;
    pph22Amount = 0;
    pph22Note = 'Pihak sekolah/bendahara tidak bertindak sebagai pemungut PPh Pasal 22.';
  } else {
    // isPph22Collector === 'Ya'
    if (data.isPph22Exempt) {
      pph22Rate = 0;
      pph22Amount = 0;
      pph22Note = data.pph22ExemptReason || 'Dikecualikan dari pemungutan PPh 22 sesuai ketentuan yang berlaku.';
    } else {
      pph22Rate = data.pph22RatePercent ?? 1.5;
      pph22Amount = Math.round(dpp * (pph22Rate / 100));
      pph22Note = `PPh Pasal 22 dipungut bendahara sebesar ${pph22Rate}% dari DPP.`;
    }
  }

  // 4. Evaluasi PPh Final UMKM 0,5%
  let pphFinalRate = 0;
  let pphFinalAmount = 0;
  let pphFinalNote = '';

  if (!data.sellerPphUmkmStatus || data.sellerPphUmkmStatus === 'Belum Diketahui') {
    pphFinalNote = 'Status PPh Final UMKM belum ditentukan.';
  } else if (data.sellerPphUmkmStatus === 'Tidak menggunakan PPh Final UMKM') {
    pphFinalNote = 'Transaksi tidak menggunakan tarif PPh Final UMKM 0,5%.';
  } else {
    // Memenuhi dan memiliki dasar/keterangan yang berlaku
    pphFinalRate = 0.5;
    pphFinalAmount = Math.round(dpp * 0.005);
    const ref = data.sellerPphUmkmRefNumber ? ` (Ref/Suket: ${data.sellerPphUmkmRefNumber})` : '';
    pphFinalNote = `PPh Final UMKM berdasarkan data penjual (0,5% dari DPP/Omset)${ref}.`;
  }

  // 5. Biaya Pihak Ketiga Nyata (Hanya jika benar-benar ada)
  let realFee = 0;
  let realFeeNote = 'Tidak ada biaya administrasi tambahan.';
  if (data.hasRealThirdPartyFee && data.realThirdPartyFeeAmount && data.realThirdPartyFeeAmount > 0) {
    realFee = data.realThirdPartyFeeAmount;
    realFeeNote = `Biaya nyata ${data.realThirdPartyFeePayer || 'pihak ketiga/bank'} sebesar Rp ${realFee.toLocaleString('id-ID')}.`;
  }

  // 6. Kalkulasi Pemotongan & Netto Transfer
  // Dalam transaksi instansi pemerintah yang memungut pajak:
  // Bendahara memotong PPN (jika dipungut bendahara) dan PPh 22 dari nilai transaksi bruto.
  // Uang yang ditransfer ke penyedia adalah nilai bruto dikurangi pajak yang dipungut bendahara dan biaya transaksi nyata.
  const totalDeductions = (data.sellerPkpStatus === 'PKP' && data.isPph22Collector === 'Ya' ? ppnAmount : 0) 
    + pph22Amount 
    + realFee;
  
  const netTransferAmount = Math.max(0, grossTotal - totalDeductions);

  const status: TaxEngineResult['status'] = issues.length > 0 
    ? 'PERLU_VERIFIKASI' 
    : (ppnAmount === 0 && pph22Amount === 0 ? 'BEBAS_PAJAK' : 'VALID');

  let explanation = '';
  if (status === 'PERLU_VERIFIKASI') {
    explanation = `Transaksi memerlukan verifikasi lanjutan untuk ${issues.length} data penting sebelum perhitungan perpajakan dapat difinalkan.`;
  } else if (status === 'BEBAS_PAJAK') {
    explanation = 'Transaksi tidak dikenakan pemotongan/pemungutan pajak (Non-PKP / Non-Pemungut / Dikecualikan).';
  } else {
    explanation = 'Kewajiban perpajakan transaksi telah dihitung secara sah berdasarkan data yang diverifikasi.';
  }

  return {
    status,
    grossAmount: grossTotal,
    dpp,
    ppnAmount: issues.length > 0 ? 0 : ppnAmount,
    ppnRate,
    ppnNote,
    pph22Amount: issues.length > 0 ? 0 : pph22Amount,
    pph22Rate,
    pph22Note,
    pphFinalUmkmAmount: issues.length > 0 ? 0 : pphFinalAmount,
    pphFinalUmkmRate: pphFinalRate,
    pphFinalUmkmNote: pphFinalNote,
    realThirdPartyFee: realFee,
    realThirdPartyFeeNote: realFeeNote,
    totalDeductions: issues.length > 0 ? 0 : totalDeductions,
    netTransferAmount: issues.length > 0 ? grossTotal : netTransferAmount,
    verificationIssues: issues,
    explanation
  };
}
