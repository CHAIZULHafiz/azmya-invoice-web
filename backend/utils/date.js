const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDateDMY(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get Indonesian date parts for Berita Acara template
 */
function getIndonesianDateParts(date) {
  const d = new Date(date);
  const hari = HARI[d.getDay()];
  const tanggal = String(d.getDate());
  const bulan = BULAN[d.getMonth()];
  const tahun = String(d.getFullYear());
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');

  return {
    hari,
    tanggal,
    bulan,
    tahun,
    singkat: `${day}/${month}/${tahun}`,
    formatted: `${day} ${bulan} ${tahun}`,
  };
}

/**
 * Parse DD/MM/YYYY string to Date object
 */
function parseDDMMYYYY(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

module.exports = {
  addDays,
  formatDateISO,
  formatDateDMY,
  getIndonesianDateParts,
  parseDDMMYYYY,
  HARI,
  BULAN,
};
