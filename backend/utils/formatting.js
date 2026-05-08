/**
 * Convert number to Roman numeral (1-12 for months)
 */
function toRoman(num) {
  const romanMap = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, numeral] of romanMap) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

/**
 * Generate Invoice number: {NoUrut} / INV / {KodeUnit} / {Romawi} / {Year}
 */
function generateInvoiceNumber(noUrut, kodeUnit, month, year) {
  const padded = String(noUrut).padStart(3, '0');
  const roman = toRoman(month);
  return `${padded} / INV / ${kodeUnit} / ${roman} / ${year}`;
}

/**
 * Generate BA number: {NoUrut} / BA / {KodeUnit} / {Romawi} / {Year}
 */
function generateBANumber(noUrut, kodeUnit, month, year) {
  const padded = String(noUrut).padStart(3, '0');
  const roman = toRoman(month);
  return `${padded} / BA / ${kodeUnit} / ${roman} / ${year}`;
}

/**
 * Calculate DPP from total including PPN 11%
 * DPP = Total / 1.11
 */
function calculateDPP(totalIncPPN) {
  return Math.round(totalIncPPN / 1.11);
}

/**
 * Calculate PPN from DPP
 * PPN = DPP * 11%
 */
function calculatePPN(dpp) {
  return Math.round(dpp * 0.11);
}

/**
 * Format number to Indonesian Rupiah
 */
function formatRupiah(num) {
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Convert number to Indonesian text (terbilang)
 */
function terbilang(angka) {
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  if (angka === 0) return 'Nol';
  if (angka < 12) return huruf[angka];
  if (angka < 20) return terbilang(angka - 10) + ' Belas';
  if (angka < 100) {
    const sisa = angka % 10;
    return terbilang(Math.floor(angka / 10)) + ' Puluh' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  }
  if (angka < 200) return 'Seratus' + (angka - 100 > 0 ? ' ' + terbilang(angka - 100) : '');
  if (angka < 1000) {
    const sisa = angka % 100;
    return terbilang(Math.floor(angka / 100)) + ' Ratus' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  }
  if (angka < 2000) return 'Seribu' + (angka - 1000 > 0 ? ' ' + terbilang(angka - 1000) : '');
  if (angka < 1000000) {
    const sisa = angka % 1000;
    return terbilang(Math.floor(angka / 1000)) + ' Ribu' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  }
  if (angka < 1000000000) {
    const sisa = angka % 1000000;
    return terbilang(Math.floor(angka / 1000000)) + ' Juta' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  }
  if (angka < 1000000000000) {
    const sisa = angka % 1000000000;
    return terbilang(Math.floor(angka / 1000000000)) + ' Milyar' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  }
  return '';
}

module.exports = {
  toRoman,
  generateInvoiceNumber,
  generateBANumber,
  calculateDPP,
  calculatePPN,
  formatRupiah,
  terbilang,
};
